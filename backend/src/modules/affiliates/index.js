import { createAffiliatesRepository } from './affiliates.repository.js';
import { createAffiliatesService } from './affiliates.service.js';
import { createAffiliatesController } from './affiliates.controller.js';
import { registerAffiliatesRoutes } from './affiliates.routes.js';

export async function registerAffiliatesModule(app, { prefix, db, authGuard, producersApi }) {
  const repo = createAffiliatesRepository({ db });
  const service = createAffiliatesService({ repo, producersApi });
  const controller = createAffiliatesController(service);

  await app.register((scope) => registerAffiliatesRoutes(scope, { controller, authGuard }), { prefix });

  return {
    findLinkByCode: (code) => service.findLinkByCodeCrossModule(code)
  };
}
