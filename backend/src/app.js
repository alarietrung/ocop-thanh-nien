import { randomUUID } from 'node:crypto';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { parseCorsOrigins, parseEnv } from './config/env.js';
import { createDbClient } from './db/client.js';
import { createAuthGuard, createTokenVerifier } from './middleware/authGuard.js';
import { createTurnstileVerifier } from './middleware/turnstile.js';
import { registerErrorHandlers } from './middleware/errorHandler.js';
import { registerRequestIdHook } from './middleware/requestId.js';
import { registerModules } from './modules/index.js';

export async function buildApp(customEnv, { verifyTokenOverride, fetchImpl } = {}) {
  const env = customEnv || parseEnv();
  const isProd = env.NODE_ENV === 'production';

  const app = Fastify({
    bodyLimit: 1048576,
    logger:
      env.NODE_ENV === 'test'
        ? false
        : {
            level: isProd ? 'info' : 'debug',
            redact: {
              paths: [
                'req.headers.authorization',
                'req.headers.cookie',
                '*.password',
                '*.token',
                '*.turnstileToken',
                '*.jwtSecret',
                '*.databaseUrl'
              ],
              censor: '[REDACTED]'
            }
          },
    genReqId: () => randomUUID()
  });

  const allowedOrigins = new Set(parseCorsOrigins(env.CORS_ORIGINS));

  await app.register(helmet);
  await app.register(cors, {
    credentials: false,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key'],
    origin(origin, cb) {
      if (!origin || allowedOrigins.has(origin)) {
        cb(null, true);
      } else {
        cb(new Error('Origin not allowed by CORS'), false);
      }
    }
  });
  await app.register(rateLimit, {
    max: env.RATE_LIMIT_MAX,
    timeWindow: '1 minute'
  });

  registerRequestIdHook(app);
  registerErrorHandlers(app, { isProd });

  const db = createDbClient({ databaseUrl: env.DATABASE_URL });
  app.addHook('onClose', async () => {
    await db.close();
  });

  const tokenVerifier =
    typeof verifyTokenOverride === 'function'
      ? verifyTokenOverride
      : createTokenVerifier({ env, db, fetchImpl });
  const authGuard = createAuthGuard(tokenVerifier);

  const verifyTurnstile = createTurnstileVerifier({
    secretKey: env.TURNSTILE_SECRET_KEY,
    allowedHostnames: env.TURNSTILE_ALLOWED_HOSTNAMES,
    isProd,
    fetchImpl
  });

  await registerModules(app, {
    env,
    db,
    authGuard,
    verifyTurnstile,
    serviceName: 'ocop-dong-nai-api'
  });

  return app;
}
