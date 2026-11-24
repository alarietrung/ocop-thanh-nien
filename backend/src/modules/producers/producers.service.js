import { randomUUID } from 'node:crypto';
import { ForbiddenError, NotFoundError, ValidationError } from '../../common/errors.js';
import { normalizeVi, slugifyVi, validateMarketplaceListingUrl } from '../../common/domainUtils.js';

export function createProducersService({ repo, verifyTurnstile }) {
  return {
    async listPublicCatalog(query) {
      return repo.listPublishedCatalog(query);
    },

    async getPublicProduct(slug) {
      const product = await repo.findPublishedProductBySlug(slug);
      if (!product) throw new NotFoundError('Không tìm thấy sản phẩm OCOP');
      return product;
    },

    async getPublicProducer(slug) {
      const result = await repo.findProducerBySlug(slug);
      if (!result) throw new NotFoundError('Không tìm thấy gian hàng cơ sở OCOP');
      return result;
    },

    async submitPilotApplication(payload, { remoteIp, logger }) {
      await verifyTurnstile({
        token: payload.turnstileToken,
        expectedAction: 'pilot_application',
        remoteIp,
        logger
      });
      return repo.savePilotApplication({
        applicantName: payload.applicantName,
        businessName: payload.businessName,
        area: payload.area,
        productNote: payload.productNote
      });
    },

    async listSellerProducts(actor) {
      if (!actor?.producerIds?.length) {
        throw new ForbiddenError('Tài khoản chưa được gắn quyền cơ sở OCOP nào.');
      }
      return repo.listSellerProducts(actor);
    },

    async createSellerProduct(actor, payload) {
      const producerId = actor?.producerIds?.[0];
      if (!producerId) {
        throw new ForbiddenError('Tài khoản không có quyền tạo sản phẩm cho cơ sở OCOP.');
      }
      const listings = (payload.listings || []).map((lst, idx) => {
        const check = validateMarketplaceListingUrl(lst.url, lst.platform);
        if (!check.valid) {
          throw new ValidationError(`Liên kết sàn #${idx + 1}: ${check.reason}`);
        }
        return {
          id: randomUUID(),
          platform: lst.platform,
          shopId: lst.shopId || `shop_${producerId.slice(0, 6)}_${lst.platform}`,
          externalItemId: lst.externalItemId || `EXT-${Date.now()}-${idx}`,
          url: check.url,
          isDemoTarget: true,
          status: 'active'
        };
      });

      const sku = `OCOP-DN-${String(Date.now()).slice(-4)}`;
      const slug = `${slugifyVi(payload.title)}-${sku.toLowerCase()}`;
      const created = await repo.createProduct(actor, {
        producerId,
        categoryId: payload.categoryId,
        sku,
        slug,
        title: payload.title,
        searchNormalized: normalizeVi(`${payload.title} ${sku}`),
        unit: payload.unit,
        spec: payload.spec,
        area: 'Đồng Nai',
        priceVnd: payload.priceVnd,
        priceUpdatedAt: new Date().toISOString(),
        stock: payload.stock,
        commissionRateBps: payload.commissionRateBps,
        commissionCondition: 'Áp dụng cho đơn hoàn thành trên sàn liên kết.',
        status: 'draft',
        description: payload.description,
        story: payload.story || '',
        listings
      });

      await repo.appendAuditLog(actor, {
        action: 'SELLER_CREATE_DRAFT',
        targetType: 'product',
        targetId: created.id,
        detail: `Tạo bản nháp ${created.sku}`
      });
      return created;
    },

    async updateSellerProduct(actor, productId, payload) {
      const existing = await repo.findProductById(productId, actor);
      if (!existing) throw new NotFoundError('Không tìm thấy sản phẩm.');
      if (!actor.producerIds?.includes(existing.producerId)) {
        throw new ForbiddenError('Không thể chỉnh sửa sản phẩm thuộc cơ sở khác.');
      }
      const patch = { ...payload };
      if (payload.title) {
        patch.searchNormalized = normalizeVi(`${payload.title} ${existing.sku}`);
      }
      const updated = await repo.updateProduct(actor, existing.id, patch);
      await repo.appendAuditLog(actor, {
        action: 'SELLER_UPDATE_PRODUCT',
        targetType: 'product',
        targetId: existing.id,
        detail: `Cập nhật ${existing.sku}`
      });
      return updated;
    },

    async submitSellerProduct(actor, productId) {
      const existing = await repo.findProductById(productId, actor);
      if (!existing) throw new NotFoundError('Không tìm thấy sản phẩm.');
      if (!actor.producerIds?.includes(existing.producerId)) {
        throw new ForbiddenError('Không thể gửi duyệt sản phẩm thuộc cơ sở khác.');
      }
      if (!existing.listings || existing.listings.length === 0) {
        throw new ValidationError('Cần liên kết ít nhất 1 sản phẩm trên sàn trước khi gửi duyệt.');
      }
      const updated = await repo.updateProduct(actor, existing.id, {
        status: 'pending_review',
        reviewNote: ''
      });
      await repo.appendAuditLog(actor, {
        action: 'SELLER_SUBMIT_REVIEW',
        targetType: 'product',
        targetId: existing.id,
        detail: `Gửi duyệt ${existing.sku}`
      });
      return updated;
    },

    async reviewProductOps(actor, productId, { decision, note }) {
      const existing = await repo.findProductById(productId, actor);
      if (!existing) throw new NotFoundError('Không tìm thấy sản phẩm cần duyệt.');
      const nextStatus = decision === 'approve' ? 'published' : 'needs_revision';
      if (decision === 'request_revision' && !String(note || '').trim()) {
        throw new ValidationError('Cần nhập lý do khi yêu cầu chủ cơ sở chỉnh sửa.');
      }
      const updated = await repo.updateProduct(actor, existing.id, {
        status: nextStatus,
        reviewNote: note || ''
      });
      await repo.appendAuditLog(actor, {
        action: decision === 'approve' ? 'OPS_APPROVE_PRODUCT' : 'OPS_REQUEST_REVISION',
        targetType: 'product',
        targetId: existing.id,
        detail: note || `Chuyển trạng thái ${nextStatus}`
      });
      return updated;
    },

    async findProductForCrossModule(idOrSku) {
      return repo.findProductById(idOrSku, { role: 'ops' });
    },

    async logAudit(actor, entry) {
      return repo.appendAuditLog(actor, entry);
    }
  };
}
