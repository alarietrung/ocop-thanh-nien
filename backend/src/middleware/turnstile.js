import { AppError } from '../common/errors.js';
import { parseCommaList } from '../config/env.js';

export function createTurnstileVerifier({
  secretKey = '',
  allowedHostnames = '',
  isProd = false,
  fetchImpl = globalThis.fetch
} = {}) {
  const allowedSet = new Set(parseCommaList(allowedHostnames));

  return async function verifyTurnstile({ token, expectedAction, remoteIp, logger }) {
    const trimmedSecret = String(secretKey || '').trim();
    if (!trimmedSecret) {
      if (isProd) {
        throw new AppError('Turnstile verification is not configured on server', {
          statusCode: 503,
          code: 'CAPTCHA_NOT_CONFIGURED'
        });
      }
      return { verified: true, mode: 'dev-bypass' };
    }

    const trimmedToken = String(token || '').trim();
    if (!trimmedToken) {
      throw new AppError('Vui lòng hoàn thành xác minh chống bot (Turnstile).', {
        statusCode: 400,
        code: 'CAPTCHA_REQUIRED'
      });
    }

    const body = new URLSearchParams({
      secret: trimmedSecret,
      response: trimmedToken
    });
    if (remoteIp) body.set('remoteip', remoteIp);

    let data;
    try {
      const res = await fetchImpl('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
        signal: AbortSignal.timeout(4000)
      });
      data = await res.json();
    } catch {
      throw new AppError('Không thể xác minh Turnstile lúc này, vui lòng thử lại.', {
        statusCode: 503,
        code: 'CAPTCHA_UNAVAILABLE'
      });
    }

    if (!data?.success) {
      logger?.warn({ errorCodes: data?.['error-codes'] || [] }, 'Turnstile siteverify rejected');
      throw new AppError('Xác minh bảo mật chưa hợp lệ. Vui lòng thử lại.', {
        statusCode: 403,
        code: 'CAPTCHA_INVALID'
      });
    }

    if (expectedAction && data.action && data.action !== expectedAction) {
      throw new AppError('Turnstile action mismatch', {
        statusCode: 403,
        code: 'CAPTCHA_ACTION_MISMATCH'
      });
    }

    const host = String(data.hostname || '').toLowerCase();
    if (allowedSet.size > 0 && host && !allowedSet.has(host)) {
      throw new AppError('Turnstile hostname is not allowlisted', {
        statusCode: 403,
        code: 'CAPTCHA_HOSTNAME_INVALID'
      });
    }

    return { verified: true, hostname: host, action: data.action || '' };
  };
}
