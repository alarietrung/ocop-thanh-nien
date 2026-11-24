import { describe, it, expect, beforeEach } from 'vitest';
import {
  _resetAiRateLimiterForTests,
  handleAiDescribeRequest
} from '../../api/ai-describe.js';

const TINY_VALID_PNG_B64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAACXBIWXMAAAsTAAALEwEAmpwYAAAA' +
  'B3RJTUUH6gsYBjI0m9G1mQAAABl0RVh0Q29tbWVudABDcmVhdGVkIHdpdGggR0lNUFeBDhcAAAAo' +
  'SURBVBjTY2RgYPjPwMDAwMTExMDIyMjAyMjIwMjIyMDIyMjAAAEAAwABAwABAAAAAElFTkSuQmCC';

function makeRequest(body, headers = {}, method = 'POST') {
  return new Request('https://ocop-thanh-nien-dong-nai.vercel.app/api/ai-describe', {
    method,
    headers: {
      'Content-Type': 'application/json',
      Origin: 'https://ocop-thanh-nien-dong-nai.vercel.app',
      'X-OCOP-Client': 'ocop-web',
      'X-Forwarded-For': '203.0.113.10',
      ...headers
    },
    body: method === 'POST' ? JSON.stringify(body) : undefined
  });
}

describe('POST /api/ai-describe (Gemini Flash Free Tier server function)', () => {
  beforeEach(() => {
    _resetAiRateLimiterForTests();
  });

  it('rejects requests without valid app client/auth header (401)', async () => {
    const req = new Request('https://ocop-thanh-nien-dong-nai.vercel.app/api/ai-describe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'https://ocop-thanh-nien-dong-nai.vercel.app'
      },
      body: JSON.stringify({ imageDataUrl: `data:image/png;base64,${TINY_VALID_PNG_B64}` })
    });
    const res = await handleAiDescribeRequest(req, { env: {} });
    expect(res.status).toBe(401);
  });

  it('rejects disallowed MIME types (400) and oversized images (413)', async () => {
    const badMime = await handleAiDescribeRequest(
      makeRequest({ imageDataUrl: `data:image/gif;base64,${TINY_VALID_PNG_B64}` }),
      { env: {} }
    );
    expect(badMime.status).toBe(400);

    const hugeBase64 = 'A'.repeat(5_000_000);
    const tooLarge = await handleAiDescribeRequest(
      makeRequest({ imageDataUrl: `data:image/jpeg;base64,${hugeBase64}` }),
      { env: {} }
    );
    expect(tooLarge.status).toBe(413);
  });

  it('returns 503 AI_NOT_CONFIGURED cleanly when GEMINI_API_KEY is absent', async () => {
    const res = await handleAiDescribeRequest(
      makeRequest({ imageDataUrl: `data:image/png;base64,${TINY_VALID_PNG_B64}` }),
      { env: { GEMINI_MODEL: 'gemini-3.6-flash' } }
    );
    expect(res.status).toBe(503);
    const json = await res.json();
    expect(json.code).toBe('AI_NOT_CONFIGURED');
    expect(json.fallbackAvailable).toBe(true);
    expect(json.model).toBe('gemini-3.6-flash');
  });

  it('enforces per-IP rate limiting (429 with Retry-After)', async () => {
    const env = { AI_RATE_LIMIT_MAX: '2' };
    await handleAiDescribeRequest(
      makeRequest({ imageDataUrl: `data:image/png;base64,${TINY_VALID_PNG_B64}` }),
      { env }
    );
    await handleAiDescribeRequest(
      makeRequest({ imageDataUrl: `data:image/png;base64,${TINY_VALID_PNG_B64}` }),
      { env }
    );
    const blocked = await handleAiDescribeRequest(
      makeRequest({ imageDataUrl: `data:image/png;base64,${TINY_VALID_PNG_B64}` }),
      { env }
    );
    expect(blocked.status).toBe(429);
    expect(Number(blocked.headers.get('retry-after'))).toBeGreaterThanOrEqual(1);
  });

  it('calls Gemini Flash with x-goog-api-key header, parses JSON, and handles 429/timeout', async () => {
    let calledUrl = '';
    let sentKeyHeader = '';
    const mockOkFetch = async (url, init) => {
      calledUrl = url;
      sentKeyHeader = init.headers['x-goog-api-key'];
      return new Response(
        JSON.stringify({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      titleSuggestion: 'Sầu riêng Ri6 cơm vàng vườn Ba Tư (1 kg)',
                      shortSpec: 'Cơm vàng béo mịn, cắt già tại cây.',
                      description: 'Sầu riêng Ri6 hái tại vườn Long Khánh, cơm vàng đậm thơm tự nhiên.',
                      highlights: ['Cắt già tự nhiên', 'Có mã QR nhật ký lô']
                    })
                  }
                ]
              }
            }
          ]
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    };

    const okRes = await handleAiDescribeRequest(
      makeRequest({
        imageDataUrl: `data:image/png;base64,${TINY_VALID_PNG_B64}`,
        productHint: 'Sầu riêng Ri6'
      }),
      {
        env: { GEMINI_API_KEY: 'test-only-secret', GEMINI_MODEL: 'gemini-3.6-flash' },
        fetchImpl: mockOkFetch
      }
    );
    expect(okRes.status).toBe(200);
    expect(calledUrl).toContain('/models/gemini-3.6-flash:generateContent');
    expect(calledUrl).not.toContain('test-only-secret');
    expect(sentKeyHeader).toBe('test-only-secret');
    const okJson = await okRes.json();
    expect(okJson.ok).toBe(true);
    expect(okJson.suggestion.description).toContain('Sầu riêng Ri6');

    const res429 = await handleAiDescribeRequest(
      makeRequest({ imageDataUrl: `data:image/png;base64,${TINY_VALID_PNG_B64}` }),
      {
        env: { GEMINI_API_KEY: 'test-only-secret', GEMINI_MODEL: 'gemini-3.6-flash' },
        fetchImpl: async () => new Response('{}', { status: 429 })
      }
    );
    expect(res429.status).toBe(429);

    const resTimeout = await handleAiDescribeRequest(
      makeRequest({ imageDataUrl: `data:image/png;base64,${TINY_VALID_PNG_B64}` }),
      {
        env: { GEMINI_API_KEY: 'test-only-secret', GEMINI_MODEL: 'gemini-3.6-flash' },
        fetchImpl: async () => {
          const err = new Error('Timed out');
          err.name = 'TimeoutError';
          throw err;
        }
      }
    );
    expect(resTimeout.status).toBe(504);
  });
});
