import { NotFoundError, ValidationError } from '../../common/errors.js';
import { ORDER_TRANSITIONS } from '../../common/domainUtils.js';

export function createCommissionLedgerService({ repo, producersApi }) {
  return {
    async getMyCommission(actor) {
      const entries = await repo.getAffiliateLedger(actor);
      let pendingVnd = 0;
      let availableVnd = 0;
      let paidVnd = 0;
      let clawedBackVnd = 0;

      for (const row of entries) {
        const signed = row.direction === 'credit' ? row.amountVnd : -row.amountVnd;
        if (row.state === 'pending') pendingVnd += signed;
        if (row.state === 'available') availableVnd += signed;
        if (row.state === 'paid') paidVnd += signed;
        if (row.state === 'clawed_back') clawedBackVnd += Math.abs(signed);
      }

      return {
        summary: {
          pendingVnd: Math.max(0, pendingVnd),
          availableVnd: Math.max(0, availableVnd),
          paidVnd: Math.max(0, paidVnd),
          clawedBackVnd
        },
        entries
      };
    },

    async recordOrderCommission(actor, { orderId, affiliateId, amountVnd, state, note }) {
      if (!affiliateId || amountVnd <= 0) return null;
      return repo.appendDoubleEntry(actor, {
        orderId,
        affiliateId,
        amountVnd,
        state,
        note,
        debitAccount: 'platform_escrow',
        creditAccount: 'affiliate_payable'
      });
    },

    async reconcileOrder(actor, { orderId, nextStatus, reason }) {
      const data = await repo.getOrderForReconcile(actor, orderId);
      if (!data) throw new NotFoundError('Không tìm thấy đơn hàng.');
      const { order, entries } = data;

      if (!ORDER_TRANSITIONS[order.status]?.includes(nextStatus)) {
        throw new ValidationError(`Không thể chuyển trạng thái đơn từ "${order.status}" sang "${nextStatus}".`);
      }

      const netCredited = entries.reduce(
        (acc, r) => acc + (r.direction === 'credit' ? r.amountVnd : -r.amountVnd),
        0
      );

      if ((nextStatus === 'refunded' || nextStatus === 'cancelled') && netCredited > 0 && order.affiliateId) {
        await repo.appendDoubleEntry(actor, {
          orderId: order.id,
          affiliateId: order.affiliateId,
          amountVnd: netCredited,
          state: 'clawed_back',
          note: `Bút toán đảo hoàn/hủy đơn ${order.externalOrderId}: ${reason || 'Hoàn trả sàn'}`,
          debitAccount: 'affiliate_payable',
          creditAccount: 'platform_escrow',
          reversalOfTxGroupId: entries[0]?.txGroupId || null
        });
      } else if (nextStatus === 'completed' && order.affiliateId && order.commissionVnd > 0) {
        const pendingAmount = entries
          .filter((l) => l.state === 'pending')
          .reduce((acc, r) => acc + (r.direction === 'credit' ? r.amountVnd : -r.amountVnd), 0);
        if (pendingAmount > 0) {
          await repo.appendDoubleEntry(actor, {
            orderId: order.id,
            affiliateId: order.affiliateId,
            amountVnd: pendingAmount,
            state: 'available',
            note: `Mở khóa hoa hồng khả dụng đơn ${order.externalOrderId}`,
            debitAccount: 'platform_escrow',
            creditAccount: 'affiliate_payable'
          });
        }
      }

      const updated = await repo.updateOrderStatus(actor, order.id, nextStatus);
      await producersApi.logAudit(actor, {
        action: `OPS_RECONCILE_${nextStatus.toUpperCase()}`,
        targetType: 'order',
        targetId: order.id,
        detail: reason || `Cập nhật trạng thái ${order.status} -> ${nextStatus}`
      });
      return updated;
    },

    async getOpsMetrics(actor, { platform }) {
      return repo.getOpsMetrics(actor, platform);
    }
  };
}
