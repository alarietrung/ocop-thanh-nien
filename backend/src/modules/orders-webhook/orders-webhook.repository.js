import { randomUUID } from 'node:crypto';

export function createOrdersWebhookRepository({ db }) {
  return {
    async listSellerOrders(actor) {
      return db.withActorTx(actor, async (tx) => {
        if (tx.mode === 'memory') {
          const pids = new Set(actor.producerIds || []);
          return tx.memory.orders.filter((o) => pids.has(o.producerId));
        }
        const pid = actor.producerIds?.[0];
        if (!pid) return [];
        const res = await tx.query(
          `SELECT id, platform, shop_id AS "shopId", external_order_id AS "externalOrderId", producer_id AS "producerId",
                  attribution_status AS "attributionStatus", gross_amount_vnd AS "grossAmountVnd", net_amount_vnd AS "netAmountVnd",
                  commission_rate_bps AS "commissionRateBps", commission_vnd AS "commissionVnd", status, source, ordered_at AS "orderedAt"
           FROM ocop_app.orders WHERE producer_id = $1 ORDER BY ordered_at DESC LIMIT 200`,
          [pid]
        );
        return res.rows;
      });
    },

    async createImportBatch(actor, { totalRows, validRows, payload }) {
      return db.withActorTx(actor, async (tx) => {
        if (tx.mode === 'memory') {
          const batch = {
            id: randomUUID(),
            actorUserId: actor.id,
            producerId: actor.producerIds?.[0] || null,
            totalRows,
            validRows,
            insertedCount: 0,
            duplicateCount: 0,
            status: 'previewed',
            payload,
            createdAt: new Date().toISOString()
          };
          tx.memory.importBatches.unshift(batch);
          return batch;
        }
        const id = randomUUID();
        const res = await tx.query(
          `INSERT INTO ocop_app.import_batches (id, actor_user_id, producer_id, total_rows, valid_rows, status, payload_json)
           VALUES ($1,$2,$3,$4,$5,'previewed',$6::jsonb)
           RETURNING id, total_rows AS "totalRows", valid_rows AS "validRows", status`,
          [id, actor.id, actor.producerIds?.[0] || null, totalRows, validRows, JSON.stringify(payload)]
        );
        return { ...res.rows[0], payload };
      });
    },

    async getImportBatch(actor, batchId) {
      return db.withActorTx(actor, async (tx) => {
        if (tx.mode === 'memory') {
          return tx.memory.importBatches.find((b) => b.id === batchId) || null;
        }
        const res = await tx.query(
          `SELECT id, actor_user_id AS "actorUserId", producer_id AS "producerId", status, payload_json AS "payload",
                  inserted_count AS "insertedCount", duplicate_count AS "duplicateCount"
           FROM ocop_app.import_batches WHERE id = $1 LIMIT 1`,
          [batchId]
        );
        return res.rows[0] || null;
      });
    },

    async insertOrderIfUnique(actor, orderRecord) {
      return db.withActorTx(actor, async (tx) => {
        if (tx.mode === 'memory') {
          const dup = tx.memory.orders.some(
            (o) =>
              o.platform === orderRecord.platform &&
              o.shopId === orderRecord.shopId &&
              o.externalOrderId === orderRecord.externalOrderId
          );
          if (dup) return { duplicate: true, order: null };
          const order = { id: randomUUID(), ...orderRecord, createdAt: new Date().toISOString() };
          tx.memory.orders.unshift(order);
          return { duplicate: false, order };
        }

        const id = randomUUID();
        const res = await tx.query(
          `INSERT INTO ocop_app.orders (
             id, platform, shop_id, external_order_id, producer_id, affiliate_link_id, affiliate_user_id,
             attribution_status, gross_amount_vnd, net_amount_vnd, commission_rate_bps, commission_vnd,
             status, source, import_batch_id, ordered_at
           )
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
           ON CONFLICT (platform, shop_id, external_order_id) DO NOTHING
           RETURNING id, platform, shop_id AS "shopId", external_order_id AS "externalOrderId", status`,
          [
            id,
            orderRecord.platform,
            orderRecord.shopId,
            orderRecord.externalOrderId,
            orderRecord.producerId,
            orderRecord.affiliateLinkId || null,
            orderRecord.affiliateId || null,
            orderRecord.attributionStatus,
            orderRecord.grossAmountVnd,
            orderRecord.netAmountVnd,
            orderRecord.commissionRateBps,
            orderRecord.commissionVnd,
            orderRecord.status,
            orderRecord.source,
            orderRecord.importBatchId || null,
            orderRecord.orderedAt
          ]
        );
        if (res.rows.length === 0) return { duplicate: true, order: null };
        return { duplicate: false, order: res.rows[0] };
      });
    },

    async markBatchCommitted(actor, batchId, { insertedCount, duplicateCount }) {
      return db.withActorTx(actor, async (tx) => {
        if (tx.mode === 'memory') {
          const batch = tx.memory.importBatches.find((b) => b.id === batchId);
          if (batch) {
            batch.status = 'committed';
            batch.insertedCount = insertedCount;
            batch.duplicateCount = duplicateCount;
          }
          return batch;
        }
        await tx.query(
          `UPDATE ocop_app.import_batches SET status = 'committed', inserted_count = $2, duplicate_count = $3 WHERE id = $1`,
          [batchId, insertedCount, duplicateCount]
        );
        return { id: batchId, status: 'committed', insertedCount, duplicateCount };
      });
    }
  };
}
