import { okResponse } from '../../common/response.js';
import { validateSchema } from '../../common/validate.js';
import { metricsQuerySchema, reconciliationSchema } from './commission-ledger.schema.js';

export function createCommissionLedgerController(service) {
  return {
    async getMyCommission(request) {
      const data = await service.getMyCommission(request.user);
      return okResponse(request, data);
    },

    async getOpsMetrics(request) {
      const query = validateSchema(metricsQuerySchema, request.query || {});
      const data = await service.getOpsMetrics(request.user, query);
      return okResponse(request, data);
    },

    async reconcile(request) {
      const body = validateSchema(reconciliationSchema, request.body || {});
      const updated = await service.reconcileOrder(request.user, body);
      return okResponse(request, updated);
    }
  };
}
