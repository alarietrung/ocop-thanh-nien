import { requireRoles } from '../../middleware/authGuard.js';

export async function registerOrdersWebhookRoutes(app, { controller, authGuard }) {
  app.get('/seller/orders', { preHandler: [authGuard, requireRoles('seller', 'ops')] }, controller.listSellerOrders);
  app.post('/ops/imports/preview', { preHandler: [authGuard, requireRoles('ops', 'seller')] }, controller.previewImport);
  app.post('/ops/imports/:id/commit', { preHandler: [authGuard, requireRoles('ops', 'seller')] }, controller.commitImport);
  app.post('/webhooks/marketplace/:platform', controller.handleWebhook);
}
