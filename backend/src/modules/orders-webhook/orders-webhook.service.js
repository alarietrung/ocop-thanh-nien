import { AppError, ForbiddenError, NotFoundError } from '../../common/errors.js';
import { calculateCommissionVnd } from '../../common/domainUtils.js';

export function createOrdersWebhookService({ repo, producersApi, affiliatesApi, ledgerApi }) {
  return {
    async listSellerOrders(actor) {
      if (!actor.producerIds?.length) {
        throw new ForbiddenError('Tài khoản chưa được gắn quyền cơ sở OCOP nào.');
      }
      return repo.listSellerOrders(actor);
    },

    async previewImport(actor, { rows }) {
      const validRows = [];
      const errors = [];

      for (let i = 0; i < rows.length; i += 1) {
        const row = rows[i];
        const product = await producersApi.findProductForCrossModule(row.sku.toUpperCase());
        if (!product) {
          errors.push({ line: row.line || i + 1, reason: `Không tìm thấy SKU ${row.sku}` });
          continue;
        }
        if (actor.role === 'seller' && !actor.producerIds?.includes(product.producerId)) {
          errors.push({ line: row.line || i + 1, reason: `SKU ${row.sku} không thuộc quyền cơ sở của bạn` });
          continue;
        }
        validRows.push({
          ...row,
          productId: product.id,
          producerId: product.producerId,
          productTitle: product.title,
          commissionRateBps: product.commissionRateBps
        });
      }

      const batch = await repo.createImportBatch(actor, {
        totalRows: rows.length,
        validRows: validRows.length,
        payload: validRows
      });

      return {
        batchId: batch.id,
        totalRows: rows.length,
        validCount: validRows.length,
        errors
      };
    },

    async commitImport(actor, batchId) {
      const batch = await repo.getImportBatch(actor, batchId);
      if (!batch) throw new NotFoundError('Không tìm thấy lô import.');
      if (batch.actorUserId !== actor.id && actor.role !== 'ops') {
        throw new ForbiddenError('Không thể xác nhận lô import của tài khoản khác.');
      }
      if (batch.status === 'committed') {
        return {
          batchId: batch.id,
          alreadyCommitted: true,
          insertedCount: batch.insertedCount,
          duplicateCount: batch.duplicateCount
        };
      }

      let insertedCount = 0;
      let duplicateCount = 0;

      for (const row of batch.payload || []) {
        const link = row.affiliateCode ? await affiliatesApi.findLinkByCode(row.affiliateCode) : null;
        const netAmountVnd = row.netAmountVnd ?? row.grossAmountVnd;
        const commissionVnd = link ? calculateCommissionVnd(netAmountVnd, row.commissionRateBps) : 0;

        const res = await repo.insertOrderIfUnique(actor, {
          platform: row.platform,
          shopId: row.shopId,
          externalOrderId: row.externalOrderId,
          producerId: row.producerId,
          productId: row.productId,
          sku: row.sku.toUpperCase(),
          productTitle: row.productTitle,
          quantity: row.quantity,
          affiliateLinkId: link ? link.id : null,
          affiliateId: link ? link.affiliateId : null,
          affiliateName: link ? link.affiliateName || 'Đoàn viên' : 'Chưa gán',
          attributionStatus: link ? 'attributed' : 'unassigned',
          grossAmountVnd: row.grossAmountVnd,
          netAmountVnd,
          commissionRateBps: row.commissionRateBps,
          commissionVnd,
          status: row.status || 'placed',
          source: 'csv_import',
          importBatchId: batch.id,
          orderedAt: row.orderedAt || new Date().toISOString()
        });

        if (res.duplicate) {
          duplicateCount += 1;
          continue;
        }

        insertedCount += 1;
        if (link && commissionVnd > 0 && row.status !== 'cancelled' && row.status !== 'refunded') {
          const state = row.status === 'completed' ? 'available' : 'pending';
          await ledgerApi.recordOrderCommission(actor, {
            orderId: res.order.id,
            affiliateId: link.affiliateId,
            amountVnd: commissionVnd,
            state,
            note: `Import CSV đơn ${row.externalOrderId}`
          });
        }
      }

      await repo.markBatchCommitted(actor, batch.id, { insertedCount, duplicateCount });
      await producersApi.logAudit(actor, {
        action: 'IMPORT_BATCH_COMMITTED',
        targetType: 'import_batch',
        targetId: batch.id,
        detail: `Nhập ${insertedCount} đơn mới, bỏ qua ${duplicateCount} đơn trùng`
      });

      return { batchId: batch.id, insertedCount, duplicateCount };
    },

    handleMarketplaceWebhook(platform) {
      throw new AppError(
        `Webhook sàn ${platform} hiện đóng mặc định vì chưa có khóa chữ ký đối tác chính thức. Hãy dùng Import CSV mẫu hoặc cấu hình sandbox hợp lệ.`,
        {
          statusCode: 501,
          code: 'PARTNER_INTEGRATION_NOT_ENABLED'
        }
      );
    }
  };
}
