import { describe, it, expect, vi, afterEach } from 'vitest';
import { ApiError, apiRequest } from './apiClient';

describe('apiClient envelope handling', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('returns unwrapped data on ok:true and forwards Bearer token', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => 'req-1' },
      json: async () => ({ ok: true, data: { status: 'ok' }, requestId: 'req-1' })
    });
    globalThis.fetch = fetchMock;

    const data = await apiRequest('/api/v1/health', { token: 'abc123' });
    expect(data).toEqual({ status: 'ok' });
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/health',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({ Authorization: 'Bearer abc123' })
      })
    );
  });

  it('throws ApiError with code and requestId on ok:false', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      headers: { get: () => 'req-err-9' },
      json: async () => ({
        ok: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid input' },
        requestId: 'req-err-9'
      })
    });

    await expect(apiRequest('/api/v1/items', { method: 'POST', body: { x: 1 } })).rejects.toMatchObject({
      name: 'ApiError',
      status: 400,
      code: 'VALIDATION_ERROR',
      requestId: 'req-err-9'
    });
    expect(new ApiError('err', { status: 400 })).toBeInstanceOf(Error);
  });
});
