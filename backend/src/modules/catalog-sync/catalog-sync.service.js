import { ForbiddenError, NotFoundError, ValidationError } from '../../common/errors.js';
import { validateMarketplaceListingUrl } from '../../common/domainUtils.js';

export function createCatalogSyncService({ repo, producersApi }) {
  return {
    getMarketplaceAdapterStatus() {
      return {
        mode: 'sandbox_and_csv_import',
        providers: [
          {
            platform: 'tiktok',
            label: 'TikTok Shop',
            oauthConnected: false,
            supportedLevel: 'link_and_csv_import',
            missingRequirement: 'Cần tài khoản đối tác TikTok Shop Partner API & App Key/Secret đã duyệt.'
          },
          {
            platform: 'shopee',
            label: 'Shopee',
            oauthConnected: false,
            supportedLevel: 'link_and_csv_import',
            missingRequirement: 'Cần Shopee Open Platform Partner ID/Key được cấp quyền live.'
          },
          {
            platform: 'lazada',
            label: 'Lazada',
            oauthConnected: false,
            supportedLevel: 'link_and_csv_import',
            missingRequirement: 'Cần Lazada Open Platform App Key/Secret cho đồng bộ đơn.'
          }
        ]
      };
    },

    async addProductListing(actor, productId, payload) {
      const product = await producersApi.findProductForCrossModule(productId);
      if (!product) throw new NotFoundError('Không tìm thấy sản phẩm.');
      if (!actor.producerIds?.includes(product.producerId)) {
        throw new ForbiddenError('Không thể gắn link sàn cho sản phẩm thuộc cơ sở khác.');
      }
      const check = validateMarketplaceListingUrl(payload.url, payload.platform);
      if (!check.valid) {
        throw new ValidationError(check.reason);
      }
      const created = await repo.attachListing(actor, product.id, {
        platform: payload.platform,
        shopId: payload.shopId || `shop_${product.producerId.slice(0, 6)}_${payload.platform}`,
        externalItemId: payload.externalItemId || `EXT-${Date.now()}`,
        url: check.url
      });
      await producersApi.logAudit(actor, {
        action: 'SELLER_ATTACH_LISTING',
        targetType: 'product_listing',
        targetId: created.id,
        detail: `Gắn listing ${payload.platform} cho SKU ${product.sku}`
      });
      return created;
    }
  };
}
