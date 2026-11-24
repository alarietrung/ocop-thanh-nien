import { requireRoles } from '../../middleware/authGuard.js';

export async function registerAffiliatesRoutes(app, { controller, authGuard }) {
  app.get('/affiliate/links', { preHandler: [authGuard, requireRoles('affiliate', 'ops')] }, controller.listLinks);
  app.post('/affiliate/links', { preHandler: [authGuard, requireRoles('affiliate', 'ops')] }, controller.createLink);
  app.patch('/affiliate/links/:id/deactivate', { preHandler: [authGuard, requireRoles('affiliate', 'ops')] }, controller.deactivateLink);

  // Public redirect lookup & intentional visit
  app.get('/redirects/:code', controller.lookupRedirect);
  app.post('/redirects/:code/visit', controller.visitRedirect);
}
