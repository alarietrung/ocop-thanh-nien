import { createHmac, createPublicKey, createVerify, timingSafeEqual } from 'node:crypto';
import { ForbiddenError, UnauthorizedError } from '../common/errors.js';

function decodeBase64Url(input) {
  const padded = String(input).replace(/-/g, '+').replace(/_/g, '/');
  return Buffer.from(padded, 'base64');
}

export function verifyHs256Jwt(token, secret, { audience } = {}) {
  const parts = String(token || '').split('.');
  if (parts.length !== 3) {
    throw new UnauthorizedError('Malformed JWT');
  }
  const [headerB64, payloadB64, sigB64] = parts;
  const header = JSON.parse(decodeBase64Url(headerB64).toString('utf8'));
  if (header.alg !== 'HS256') {
    throw new UnauthorizedError('Unsupported JWT algorithm');
  }

  const signingInput = `${headerB64}.${payloadB64}`;
  const expectedSig = createHmac('sha256', secret).update(signingInput).digest();
  const actualSig = decodeBase64Url(sigB64);

  if (expectedSig.length !== actualSig.length || !timingSafeEqual(expectedSig, actualSig)) {
    throw new UnauthorizedError('Invalid JWT signature');
  }

  const payload = JSON.parse(decodeBase64Url(payloadB64).toString('utf8'));
  const nowSec = Math.floor(Date.now() / 1000);
  if (typeof payload.exp === 'number' && payload.exp <= nowSec) {
    throw new UnauthorizedError('Authentication token expired');
  }
  if (audience && payload.aud && payload.aud !== audience) {
    throw new UnauthorizedError('Invalid token audience');
  }
  return payload;
}

