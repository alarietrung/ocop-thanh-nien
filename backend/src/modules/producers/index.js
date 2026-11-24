import { createProducersRepository } from './producers.repository.js';
import { createProducersService } from './producers.service.js';
import { createProducersController } from './producers.controller.js';
import { registerProducersRoutes } from './producers.routes.js';

export async function registerProducersModule(app, { prefix, db, authGuard, verifyTurnstile }) {
  const repo = createProducersRepository({ db });
  const service = createProducersService({ repo, verifyTurnstile });
  const controller = createProducersController(service);

  await app.register((scope) => registerProducersRoutes(scope, { controller, authGuard }), { prefix });

  return {
    findProductForCrossModule: (idOrSku) => service.findProductForCrossModule(idOrSku),
    logAudit: (actor, entry) => service.logAudit(actor, entry)
  };
}
