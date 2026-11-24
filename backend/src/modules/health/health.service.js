import { AppError } from '../../common/errors.js';

export function createHealthService({ serviceName, db }) {
  return {
    getLiveness() {
      return {
        status: 'ok',
        service: serviceName,
        uptimeSeconds: Math.floor(process.uptime())
      };
    },

    async getReadiness({ verbose = false } = {}) {
      const dbHealth = await db.checkHealth();
      if (dbHealth.status === 'error') {
        throw new AppError('Database readiness check failed', {
          statusCode: 503,
          code: 'DB_UNAVAILABLE',
          details: verbose ? { database: dbHealth } : undefined
        });
      }
      return {
        status: 'ready',
        service: serviceName,
        dependencies: verbose ? { database: dbHealth } : { database: dbHealth.status }
      };
    }
  };
}
