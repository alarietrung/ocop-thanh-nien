import { createCatalogSyncRepository } from './catalog-sync.repository.js';
import { createCatalogSyncService } from './catalog-sync.service.js';
import { createCatalogSyncController } from './catalog-sync.controller.js';
import { registerCatalogSyncRoutes } from './catalog-sync.routes.js';

export async function registerCatalogSyncModule(app, { prefix, db, authGuard, producersApi }) {
  const repo = createCatalogSyncRepository({ db });
  const service = createCatalogSyncService({ repo, producersApi });
  const controller = createCatalogSyncController(service);
  await app.register((scope) => registerCatalogSyncRoutes(scope, { controller, authGuard }), { prefix });
  return {};
}
