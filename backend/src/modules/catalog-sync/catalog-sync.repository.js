import { randomUUID } from 'node:crypto';

export function createCatalogSyncRepository({ db }) {
  return {
    async attachListing(actor, productId, listing) {
      return db.withActorTx(actor, async (tx) => {
        if (tx.mode === 'memory') {
          const p = tx.memory.products.find((item) => item.id === productId);
          if (!p) return null;
          const row = { id: randomUUID(), ...listing, isDemoTarget: true, status: 'active' };
          p.listings = [...(p.listings || []), row];
          return row;
        }
        const res = await tx.query(
          `INSERT INTO ocop_app.product_listings (product_id, platform, shop_id, external_item_id, listing_url, is_demo_target)
           VALUES ($1,$2,$3,$4,$5,true)
           RETURNING id, platform, shop_id AS "shopId", external_item_id AS "externalItemId", listing_url AS "url", is_demo_target AS "isDemoTarget", status`,
          [productId, listing.platform, listing.shopId, listing.externalItemId, listing.url]
        );
        return res.rows[0];
      });
    }
  };
}
