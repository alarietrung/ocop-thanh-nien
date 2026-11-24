import { describe, it, expect, beforeEach } from 'vitest';
import {
  addDemoLivestream,
  addToCart,
  commitOrderImportRows,
  createAffiliateLink,
  deactivateAffiliateLink,
  fetchAffiliateCommission,
  fetchLivestreamSchedule,
  fetchOpsDashboard,
  fetchProducerBySlug,
  fetchProductBySlug,
  fetchPublicCatalog,
  fetchSeasonLogByBatch,
  fetchSellerOrders,
  fetchSellerProducts,
  loadCart,
  lookupRedirectCode,
  placeCartOrder,
  publishQuickGardenProduct,
  reconcileOrderOps,
  recordIntentionalVisit,
  resetPilotState,
  reviewProductOps,
  submitSellerProductForReview,
  updateCartQuantity,
  updateSellerOrderStatus,
  upsertSellerProduct
} from './ocopStore';
import { parseOrderImportCsv } from '../utils/formatters';

function installMemoryStorage() {
  const store = {};
  globalThis.localStorage = {
    getItem: (k) => (k in store ? store[k] : null),
    setItem: (k, v) => {
      store[k] = String(v);
    }
  };
}

describe('ocopStore vertical pilot flows & role isolation', () => {
  beforeEach(() => {
    installMemoryStorage();
    resetPilotState();
  });

  it('supports public search (diacritic-insensitive), product detail, affiliate link, and intentional redirect', async () => {
    const res = await fetchPublicCatalog({ q: 'hat dieu', platform: 'shopee' });
    expect(res.total).toBeGreaterThanOrEqual(1);
    const first = res.items[0];
    expect(first.sku).toBe('OCOP-DN-001');

    const detail = await fetchProductBySlug(first.slug);
    expect(detail.product?.title).toContain('Hạt điều');

    const link = await createAffiliateLink({
      affiliateId: 'aff-member-1',
      affiliateName: 'Thảo Vy',
      productId: first.id,
      platform: 'shopee'
    });
    expect(link.code).toHaveLength(10);

    // Preview lookup must NOT increment clicks
    const preview = await lookupRedirectCode(link.code);
    expect(preview.clicksCount).toBe(0);

    // Intentional visit increments click and validates target URL
    const visit = await recordIntentionalVisit(link.code);
    expect(visit.clicksCount).toBe(1);
    expect(visit.targetUrl).toMatch(/^https:\/\/shopee\.vn\//);

    // Deactivating prevents subsequent visits and another affiliate cannot deactivate
    await expect(
      deactivateAffiliateLink({ id: link.id, affiliateId: 'aff-member-2' })
    ).rejects.toThrow();

    await deactivateAffiliateLink({ id: link.id, affiliateId: 'aff-member-1' });
    await expect(recordIntentionalVisit(link.code)).rejects.toThrow();
  });

  it('enforces seller ownership isolation and draft -> review -> publish flow', async () => {
    const created = await upsertSellerProduct({
      producerId: 'prod-tan-trieu-pomelo',
      payload: {
        title: 'Mứt vỏ bưởi Tân Triều đặc biệt',
        categoryId: 'hat-say',
        unit: 'Hộp 200g',
        spec: 'Đóng hộp giấy kraft',
        priceVnd: 110000,
        stock: 50,
        commissionRateBps: 1200,
        description: 'Mứt vỏ bưởi ít đường chuẩn OCOP',
        listings: [{ platform: 'shopee', url: 'https://shopee.vn/mut-vo-buoi-pilot-i.1.99' }]
      }
    });
    expect(created.status).toBe('draft');

    // Seller B cannot mutate Seller A product
    await expect(
      submitSellerProductForReview({ id: created.id, producerId: 'prod-dinh-quan-cashew' })
    ).rejects.toThrow();

    await submitSellerProductForReview({ id: created.id, producerId: 'prod-tan-trieu-pomelo' });
    await reviewProductOps({ productId: created.id, decision: 'approve' });

    const publicCatalog = await fetchPublicCatalog({ q: 'mut vo buoi' });
    expect(publicCatalog.items.some((p) => p.id === created.id)).toBe(true);

    const sellerAOwn = await fetchSellerProducts({ producerId: 'prod-tan-trieu-pomelo' });
    const sellerBOwn = await fetchSellerProducts({ producerId: 'prod-dinh-quan-cashew' });
    expect(sellerAOwn.items.some((p) => p.id === created.id)).toBe(true);
    expect(sellerBOwn.items.some((p) => p.id === created.id)).toBe(false);
    const sellerBOrders = await fetchSellerOrders({ producerId: 'prod-dinh-quan-cashew' });
    expect(sellerBOrders.every((o) => o.producerId === 'prod-dinh-quan-cashew')).toBe(true);
  });

  it('deduplicates repeated CSV imports and creates balanced reversal ledger entries on refund', async () => {
    const csv =
      'platform,shop_id,external_order_id,sku,quantity,gross_amount_vnd,net_amount_vnd,affiliate_code,status\n' +
      'tiktok,shop_tantrieu_tt,TT-IDEMP-99,OCOP-DN-002,1,100000,100000,DN8K4M2P9Q,confirmed';
    const parsed = parseOrderImportCsv(csv);
    expect(parsed.errors).toHaveLength(0);

    const firstCommit = await commitOrderImportRows({ rows: parsed.rows });
    expect(firstCommit.insertedCount).toBe(1);
    expect(firstCommit.duplicateCount).toBe(0);

    const secondCommit = await commitOrderImportRows({ rows: parsed.rows });
    expect(secondCommit.insertedCount).toBe(0);
    expect(secondCommit.duplicateCount).toBe(1);

    const opsBefore = await fetchOpsDashboard();
    const targetOrder = opsBefore.orders.find((o) => o.externalOrderId === 'TT-IDEMP-99');
    expect(targetOrder).toBeTruthy();

    await reconcileOrderOps({ orderId: targetOrder.id, nextStatus: 'refunded', reason: 'Khách hoàn hàng' });

    const wallet = await fetchAffiliateCommission({ affiliateId: 'aff-member-1' });
    const orderEntries = wallet.entries.filter((e) => e.orderId === targetOrder.id);
    const netForOrder = orderEntries.reduce(
      (sum, e) => sum + (e.direction === 'credit' ? e.amountVnd : -e.amountVnd),
      0
    );
    expect(netForOrder).toBe(0);
  });

  it('completes the 6-screen Round 1 flow for Nha vuon Ba Tu (Long Khanh)', async () => {
    // Screen 1: Nha vuon Ba Tu profile & 5 products (38k - 120k)
    const garden = await fetchProducerBySlug('nha-vuon-ba-tu');
    expect(garden.producer?.businessName).toContain('Nhà vườn Ba Tư');
    expect(garden.products.length).toBeGreaterThanOrEqual(5);

    // Screen 2: Quick publish via photo + simulated voice
    const quick = publishQuickGardenProduct({
      title: 'Chôm chôm đường hái mới',
      priceVnd: 42000,
      stockKg: 50,
      batchCode: 'LK-CC-TEST',
      voiceInputMode: 'simulated_voice'
    });
    expect(quick.sku).toMatch(/^NVBT-/);

    // Screen 3: Product detail + QR Season Log (3 stages)
    const log = fetchSeasonLogByBatch(quick.batchCode);
    expect(log?.milestones).toHaveLength(3);

    // Screen 4: Cart add -> quantity change -> pickup order checkout
    addToCart(quick, 2);
    updateCartQuantity(quick.id, 3);
    expect(loadCart()[0].quantity).toBe(3);

    const createdOrder = placeCartOrder({
      customerName: 'Khách thử Long Khánh',
      customerPhone: '0901234567',
      deliveryMethod: 'pickup',
      shippingAddress: ''
    });
    expect(createdOrder.orderCode).toMatch(/^DON-LK-/);
    expect(createdOrder.shippingFeeVnd).toBe(0);
    expect(loadCart()).toHaveLength(0);

    // Screen 5: Order appears in Seller Orders & status updates cleanly
    const baTuOrders = await fetchSellerOrders({ producerId: 'prod-ba-tu-long-khanh' });
    expect(baTuOrders.some((o) => o.orderCode === createdOrder.orderCode)).toBe(true);
    const updated = await updateSellerOrderStatus({
      orderId: createdOrder.id,
      producerId: 'prod-ba-tu-long-khanh',
      nextStatus: 'confirmed'
    });
    expect(updated.status).toBe('confirmed');

    // Screen 6: Youth supporter livestream schedule
    const addedLive = addDemoLivestream({
      supporterName: 'Đoàn viên Minh Anh',
      productSummary: 'Chôm chôm nhãn 45k/kg'
    });
    expect(fetchLivestreamSchedule().some((s) => s.id === addedLive.id)).toBe(true);
  });
});
