import { createOrdersWebhookRepository } from './orders-webhook.repository.js';
import { createOrdersWebhookService } from './orders-webhook.service.js';
import { createOrdersWebhookController } from './orders-webhook.controller.js';
import { registerOrdersWebhookRoutes } from './orders-webhook.routes.js';

export async function registerOrdersWebhookModule(app, { prefix, db, authGuard, producersApi, affiliatesApi, ledgerApi }) {
  const repo = createOrdersWebhookRepository({ db });
  const service = createOrdersWebhookService({ repo, producersApi, affiliatesApi, ledgerApi });
  const controller = createOrdersWebhookController(service);
  await app.register((scope) => registerOrdersWebhookRoutes(scope, { controller, authGuard }), { prefix });
  return {};
}
