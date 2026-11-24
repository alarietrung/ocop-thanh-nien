import { describe, it, expect, beforeEach } from 'vitest';
import {
  addDemoLivestream,
  addSeasonNoteDraft,
  addToCart,
  addVolunteerLog,
  commitOrderImportRows,
  createAffiliateLink,
  createSupportRequest,
  createVisitRequest,
  deactivateAffiliateLink,
  fetchAffiliateCommission,
  fetchLivestreamSchedule,
  fetchOpsDashboard,
  fetchOrderByCode,
  fetchProducerBySlug,
  fetchProductBySlug,
  fetchPublicCatalog,
  fetchSeasonLogByBatch,
  fetchSellerOrders,
  fetchSellerProducts,
  fetchSupportRequests,
  fetchVisitRequests,
  fetchVolunteerLogs,
  getVolunteerTotals,
  groupCartByProducer,
  loadCart,
  lookupRedirectCode,
  placeCartOrder,
  publishQuickGardenProduct,
  reconcileOrderOps,
  recordDirectReferralVisit,
  recordIntentionalVisit,
  resetPilotState,
  reviewProductOps,
  reviewVolunteerLog,
  submitMultiGardenOrder,
  submitSellerProductForReview,
  syncSeasonNoteDraftToBatch,
  updateCartQuantity,
  updateSellerOrderStatus,
  upsertSellerProduct
} from './ocopStore';
import { parseOrderImportCsv } from '../utils/formatters';
import { buildLivestreamIcs } from '../utils/icsCalendar';
import { buildPublicTraceUrl, buildTraceQrSvgDataUri } from '../utils/qrSvg';

function installMemoryStorage() {
  const store = {};
  globalThis.localStorage = {
    getItem: (k) => (k in store ? store[k] : null),
    setItem: (k, v) => {
      store[k] = String(v);
    }
  };
}

