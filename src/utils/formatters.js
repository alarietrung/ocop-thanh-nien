const ALLOWED_MARKETPLACE_HOSTS = {
  tiktok: ['shop.tiktok.com', 'www.tiktok.com', 'vt.tiktok.com'],
  shopee: ['shopee.vn', 'www.shopee.vn'],
  lazada: ['www.lazada.vn', 'lazada.vn']
};

export const PLATFORM_META = {
  direct_ocop: { id: 'direct_ocop', label: 'Chợ OCOP', shortLabel: 'OCOP', badgeClass: 'bg-brand text-white' },
  tiktok: { id: 'tiktok', label: 'TikTok Shop', shortLabel: 'TikTok', badgeClass: 'bg-stone-900 text-white' },
  shopee: { id: 'shopee', label: 'Shopee', shortLabel: 'Shopee', badgeClass: 'bg-amber-700 text-white' },
  lazada: { id: 'lazada', label: 'Lazada', shortLabel: 'Lazada', badgeClass: 'bg-sky-800 text-white' }
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

export function formatVnd(amount = 0) {
  const safe = Math.round(Number(amount) || 0);
  return `${new Intl.NumberFormat('vi-VN').format(safe)} ₫`;
}

export function formatBpsPercent(bps = 0) {
  const safe = Math.max(0, Math.min(10000, Math.round(Number(bps) || 0)));
  const pct = safe / 100;
  return Number.isInteger(pct) ? `${pct}%` : `${pct.toFixed(1)}%`;
}

export function calculateCommissionVnd(netAmountVnd, commissionRateBps) {
  const amount = Math.max(0, Math.round(Number(netAmountVnd) || 0));
  const bps = Math.max(0, Math.min(10000, Math.round(Number(commissionRateBps) || 0)));
  return Math.round((amount * bps) / 10000);
}

export function formatDateTimeVn(isoString) {
  if (!isoString) return 'Chưa cập nhật';
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return 'Chưa cập nhật';
  return new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

export function validateMarketplaceListingUrl(urlString, platform) {
  try {
    const parsed = new URL(String(urlString || '').trim());
    if (parsed.protocol !== 'https:') {
      return { valid: false, reason: 'Liên kết sàn bắt buộc dùng giao thức HTTPS.' };
    }
    const hostname = parsed.hostname.toLowerCase();
    const allowed = platform
      ? ALLOWED_MARKETPLACE_HOSTS[platform] || []
      : Object.values(ALLOWED_MARKETPLACE_HOSTS).flat();
    if (!allowed.includes(hostname)) {
      return {
        valid: false,
        reason: `Tên miền "${hostname}" không nằm trong danh sách sàn hợp lệ (${allowed.join(', ')}).`
      };
    }
    if (!parsed.pathname || parsed.pathname === '/') {
      return { valid: false, reason: 'Liên kết phải trỏ tới trang sản phẩm cụ thể trên sàn.' };
    }
    return { valid: true, url: parsed.toString(), hostname };
  } catch {
    return { valid: false, reason: 'Định dạng URL không hợp lệ.' };
  }
}

export function generateAffiliateCode(length = 10) {
  const alphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  const bytes = new Uint8Array(length);
  if (globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < length; i += 1) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('');
}

export function escapeCsvCell(value) {
  const str = String(value ?? '');
  const neutralized = /^[=+\-@\t\r]/.test(str) ? `'${str}` : str;
  if (/[",\n\r]/.test(neutralized)) {
    return `"${neutralized.replace(/"/g, '""')}"`;
  }
  return neutralized;
}

export function buildSafeCsv(headers, rows) {
  const headLine = headers.map((h) => escapeCsvCell(h.label)).join(',');
  const bodyLines = rows.map((row) => headers.map((h) => escapeCsvCell(row[h.key])).join(','));
  return `\uFEFF${[headLine, ...bodyLines].join('\r\n')}`;
}

export function parseOrderImportCsv(csvText = '') {
  const lines = String(csvText || '')
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    return {
      rows: [],
      errors: [{ line: 1, message: 'File CSV cần tối thiểu 1 dòng tiêu đề và 1 dòng dữ liệu.' }]
    };
  }

  const splitLine = (line) => {
    const out = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i += 1) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          cur += '"';
          i += 1;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === ',' && !inQuotes) {
        out.push(cur.trim());
        cur = '';
      } else {
        cur += ch;
      }
    }
    out.push(cur.trim());
    return out;
  };

  const headers = splitLine(lines[0]).map((h) => h.toLowerCase());
  const required = ['platform', 'shop_id', 'external_order_id', 'sku', 'quantity', 'gross_amount_vnd'];
  const missing = required.filter((col) => !headers.includes(col));
  if (missing.length > 0) {
    return {
      rows: [],
      errors: [{ line: 1, message: `Thiếu cột bắt buộc trong CSV: ${missing.join(', ')}` }]
    };
  }

  const rows = [];
  const errors = [];

  for (let idx = 1; idx < lines.length; idx += 1) {
    const lineNo = idx + 1;
    const cols = splitLine(lines[idx]);
    const record = {};
    headers.forEach((h, colIdx) => {
      record[h] = cols[colIdx] ?? '';
    });

    const platform = record.platform?.toLowerCase();
    const quantity = Number(record.quantity);
    const grossAmountVnd = Number(record.gross_amount_vnd);
    const netAmountVnd = record.net_amount_vnd ? Number(record.net_amount_vnd) : grossAmountVnd;
    const status = (record.status || 'placed').toLowerCase();

    if (!['tiktok', 'shopee', 'lazada'].includes(platform)) {
      errors.push({ line: lineNo, message: `Sàn "${record.platform}" không hợp lệ (chỉ nhận tiktok, shopee, lazada).` });
      continue;
    }
    if (!record.shop_id || !record.external_order_id || !record.sku) {
      errors.push({ line: lineNo, message: 'Thiếu shop_id, external_order_id hoặc sku.' });
      continue;
    }
    if (!Number.isInteger(quantity) || quantity <= 0 || quantity > 1000) {
      errors.push({ line: lineNo, message: 'Số lượng (quantity) phải là số nguyên dương từ 1 đến 1000.' });
      continue;
    }
    if (!Number.isFinite(grossAmountVnd) || grossAmountVnd <= 0 || grossAmountVnd > 500000000) {
      errors.push({ line: lineNo, message: 'Giá trị đơn (gross_amount_vnd) không hợp lệ.' });
      continue;
    }
    if (!['placed', 'confirmed', 'completed', 'cancelled', 'refunded'].includes(status)) {
      errors.push({ line: lineNo, message: `Trạng thái "${status}" không hợp lệ.` });
      continue;
    }

    rows.push({
      line: lineNo,
      platform,
      shopId: record.shop_id,
      externalOrderId: record.external_order_id,
      sku: record.sku.toUpperCase(),
      quantity,
      grossAmountVnd: Math.round(grossAmountVnd),
      netAmountVnd: Math.round(netAmountVnd),
      affiliateCode: record.affiliate_code || '',
      status,
      orderedAt: record.ordered_at || new Date().toISOString()
    });
  }

  return { rows, errors };
}

