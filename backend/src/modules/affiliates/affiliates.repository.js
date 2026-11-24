import { randomUUID } from 'node:crypto';

export function createAffiliatesRepository({ db }) {
  return {
    async listLinksByUser(actor) {
      return db.withActorTx(actor, async (tx) => {
        if (tx.mode === 'memory') {
          const pMap = new Map(tx.memory.products.map((p) => [p.id, p]));
          return tx.memory.affiliateLinks
            .filter((l) => l.affiliateId === actor.id)
            .map((l) => ({ ...l, product: pMap.get(l.productId) || null }));
        }
        const res = await tx.query(
          `SELECT al.id, al.code, al.affiliate_user_id AS "affiliateId", al.product_id AS "productId",
                  al.platform, al.target_url AS "targetUrl", al.is_demo_target AS "isDemoTarget",
                  al.active, al.clicks_count AS "clicksCount", al.created_at AS "createdAt",
                  p.title AS "productTitle", p.sku, p.price_vnd AS "priceVnd", p.commission_rate_bps AS "commissionRateBps"
           FROM ocop_app.affiliate_links al
           JOIN ocop_app.products p ON p.id = al.product_id
           WHERE al.affiliate_user_id = $1
           ORDER BY al.created_at DESC`,
          [actor.id]
        );
        return res.rows;
      });
    },

    async findLinkByCode(code) {
      return db.withActorTx({ role: 'public' }, async (tx) => {
        if (tx.mode === 'memory') {
          const link = tx.memory.affiliateLinks.find((l) => l.code === code) || null;
          if (!link) return null;
          const product = tx.memory.products.find((p) => p.id === link.productId && p.status === 'published') || null;
          return { ...link, product };
        }
        const res = await tx.query(
          `SELECT al.id, al.code, al.affiliate_user_id AS "affiliateId", al.product_id AS "productId",
                  al.platform, al.target_url AS "targetUrl", al.is_demo_target AS "isDemoTarget",
                  al.active, al.clicks_count AS "clicksCount",
                  pr.display_name AS "affiliateName",
                  p.slug AS "productSlug", p.title AS "productTitle", p.unit, p.price_vnd AS "priceVnd", p.status AS "productStatus"
           FROM ocop_app.affiliate_links al
           JOIN ocop_app.profiles pr ON pr.id = al.affiliate_user_id
           JOIN ocop_app.products p ON p.id = al.product_id
           WHERE al.code = $1 LIMIT 1`,
          [code]
        );
        if (res.rows.length === 0) return null;
        const row = res.rows[0];
        return {
          ...row,
          product:
            row.productStatus === 'published'
              ? { id: row.productId, slug: row.productSlug, title: row.productTitle, unit: row.unit, priceVnd: row.priceVnd }
              : null
        };
      });
    },

    async findLinkById(actor, id) {
      return db.withActorTx(actor, async (tx) => {
        if (tx.mode === 'memory') {
          return tx.memory.affiliateLinks.find((l) => l.id === id) || null;
        }
        const res = await tx.query(
          `SELECT id, code, affiliate_user_id AS "affiliateId", product_id AS "productId", platform, target_url AS "targetUrl", active
           FROM ocop_app.affiliate_links WHERE id = $1 LIMIT 1`,
          [id]
        );
        return res.rows[0] || null;
      });
    },

    async createLink(actor, record) {
      return db.withActorTx(actor, async (tx) => {
        if (tx.mode === 'memory') {
          const item = { id: randomUUID(), ...record, clicksCount: 0, createdAt: new Date().toISOString() };
          tx.memory.affiliateLinks.unshift(item);
          return item;
        }
        const id = randomUUID();
        const res = await tx.query(
          `INSERT INTO ocop_app.affiliate_links (id, code, affiliate_user_id, product_id, platform, target_url, is_demo_target, active)
           VALUES ($1,$2,$3,$4,$5,$6,$7,true)
           RETURNING id, code, affiliate_user_id AS "affiliateId", product_id AS "productId", platform, target_url AS "targetUrl",
                     is_demo_target AS "isDemoTarget", active, clicks_count AS "clicksCount", created_at AS "createdAt"`,
          [id, record.code, actor.id, record.productId, record.platform, record.targetUrl, record.isDemoTarget]
        );
        return res.rows[0];
      });
    },

    async deactivateLink(actor, id) {
      return db.withActorTx(actor, async (tx) => {
        if (tx.mode === 'memory') {
          const link = tx.memory.affiliateLinks.find((l) => l.id === id);
          if (!link) return null;
          link.active = false;
          return link;
        }
        const res = await tx.query(
          `UPDATE ocop_app.affiliate_links SET active = false WHERE id = $1
           RETURNING id, code, active`,
          [id]
        );
        return res.rows[0] || null;
      });
    },

    async recordIntentionalClick(code, userAgentHash = '') {
      return db.withActorTx({ role: 'public' }, async (tx) => {
        if (tx.mode === 'memory') {
          const link = tx.memory.affiliateLinks.find((l) => l.code === code);
          if (!link) return null;
          link.clicksCount = (link.clicksCount || 0) + 1;
          tx.memory.affiliateClicks.push({
            id: randomUUID(),
            affiliateLinkId: link.id,
            intentionalCta: true,
            userAgentHash,
            clickedAt: new Date().toISOString()
          });
          return link;
        }
        const upd = await tx.query(
          `UPDATE ocop_app.affiliate_links SET clicks_count = clicks_count + 1
           WHERE code = $1 AND active = true
           RETURNING id, code, platform, target_url AS "targetUrl", clicks_count AS "clicksCount"`,
          [code]
        );
        if (upd.rows.length === 0) return null;
        await tx.query(
          `INSERT INTO ocop_app.affiliate_clicks (affiliate_link_id, intentional_cta, user_agent_hash)
           VALUES ($1, true, $2)`,
          [upd.rows[0].id, userAgentHash]
        );
        return upd.rows[0];
      });
    }
  };
}
