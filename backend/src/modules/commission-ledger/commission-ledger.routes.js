import { requireRoles } from '../../middleware/authGuard.js';

export async function registerCommissionLedgerRoutes(app, { controller, authGuard }) {
  app.get('/affiliate/commission', { preHandler: [authGuard, requireRoles('affiliate', 'ops')] }, controller.getMyCommission);
  app.get('/ops/metrics', { preHandler: [authGuard, requireRoles('ops')] }, controller.getOpsMetrics);
  app.post('/ops/reconciliations', { preHandler: [authGuard, requireRoles('ops')] }, controller.reconcile);
}
