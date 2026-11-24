import { createMediaJobsRepository } from './media-jobs.repository.js';
import { createMediaJobsService } from './media-jobs.service.js';
import { createMediaJobsController } from './media-jobs.controller.js';
import { registerMediaJobsRoutes } from './media-jobs.routes.js';

export async function registerMediaJobsModule(app, { prefix, db, authGuard, producersApi }) {
  const repo = createMediaJobsRepository({ db });
  const service = createMediaJobsService({ repo, producersApi });
  const controller = createMediaJobsController(service);
  await app.register((scope) => registerMediaJobsRoutes(scope, { controller, authGuard }), { prefix });
  return {};
}
