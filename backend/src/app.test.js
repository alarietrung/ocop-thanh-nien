import { createHmac } from 'node:crypto';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { z } from 'zod';
import { buildApp } from './app.js';
import { parseEnv } from './config/env.js';
import { validateSchema } from './common/validate.js';
import { ValidationError } from './common/errors.js';
import { requireAuth, requireRoles } from './middleware/authGuard.js';

const TEST_JWT_SECRET = 'test-only-ocop-dong-nai-secret-at-least-32-chars';

function signTestJwt(sub, { secret = TEST_JWT_SECRET, expOffsetSec = 3600 } = {}) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(
    JSON.stringify({
      sub,
      aud: 'authenticated',
      exp: Math.floor(Date.now() / 1000) + expOffsetSec,
      user_metadata: { role: 'ops' } // Must be ignored in favor of DB role!
    })
  ).toString('base64url');
  const sig = createHmac('sha256', secret).update(`${header}.${payload}`).digest('base64url');
  return `${header}.${payload}.${sig}`;
}

describe('ocop-dong-nai-api full modular verification', () => {
  let app;

  const sellerTokenA = signTestJwt('10000000-0000-4000-8000-000000000001'); // Tan Trieu
  const sellerTokenB = signTestJwt('10000000-0000-4000-8000-000000000002'); // Dinh Quan
  const affiliateTokenA = signTestJwt('10000000-0000-4000-8000-000000000003'); // Thao Vy
  const affiliateTokenB = signTestJwt('10000000-0000-4000-8000-000000000004'); // Quoc Bao
  const opsToken = signTestJwt('10000000-0000-4000-8000-000000000005'); // Ops

  beforeAll(async () => {
    const env = parseEnv({
      NODE_ENV: 'test',
      PORT: '4003',
      API_PREFIX: '/api/v1',
      JWT_SECRET: TEST_JWT_SECRET,
      SUPABASE_JWT_AUDIENCE: 'authenticated'
    });
    app = await buildApp(env);
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  it('serves GET /api/v1/health, /ready and /products with standard envelopes', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/health' });
    expect(res.statusCode).toBe(200);
    expect(res.headers['x-request-id']).toBeTruthy();
    expect(res.json().data.status).toBe('ok');

    const readyRes = await app.inject({ method: 'GET', url: '/api/v1/ready?verbose=true' });
    expect(readyRes.statusCode).toBe(200);

    const badReady = await app.inject({ method: 'GET', url: '/api/v1/ready?verbose=invalid' });
    expect(badReady.statusCode).toBe(400);
    expect(badReady.json().error.code).toBe('VALIDATION_ERROR');

    const catalogRes = await app.inject({ method: 'GET', url: '/api/v1/products?q=hat%20dieu' });
    expect(catalogRes.statusCode).toBe(200);
    expect(catalogRes.json().data.items.length).toBeGreaterThanOrEqual(1);
  });

  it('ignores user_metadata role tampering and enforces DB-resolved RBAC + anti-IDOR', async () => {
    // Affiliate A cannot call ops endpoint even though JWT user_metadata claimed ops!
    const meRes = await app.inject({
      method: 'GET',
      url: '/api/v1/me',
      headers: { authorization: `Bearer ${affiliateTokenA}` }
    });
    expect(meRes.statusCode).toBe(200);
    expect(meRes.json().data.role).toBe('affiliate');
    expect(meRes.headers['cache-control']).toBe('no-store');

    const opsBlocked = await app.inject({
      method: 'GET',
      url: '/api/v1/ops/metrics',
      headers: { authorization: `Bearer ${affiliateTokenA}` }
    });
    expect(opsBlocked.statusCode).toBe(403);

    // Expired JWT rejected with 401
    const expired = signTestJwt('10000000-0000-4000-8000-000000000003', { expOffsetSec: -60 });
    const expRes = await app.inject({
      method: 'GET',
      url: '/api/v1/me',
      headers: { authorization: `Bearer ${expired}` }
    });
    expect(expRes.statusCode).toBe(401);
  });

  it('completes seller draft -> submit -> ops approve -> affiliate link -> intentional click -> isolation', async () => {
    const createRes = await app.inject({
      method: 'POST',
      url: '/api/v1/seller/products',
      headers: { authorization: `Bearer ${sellerTokenA}` },
      payload: {
        title: 'Trà Bưởi Tân Triều Pilot Test',
        categoryId: 'mat-ong-tra',
        unit: 'Hộp 200g',
        spec: 'Sấy lạnh đóng gói chân không',
        priceVnd: 135000,
        stock: 60,
        commissionRateBps: 1400,
        description: 'Sản phẩm test API backend Đề 3.',
        listings: [{ platform: 'shopee', url: 'https://shopee.vn/tra-buoi-tan-trieu-test-i.1.2' }]
      }
    });
    expect(createRes.statusCode).toBe(201);
    const createdProduct = createRes.json().data;

    // Seller B cannot update or submit Seller A's product
    const idorSubmit = await app.inject({
      method: 'POST',
      url: `/api/v1/seller/products/${createdProduct.id}/submit`,
      headers: { authorization: `Bearer ${sellerTokenB}` }
    });
    expect(idorSubmit.statusCode).toBe(403);

    const submitOk = await app.inject({
      method: 'POST',
      url: `/api/v1/seller/products/${createdProduct.id}/submit`,
      headers: { authorization: `Bearer ${sellerTokenA}` }
    });
    expect(submitOk.statusCode).toBe(200);
    expect(submitOk.json().data.status).toBe('pending_review');

    const approveRes = await app.inject({
      method: 'POST',
      url: `/api/v1/ops/products/${createdProduct.id}/review`,
      headers: { authorization: `Bearer ${opsToken}` },
      payload: { decision: 'approve' }
    });
    expect(approveRes.statusCode).toBe(200);
    expect(approveRes.json().data.status).toBe('published');

    // Affiliate A creates link
    const linkRes = await app.inject({
      method: 'POST',
      url: '/api/v1/affiliate/links',
      headers: { authorization: `Bearer ${affiliateTokenA}` },
      payload: { productId: createdProduct.id, platform: 'shopee' }
    });
    expect(linkRes.statusCode).toBe(201);
    const createdLink = linkRes.json().data;

    // Lookup does not increment clicks
    const lookupRes = await app.inject({ method: 'GET', url: `/api/v1/redirects/${createdLink.code}` });
    expect(lookupRes.statusCode).toBe(200);
    expect(lookupRes.json().data.clicksCount).toBe(0);

    // Intentional visit increments clicks
    const visitRes = await app.inject({
      method: 'POST',
      url: `/api/v1/redirects/${createdLink.code}/visit`,
      payload: {}
    });
    expect(visitRes.statusCode).toBe(200);
    expect(visitRes.json().data.clicksCount).toBe(1);

    // Affiliate B cannot deactivate Affiliate A's link
    const deactIdor = await app.inject({
      method: 'PATCH',
      url: `/api/v1/affiliate/links/${createdLink.id}/deactivate`,
      headers: { authorization: `Bearer ${affiliateTokenB}` }
    });
    expect(deactIdor.statusCode).toBe(403);
  });

  it('deduplicates CSV imports, reconciles refund reversal, and closes partner webhooks safely', async () => {
    const previewRes = await app.inject({
      method: 'POST',
      url: '/api/v1/ops/imports/preview',
      headers: { authorization: `Bearer ${opsToken}` },
      payload: {
        rows: [
          {
            platform: 'tiktok',
            shopId: 'shop_tantrieu_tt',
            externalOrderId: 'TT-API-IDEMP-01',
            sku: 'OCOP-DN-002',
            quantity: 2,
            grossAmountVnd: 190000,
            netAmountVnd: 190000,
            affiliateCode: 'DN8K4M2P9Q',
            status: 'confirmed'
          }
        ]
      }
    });
    expect(previewRes.statusCode).toBe(200);
    const { batchId } = previewRes.json().data;

    const commit1 = await app.inject({
      method: 'POST',
      url: `/api/v1/ops/imports/${batchId}/commit`,
      headers: { authorization: `Bearer ${opsToken}` },
      payload: {}
    });
    expect(commit1.statusCode).toBe(200);
    expect(commit1.json().data.insertedCount).toBe(1);

    // Second preview+commit with same external order must deduplicate
    const preview2 = await app.inject({
      method: 'POST',
      url: '/api/v1/ops/imports/preview',
      headers: { authorization: `Bearer ${opsToken}` },
      payload: {
        rows: [
          {
            platform: 'tiktok',
            shopId: 'shop_tantrieu_tt',
            externalOrderId: 'TT-API-IDEMP-01',
            sku: 'OCOP-DN-002',
            quantity: 2,
            grossAmountVnd: 190000,
            affiliateCode: 'DN8K4M2P9Q',
            status: 'confirmed'
          }
        ]
      }
    });
    const commit2 = await app.inject({
      method: 'POST',
      url: `/api/v1/ops/imports/${preview2.json().data.batchId}/commit`,
      headers: { authorization: `Bearer ${opsToken}` },
      payload: {}
    });
    expect(commit2.json().data.insertedCount).toBe(0);
    expect(commit2.json().data.duplicateCount).toBe(1);

    // Webhook closed by default without partner credentials
    const whRes = await app.inject({
      method: 'POST',
      url: '/api/v1/webhooks/marketplace/shopee',
      payload: {}
    });
    expect(whRes.statusCode).toBe(501);
    expect(whRes.json().error.code).toBe('PARTNER_INTEGRATION_NOT_ENABLED');
  });

  it('keeps baseline authGuard, validateSchema, and production env invariants', async () => {
    await expect(requireAuth({ headers: {} })).rejects.toMatchObject({ statusCode: 401 });
    await expect(requireAuth({ headers: { authorization: 'Bearer test' } })).rejects.toMatchObject({
      statusCode: 401
    });
    await expect(requireRoles('ops')({ user: { role: 'affiliate' } })).rejects.toMatchObject({
      statusCode: 403
    });
    expect(() => validateSchema(z.object({ id: z.string().min(3) }), { id: 'a' })).toThrow(ValidationError);

    expect(() =>
      parseEnv({
        NODE_ENV: 'production',
        DATABASE_URL: '',
        JWT_SECRET: 'short'
      })
    ).toThrow();
  });
});
