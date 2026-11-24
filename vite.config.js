import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { handleAiDescribeRequest } from './api/ai-describe.js';

function localAiApiPlugin() {
  const middleware = async (req, res, next) => {
    if (!req.url?.startsWith('/api/ai-describe')) return next();
    try {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const bodyBuffer = Buffer.concat(chunks);
      const url = `http://${req.headers.host || 'localhost:5175'}${req.url}`;
      const headers = new Headers();
      for (const [k, v] of Object.entries(req.headers)) {
        if (typeof v === 'string') headers.set(k, v);
        else if (Array.isArray(v)) headers.set(k, v.join(', '));
      }
      const webReq = new Request(url, {
        method: req.method,
        headers,
        body: ['GET', 'HEAD', 'OPTIONS'].includes(req.method || '') ? undefined : bodyBuffer
      });
      const webRes = await handleAiDescribeRequest(webReq);
      res.statusCode = webRes.status;
      webRes.headers.forEach((value, key) => res.setHeader(key, value));
      const out = Buffer.from(await webRes.arrayBuffer());
      res.end(out);
    } catch {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ ok: false, code: 'LOCAL_API_ERROR', message: 'Lỗi máy chủ cục bộ.' }));
    }
  };
  return {
    name: 'ocop-local-ai-api',
    configureServer(server) {
      server.middlewares.use(middleware);
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware);
    }
  };
}

export default defineConfig({
  base: process.env.VITE_BASE_PATH || '/',
  plugins: [react(), localAiApiPlugin()],
  server: {
    port: 5175,
    host: true
  }
});
