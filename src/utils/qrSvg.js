import { create } from '../vendor/qr-core';
import { productionStorefront } from '../config/productionStorefront';

export function buildPublicTraceUrl(batchCode) {
  const safeBatch = encodeURIComponent(String(batchCode || '').trim());
  const configuredPublic = String(import.meta.env?.VITE_PUBLIC_WEB_URL || '').trim().replace(/\/+$/, '');
  if (typeof window !== 'undefined') {
    const { protocol, hostname, origin } = window.location;
    const isPublicHttp =
      (protocol === 'https:' || protocol === 'http:') &&
      !/^(localhost|127\.0\.0\.1|\[::1\])$/i.test(hostname);
    if (isPublicHttp) {
      const basePath = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');
      return `${origin}${basePath}/nhat-ky/${safeBatch}`;
    }
  }
  const fallbackOrigin = configuredPublic || `https://${productionStorefront.hostname}`;
  return `${fallbackOrigin}/nhat-ky/${safeBatch}`;
}

export function buildTraceQrSvgDataUri(payload) {
  try {
    const { modules } = create(payload, { errorCorrectionLevel: 'M' });
    // Standard ISO/IEC 18004 quiet zone: 4 modules of white border around all 4 sides
    const margin = 4;
    const size = modules.size + 2 * margin;
    const paths = [];
    for (let y = 0; y < modules.size; y += 1) {
      for (let x = 0; x < modules.size; x += 1) {
        if (modules.get(y, x)) {
          paths.push(`M${x + margin} ${y + margin}h1v1h-1z`);
        }
      }
    }
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" role="img" viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges"><rect width="${size}" height="${size}" fill="#FFFFFF"/><path fill="#08234B" d="${paths.join('')}"/></svg>`;
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  } catch {
    return '';
  }
}
