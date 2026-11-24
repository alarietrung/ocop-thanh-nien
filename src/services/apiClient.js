import { getApiBaseUrl } from './storageService';

export class ApiError extends Error {
  constructor(message, { status = 500, code = 'API_ERROR', details = null, requestId = null } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
    this.requestId = requestId;
  }
}

export async function apiRequest(path, { method = 'GET', body, token, headers = {}, signal } = {}) {
  const baseUrl = getApiBaseUrl().replace(/\/+$/, '');
  const normalizedPath = String(path || '').startsWith('/') ? path : `/${path}`;
  const url = `${baseUrl}${normalizedPath}`;

  const reqHeaders = { ...headers };
  if (body !== undefined && !reqHeaders['Content-Type']) {
    reqHeaders['Content-Type'] = 'application/json';
  }
  if (token && !reqHeaders.Authorization) {
    reqHeaders.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    method,
    headers: reqHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal
  });

  let payload = null;
  try {
    payload = await res.json();
  } catch {
    payload = null;
  }

  if (!res.ok || payload?.ok === false) {
    throw new ApiError(payload?.error?.message || `HTTP ${res.status}`, {
      status: res.status,
      code: payload?.error?.code || 'HTTP_ERROR',
      details: payload?.error?.details || null,
      requestId: payload?.requestId || res.headers.get('x-request-id') || null
    });
  }

  return payload && 'data' in payload ? payload.data : payload;
}
