import { randomBytes } from 'node:crypto';

const ALLOWED_HOSTS = {
  tiktok: ['shop.tiktok.com', 'www.tiktok.com', 'vt.tiktok.com'],
  shopee: ['shopee.vn', 'www.shopee.vn'],
  lazada: ['www.lazada.vn', 'lazada.vn']
};

export const ORDER_TRANSITIONS = {
  placed: ['confirmed', 'completed', 'cancelled'],
  confirmed: ['completed', 'cancelled', 'refunded'],
  completed: ['refunded'],
  cancelled: [],
  refunded: []
};

export function normalizeVi(input = '') {
  return String(input || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

export function slugifyVi(input = '') {
  return normalizeVi(input)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export function calculateCommissionVnd(netAmountVnd, commissionRateBps) {
  const amount = Math.max(0, Math.round(Number(netAmountVnd) || 0));
  const bps = Math.max(0, Math.min(10000, Math.round(Number(commissionRateBps) || 0)));
  return Math.round((amount * bps) / 10000);
}

export function validateMarketplaceListingUrl(urlString, platform) {
  try {
    const parsed = new URL(String(urlString || '').trim());
    if (parsed.protocol !== 'https:') {
      return { valid: false, reason: 'Listing URL must use HTTPS' };
    }
    const hostname = parsed.hostname.toLowerCase();
    const allowed = platform ? ALLOWED_HOSTS[platform] || [] : Object.values(ALLOWED_HOSTS).flat();
    if (!allowed.includes(hostname)) {
      return { valid: false, reason: `Hostname ${hostname} is not on the approved marketplace allowlist` };
    }
    if (!parsed.pathname || parsed.pathname === '/') {
      return { valid: false, reason: 'Listing URL must point to a concrete product path' };
    }
    return { valid: true, url: parsed.toString(), hostname };
  } catch {
    return { valid: false, reason: 'Malformed URL' };
  }
}

export function generateAffiliateCode(length = 10) {
  const alphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  const buf = randomBytes(length);
  let code = '';
  for (let i = 0; i < length; i += 1) {
    code += alphabet[buf[i] % alphabet.length];
  }
  return code;
}