export function buildProductArtworkDataUri({ title, area, accentHex = '#15803D', secondaryHex = '#B45309', tag = 'OCOP Pilot' }) {
  const safeTitle = String(title || 'Nông sản Đồng Nai').slice(0, 38).replace(/[<>&"]/g, '');
  const safeArea = String(area || 'Đồng Nai').slice(0, 28).replace(/[<>&"]/g, '');
  const safeTag = String(tag || 'OCOP Pilot').slice(0, 22).replace(/[<>&"]/g, '');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480" viewBox="0 0 640 480">
    <rect width="640" height="480" fill="#FAF8F5"/>
    <circle cx="520" cy="110" r="145" fill="${accentHex}" fill-opacity="0.10"/>
    <circle cx="130" cy="390" r="165" fill="${secondaryHex}" fill-opacity="0.10"/>
    <rect x="36" y="36" width="568" height="408" rx="24" fill="#FFFFFF" stroke="#E7E5E4" stroke-width="2"/>
    <rect x="64" y="64" width="176" height="34" rx="17" fill="${accentHex}"/>
    <text x="152" y="86" text-anchor="middle" font-family="Segoe UI, sans-serif" font-size="14" font-weight="700" fill="#FFFFFF">${safeTag}</text>
    <g transform="translate(250, 128)">
      <rect x="0" y="24" width="140" height="156" rx="22" fill="${accentHex}" fill-opacity="0.14" stroke="${accentHex}" stroke-width="3"/>
      <path d="M70 0 C95 0 112 18 112 36 C86 38 74 28 70 12 C66 28 54 38 28 36 C28 18 45 0 70 0 Z" fill="${accentHex}"/>
      <rect x="24" y="68" width="92" height="68" rx="12" fill="#FAF8F5" stroke="${secondaryHex}" stroke-width="2"/>
      <circle cx="70" cy="102" r="18" fill="${secondaryHex}" fill-opacity="0.22"/>
    </g>
    <text x="320" y="354" text-anchor="middle" font-family="Segoe UI, sans-serif" font-size="22" font-weight="700" fill="#1C1917">${safeTitle}</text>
    <text x="320" y="390" text-anchor="middle" font-family="Segoe UI, sans-serif" font-size="15" font-weight="600" fill="#57534E">Vùng nguyên liệu: ${safeArea}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
