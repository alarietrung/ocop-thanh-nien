import { randomUUID } from 'node:crypto';
import { normalizeVi } from '../../common/domainUtils.js';

export function createProducersRepository({ db }) {
  return {
    async listPublishedCatalog({ q = '', category = 'all', platform = 'all', sort = 'featured', page = 1, pageSize = 12 }) {
      return db.withActorTx({ role: 'public' }, async (tx) => {
        if (tx.mode === 'memory') {
          const producerMap = new Map(tx.memory.producers.map((p) => [p.id, p]));
          const qNorm = normalizeVi(q);
          let items = tx.memory.products.filter((p) => p.status === 'published');
          if (category && category !== 'all') items = items.filter((p) => p.categoryId === category);
          if (platform && platform !== 'all') {
            items = items.filter((p) => p.listings?.some((l) => l.platform === platform && l.status === 'active'));
          }
          if (qNorm) {
            items = items.filter((p) => p.searchNormalized.includes(qNorm));
          }
          const enriched = items.map((p) => ({ ...p, producer: producerMap.get(p.producerId) || null }));
          enriched.sort((a, b) => {
            if (sort === 'commission_desc') return b.commissionRateBps - a.commissionRateBps;
            if (sort === 'price_asc') return a.priceVnd - b.priceVnd;
            if (sort === 'price_desc') return b.priceVnd - a.priceVnd;
            return a.title.localeCompare(b.title);
          });
          const total = enriched.length;
          const totalPages = Math.max(1, Math.ceil(total / pageSize));
          const safePage = Math.min(Math.max(1, page), totalPages);
          const start = (safePage - 1) * pageSize;
          return {
            items: enriched.slice(start, start + pageSize),
            total,
            page: safePage,
            pageSize,
            totalPages,
            producersCount: tx.memory.producers.length
          };
        }

        const qNorm = normalizeVi(q);
        const where = ["p.status = 'published'"];
        const params = [];
        if (category && category !== 'all') {
          params.push(category);
          where.push(`p.category_id = $${params.length}`);
        }
        if (qNorm) {
          params.push(`%${qNorm}%`);
          where.push(`p.search_normalized LIKE $${params.length}`);
        }
        if (platform && platform !== 'all') {
          params.push(platform);
          where.push(`EXISTS (SELECT 1 FROM ocop_app.product_listings pl WHERE pl.product_id = p.id AND pl.platform = $${params.length} AND pl.status = 'active')`);
        }

        const orderClause =
          sort === 'commission_desc'
            ? 'p.commission_rate_bps DESC'
            : sort === 'price_asc'
              ? 'p.price_vnd ASC'
              : sort === 'price_desc'
                ? 'p.price_vnd DESC'
                : 'p.created_at DESC';

        const whereSql = where.join(' AND ');
        const countRes = await tx.query(`SELECT COUNT(*)::int AS total FROM ocop_app.products p WHERE ${whereSql}`, params);
        const total = countRes.rows[0]?.total || 0;
        const totalPages = Math.max(1, Math.ceil(total / pageSize));
        const safePage = Math.min(Math.max(1, page), totalPages);
        const offset = (safePage - 1) * pageSize;

        params.push(pageSize, offset);
        const rowsRes = await tx.query(
          `SELECT p.id, p.producer_id AS "producerId", p.category_id AS "categoryId", p.sku, p.slug, p.title,
                  p.unit, p.spec, p.area, p.price_vnd AS "priceVnd", p.price_updated_at AS "priceUpdatedAt",
                  p.stock, p.commission_rate_bps AS "commissionRateBps", p.commission_condition AS "commissionCondition",
                  p.status, p.description, p.story, p.image_url AS "imageUrl", p.media_kit_ready AS "mediaKitReady",
                  pr.business_name AS "businessName", pr.slug AS "producerSlug", pr.ocop_stars AS "ocopStars",
                  COALESCE(
                    (SELECT json_agg(json_build_object(
                      'id', pl.id,
                      'platform', pl.platform,
                      'shopId', pl.shop_id,
                      'externalItemId', pl.external_item_id,
                      'url', pl.listing_url,
                      'isDemoTarget', pl.is_demo_target,
                      'status', pl.status
                    )) FROM ocop_app.product_listings pl WHERE pl.product_id = p.id AND pl.status = 'active'),
                    '[]'::json
                  ) AS listings
           FROM ocop_app.products p
           JOIN ocop_app.ocop_producers pr ON pr.id = p.producer_id
           WHERE ${whereSql}
           ORDER BY ${orderClause}
           LIMIT $${params.length - 1} OFFSET $${params.length}`,
          params
        );

        const items = rowsRes.rows.map((r) => ({
          ...r,
          producer: {
            id: r.producerId,
            slug: r.producerSlug,
            businessName: r.businessName,
            ocopStars: r.ocopStars
          }
        }));

        return { items, total, page: safePage, pageSize, totalPages };
      });
    },

    async findPublishedProductBySlug(slug) {
      return db.withActorTx({ role: 'public' }, async (tx) => {
        if (tx.mode === 'memory') {
          const p = tx.memory.products.find((item) => item.slug === slug && item.status === 'published');
          if (!p) return null;
          const producer = tx.memory.producers.find((pr) => pr.id === p.producerId) || null;
          return { ...p, producer };
        }
        const res = await tx.query(
          `SELECT p.id, p.producer_id AS "producerId", p.category_id AS "categoryId", p.sku, p.slug, p.title,
                  p.unit, p.spec, p.area, p.price_vnd AS "priceVnd", p.price_updated_at AS "priceUpdatedAt",
                  p.stock, p.commission_rate_bps AS "commissionRateBps", p.commission_condition AS "commissionCondition",
                  p.status, p.description, p.story, p.media_kit_ready AS "mediaKitReady"
           FROM ocop_app.products p WHERE p.slug = $1 AND p.status = 'published' LIMIT 1`,
          [slug]
        );
        if (res.rows.length === 0) return null;
        const product = res.rows[0];
        const lstRes = await tx.query(
          `SELECT id, platform, shop_id AS "shopId", external_item_id AS "externalItemId", listing_url AS "url", is_demo_target AS "isDemoTarget", status
           FROM ocop_app.product_listings WHERE product_id = $1 AND status = 'active'`,
          [product.id]
        );
        const prodRes = await tx.query(
          `SELECT id, slug, business_name AS "businessName", owner_name AS "ownerName", area, ocop_stars AS "ocopStars",
                  cert_status_label AS "certStatusLabel", public_contact AS "publicContact", story, verified
           FROM ocop_app.ocop_producers WHERE id = $1 LIMIT 1`,
          [product.producerId]
        );
        return { ...product, listings: lstRes.rows, producer: prodRes.rows[0] || null };
      });
    },

    async findProducerBySlug(slug) {
      return db.withActorTx({ role: 'public' }, async (tx) => {
        if (tx.mode === 'memory') {
          const producer = tx.memory.producers.find((p) => p.slug === slug) || null;
          if (!producer) return null;
          const products = tx.memory.products.filter((p) => p.producerId === producer.id && p.status === 'published');
          return { producer, products };
        }
        const prodRes = await tx.query(
          `SELECT id, slug, business_name AS "businessName", owner_name AS "ownerName", area, ocop_stars AS "ocopStars",
                  cert_status_label AS "certStatusLabel", public_contact AS "publicContact", story, verified
           FROM ocop_app.ocop_producers WHERE slug = $1 LIMIT 1`,
          [slug]
        );
        if (prodRes.rows.length === 0) return null;
        const producer = prodRes.rows[0];
        const itemsRes = await tx.query(
          `SELECT id, sku, slug, title, price_vnd AS "priceVnd", commission_rate_bps AS "commissionRateBps", unit
           FROM ocop_app.products WHERE producer_id = $1 AND status = 'published'`,
          [producer.id]
        );
        return { producer, products: itemsRes.rows };
      });
    },

    async listSellerProducts(actor) {
      return db.withActorTx(actor, async (tx) => {
        if (tx.mode === 'memory') {
          const pids = new Set(actor.producerIds || []);
          const items = tx.memory.products.filter((p) => pids.has(p.producerId));
          const producer = tx.memory.producers.find((p) => pids.has(p.id)) || null;
          return { items, producer };
        }
        const pid = actor.producerIds?.[0];
        if (!pid) return { items: [], producer: null };
        const itemsRes = await tx.query(
          `SELECT id, producer_id AS "producerId", category_id AS "categoryId", sku, slug, title, unit, spec, area,
                  price_vnd AS "priceVnd", stock, commission_rate_bps AS "commissionRateBps", status, review_note AS "reviewNote"
           FROM ocop_app.products WHERE producer_id = $1 ORDER BY updated_at DESC`,
          [pid]
        );
        const prodRes = await tx.query(
          'SELECT id, slug, business_name AS "businessName", area, ocop_stars AS "ocopStars" FROM ocop_app.ocop_producers WHERE id = $1',
          [pid]
        );
        return { items: itemsRes.rows, producer: prodRes.rows[0] || null };
      });
    },

    async findProductById(id, actor = { role: 'ops' }) {
      return db.withActorTx(actor, async (tx) => {
        if (tx.mode === 'memory') {
          return tx.memory.products.find((p) => p.id === id || p.sku === id) || null;
        }
        const res = await tx.query(
          `SELECT id, producer_id AS "producerId", category_id AS "categoryId", sku, slug, title, unit, spec, area,
                  price_vnd AS "priceVnd", stock, commission_rate_bps AS "commissionRateBps", status, review_note AS "reviewNote"
           FROM ocop_app.products WHERE id::text = $1 OR sku = $1 LIMIT 1`,
          [id]
        );
        if (res.rows.length === 0) return null;
        const product = res.rows[0];
        const lstRes = await tx.query(
          'SELECT id, platform, shop_id AS "shopId", external_item_id AS "externalItemId", listing_url AS "url", is_demo_target AS "isDemoTarget", status FROM ocop_app.product_listings WHERE product_id = $1',
          [product.id]
        );
        return { ...product, listings: lstRes.rows };
      });
    },

    async createProduct(actor, record) {
      return db.withActorTx(actor, async (tx) => {
        if (tx.mode === 'memory') {
          const item = { id: randomUUID(), ...record, createdAt: new Date().toISOString() };
          tx.memory.products.unshift(item);
          return item;
        }
        const id = randomUUID();
        await tx.query(
          `INSERT INTO ocop_app.products (id, producer_id, category_id, sku, slug, title, search_normalized, unit, spec, area, price_vnd, stock, commission_rate_bps, status, description, story)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,'draft',$14,$15)`,
          [
            id,
            record.producerId,
            record.categoryId,
            record.sku,
            record.slug,
            record.title,
            record.searchNormalized,
            record.unit,
            record.spec,
            record.area,
            record.priceVnd,
            record.stock,
            record.commissionRateBps,
            record.description,
            record.story || ''
          ]
        );
        for (const lst of record.listings || []) {
          await tx.query(
            `INSERT INTO ocop_app.product_listings (product_id, platform, shop_id, external_item_id, listing_url, is_demo_target)
             VALUES ($1,$2,$3,$4,$5,true)`,
            [id, lst.platform, lst.shopId, lst.externalItemId, lst.url]
          );
        }
        return { id, ...record, status: 'draft' };
      });
    },

    async updateProduct(actor, id, patch) {
      return db.withActorTx(actor, async (tx) => {
        if (tx.mode === 'memory') {
          const idx = tx.memory.products.findIndex((p) => p.id === id);
          if (idx === -1) return null;
          tx.memory.products[idx] = { ...tx.memory.products[idx], ...patch };
          return tx.memory.products[idx];
        }
        const fields = [];
        const params = [];
        const map = {
          title: 'title',
          categoryId: 'category_id',
          unit: 'unit',
          spec: 'spec',
          priceVnd: 'price_vnd',
          stock: 'stock',
          commissionRateBps: 'commission_rate_bps',
          description: 'description',
          status: 'status',
          reviewNote: 'review_note',
          searchNormalized: 'search_normalized'
        };
        Object.entries(patch).forEach(([k, v]) => {
          if (map[k] && v !== undefined) {
            params.push(v);
            fields.push(`${map[k]} = $${params.length}`);
          }
        });
        if (fields.length === 0) return this.findProductById(id, actor);
        params.push(id);
        const res = await tx.query(
          `UPDATE ocop_app.products SET ${fields.join(', ')}, updated_at = now() WHERE id = $${params.length}
           RETURNING id, producer_id AS "producerId", sku, slug, title, price_vnd AS "priceVnd", status, review_note AS "reviewNote"`,
          params
        );
        return res.rows[0] || null;
      });
    },

    async savePilotApplication(entry) {
      return db.withActorTx({ role: 'public' }, async (tx) => {
        if (tx.mode === 'memory') {
          const item = { id: randomUUID(), ...entry, createdAt: new Date().toISOString() };
          tx.memory.pilotApplications.unshift(item);
          return item;
        }
        const res = await tx.query(
          `INSERT INTO ocop_app.pilot_applications (applicant_name, business_name, area, product_note)
           VALUES ($1,$2,$3,$4) RETURNING id, created_at AS "createdAt"`,
          [entry.applicantName, entry.businessName, entry.area, entry.productNote]
        );
        return { ...res.rows[0], ...entry };
      });
    },

    async appendAuditLog(actor, entry) {
      return db.withActorTx(actor || { role: 'ops' }, async (tx) => {
        if (tx.mode === 'memory') {
          const item = {
            id: randomUUID(),
            actorUserId: actor?.id || null,
            actorRole: actor?.role || 'system',
            ...entry,
            createdAt: new Date().toISOString()
          };
          tx.memory.auditLogs.unshift(item);
          return item;
        }
        await tx.query(
          `INSERT INTO ocop_app.audit_logs (actor_user_id, actor_role, action, target_type, target_id, detail)
           VALUES ($1,$2,$3,$4,$5,$6)`,
          [actor?.id || null, actor?.role || 'system', entry.action, entry.targetType, String(entry.targetId), entry.detail || '']
        );
        return entry;
      });
    }
  };
}
