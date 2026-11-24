import { requireRoles } from '../../middleware/authGuard.js';

export async function registerCatalogSyncRoutes(app, { controller, authGuard }) {
  app.get('/ops/marketplace-status', { preHandler: [authGuard, requireRoles('ops', 'seller')] }, controller.getStatus);
  app.post('/seller/products/:id/listings', { preHandler: [authGuard, requireRoles('seller')] }, controller.addListing);
}
