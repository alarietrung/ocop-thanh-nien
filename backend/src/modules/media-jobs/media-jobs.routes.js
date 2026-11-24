import { requireRoles } from '../../middleware/authGuard.js';

export async function registerMediaJobsRoutes(app, { controller, authGuard }) {
  app.get('/media/templates', controller.listTemplates);
  app.post('/seller/media/upload-init', { preHandler: [authGuard, requireRoles('seller', 'ops')] }, controller.initUpload);
  app.post('/seller/media/upload-complete', { preHandler: [authGuard, requireRoles('seller', 'ops')] }, controller.completeUpload);
}