export function createTokenVerifier({ env, db, fetchImpl = globalThis.fetch } = {}) {
  let jwksCache = { expiresAt: 0, keys: [] };

  async function verifyViaJwks(token) {
    const parts = String(token || '').split('.');
    if (parts.length !== 3) throw new UnauthorizedError('Malformed JWT');
    const [headerB64, payloadB64, sigB64] = parts;
    const header = JSON.parse(decodeBase64Url(headerB64).toString('utf8'));
    if (!['RS256', 'ES256'].includes(header.alg)) return null;

    const jwksUrl =
      env.SUPABASE_JWKS_URL?.trim() ||
      (env.SUPABASE_URL?.trim() ? `${env.SUPABASE_URL.replace(/\/+$/, '')}/auth/v1/.well-known/jwks.json` : '');
    if (!jwksUrl || typeof fetchImpl !== 'function') return null;

    if (Date.now() > jwksCache.expiresAt) {
      const res = await fetchImpl(jwksUrl, { signal: AbortSignal.timeout(4000) });
      if (!res.ok) throw new UnauthorizedError('Unable to fetch JWKS');
      const data = await res.json();
      jwksCache = { keys: data.keys || [], expiresAt: Date.now() + 10 * 60 * 1000 };
    }

    const jwk = jwksCache.keys.find((k) => !header.kid || k.kid === header.kid);
    if (!jwk) throw new UnauthorizedError('Unknown signing key');

    const keyObj = createPublicKey({ key: jwk, format: 'jwk' });
    const verifier = createVerify('SHA256');
    verifier.update(`${headerB64}.${payloadB64}`);
    const sig = decodeBase64Url(sigB64);
    if (!verifier.verify(keyObj, sig)) {
      throw new UnauthorizedError('Invalid JWT signature');
    }

    const payload = JSON.parse(decodeBase64Url(payloadB64).toString('utf8'));
    const nowSec = Math.floor(Date.now() / 1000);
    if (typeof payload.exp === 'number' && payload.exp <= nowSec) {
      throw new UnauthorizedError('Authentication token expired');
    }
    if (env.SUPABASE_JWT_AUDIENCE && payload.aud && payload.aud !== env.SUPABASE_JWT_AUDIENCE) {
      throw new UnauthorizedError('Invalid token audience');
    }
    return payload;
  }

  return async function verifyToken(token) {
    let claims = null;

    // 1. Try JWKS when configured
    if (env?.SUPABASE_JWKS_URL || env?.SUPABASE_URL) {
      claims = await verifyViaJwks(token).catch((err) => {
        if (err instanceof UnauthorizedError) throw err;
        return null;
      });
    }

    // 2. Try Supabase Auth user endpoint if configured and asymmetric verify skipped
    if (!claims && env?.SUPABASE_URL && env?.SUPABASE_PUBLISHABLE_KEY && typeof fetchImpl === 'function') {
      const res = await fetchImpl(`${env.SUPABASE_URL.replace(/\/+$/, '')}/auth/v1/user`, {
        headers: {
          apikey: env.SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${token}`
        },
        signal: AbortSignal.timeout(4000)
      });
      if (res.ok) {
        const userData = await res.json();
        claims = { sub: userData.id, email: userData.email };
      }
    }

    // 3. Fallback HS256 JWT_SECRET (never read roles from token metadata!)
    if (!claims && env?.JWT_SECRET) {
      claims = verifyHs256Jwt(token, env.JWT_SECRET, {
        audience: env.SUPABASE_JWT_AUDIENCE || undefined
      });
    }

    if (!claims || !claims.sub) {
      throw new UnauthorizedError('Invalid authentication session');
    }

    // Always resolve authoritative role & producer membership from DB, never user_metadata
    const userId = String(claims.sub);
    const context = await resolveActorFromDb(db, userId);
    if (!context) {
      throw new UnauthorizedError('User profile not provisioned for OCOP Pilot');
    }

    return {
      id: userId,
      email: context.email || claims.email || '',
      displayName: context.displayName || '',
      role: context.role,
      roles: context.roles,
      producerIds: context.producerIds
    };
  };
}

async function resolveActorFromDb(db, userId) {
  if (!db) return null;
  if (!db.isConfigured) {
    const profile = db.memory.profiles.find((p) => p.id === userId);
    if (!profile) return null;
    return {
      email: profile.email,
      displayName: profile.displayName,
      roles: profile.roles,
      role: profile.roles[0] || 'affiliate',
      producerIds: profile.producerIds || []
    };
  }

  return db.withActorTx({ id: userId, role: 'ops' }, async (tx) => {
    const profileRes = await tx.query(
      'SELECT id, email, display_name FROM ocop_app.profiles WHERE id = $1 LIMIT 1',
      [userId]
    );
    if (profileRes.rows.length === 0) return null;
    const roleRes = await tx.query(
      'SELECT role FROM ocop_app.role_memberships WHERE user_id = $1 ORDER BY created_at ASC',
      [userId]
    );
    const prodRes = await tx.query(
      'SELECT producer_id FROM ocop_app.producer_memberships WHERE user_id = $1',
      [userId]
    );
    const roles = roleRes.rows.map((r) => r.role);
    return {
      email: profileRes.rows[0].email,
      displayName: profileRes.rows[0].display_name,
      roles,
      role: roles[0] || 'affiliate',
      producerIds: prodRes.rows.map((p) => p.producer_id)
    };
  });
}

export function createAuthGuard(verifyToken) {
  return async function requireAuth(request, reply) {
    if (reply?.header) {
      reply.header('Cache-Control', 'no-store');
    }
    const header = request.headers?.authorization || '';
    if (!header.startsWith('Bearer ')) {
      throw new UnauthorizedError('Missing bearer token');
    }
    const token = header.slice(7).trim();
    if (!token) {
      throw new UnauthorizedError('Empty bearer token');
    }
    if (typeof verifyToken !== 'function') {
      throw new UnauthorizedError('Authentication verifier not configured');
    }
    const user = await verifyToken(token, request);
    if (!user || !user.id) {
      throw new UnauthorizedError('Invalid authentication session');
    }
    request.user = user;
  };
}

export const requireAuth = createAuthGuard(null);

export function requireRoles(...allowedRoles) {
  return async function checkRoles(request, reply) {
    if (reply?.header) {
      reply.header('Cache-Control', 'no-store');
    }
    if (!request.user) {
      throw new UnauthorizedError('Authentication required');
    }
    const userRoles = Array.isArray(request.user.roles) ? request.user.roles : [request.user.role];
    const hasAccess = userRoles.some((r) => allowedRoles.includes(r));
    if (!hasAccess) {
      throw new ForbiddenError('Role does not have access to this resource');
    }
  };
}
