import { randomUUID } from 'node:crypto';

export function createMediaJobsRepository({ db }) {
  return {
    async listVideoTemplates() {
      return db.withActorTx({ role: 'public' }, async (tx) => {
        if (tx.mode === 'memory') return tx.memory.videoTemplates;
        const res = await tx.query('SELECT id, duration_sec AS "durationSec", title, goal, scenes_json AS "scenes" FROM ocop_app.video_templates ORDER BY duration_sec ASC');
        return res.rows;
      });
    },

    async createMediaAsset(actor, record) {
      return db.withActorTx(actor, async (tx) => {
        if (tx.mode === 'memory') {
          const asset = { id: randomUUID(), ...record, status: 'pending_upload', createdAt: new Date().toISOString() };
          tx.memory.mediaAssets.unshift(asset);
          return asset;
        }
        const id = randomUUID();
        const res = await tx.query(
          `INSERT INTO ocop_app.media_assets (id, owner_user_id, producer_id, storage_path, mime_type, size_bytes, status)
           VALUES ($1,$2,$3,$4,$5,$6,'pending_upload')
           RETURNING id, storage_path AS "storagePath", mime_type AS "mimeType", size_bytes AS "sizeBytes", status`,
          [id, actor.id, record.producerId, record.storagePath, record.mimeType, record.sizeBytes]
        );
        return res.rows[0];
      });
    },

    async markMediaReady(actor, assetId) {
      return db.withActorTx(actor, async (tx) => {
        if (tx.mode === 'memory') {
          const asset = tx.memory.mediaAssets.find((a) => a.id === assetId);
          if (!asset) return null;
          if (asset.ownerUserId !== actor.id && actor.role !== 'ops') return 'FORBIDDEN';
          asset.status = 'ready';
          return asset;
        }
        const check = await tx.query('SELECT owner_user_id AS "ownerUserId" FROM ocop_app.media_assets WHERE id = $1 LIMIT 1', [assetId]);
        if (check.rows.length === 0) return null;
        if (check.rows[0].ownerUserId !== actor.id && actor.role !== 'ops') return 'FORBIDDEN';
        const res = await tx.query(
          `UPDATE ocop_app.media_assets SET status = 'ready' WHERE id = $1
           RETURNING id, storage_path AS "storagePath", mime_type AS "mimeType", size_bytes AS "sizeBytes", status`,
          [assetId]
        );
        return res.rows[0];
      });
    }
  };
}
