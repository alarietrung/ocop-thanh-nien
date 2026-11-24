import { buildApp } from '../src/app.js';
import { parseEnv } from '../src/config/env.js';

let appPromise = null;

async function getApp() {
  if (!appPromise) {
    const env = parseEnv(process.env);
    appPromise = buildApp(env).then(async (app) => {
      await app.ready();
      return app;
    });
  }
  return appPromise;
}

export default async function handler(req, res) {
  const app = await getApp();
  app.server.emit('request', req, res);
}
