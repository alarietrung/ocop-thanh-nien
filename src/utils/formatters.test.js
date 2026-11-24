import { describe, it, expect } from 'vitest';
import {
  buildSafeCsv,
  calculateCommissionVnd,
  escapeCsvCell,
  formatBpsPercent,
  generateAffiliateCode,
  normalizeVi,
  parseOrderImportCsv,
  validateMarketplaceListingUrl
} from './formatters';

describe('formatters & domain helpers', () => {
  it('normalizes Vietnamese text with and without diacritics', () => {
    expect(normalizeVi('Hạt Điều Định Quán — Đồng Nai')).toBe('hat dieu dinh quan — dong nai');
    expect(normalizeVi('Đoàn viên Thanh niên')).toBe('doan vien thanh nien');
  });

  it('calculates commission in VND from basis points safely', () => {
    expect(formatBpsPercent(1200)).toBe('12%');
    expect(formatBpsPercent(1250)).toBe('12.5%');
    expect(calculateCommissionVnd(285000, 1500)).toBe(42750);
  });

  it('validates marketplace listing URLs against strict HTTPS allowlists', () => {
    expect(validateMarketplaceListingUrl('https://shopee.vn/hat-dieu-i.1.2', 'shopee').valid).toBe(true);
    expect(validateMarketplaceListingUrl('http://shopee.vn/hat-dieu-i.1.2', 'shopee').valid).toBe(false);
    expect(validateMarketplaceListingUrl('https://evil.example.com/phish', 'tiktok').valid).toBe(false);
    expect(validateMarketplaceListingUrl('https://shopee.vn/', 'shopee').valid).toBe(false);
  });

  it('neutralizes CSV formula injection and parses valid order CSV rows', () => {
    expect(escapeCsvCell('=CMD()')).toBe("'=CMD()");
    const csv = buildSafeCsv(
      [{ key: 'name', label: 'Tên' }],
      [{ name: '+SUM(A1:A2)' }]
    );
    expect(csv).toContain("'+SUM(A1:A2)");

    const parsed = parseOrderImportCsv(
      'platform,shop_id,external_order_id,sku,quantity,gross_amount_vnd,status\n' +
        'tiktok,shop1,ORD-1,OCOP-DN-002,2,190000,completed\n' +
        'badplat,shop1,ORD-2,OCOP-DN-002,1,50000,placed'
    );
    expect(parsed.rows).toHaveLength(1);
    expect(parsed.errors).toHaveLength(1);
    expect(parsed.rows[0].externalOrderId).toBe('ORD-1');
  });

  it('generates hard-to-guess affiliate short codes', () => {
    const codeA = generateAffiliateCode(10);
    const codeB = generateAffiliateCode(10);
    expect(codeA).toHaveLength(10);
    expect(codeA).not.toBe(codeB);
  });
});
