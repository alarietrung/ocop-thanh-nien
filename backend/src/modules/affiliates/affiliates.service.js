import { createHash } from 'node:crypto';
import { ForbiddenError, NotFoundError, ValidationError } from '../../common/errors.js';
import { generateAffiliateCode, validateMarketplaceListingUrl } from '../../common/domainUtils.js';

export function createAffiliatesService({ repo, producersApi }) {
  return {
    async listMyLinks(actor) {
      return repo.listLinksByUser(actor);
    },

    async createLink(actor, { productId, platform }) {
      const product = await producersApi.findProductForCrossModule(productId);
      if (!product || product.status !== 'published') {
        throw new ValidationError('Chỉ có thể tạo link affiliate cho sản phẩm OCOP đã công bố.');
      }
      const listing =
        (platform ? product.listings?.find((l) => l.platform === platform && l.status === 'active') : null) ||
        product.listings?.[0];
      if (!listing) {
        throw new ValidationError('Sản phẩm chưa có đường dẫn sàn hợp lệ.');
      }
      const check = validateMarketplaceListingUrl(listing.url, listing.platform);
      if (!check.valid) {
        throw new ValidationError(`URL đích trên sàn không hợp lệ: ${check.reason}`);
      }

      const code = generateAffiliateCode(10);
      const created = await repo.createLink(actor, {
        code,
        affiliateName: actor.displayName || actor.email,
        productId: product.id,
        platform: listing.platform,
        targetUrl: check.url,
        isDemoTarget: Boolean(listing.isDemoTarget)
      });

      await producersApi.logAudit(actor, {
        action: 'AFFILIATE_CREATE_LINK',
        targetType: 'affiliate_link',
        targetId: created.id,
        detail: `Tạo mã link ${created.code} cho SKU ${product.sku}`
      });

      return created;
    },

    async deactivateLink(actor, linkId) {
      const existing = await repo.findLinkById(actor, linkId);
      if (!existing) throw new NotFoundError('Không tìm thấy đường dẫn affiliate.');
      if (existing.affiliateId !== actor.id && actor.role !== 'ops') {
        throw new ForbiddenError('Không thể khóa liên kết thuộc đoàn viên khác.');
      }
      return repo.deactivateLink(actor, linkId);
    },

    async lookupPublicRedirect(code) {
      const link = await repo.findLinkByCode(code);
      if (!link) throw new NotFoundError('Không tìm thấy mã liên kết chia sẻ.');
      return {
        code: link.code,
        active: link.active,
        platform: link.platform,
        affiliateName: link.affiliateName || 'Đoàn viên OCOP',
        isDemoTarget: Boolean(link.isDemoTarget),
        clicksCount: link.clicksCount,
        product: link.product
      };
    },

    async recordIntentionalVisit(code, userAgent = '') {
      const existing = await repo.findLinkByCode(code);
      if (!existing) throw new NotFoundError('Không tìm thấy mã liên kết chia sẻ.');
      if (!existing.active) throw new ValidationError('Liên kết chia sẻ đã bị vô hiệu hóa.');
      const check = validateMarketplaceListingUrl(existing.targetUrl, existing.platform);
      if (!check.valid) {
        throw new ValidationError(`Liên kết đích không đạt kiểm tra an toàn: ${check.reason}`);
      }

      const uaHash = createHash('sha256').update(String(userAgent || '')).digest('hex').slice(0, 16);
      const updated = await repo.recordIntentionalClick(code, uaHash);
      if (!updated) throw new ValidationError('Không thể ghi nhận lượt chuyển sàn.');

      return {
        targetUrl: check.url,
        platform: existing.platform,
        clicksCount: updated.clicksCount
      };
    },

    async findLinkByCodeCrossModule(code) {
      return repo.findLinkByCode(code);
    }
  };
}
