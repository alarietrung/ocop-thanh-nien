import { okResponse } from '../../common/response.js';
import { validateSchema } from '../../common/validate.js';
import { readyQuerySchema } from './health.schema.js';

export function createHealthController(healthService) {
  return {
    async getHealth(request) {
      return okResponse(request, healthService.getLiveness());
    },

    async getReady(request) {
      const query = validateSchema(readyQuerySchema, request.query || {});
      const data = await healthService.getReadiness({ verbose: query.verbose === 'true' });
      return okResponse(request, data);
    }
  };
}
