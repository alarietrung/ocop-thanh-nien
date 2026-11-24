import { createMemoryStore } from './memoryStore.js';

export function createDbClient({ databaseUrl = '' } = {}) {
  const trimmedUrl = String(databaseUrl || '').trim();
  const configured = Boolean(trimmedUrl);
  const memory = createMemoryStore();
  let poolPromise = null;

  async function getPool() {
    if (!configured) return null;
    if (!poolPromise) {
      poolPromise = import('pg').then(({ Pool }) => {
        const isLocal = trimmedUrl.includes('localhost') || trimmedUrl.includes('127.0.0.1');
        return new Pool({
          connectionString: trimmedUrl,
          max: 5,
          idleTimeoutMillis: 10000,
          connectionTimeoutMillis: 5000,
          ssl: isLocal ? false : { rejectUnauthorized: true }
        });
      });
    }
    return poolPromise;
  }

  return {
    isConfigured: configured,
    memory,

    async checkHealth() {
      if (!configured) {
        return { status: 'unconfigured', mode: 'memory-pilot' };
      }
      try {
        const pool = await getPool();
        const result = await pool.query('SELECT 1 AS ok');
        if (result?.rows?.[0]?.ok === 1) {
          return { status: 'connected', mode: 'postgres' };
        }
        return { status: 'error', reason: 'UNEXPECTED_QUERY_RESULT' };
      } catch {
        return { status: 'error', reason: 'DATABASE_UNREACHABLE' };
      }
    },

    async withActorTx(actor = {}, fn) {
      const pool = await getPool();
      if (!pool) {
        return fn({ mode: 'memory', memory });
      }
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query(
          "SELECT set_config('ocop.actor_id', $1, true), set_config('ocop.actor_role', $2, true)",
          [String(actor.id || ''), String(actor.role || 'public')]
        );
        const result = await fn({ mode: 'pg', query: (text, params) => client.query(text, params) });
        await client.query('COMMIT');
        return result;
      } catch (err) {
        await client.query('ROLLBACK').catch(() => {});
        throw err;
      } finally {
        client.release();
      }
    },

    async close() {
      if (poolPromise) {
        const pool = await poolPromise.catch(() => null);
        if (pool) await pool.end().catch(() => {});
        poolPromise = null;
      }
    }
  };
}
