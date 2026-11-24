import { createHealthService } from './health.service.js';
import { createHealthController } from './health.controller.js';
import { registerHealthRoutes } from './health.routes.js';

export async function registerHealthModule(app, { prefix, serviceName, db }) {
  const service = createHealthService({ serviceName, db });
  const controller = createHealthController(service);
  await app.register((scope) => registerHealthRoutes(scope, { controller }), { prefix });
}
