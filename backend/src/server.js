import { parseEnv } from './config/env.js';
import { buildApp } from './app.js';

const env = parseEnv();
const app = await buildApp(env);

const shutdown = async (signal) => {
  app.log.info({ signal }, 'Shutting down gracefully');
  await app.close();
  process.exit(0);
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

try {
  await app.listen({ host: env.HOST, port: env.PORT });
} catch (err) {
  app.log.error(err, 'Failed to start backend server');
  process.exit(1);
}
