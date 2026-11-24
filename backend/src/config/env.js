import { z } from 'zod';

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    APP_ENV: z.enum(['development', 'test', 'preview', 'production']).default('development'),
    HOST: z.string().min(1).default('0.0.0.0'),
    PORT: z.coerce.number().int().min(1).max(65535).default(4003),
    API_PREFIX: z.string().startsWith('/').default('/api/v1'),
    PUBLIC_WEB_URL: z.string().optional().default(''),
    CORS_ORIGINS: z
      .string()
      .default('http://localhost:5173,http://localhost:5174,http://localhost:5175,http://localhost:5176'),
    RATE_LIMIT_MAX: z.coerce.number().int().min(10).max(10000).default(120),
    DATABASE_URL: z.string().optional().default(''),
    SUPABASE_URL: z.string().optional().default(''),
    SUPABASE_PUBLISHABLE_KEY: z.string().optional().default(''),
    SUPABASE_JWKS_URL: z.string().optional().default(''),
    SUPABASE_JWT_AUDIENCE: z.string().optional().default('authenticated'),
    JWT_SECRET: z.string().optional().default(''),
    TURNSTILE_SECRET_KEY: z.string().optional().default(''),
    TURNSTILE_ALLOWED_HOSTNAMES: z.string().optional().default('localhost'),
    STORAGE_SIGNING_SECRET: z.string().optional().default('')
  })
  .superRefine((data, ctx) => {
    if (data.NODE_ENV === 'production') {
      if (!data.DATABASE_URL.trim()) {
        ctx.addIssue({
          code: 'custom',
          path: ['DATABASE_URL'],
          message: 'DATABASE_URL is required in production'
        });
      }
      const hasSupabaseVerifier = Boolean(data.SUPABASE_URL.trim() || data.SUPABASE_JWKS_URL.trim());
      if (!hasSupabaseVerifier && (data.JWT_SECRET.trim().length < 32 || data.JWT_SECRET.startsWith('dev-only'))) {
        ctx.addIssue({
          code: 'custom',
          path: ['JWT_SECRET'],
          message: 'JWT_SECRET must be at least 32 non-default characters in production when Supabase verifier is unset'
        });
      }
    }
  });

export function parseEnv(rawEnv = process.env) {
  return envSchema.parse(rawEnv);
}

export function parseCorsOrigins(originsCsv) {
  return String(originsCsv || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
}

export function parseCommaList(csv) {
  return String(csv || '')
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}
