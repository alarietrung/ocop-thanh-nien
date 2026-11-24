import { describe, it, expect } from 'vitest';
import { loadJson, saveJson, getApiBaseUrl } from './storageService';

describe('storageService baseline', () => {
  it('saves, loads, and validates JSON safely', () => {
    const store = {};
    const prev = globalThis.localStorage;
    globalThis.localStorage = {
      getItem: (k) => (k in store ? store[k] : null),
      setItem: (k, v) => {
        store[k] = String(v);
      }
    };
    try {
      expect(saveJson('starter_key', { ready: true })).toBe(true);
      expect(loadJson('starter_key', null, (d) => Boolean(d?.ready))).toEqual({ ready: true });
      expect(loadJson('starter_key', { fallback: true }, () => false)).toEqual({ fallback: true });
      expect(typeof getApiBaseUrl()).toBe('string');
    } finally {
      globalThis.localStorage = prev;
    }
  });
});
