import { randomUUID } from 'node:crypto';

export function createCommissionLedgerRepository({ db }) {
  return {
    async getAffiliateLedger(actor) {
      return db.withActorTx(actor, async (tx) => {
        if (tx.mode === 'memory') {
          const ordersMap = new Map(tx.memory.orders.map((o) => [o.id, o]));
          const entries = tx.memory.commissionLedger
            .filter((e) => e.affiliateId === actor.id && e.accountType === 'affiliate_payable')
            .map((e) => ({ ...e, order: ordersMap.get(e.orderId) || null }));
          return entries;
        }
        const res = await tx.query(
          `SELECT cl.id, cl.tx_group_id AS "txGroupId", cl.order_id AS "orderId", cl.affiliate_user_id AS "affiliateId",
                  cl.account_type AS "accountType", cl.direction, cl.amount_vnd AS "amountVnd", cl.state, cl.note, cl.created_at AS "createdAt",
                  o.external_order_id AS "externalOrderId", o.platform, o.net_amount_vnd AS "netAmountVnd", o.commission_rate_bps AS "commissionRateBps"
           FROM ocop_app.commission_ledger cl
           JOIN ocop_app.orders o ON o.id = cl.order_id
           WHERE cl.affiliate_user_id = $1 AND cl.account_type = 'affiliate_payable'
           ORDER BY cl.created_at DESC`,
          [actor.id]
        );
        return res.rows;
      });
    },

    async appendDoubleEntry(actor, { orderId, affiliateId, amountVnd, state, note, debitAccount, creditAccount, reversalOfTxGroupId = null }) {
      const txGroupId = randomUUID();
      const createdAt = new Date().toISOString();
      return db.withActorTx(actor, async (tx) => {
        if (tx.mode === 'memory') {
          const debit = {
            id: randomUUID(),
            txGroupId,
            orderId,
            affiliateId,
            accountType: debitAccount,
            direction: 'debit',
            amountVnd,
            state,
            reversalOfTxGroupId,
            note,
            createdAt
          };
          const credit = {
            id: randomUUID(),
            txGroupId,
            orderId,
            affiliateId,
            accountType: creditAccount,
            direction: 'credit',
            amountVnd,
            state,
            reversalOfTxGroupId,
            note,
            createdAt
          };
          tx.memory.commissionLedger.unshift(credit, debit);
          return { txGroupId, debit, credit };
        }

        await tx.query(
          `INSERT INTO ocop_app.commission_ledger (tx_group_id, order_id, affiliate_user_id, account_type, direction, amount_vnd, state, reversal_of_tx_group_id, note)
           VALUES ($1,$2,$3,$4,'debit',$5,$6,$7,$8), ($1,$2,$3,$9,'credit',$5,$6,$7,$8)`,
          [txGroupId, orderId, affiliateId, debitAccount, amountVnd, state, reversalOfTxGroupId, note, creditAccount]
        );
        return { txGroupId };
      });
    },

    async getOrderForReconcile(actor, orderId) {
      return db.withActorTx(actor, async (tx) => {
        if (tx.mode === 'memory') {
          const order = tx.memory.orders.find((o) => o.id === orderId) || null;
          if (!order) return null;
          const entries = tx.memory.commissionLedger.filter((l) => l.orderId === orderId && l.accountType === 'affiliate_payable');
          return { order, entries };
        }
        const oRes = await tx.query(
          `SELECT id, platform, shop_id AS "shopId", external_order_id AS "externalOrderId", producer_id AS "producerId",
                  affiliate_user_id AS "affiliateId", net_amount_vnd AS "netAmountVnd", commission_rate_bps AS "commissionRateBps",
                  commission_vnd AS "commissionVnd", status
           FROM ocop_app.orders WHERE id = $1 LIMIT 1`,
          [orderId]
        );
        if (oRes.rows.length === 0) return null;
        const lRes = await tx.query(
          `SELECT id, tx_group_id AS "txGroupId", direction, amount_vnd AS "amountVnd", state
           FROM ocop_app.commission_ledger WHERE order_id = $1 AND account_type = 'affiliate_payable'`,
          [orderId]
        );
        return { order: oRes.rows[0], entries: lRes.rows };
      });
    },

    async updateOrderStatus(actor, orderId, nextStatus) {
      return db.withActorTx(actor, async (tx) => {
        if (tx.mode === 'memory') {
          const order = tx.memory.orders.find((o) => o.id === orderId);
          if (!order) return null;
          order.status = nextStatus;
          return order;
        }
        const res = await tx.query(
          `UPDATE ocop_app.orders SET status = $2 WHERE id = $1
           RETURNING id, external_order_id AS "externalOrderId", status`,
          [orderId, nextStatus]
        );
        return res.rows[0] || null;
      });
    },

    async getOpsMetrics(actor, platform = 'all') {
      return db.withActorTx(actor, async (tx) => {
        if (tx.mode === 'memory') {
          const orders = platform === 'all' ? tx.memory.orders : tx.memory.orders.filter((o) => o.platform === platform);
          const links = platform === 'all' ? tx.memory.affiliateLinks : tx.memory.affiliateLinks.filter((l) => l.platform === platform);
          const grossRevenueVnd = orders
            .filter((o) => o.status !== 'cancelled' && o.status !== 'refunded')
            .reduce((s, o) => s + o.grossAmountVnd, 0);
          const totalClicks = links.reduce((s, l) => s + (l.clicksCount || 0), 0);
          const payable = tx.memory.commissionLedger.filter((l) => l.accountType === 'affiliate_payable');
          const available = payable
            .filter((l) => l.state === 'available')
            .reduce((s, l) => s + (l.direction === 'credit' ? l.amountVnd : -l.amountVnd), 0);
          const pending = payable
            .filter((l) => l.state === 'pending')
            .reduce((s, l) => s + (l.direction === 'credit' ? l.amountVnd : -l.amountVnd), 0);

          const productMap = new Map();
          const affiliateMap = new Map();
          for (const o of orders) {
            if (o.status === 'cancelled' || o.status === 'refunded') continue;
            const prevP = productMap.get(o.sku) || { sku: o.sku, title: o.productTitle, orders: 0, revenueVnd: 0 };
            prevP.orders += 1;
            prevP.revenueVnd += o.grossAmountVnd;
            productMap.set(o.sku, prevP);
            if (o.affiliateId) {
              const prevA = affiliateMap.get(o.affiliateId) || { affiliateId: o.affiliateId, affiliateName: o.affiliateName || o.affiliateId, orders: 0, commissionVnd: 0, revenueVnd: 0 };
              prevA.orders += 1;
              prevA.revenueVnd += o.grossAmountVnd;
              prevA.commissionVnd += o.commissionVnd;
              affiliateMap.set(o.affiliateId, prevA);
            }
          }

          return {
            metrics: {
              producersCount: tx.memory.producers.length,
              publishedProductsCount: tx.memory.products.filter((p) => p.status === 'published').length,
              pendingProductsCount: tx.memory.products.filter((p) => p.status === 'pending_review').length,
              totalClicks,
              ordersCount: orders.length,
              grossRevenueVnd,
              commissionAvailableVnd: Math.max(0, available),
              commissionPendingVnd: Math.max(0, pending)
            },
            topProducts: Array.from(productMap.values()).sort((a, b) => b.revenueVnd - a.revenueVnd).slice(0, 5),
            topAffiliates: Array.from(affiliateMap.values()).sort((a, b) => b.commissionVnd - a.commissionVnd).slice(0, 5),
            products: tx.memory.products,
            orders,
            auditLogs: tx.memory.auditLogs.slice(0, 20)
          };
        }

        const pFilter = platform !== 'all' ? [platform] : [];
        const ordWhere = platform !== 'all' ? 'WHERE platform = $1' : '';
        const linkWhere = platform !== 'all' ? 'WHERE platform = $1' : '';
        const prodCounts = await tx.query(
          `SELECT (SELECT COUNT(*)::int FROM ocop_app.ocop_producers) AS producers_count,
                  (SELECT COUNT(*)::int FROM ocop_app.products WHERE status = 'published') AS published_count,
                  (SELECT COUNT(*)::int FROM ocop_app.products WHERE status = 'pending_review') AS pending_count`
        );
        const ordStats = await tx.query(
          `SELECT COUNT(*)::int AS orders_count,
                  COALESCE(SUM(CASE WHEN status NOT IN ('cancelled','refunded') THEN gross_amount_vnd ELSE 0 END), 0)::bigint AS revenue_vnd
           FROM ocop_app.orders ${ordWhere}`,
          pFilter
        );
        const clkStats = await tx.query(
          `SELECT COALESCE(SUM(clicks_count), 0)::int AS total_clicks FROM ocop_app.affiliate_links ${linkWhere}`,
          pFilter
        );
        const ldgStats = await tx.query(
          `SELECT COALESCE(SUM(CASE WHEN state = 'available' THEN CASE WHEN direction='credit' THEN amount_vnd ELSE -amount_vnd END ELSE 0 END), 0)::bigint AS available_vnd,
                  COALESCE(SUM(CASE WHEN state = 'pending' THEN CASE WHEN direction='credit' THEN amount_vnd ELSE -amount_vnd END ELSE 0 END), 0)::bigint AS pending_vnd
           FROM ocop_app.commission_ledger WHERE account_type = 'affiliate_payable'`
        );
        const productsRes = await tx.query(
          `SELECT id, sku, title, area, price_vnd AS "priceVnd", commission_rate_bps AS "commissionRateBps", status
           FROM ocop_app.products ORDER BY updated_at DESC LIMIT 50`
        );
        const ordersRes = await tx.query(
          `SELECT id, platform, shop_id AS "shopId", external_order_id AS "externalOrderId",
                  gross_amount_vnd AS "grossAmountVnd", commission_vnd AS "commissionVnd", status, source
           FROM ocop_app.orders ${ordWhere} ORDER BY ordered_at DESC LIMIT 50`,
          pFilter
        );
        const auditRes = await tx.query(
          `SELECT id, actor_role AS "actorLabel", action, target_id AS "targetLabel", detail, created_at AS "createdAt"
           FROM ocop_app.audit_logs ORDER BY created_at DESC LIMIT 20`
        );

        return {
          metrics: {
            producersCount: prodCounts.rows[0].producers_count,
            publishedProductsCount: prodCounts.rows[0].published_count,
            pendingProductsCount: prodCounts.rows[0].pending_count,
            totalClicks: clkStats.rows[0].total_clicks,
            ordersCount: ordStats.rows[0].orders_count,
            grossRevenueVnd: Number(ordStats.rows[0].revenue_vnd),
            commissionAvailableVnd: Math.max(0, Number(ldgStats.rows[0].available_vnd)),
            commissionPendingVnd: Math.max(0, Number(ldgStats.rows[0].pending_vnd))
          },
          topProducts: [],
          topAffiliates: [],
          products: productsRes.rows,
          orders: ordersRes.rows,
          auditLogs: auditRes.rows
        };
      });
    }
  };
}