describe('ocopStore vertical flows, multi-garden cart, referral reconciliation & 3 bonuses', () => {
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
      affiliateName: 'Đoàn viên Minh Anh',
      productId: first.id,
      platform: 'shopee'
    });
    expect(link.code).toHaveLength(10);

    const preview = await lookupRedirectCode(link.code);
    expect(preview.clicksCount).toBe(0);

    const visit = await recordIntentionalVisit(link.code);
    expect(visit.clicksCount).toBe(1);
    expect(visit.targetUrl).toMatch(/^https:\/\/shopee\.vn\//);

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

  it('completes the 6-screen flow for Nha vuon Ba Tu including order tracking after update', async () => {
    const garden = await fetchProducerBySlug('nha-vuon-ba-tu');
    expect(garden.producer?.businessName).toContain('Nhà vườn Ba Tư');
    expect(garden.products.length).toBeGreaterThanOrEqual(5);

    const quick = publishQuickGardenProduct({
      title: 'Chôm chôm đường hái mới',
      priceVnd: 42000,
      stockKg: 50,
      batchCode: 'LK-CC-TEST',
      voiceInputMode: 'simulated_voice'
    });
    expect(quick.sku).toMatch(/^NVBT-/);

    const log = fetchSeasonLogByBatch(quick.batchCode);
    expect(log?.milestones).toHaveLength(3);

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

    const baTuOrders = await fetchSellerOrders({ producerId: 'prod-ba-tu-long-khanh' });
    expect(baTuOrders.some((o) => o.orderCode === createdOrder.orderCode)).toBe(true);
    const updated = await updateSellerOrderStatus({
      orderId: createdOrder.id,
      producerId: 'prod-ba-tu-long-khanh',
      nextStatus: 'confirmed'
    });
    expect(updated.status).toBe('confirmed');

    // Buyer tracking sees updated status immediately
    const tracked = fetchOrderByCode(createdOrder.orderCode);
    expect(tracked?.status).toBe('confirmed');

    const addedLive = addDemoLivestream({
      supporterName: 'Đoàn viên Minh Anh',
      productSummary: 'Chôm chôm nhãn 45k/kg'
    });
    expect(fetchLivestreamSchedule().some((s) => s.id === addedLive.id)).toBe(true);
    const ics = buildLivestreamIcs(addedLive);
    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('BEGIN:VEVENT');
  });

  it('splits multi-garden cart by exact pickup point and preserves failed garden items on partial submission', async () => {
    const ri6 = (await fetchProductBySlug('sau-rieng-ri6-vuon-ba-tu-long-khanh')).product;
    const pomelo = (await fetchProductBySlug('vo-buoi-say-deo-tan-trieu-250g')).product;

    addToCart(ri6, 1);
    addToCart(pomelo, 2);
    const groups = groupCartByProducer(loadCart());
    expect(groups).toHaveLength(2);
    expect(groups.find((g) => g.producerId === 'prod-ba-tu-long-khanh')?.producer.pickupPoint).toContain('Long Khánh');
    expect(groups.find((g) => g.producerId === 'prod-tan-trieu-pomelo')?.producer.pickupPoint).toContain('Tân Triều');

    // Simulate partial submission: Ba Tu succeeds, Tan Trieu fails -> Tan Trieu remains in cart!
    const partialRes = await submitMultiGardenOrder(
      {
        customerName: 'Khách đặt 2 vườn',
        customerPhone: '0909888777',
        deliveryByProducer: {
          'prod-ba-tu-long-khanh': 'pickup',
          'prod-tan-trieu-pomelo': 'pickup'
        }
      },
      {
        submitGardenOrderOverride: async ({ group }) => {
          if (group.producerId === 'prod-tan-trieu-pomelo') {
            throw new Error('Mất kết nối tạm thời tới cơ sở Tân Triều.');
          }
          return {
            id: 'ord-part-1',
            orderCode: 'DON-LK-PART1',
            producerId: group.producerId,
            producerName: group.producer.businessName
          };
        }
      }
    );
    expect(partialRes.partial).toBe(true);
    expect(partialRes.succeededOrders).toHaveLength(1);
    expect(partialRes.failedGroups).toHaveLength(1);
    const remainingCart = loadCart();
    expect(remainingCart).toHaveLength(1);
    expect(remainingCart[0].producerId).toBe('prod-tan-trieu-pomelo');

    // Now submit remaining item cleanly and verify exact Tân Triều pickup point
    const finalRes = await submitMultiGardenOrder({
      customerName: 'Khách đặt 2 vườn',
      customerPhone: '0909888777',
      deliveryByProducer: { 'prod-tan-trieu-pomelo': 'pickup' }
    });
    expect(finalRes.partial).toBe(false);
    expect(finalRes.succeededOrders[0].deliveryLabel).toContain('Tân Triều');
    expect(finalRes.succeededOrders[0].deliveryLabel).not.toContain('Nhà vườn Ba Tư');
    expect(loadCart()).toHaveLength(0);
  });

  it('tracks youth referral click -> direct cart purchase -> commission reconciliation & seller completion', async () => {
    const ri6 = (await fetchProductBySlug('sau-rieng-ri6-vuon-ba-tu-long-khanh')).product;
    const link = await createAffiliateLink({
      affiliateId: 'aff-member-1',
      affiliateName: 'Đoàn viên Minh Anh',
      productId: ri6.id,
      platform: 'direct_ocop'
    });

    const visit = await recordDirectReferralVisit(link.code);
    expect(visit.clicksCount).toBe(1);
    addToCart(visit.product, 2);

    const res = await submitMultiGardenOrder({
      customerName: 'Khách từ link đoàn viên',
      customerPhone: '0903334445',
      deliveryByProducer: { 'prod-ba-tu-long-khanh': 'pickup' }
    });
    const ord = res.succeededOrders[0];
    expect(ord.affiliateCode).toBe(link.code);
    expect(ord.commissionVnd).toBe(23000); // 2 * 115,000 * 10%

    const beforeComplete = await fetchAffiliateCommission({ affiliateId: 'aff-member-1' });
    expect(beforeComplete.orders.some((o) => o.orderCode === ord.orderCode)).toBe(true);

    await updateSellerOrderStatus({
      orderId: ord.id,
      producerId: 'prod-ba-tu-long-khanh',
      nextStatus: 'completed'
    });

    const afterComplete = await fetchAffiliateCommission({ affiliateId: 'aff-member-1' });
    expect(afterComplete.summary.availableVnd).toBeGreaterThanOrEqual(23000);
  });

  it('supports Bonus B farm visit booking, Bonus C volunteer approval, offline voice log sync, and QR generation', () => {
    // Bonus B: Farm tour booking
    const booking = createVisitRequest({
      producerId: 'prod-ba-tu-long-khanh',
      packageName: 'Hái chôm chôm tại vườn',
      visitorName: 'Gia đình chị Hương',
      visitorPhone: '0908111222',
      visitDate: '2026-12-01',
      timeSlot: 'Sáng 08:00 – 10:00',
      guestsCount: 4
    });
    expect(fetchVisitRequests('prod-ba-tu-long-khanh').some((v) => v.id === booking.id)).toBe(true);

    // Bonus C: Volunteer hours + Farmer approval
    const beforeTotals = getVolunteerTotals(fetchVolunteerLogs());
    const minhAnhBefore = beforeTotals.find((m) => m.id === 'aff-member-1').approvedHours;

    const newLog = addVolunteerLog({
      memberId: 'aff-member-1',
      producerId: 'prod-ba-tu-long-khanh',
      activityDate: '2026-11-24',
      taskTitle: 'Hỗ trợ dán mã QR lô chôm chôm chiều',
      hours: 2.5
    });
    expect(newLog.status).toBe('pending');
    expect(getVolunteerTotals(fetchVolunteerLogs()).find((m) => m.id === 'aff-member-1').approvedHours).toBe(minhAnhBefore);

    reviewVolunteerLog({ logId: newLog.id, decision: 'approved', producerId: 'prod-ba-tu-long-khanh' });
    expect(getVolunteerTotals(fetchVolunteerLogs()).find((m) => m.id === 'aff-member-1').approvedHours).toBe(
      minhAnhBefore + 2.5
    );

    // One-tap youth support
    const req = createSupportRequest({
      producerId: 'prod-ba-tu-long-khanh',
      topic: 'Nhờ chụp ảnh sầu riêng mới cắt'
    });
    expect(fetchSupportRequests('prod-ba-tu-long-khanh').some((r) => r.id === req.id)).toBe(true);

    // Offline voice season note sync to QR batch
    const draft = addSeasonNoteDraft({
      batchCode: 'LK-CC-2411',
      stage: 'Tỉa trái đợt 2 (Voice)',
      detail: 'Tỉa trái non giữ quả to đều tại lô A1.',
      inputMode: 'simulated_voice',
      isOffline: true
    });
    syncSeasonNoteDraftToBatch(draft.id);
    const updatedSeason = fetchSeasonLogByBatch('LK-CC-2411');
    expect(updatedSeason.milestones.some((m) => m.detail.includes('Tỉa trái non'))).toBe(true);

    // Public QR URL + SVG quiet zone
    const qrUrl = buildPublicTraceUrl('LK-SR-2411');
    expect(qrUrl).toMatch(/^https:\/\/.+\/nhat-ky\/LK-SR-2411$/);
    const qrSvg = buildTraceQrSvgDataUri(qrUrl);
    expect(qrSvg).toContain('data:image/svg+xml');
  });
});
