import { execSync } from 'node:child_process';
import { copyFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const rawBase = process.env.VITE_BASE_PATH || '/hackathon/de-3/';
const normalizedBase = rawBase.endsWith('/') ? rawBase : `${rawBase}/`;

console.log(`[de-3:build:gh] Building Vite bundle with VITE_BASE_PATH=${normalizedBase}`);

execSync('npx vite build', {
  stdio: 'inherit',
  env: {
    ...process.env,
    VITE_BASE_PATH: normalizedBase
  }
});

const distIndex = resolve('dist', 'index.html');
const dist404 = resolve('dist', '404.html');

if (!existsSync(distIndex)) {
  throw new Error(`Expected build artifact missing: ${distIndex}`);
}

copyFileSync(distIndex, dist404);
console.log('[de-3:build:gh] Generated dist/404.html for SPA fallback.');
