import { requireRoles } from '../../middleware/authGuard.js';

export async function registerProducersRoutes(app, { controller, authGuard }) {
  // Public routes
  app.get('/products', controller.listProducts);
  app.get('/products/:slug', controller.getProduct);
  app.get('/producers/:slug', controller.getProducer);
  app.post('/pilot-applications', controller.createPilotApplication);

  // Authenticated profile
  app.get('/me', { preHandler: [authGuard] }, controller.getMe);

  // Seller scoped routes
  app.get('/seller/products', { preHandler: [authGuard, requireRoles('seller', 'ops')] }, controller.listSellerProducts);
  app.post('/seller/products', { preHandler: [authGuard, requireRoles('seller')] }, controller.createSellerProduct);
  app.patch('/seller/products/:id', { preHandler: [authGuard, requireRoles('seller')] }, controller.updateSellerProduct);
  app.post('/seller/products/:id/submit', { preHandler: [authGuard, requireRoles('seller')] }, controller.submitSellerProduct);

  // Ops review route
  app.post('/ops/products/:id/review', { preHandler: [authGuard, requireRoles('ops')] }, controller.reviewProduct);
}
