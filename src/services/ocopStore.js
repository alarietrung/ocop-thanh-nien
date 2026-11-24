import {
  DEMO_YOUTH_MEMBERS,
  INITIAL_AFFILIATE_LINKS,
  INITIAL_AUDIT_LOGS,
  INITIAL_LEDGER,
  INITIAL_LIVESTREAM_SCHEDULE,
  INITIAL_ORDERS,
  INITIAL_PRODUCERS,
  INITIAL_PRODUCTS,
  INITIAL_SEASON_LOGS,
  INITIAL_SUPPORT_REQUESTS,
  INITIAL_VISIT_REQUESTS,
  INITIAL_VOLUNTEER_LOGS,
  PILOT_ROADMAP_90_DAYS,
  PRIMARY_FARMER_PRODUCER_ID,
  PRODUCT_CATEGORIES,
  VIDEO_TEMPLATES
} from '../data/pilotData';
import {
  buildProductArtworkDataUri,
  calculateCommissionVnd,
  generateAffiliateCode,
  normalizeVi,
  slugifyVi,
  validateMarketplaceListingUrl
} from '../utils/formatters';
import { apiRequest } from './apiClient';
import { getApiBaseUrl, loadJson, saveJson } from './storageService';
import {
  fetchStorefrontOrders,
  hasStorefrontSync,
  loadPublicStorefront,
  loadStorefrontSeason,
  saveStorefrontOrder,
  updateStorefrontOrderStatus
} from './supabaseStorefront';

const STORE_KEY = 'ocop_de3_pilot_state_v3';
const CART_KEY = 'ocop_de3_cart_v1';
const ACTIVE_REFERRAL_KEY = 'ocop_de3_active_referral_v1';
const RECENT_ORDERS_KEY = 'ocop_de3_recent_orders_v1';
const QUICK_DRAFT_KEY = 'ocop_de3_quick_publish_draft_v1';
const OFFLINE_SEASON_DRAFTS_KEY = 'ocop_de3_offline_season_drafts_v1';
const STATE_VERSION = 3;

function createInitialState() {
  return {
    version: STATE_VERSION,
    producers: INITIAL_PRODUCERS,
    products: INITIAL_PRODUCTS,
    seasonLogs: INITIAL_SEASON_LOGS,
    livestreams: INITIAL_LIVESTREAM_SCHEDULE,
    affiliateLinks: INITIAL_AFFILIATE_LINKS,
    orders: INITIAL_ORDERS,
    ledger: INITIAL_LEDGER,
    auditLogs: INITIAL_AUDIT_LOGS,
    volunteerLogs: INITIAL_VOLUNTEER_LOGS,
    visitRequests: INITIAL_VISIT_REQUESTS,
    supportRequests: INITIAL_SUPPORT_REQUESTS,
    pilotApplications: []
  };
}

function validateState(data) {
  return (
    data &&
    typeof data === 'object' &&
    data.version === STATE_VERSION &&
    Array.isArray(data.producers) &&
    Array.isArray(data.products) &&
    Array.isArray(data.affiliateLinks) &&
    Array.isArray(data.orders) &&
    Array.isArray(data.ledger) &&
    data.seasonLogs &&
    Array.isArray(data.livestreams) &&
    Array.isArray(data.volunteerLogs) &&
    Array.isArray(data.visitRequests) &&
    Array.isArray(data.supportRequests)
  );
}

export function loadPilotState() {
  return loadJson(STORE_KEY, createInitialState(), validateState);
}

export function savePilotState(state) {
  saveJson(STORE_KEY, state);
  return state;
}

export function resetPilotState() {
  const initial = createInitialState();
  savePilotState(initial);
  saveJson(CART_KEY, []);
  saveJson(ACTIVE_REFERRAL_KEY, null);
  saveJson(RECENT_ORDERS_KEY, []);
  saveJson(QUICK_DRAFT_KEY, null);
  saveJson(OFFLINE_SEASON_DRAFTS_KEY, []);
  return initial;
}

export function hasRemoteApi() {
  return Boolean(getApiBaseUrl());
}

export function getStaticReferenceData() {
  return {
    categories: PRODUCT_CATEGORIES,
    videoTemplates: VIDEO_TEMPLATES,
    roadmap: PILOT_ROADMAP_90_DAYS,
    youthMembers: DEMO_YOUTH_MEMBERS
  };
}

export function fetchAllProducers() {
  const state = loadPilotState();
  return state.producers || INITIAL_PRODUCERS;
}

// --- ACTIVE YOUTH REFERRAL ATTRIBUTION ---

export function getActiveReferral() {
  const ref = loadJson(ACTIVE_REFERRAL_KEY, null, (v) => Boolean(v && typeof v.code === 'string'));
  if (!ref) return null;
  if (ref.expiresAt && ref.expiresAt < Date.now()) {
    saveJson(ACTIVE_REFERRAL_KEY, null);
    return null;
  }
  return ref;
}

export function setActiveReferral(referral) {
  if (!referral?.code) {
    saveJson(ACTIVE_REFERRAL_KEY, null);
    return null;
  }
  const payload = {
    code: referral.code,
    affiliateLinkId: referral.affiliateLinkId || null,
    affiliateId: referral.affiliateId || null,
    affiliateName: referral.affiliateName || 'Đoàn viên hỗ trợ',
    productId: referral.productId || null,
    productTitle: referral.productTitle || '',
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000
  };
  saveJson(ACTIVE_REFERRAL_KEY, payload);
  return payload;
}

export function clearActiveReferral() {
  saveJson(ACTIVE_REFERRAL_KEY, null);
}

// --- RECENT BUYER ORDERS & TRACKING ---

export function loadRecentBuyerOrderCodes() {
  return loadJson(RECENT_ORDERS_KEY, [], (v) => Array.isArray(v));
}

function recordRecentBuyerOrderCode(orderCode) {
  if (!orderCode) return;
  const current = loadRecentBuyerOrderCodes().filter((c) => c !== orderCode);
  saveJson(RECENT_ORDERS_KEY, [orderCode, ...current].slice(0, 20));
}

export function fetchOrderByCode(orderCode) {
  const clean = String(orderCode || '').trim().toUpperCase();
  if (!clean) return null;
  const state = loadPilotState();
  return (
    state.orders.find(
      (o) =>
        String(o.orderCode || '').toUpperCase() === clean ||
        String(o.externalOrderId || '').toUpperCase() === clean
    ) || null
  );
}

export function lookupBuyerOrders(query = '') {
  const state = loadPilotState();
  const clean = String(query || '').trim().toUpperCase();
  const recentCodes = loadRecentBuyerOrderCodes();
  if (!clean) {
    const recentOrders = recentCodes
      .map((code) => state.orders.find((o) => o.orderCode === code || o.externalOrderId === code))
      .filter(Boolean);
    const sampleFallback = state.orders.filter(
      (o) => o.platform === 'direct_ocop' && !recentOrders.some((r) => r.id === o.id)
    );
    return [...recentOrders, ...sampleFallback.slice(0, 4)];
  }
  return state.orders.filter((o) => {
    const code = String(o.orderCode || o.externalOrderId || '').toUpperCase();
    const phone = String(o.customerPhone || '').replace(/[\s.-]/g, '');
    const cleanDigits = clean.replace(/[\s.-]/g, '');
    return code.includes(clean) || (cleanDigits.length >= 4 && phone.includes(cleanDigits));
  });
}

// --- CART & MULTI-GARDEN CHECKOUT (MÀN 4 & LUỒNG XUYÊN SUỐT MÀN 3 -> 4 -> 5) ---

export function loadCart() {
  return loadJson(CART_KEY, [], (arr) => Array.isArray(arr));
}

export function saveCart(items) {
  saveJson(CART_KEY, items);
  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    window.dispatchEvent(
      new CustomEvent('ocop-cart-updated', {
        detail: { count: items.reduce((s, i) => s + i.quantity, 0) }
      })
    );
  }
  return items;
}

export function addToCart(product, quantity = 1, { preorder = false } = {}) {
  if (!product?.id) throw new Error('Thiếu thông tin sản phẩm.');
  const qty = Math.max(1, Math.min(99, Math.round(Number(quantity) || 1)));
  const current = loadCart();
  const idx = current.findIndex((i) => i.productId === product.id);
  let next;
  if (idx >= 0) {
    next = current.map((item, i) =>
      i === idx
        ? {
            ...item,
            quantity: Math.min(99, item.quantity + qty),
            preorder: preorder || Boolean(item.preorder)
          }
        : item
    );
  } else {
    next = [
      ...current,
      {
        productId: product.id,
        producerId: product.producerId || PRIMARY_FARMER_PRODUCER_ID,
        sku: product.sku,
        slug: product.slug,
        title: product.title,
        unit: product.unit,
        priceVnd: product.priceVnd,
        commissionRateBps: product.commissionRateBps || 1000,
        imageUrl: product.imageUrl,
        batchCode: product.batchCode || '',
        preorder: Boolean(preorder),
        quantity: qty
      }
    ];
  }
  return saveCart(next);
}

export function updateCartQuantity(productId, quantity) {
  const qty = Math.round(Number(quantity) || 0);
  const current = loadCart();
  const next =
    qty <= 0
      ? current.filter((i) => i.productId !== productId)
      : current.map((i) => (i.productId === productId ? { ...i, quantity: Math.min(99, qty) } : i));
  return saveCart(next);
}

export function clearCart() {
  return saveCart([]);
}

export function groupCartByProducer(cartItems = loadCart()) {
  const state = loadPilotState();
  const producerMap = new Map(state.producers.map((p) => [p.id, p]));
  const groupsMap = new Map();

  for (const item of cartItems || []) {
    const pid = item.producerId || PRIMARY_FARMER_PRODUCER_ID;
    if (!groupsMap.has(pid)) {
      const producer = producerMap.get(pid) || {
        id: pid,
        slug: 'nha-vuon-ba-tu',
        businessName: 'Nhà vườn Đồng Nai',
        area: 'Đồng Nai',
        pickupPoint: 'Điểm hẹn tại cơ sở sản xuất (liên hệ xác nhận)',
        pickupHours: '08:00 – 17:00',
        pickupEligible: true
      };
      groupsMap.set(pid, {
        producerId: pid,
        producer,
        items: [],
        subtotalVnd: 0,
        totalQty: 0
      });
    }
    const g = groupsMap.get(pid);
    g.items.push(item);
    g.subtotalVnd += item.priceVnd * item.quantity;
    g.totalQty += item.quantity;
  }

  return Array.from(groupsMap.values());
}

export function getShippingFeeForMethod(method) {
  if (method === 'pickup') return 0;
  if (method === 'group_drop') return 15000;
  return 25000;
}

function buildDeliverySummary(method, producer, cleanAddr, groupDropPoint) {
  const pickupAddr =
    producer?.pickupPoint || producer?.publicContact || `Cơ sở ${producer?.businessName || 'OCOP Đồng Nai'}`;
  if (method === 'pickup') {
    return {
      shippingFeeVnd: 0,
      deliveryLabel: `Nhận trực tiếp tại ${producer?.businessName?.split('—')[0]?.trim() || 'nhà vườn'}: ${pickupAddr}`,
      shippingAddress: pickupAddr
    };
  }
  if (method === 'group_drop') {
    const dropLabel = String(groupDropPoint || '').trim() || 'Cụm điểm nhận chung TP. Biên Hòa (Minh họa)';
    return {
      shippingFeeVnd: 15000,
      deliveryLabel: `Gom chuyến minh họa tại ${dropLabel} (nhà vườn liên hệ xác nhận khung nhận)`,
      shippingAddress: dropLabel
    };
  }
  return {
    shippingFeeVnd: 25000,
    deliveryLabel: `Giao tận nơi từ ${producer?.businessName?.split('—')[0]?.trim() || 'nhà vườn'}: ${cleanAddr}`,
    shippingAddress: cleanAddr
  };
}

function createOrderRecordForGroup({
  group,
  index,
  customerName,
  customerPhone,
  deliveryMethod,
  shippingAddress,
  groupDropPoint,
  note,
  activeReferral,
  state
}) {
  const subtotalVnd = group.items.reduce((sum, item) => sum + item.priceVnd * item.quantity, 0);
  const { shippingFeeVnd, deliveryLabel, shippingAddress: resolvedAddr } = buildDeliverySummary(
    deliveryMethod,
    group.producer,
    shippingAddress,
    groupDropPoint
  );
  const grossAmountVnd = subtotalVnd + shippingFeeVnd;
  const suffix = `${String(Date.now()).slice(-5)}${index > 0 ? index : ''}`;
  const areaPrefix = group.producerId === PRIMARY_FARMER_PRODUCER_ID ? 'LK' : 'DN';
  const orderCode = `DON-${areaPrefix}-${suffix}`;
  const primaryItem = group.items[0];
  const totalQty = group.items.reduce((sum, i) => sum + i.quantity, 0);

  // Resolve commission rate from products in state
  const productMap = new Map(state.products.map((p) => [p.id, p]));
  let computedCommission = 0;
  let weightedRateBps = primaryItem.commissionRateBps || 1000;
  const hasReferral = Boolean(activeReferral?.affiliateId && activeReferral?.code);
  if (hasReferral) {
    computedCommission = group.items.reduce((sum, item) => {
      const p = productMap.get(item.productId);
      const bps = p?.commissionRateBps || item.commissionRateBps || 1000;
      weightedRateBps = bps;
      return sum + calculateCommissionVnd(item.priceVnd * item.quantity, bps);
    }, 0);
  }

  const hasPreorder = group.items.some((i) => i.preorder);
  const nowIso = new Date().toISOString();
  const orderId = `ord-cart-${Date.now()}-${index}`;

  const createdOrder = {
    id: orderId,
    orderCode,
    platform: 'direct_ocop',
    shopId: group.producer?.slug || 'vuon_ocop',
    externalOrderId: orderCode,
    producerId: group.producerId,
    producerName: group.producer?.businessName || 'Nhà vườn Đồng Nai',
    productId: primaryItem.productId,
    sku: primaryItem.sku,
    productTitle:
      group.items.length === 1
        ? primaryItem.title
        : `${primaryItem.title} (+${group.items.length - 1} món khác)`,
    quantity: totalQty,
    items: group.items.map((i) => ({
      productId: i.productId,
      sku: i.sku,
      title: i.title,
      quantity: i.quantity,
      unitPriceVnd: i.priceVnd,
      preorder: Boolean(i.preorder)
    })),
    deliveryMethod,
    deliveryLabel,
    customerName,
    customerPhone,
    shippingAddress: resolvedAddr,
    note: String(note || '').trim(),
    hasPreorder,
    shippingFeeVnd,
    grossAmountVnd,
    netAmountVnd: subtotalVnd,
    commissionRateBps: weightedRateBps,
    commissionVnd: computedCommission,
    affiliateCode: hasReferral ? activeReferral.code : '',
    affiliateLinkId: hasReferral ? activeReferral.affiliateLinkId : null,
    affiliateId: hasReferral ? activeReferral.affiliateId : null,
    affiliateName: hasReferral
      ? activeReferral.affiliateName
      : 'Đặt trực tiếp tại Chợ OCOP (không qua link giới thiệu)',
    attributionStatus: hasReferral ? 'attributed' : 'unassigned',
    status: 'placed',
    source: 'cart_demo',
    orderedAt: nowIso
  };

  const ledgerRows = [];
  if (hasReferral && computedCommission > 0) {
    const txGroupId = `tx-${orderId}`;
    const ledgerNote = `Đơn ${orderCode} qua link giới thiệu ${activeReferral.code} (${group.producer?.businessName || 'Nhà vườn'}) — hoa hồng ước tính`;
    ledgerRows.push(
      {
        id: `ldg-d-${orderId}`,
        txGroupId,
        orderId,
        affiliateId: activeReferral.affiliateId,
        affiliateCode: activeReferral.code,
        accountType: 'platform_escrow',
        direction: 'debit',
        amountVnd: computedCommission,
        state: 'pending',
        note: ledgerNote,
        createdAt: nowIso
      },
      {
        id: `ldg-c-${orderId}`,
        txGroupId,
        orderId,
        affiliateId: activeReferral.affiliateId,
        affiliateCode: activeReferral.code,
        accountType: 'affiliate_payable',
        direction: 'credit',
        amountVnd: computedCommission,
        state: 'pending',
        note: ledgerNote,
        createdAt: nowIso
      }
    );
  }

  return { createdOrder, ledgerRows };
}

export function placeCartOrder({
  customerName,
  customerPhone,
  deliveryMethod = 'delivery',
  shippingAddress = '',
  note = ''
}) {
  const cart = loadCart();
  if (!cart || cart.length === 0) {
    throw new Error('Giỏ hàng đang trống. Vui lòng chọn sản phẩm trước khi đặt hàng.');
  }
  const groups = groupCartByProducer(cart);
  const deliveryByProducer = {};
  for (const g of groups) {
    deliveryByProducer[g.producerId] = deliveryMethod;
  }
  const result = placeMultiGardenOrders({
    customerName,
    customerPhone,
    shippingAddress,
    note,
    deliveryByProducer
  });
  return result.succeededOrders[0];
}

export function placeMultiGardenOrders({
  customerName,
  customerPhone,
  shippingAddress = '',
  note = '',
  deliveryByProducer = {},
  groupDropPoint = ''
}) {
  const cart = loadCart();
  if (!cart || cart.length === 0) {
    throw new Error('Giỏ hàng đang trống. Vui lòng chọn sản phẩm trước khi đặt hàng.');
  }
  const cleanName = String(customerName || '').trim();
  const cleanPhone = String(customerPhone || '').trim();
  const cleanAddr = String(shippingAddress || '').trim();
  if (cleanName.length < 2) {
    throw new Error('Vui lòng nhập họ tên người nhận (tối thiểu 2 ký tự).');
  }
  if (!/^[0-9+\s.-]{8,15}$/.test(cleanPhone)) {
    throw new Error('Vui lòng nhập số điện thoại liên hệ hợp lệ (8–15 chữ số).');
  }

  const groups = groupCartByProducer(cart);
  const needsDeliveryAddr = groups.some((g) => (deliveryByProducer[g.producerId] || 'delivery') === 'delivery');
  if (needsDeliveryAddr && cleanAddr.length < 6) {
    throw new Error('Vui lòng nhập địa chỉ giao hàng cụ thể cho nhà vườn chọn Giao tận nơi.');
  }

  const state = loadPilotState();
  const activeReferral = getActiveReferral();
  const createdOrders = [];
  const createdLedger = [];
  const auditEntries = [];

  groups.forEach((group, idx) => {
    const method = deliveryByProducer[group.producerId] || 'delivery';
    const { createdOrder, ledgerRows } = createOrderRecordForGroup({
      group,
      index: idx,
      customerName: cleanName,
      customerPhone: cleanPhone,
      deliveryMethod: method,
      shippingAddress: cleanAddr,
      groupDropPoint,
      note,
      activeReferral,
      state
    });
    createdOrders.push(createdOrder);
    createdLedger.push(...ledgerRows);
    auditEntries.push({
      id: `aud-${Date.now()}-${idx}`,
      actorLabel: cleanName,
      action: 'CART_ORDER_CREATED',
      targetLabel: createdOrder.orderCode,
      detail: `Đặt đơn tại ${createdOrder.producerName} (${createdOrder.deliveryLabel}) trị giá ${createdOrder.grossAmountVnd}đ.`,
      createdAt: createdOrder.orderedAt
    });
    recordRecentBuyerOrderCode(createdOrder.orderCode);
  });

  savePilotState({
    ...state,
    orders: [...createdOrders, ...state.orders],
    ledger: [...createdLedger, ...state.ledger],
    auditLogs: [...auditEntries, ...state.auditLogs]
  });

  clearCart();
  if (activeReferral) clearActiveReferral();
  return { succeededOrders: createdOrders, failedGroups: [], partial: false };
}

export async function submitMultiGardenOrder(
  {
    customerName,
    customerPhone,
    shippingAddress = '',
    note = '',
    deliveryByProducer = {},
    groupDropPoint = '',
    orderIdsByProducer = {},
    useRealSupabase = false
  },
  { submitGardenOrderOverride } = {}
) {
  const cart = loadCart();
  if (!cart || cart.length === 0) {
    throw new Error('Giỏ hàng đang trống. Vui lòng chọn sản phẩm trước khi đặt hàng.');
  }

  const cleanName = String(customerName || '').trim();
  const cleanPhone = String(customerPhone || '').trim();
  const cleanAddr = String(shippingAddress || '').trim();
  if (cleanName.length < 2) {
    throw new Error('Vui lòng nhập họ tên người nhận (tối thiểu 2 ký tự).');
  }
  if (!/^[0-9+\s.-]{8,15}$/.test(cleanPhone)) {
    throw new Error('Vui lòng nhập số điện thoại liên hệ hợp lệ (8–15 chữ số).');
  }

  const groups = groupCartByProducer(cart);
  const needsDeliveryAddr = groups.some((g) => (deliveryByProducer[g.producerId] || 'delivery') === 'delivery');
  if (needsDeliveryAddr && cleanAddr.length < 6) {
    throw new Error('Vui lòng nhập địa chỉ giao hàng cụ thể cho nhà vườn chọn Giao tận nơi.');
  }

  const shouldTrySupabase = Boolean(useRealSupabase && hasStorefrontSync());
  const activeReferral = getActiveReferral();
  const succeededOrders = [];
  const failedGroups = [];
  const succeededProductIds = new Set();

  for (let idx = 0; idx < groups.length; idx += 1) {
    const group = groups[idx];
    const method = deliveryByProducer[group.producerId] || 'delivery';
    const orderUuid = orderIdsByProducer[group.producerId] || globalThis.crypto?.randomUUID?.();

    try {
      let createdOrder;
      let ledgerRows = [];

      if (typeof submitGardenOrderOverride === 'function') {
        createdOrder = await submitGardenOrderOverride({
          group,
          method,
          orderId: orderUuid,
          customerName: cleanName,
          customerPhone: cleanPhone,
          shippingAddress: cleanAddr,
          note
        });
      } else if (
        shouldTrySupabase &&
        group.items.every((item) => !item.productId.startsWith('quick-')) &&
        (method === 'pickup' || method === 'delivery')
      ) {
        const remote = await saveStorefrontOrder({
          orderId: orderUuid,
          cart: group.items,
          customerName: cleanName,
          customerPhone: cleanPhone,
          deliveryMethod: method,
          shippingAddress: cleanAddr,
          note
        });
        const { deliveryLabel, shippingAddress: resolvedAddr } = buildDeliverySummary(
          method,
          group.producer,
          cleanAddr,
          groupDropPoint
        );
        createdOrder = {
          ...remote,
          producerId: group.producerId,
          producerName: group.producer?.businessName || 'Nhà vườn Đồng Nai',
          deliveryMethod: method,
          deliveryLabel,
          shippingAddress: resolvedAddr
        };
      } else {
        const currentState = loadPilotState();
        const built = createOrderRecordForGroup({
          group,
          index: idx,
          customerName: cleanName,
          customerPhone: cleanPhone,
          deliveryMethod: method,
          shippingAddress: cleanAddr,
          groupDropPoint,
          note,
          activeReferral,
          state: currentState
        });
        createdOrder = built.createdOrder;
        ledgerRows = built.ledgerRows;

        savePilotState({
          ...currentState,
          orders: [createdOrder, ...currentState.orders],
          ledger: [...ledgerRows, ...currentState.ledger],
          auditLogs: [
            {
              id: `aud-${Date.now()}-${idx}`,
              actorLabel: cleanName,
              action: 'CART_ORDER_CREATED',
              targetLabel: createdOrder.orderCode,
              detail: `Đặt đơn tại ${createdOrder.producerName} (${createdOrder.deliveryLabel}) trị giá ${createdOrder.grossAmountVnd}đ.`,
              createdAt: createdOrder.orderedAt
            },
            ...currentState.auditLogs
          ]
        });
      }

      succeededOrders.push(createdOrder);
      recordRecentBuyerOrderCode(createdOrder.orderCode);
      group.items.forEach((item) => succeededProductIds.add(item.productId));
    } catch (err) {
      failedGroups.push({
        producerId: group.producerId,
        producerName: group.producer?.businessName || group.producerId,
        itemsCount: group.items.length,
        error: err?.message || 'Không thể gửi đơn cho nhà vườn này.'
      });
    }
  }

  // Giữ lại các sản phẩm thuộc nhà vườn gửi lỗi; chỉ bỏ các sản phẩm đã tạo đơn thành công
  if (succeededProductIds.size > 0) {
    const remainingCart = cart.filter((item) => !succeededProductIds.has(item.productId));
    saveCart(remainingCart);
    if (failedGroups.length === 0 && activeReferral) {
      clearActiveReferral();
    }
  }

  if (succeededOrders.length === 0 && failedGroups.length > 0) {
    throw new Error(failedGroups[0].error || 'Không thể tạo đơn đặt hàng. Giỏ hàng vẫn được giữ nguyên.');
  }

  return {
    succeededOrders,
    failedGroups,
    partial: succeededOrders.length > 0 && failedGroups.length > 0
  };
}

export async function submitCartOrder(fields, orderId) {
  const cart = loadCart();
  const groups = groupCartByProducer(cart);
  const deliveryByProducer = {};
  const orderIdsByProducer = {};
  for (const g of groups) {
    deliveryByProducer[g.producerId] = fields.deliveryMethod || 'delivery';
    if (orderId) orderIdsByProducer[g.producerId] = orderId;
  }
  const result = await submitMultiGardenOrder({
    ...fields,
    deliveryByProducer,
    orderIdsByProducer,
    useRealSupabase: Boolean(fields.useRealSupabase)
  });
  return result.succeededOrders[0];
}

// --- SEASON LOGS (TRUY XUẤT QR MÀN 3) & OFFLINE VOICE SEASON DRAFTS ---

export async function loadSeasonLog(batchCode) {
  const local = fetchSeasonLogByBatch(batchCode);
  if (!hasStorefrontSync()) return local;
  try {
    const remote = await loadStorefrontSeason(batchCode);
    if (remote) {
      // Merge any locally synced offline voice milestones for demo continuity
      const extraMilestones = (local?.milestones || []).filter((m) => m.isVoiceDraftNote);
      return extraMilestones.length > 0
        ? { ...remote, milestones: [...remote.milestones, ...extraMilestones] }
        : remote;
    }
  } catch {
    // Offline fallback to local
  }
  return local;
}

export function fetchSeasonLogByBatch(batchCode) {
  const state = loadPilotState();
  const log = state.seasonLogs?.[batchCode] || null;
  const product = state.products.find((p) => p.batchCode === batchCode) || null;
  if (log) {
    return { ...log, product };
  }
  if (!product) return null;
  const producer = state.producers.find((pr) => pr.id === product.producerId);
  return {
    batchCode: product.batchCode || batchCode,
    productSku: product.sku,
    productTitle: product.title,
    producerName: producer?.businessName || product.area,
    harvestWindow: 'Mùa vụ 11/2026 (Dữ liệu mẫu)',
    harvestedAtLabel: product.harvestedAtLabel || 'Thu hoạch theo đợt 11/2026',
    verifiedByYouth: 'Đoàn viên hỗ trợ cơ sở xác nhận (mẫu)',
    product,
    milestones: [
      {
        stage: 'Chăm sóc tại vườn',
        date: '15/10/2026',
        location: product.area,
        detail: 'Chăm sóc theo quy trình sạch địa phương (dữ liệu mẫu).',
        inspector: producer?.ownerName || 'Chủ cơ sở'
      },
      {
        stage: 'Thu hoạch & Sơ chế',
        date: '23/11/2026',
        location: product.area,
        detail: 'Thu hoạch đúng độ chín và chọn lọc đạt chuẩn.',
        inspector: producer?.ownerName || 'Chủ cơ sở'
      },
      {
        stage: 'Đóng gói & Gắn tem QR',
        date: '24/11/2026',
        location: product.area,
        detail: product.spec,
        inspector: 'Kiểm tra nội bộ (Mô phỏng)'
      }
    ]
  };
}

export function loadSeasonNoteDrafts() {
  return loadJson(OFFLINE_SEASON_DRAFTS_KEY, [], (v) => Array.isArray(v));
}

export function addSeasonNoteDraft({ batchCode = 'LK-CC-2411', stage = 'Ghi chú chăm sóc tại vườn', detail, inputMode = 'manual', isOffline = false }) {
  const cleanDetail = String(detail || '').trim();
  if (cleanDetail.length < 4) {
    throw new Error('Vui lòng nhập hoặc đọc nội dung nhật ký tối thiểu 4 ký tự.');
  }
  const drafts = loadSeasonNoteDrafts();
  const entry = {
    id: `snd-${Date.now()}`,
    batchCode: String(batchCode || 'LK-CC-2411').trim(),
    stage: String(stage || 'Ghi chú chăm sóc tại vườn').trim(),
    detail: cleanDetail,
    inputMode,
    createdOffline: Boolean(isOffline),
    synced: false,
    createdAt: new Date().toISOString()
  };
  saveJson(OFFLINE_SEASON_DRAFTS_KEY, [entry, ...drafts]);
  return entry;
}

export function deleteSeasonNoteDraft(draftId) {
  const next = loadSeasonNoteDrafts().filter((d) => d.id !== draftId);
  saveJson(OFFLINE_SEASON_DRAFTS_KEY, next);
  return next;
}

export function syncSeasonNoteDraftToBatch(draftId) {
  const drafts = loadSeasonNoteDrafts();
  const target = drafts.find((d) => d.id === draftId);
  if (!target) throw new Error('Không tìm thấy bản nháp nhật ký.');
  const state = loadPilotState();
  const existingLog = state.seasonLogs?.[target.batchCode] || fetchSeasonLogByBatch(target.batchCode);
  if (!existingLog) {
    throw new Error(`Không tìm thấy mã lô ${target.batchCode} để gắn nhật ký.`);
  }
  const nowLabel = new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(target.createdAt));

  const newMilestone = {
    stage: target.stage,
    date: nowLabel,
    location: 'Nhà vườn Ba Tư, Ấp Bảo Vinh, Long Khánh',
    detail: target.detail,
    inspector:
      target.inputMode === 'speech_api'
        ? 'Chú Ba Tư ghi giọng nói (PWA)'
        : target.inputMode === 'simulated_voice'
          ? 'Chú Ba Tư ghi giọng nói mẫu (PWA)'
          : 'Chú Ba Tư ghi chép tại vườn',
    isVoiceDraftNote: true
  };

  const nextLog = {
    ...existingLog,
    milestones: [...(existingLog.milestones || []), newMilestone]
  };
  delete nextLog.product;

  savePilotState({
    ...state,
    seasonLogs: {
      ...state.seasonLogs,
      [target.batchCode]: nextLog
    }
  });

  const nextDrafts = drafts.map((d) => (d.id === draftId ? { ...d, synced: true } : d));
  saveJson(OFFLINE_SEASON_DRAFTS_KEY, nextDrafts);
  return nextLog;
}

// --- QUICK PUBLISH WITH IMAGE, VOICE & AI DESCRIPTION (MÀN 2) ---

export function loadQuickPublishDraft() {
  return loadJson(QUICK_DRAFT_KEY, null, (v) => Boolean(v && typeof v === 'object'));
}

export function saveQuickPublishDraft(draft) {
  const payload = {
    ...draft,
    savedAt: new Date().toISOString()
  };
  saveJson(QUICK_DRAFT_KEY, payload);
  return payload;
}

export function clearQuickPublishDraft() {
  saveJson(QUICK_DRAFT_KEY, null);
}

export function publishQuickGardenProduct({
  producerId = PRIMARY_FARMER_PRODUCER_ID,
  title,
  priceVnd,
  stockKg,
  description,
  imageDataUrl = '',
  batchCode = '',
  voiceInputMode = 'manual',
  descriptionSource = 'manual'
}) {
  const state = loadPilotState();
  const producer = state.producers.find((p) => p.id === producerId) || state.producers[0];
  const cleanTitle = String(title || '').trim();
  const cleanPrice = Math.round(Number(priceVnd) || 0);
  const cleanStock = Math.round(Number(stockKg) || 0);
  if (cleanTitle.length < 3) {
    throw new Error('Tên sản phẩm cần tối thiểu 3 ký tự.');
  }
  if (cleanPrice < 5000 || cleanPrice > 50000000) {
    throw new Error('Giá bán/kg phải nằm trong khoảng 5.000 ₫ – 50.000.000 ₫.');
  }
  if (cleanStock < 1 || cleanStock > 100000) {
    throw new Error('Số lượng tồn kho phải từ 1 kg trở lên.');
  }

  const nowIso = new Date().toISOString();
  const sku = `NVBT-${String(state.products.length + 1).padStart(2, '0')}`;
  const baseSlug = slugifyVi(cleanTitle) || `nong-san-${Date.now()}`;
  const uniqueSlug = state.products.some((p) => p.slug === baseSlug)
    ? `${baseSlug}-${Date.now().toString().slice(-4)}`
    : baseSlug;
  const resolvedBatch = String(batchCode || '').trim() || `LK-${String(Date.now()).slice(-4)}`;
  const dateLabelVn = new Date().toLocaleDateString('vi-VN');

  const newProduct = {
    id: `quick-${Date.now()}`,
    sku,
    batchCode: resolvedBatch,
    slug: uniqueSlug,
    producerId: producer.id,
    categoryId: 'trai-cay-tuoi',
    title: cleanTitle,
    unit: '1 kg',
    spec: 'Thu hái tại vườn, đăng nhanh bằng ảnh & giọng nói.',
    area: producer.area,
    priceVnd: cleanPrice,
    priceUpdatedAt: nowIso,
    stock: cleanStock,
    commissionRateBps: 1000,
    commissionCondition: 'Sản phẩm đăng nhanh từ Màn 2 Nhà vườn.',
    status: 'published',
    certStatus: 'verified_pilot',
    ocopStars: producer.ocopStars,
    mediaKitReady: true,
    accentHex: '#0759BA',
    secondaryHex: '#15803D',
    harvestedAtLabel: `Cập nhật tại vườn ${dateLabelVn}`,
    description:
      String(description || '').trim() ||
      `${cleanTitle} thu hoạch trực tiếp tại ${producer.businessName}.`,
    story: `Đăng nhanh (${voiceInputMode === 'speech_api' ? 'Giọng nói tiếng Việt' : voiceInputMode === 'simulated_voice' ? 'Giọng nói mẫu mô phỏng' : 'Nhập tay'}${descriptionSource === 'gemini_flash' ? ' · Gợi ý AI Gemini Flash' : descriptionSource === 'template_fallback' ? ' · Gợi ý mẫu cục bộ' : ''}).`,
    soldCountDemo: 999,
    listings: [
      {
        id: `lst-q-${Date.now()}`,
        platform: 'tiktok',
        shopId: 'shop_batu_lk',
        externalItemId: `TT-${sku}`,
        url: `https://shop.tiktok.com/view/product/pilot-${sku.toLowerCase()}`,
        status: 'active',
        isDemoTarget: true
      }
    ],
    imageUrl:
      imageDataUrl ||
      buildProductArtworkDataUri({
        title: cleanTitle,
        area: producer.area,
        tag: `OCOP ${producer.ocopStars}★ · ${sku}`
      })
  };

  const nextSeasonLogs = {
    ...state.seasonLogs,
    [resolvedBatch]: {
      batchCode: resolvedBatch,
      productSku: sku,
      productTitle: cleanTitle,
      producerName: producer.businessName,
      harvestWindow: 'Mùa vụ 11/2026 (Đăng mới)',
      harvestedAtIso: nowIso,
      harvestedAtLabel: `Đăng & thu hoạch ngày ${dateLabelVn}`,
      verifiedByYouth: 'Đoàn viên hỗ trợ vườn Ba Tư đồng kiểm (mẫu)',
      milestones: [
        {
          stage: 'Chăm sóc tại vườn',
          date: '18/09/2026',
          location: producer.area,
          detail: 'Chăm sóc theo quy trình sạch tại vườn Long Khánh (dữ liệu mẫu).',
          inspector: producer.ownerName
        },
        {
          stage: 'Thu hoạch & Đăng bán nhanh',
          date: dateLabelVn,
          location: producer.area,
          detail: `${cleanTitle} — đăng qua ảnh và nhận dạng giọng nói.`,
          inspector: producer.ownerName
        },
        {
          stage: 'Đóng gói chuẩn bị giao',
          date: dateLabelVn,
          location: producer.area,
          detail: `Sẵn sàng ${cleanStock} kg, gắn tem truy xuất ${resolvedBatch}.`,
          inspector: 'Sẵn sàng nhận đơn từ khách'
        }
      ]
    }
  };

  savePilotState({
    ...state,
    products: [newProduct, ...state.products],
    seasonLogs: nextSeasonLogs,
    auditLogs: [
      {
        id: `aud-${Date.now()}`,
        actorLabel: producer.ownerName,
        action: 'QUICK_PUBLISH_VOICE_PHOTO',
        targetLabel: sku,
        detail: `Đăng nhanh "${cleanTitle}" (${cleanPrice}đ/kg, ${cleanStock} kg).`,
        createdAt: nowIso
      },
      ...state.auditLogs
    ]
  });

  clearQuickPublishDraft();
  return newProduct;
}

// --- LIVESTREAM SCHEDULE (MÀN 6) ---

export function fetchLivestreamSchedule() {
  const state = loadPilotState();
  return state.livestreams || [];
}

export function addDemoLivestream({
  dateLabel,
  timeRange,
  startIso = '2026-12-06T19:30:00+07:00',
  endIso = '2026-12-06T20:30:00+07:00',
  supporterName,
  productSummary,
  channelLabel,
  note = ''
}) {
  const state = loadPilotState();
  const entry = {
    id: `live-${Date.now()}`,
    dateLabel: String(dateLabel || '').trim() || 'Chủ Nhật · 06/12/2026',
    timeRange: String(timeRange || '').trim() || '19:30 – 20:30',
    startIso,
    endIso,
    location: 'Nhà vườn Ba Tư, Ấp Bảo Vinh, TP. Long Khánh',
    supporterName: String(supporterName || '').trim() || 'Đoàn viên Minh Anh (Đoàn phường Xuân An)',
    supporterRole: 'Hỗ trợ quay trực tiếp tại vườn (Mẫu)',
    producerId: PRIMARY_FARMER_PRODUCER_ID,
    producerName: 'Nhà vườn Ba Tư (Long Khánh)',
    productSkus: ['NVBT-01', 'NVBT-02'],
    productSummary: String(productSummary || '').trim() || 'Chôm chôm & Sầu riêng Long Khánh',
    channelLabel: String(channelLabel || '').trim() || 'Khung xem thử Chợ OCOP (Minh họa)',
    status: 'upcoming',
    viewerCountDemo: 42,
    note: String(note || '').trim() || 'Lịch hỗ trợ thử nghiệm — xem trước khung giỏ hàng, không phát sóng thật.',
    sampleComments: [
      { author: 'Đoàn viên hỗ trợ', text: 'Chào bà con đến với phiên giới thiệu đặc sản Long Khánh!' }
    ]
  };
  savePilotState({
    ...state,
    livestreams: [entry, ...(state.livestreams || [])]
  });
  return entry;
}

// --- BONUS B: FARM VISIT BOOKINGS ---

export function fetchVisitRequests(producerId = 'all') {
  const state = loadPilotState();
  const all = state.visitRequests || [];
  if (!producerId || producerId === 'all') return all;
  return all.filter((v) => v.producerId === producerId);
}

export function createVisitRequest({
  producerId,
  packageName,
  visitorName,
  visitorPhone,
  visitDate,
  timeSlot,
  guestsCount = 2,
  note = ''
}) {
  const state = loadPilotState();
  const producer = state.producers.find((p) => p.id === producerId);
  if (!producer) throw new Error('Vui lòng chọn nhà vườn muốn tham quan.');
  const cleanName = String(visitorName || '').trim();
  const cleanPhone = String(visitorPhone || '').trim();
  const cleanDate = String(visitDate || '').trim();
  const cleanSlot = String(timeSlot || '').trim();
  const guests = Math.round(Number(guestsCount) || 0);

  if (cleanName.length < 2) throw new Error('Vui lòng nhập họ tên người đăng ký (tối thiểu 2 ký tự).');
  if (!/^[0-9+\s.-]{8,15}$/.test(cleanPhone)) throw new Error('Vui lòng nhập số điện thoại hợp lệ (8–15 chữ số).');
  if (!cleanDate) throw new Error('Vui lòng chọn ngày dự kiến ghé vườn.');
  if (!cleanSlot) throw new Error('Vui lòng chọn khung giờ tham quan.');
  if (guests < 1 || guests > 30) throw new Error('Số lượng khách tham quan cần từ 1 đến 30 người.');

  const entry = {
    id: `vis-${Date.now()}`,
    producerId: producer.id,
    producerName: producer.businessName,
    packageName: String(packageName || producer.visitPackages?.[0]?.name || 'Tham quan nhà vườn').trim(),
    visitorName: cleanName,
    visitorPhone: cleanPhone,
    visitDate: cleanDate,
    timeSlot: cleanSlot,
    guestsCount: guests,
    note: String(note || '').trim(),
    status: 'requested',
    createdAt: new Date().toISOString()
  };

  savePilotState({
    ...state,
    visitRequests: [entry, ...(state.visitRequests || [])],
    auditLogs: [
      {
        id: `aud-${Date.now()}`,
        actorLabel: cleanName,
        action: 'FARM_VISIT_REQUESTED',
        targetLabel: producer.businessName,
        detail: `Đăng ký ${guests} khách (${cleanDate} · ${cleanSlot}) — không thu cọc online.`,
        createdAt: entry.createdAt
      },
      ...state.auditLogs
    ]
  });

  return entry;
}

// --- BONUS C: YOUTH VOLUNTEER HOURS & FARMER APPROVAL ---

export function fetchVolunteerLogs({ producerId = 'all', memberId = 'all' } = {}) {
  const state = loadPilotState();
  return (state.volunteerLogs || []).filter((row) => {
    if (producerId && producerId !== 'all' && row.producerId !== producerId) return false;
    if (memberId && memberId !== 'all' && row.memberId !== memberId) return false;
    return true;
  });
}

export function getVolunteerTotals(logs = fetchVolunteerLogs()) {
  return DEMO_YOUTH_MEMBERS.map((member) => {
    const memberLogs = logs.filter((l) => l.memberId === member.id);
    const approvedHours = memberLogs
      .filter((l) => l.status === 'approved')
      .reduce((sum, l) => sum + Number(l.hours || 0), 0);
    const pendingHours = memberLogs
      .filter((l) => l.status === 'pending')
      .reduce((sum, l) => sum + Number(l.hours || 0), 0);
    const rejectedCount = memberLogs.filter((l) => l.status === 'rejected').length;
    return {
      ...member,
      approvedHours: Math.round(approvedHours * 10) / 10,
      pendingHours: Math.round(pendingHours * 10) / 10,
      rejectedCount,
      totalEntries: memberLogs.length
    };
  });
}

export function addVolunteerLog({
  memberId,
  producerId = PRIMARY_FARMER_PRODUCER_ID,
  activityDate,
  taskTitle,
  hours,
  note = ''
}) {
  const state = loadPilotState();
  const member = DEMO_YOUTH_MEMBERS.find((m) => m.id === memberId) || DEMO_YOUTH_MEMBERS[0];
  const producer = state.producers.find((p) => p.id === producerId) || state.producers[0];
  const cleanTask = String(taskTitle || '').trim();
  const cleanHours = Math.round(Number(hours) * 10) / 10;

  if (cleanTask.length < 4) {
    throw new Error('Vui lòng mô tả công việc hỗ trợ tối thiểu 4 ký tự.');
  }
  if (!Number.isFinite(cleanHours) || cleanHours < 0.5 || cleanHours > 12) {
    throw new Error('Số giờ tình nguyện phải nằm trong khoảng 0,5 đến 12 giờ.');
  }
  if (!activityDate) {
    throw new Error('Vui lòng chọn ngày thực hiện hỗ trợ.');
  }

  const entry = {
    id: `vol-${Date.now()}`,
    memberId: member.id,
    memberCode: member.code,
    memberName: member.name,
    memberUnit: member.unit,
    producerId: producer.id,
    producerName: producer.businessName.split('—')[0].trim(),
    activityDate: String(activityDate).trim(),
    taskTitle: cleanTask,
    hours: cleanHours,
    note: String(note || '').trim(),
    status: 'pending',
    reviewNote: '',
    reviewedAt: null,
    createdAt: new Date().toISOString()
  };

  savePilotState({
    ...state,
    volunteerLogs: [entry, ...(state.volunteerLogs || [])],
    auditLogs: [
      {
        id: `aud-${Date.now()}`,
        actorLabel: member.name,
        action: 'VOLUNTEER_LOG_SUBMITTED',
        targetLabel: `${cleanHours} giờ · ${entry.producerName}`,
        detail: cleanTask,
        createdAt: entry.createdAt
      },
      ...state.auditLogs
    ]
  });

  return entry;
}

export function reviewVolunteerLog({ logId, decision, reviewNote = '', producerId = null }) {
  if (!['approved', 'rejected'].includes(decision)) {
    throw new Error('Quyết định duyệt giờ không hợp lệ.');
  }
  const state = loadPilotState();
  const target = (state.volunteerLogs || []).find((l) => l.id === logId);
  if (!target) throw new Error('Không tìm thấy bản ghi giờ tình nguyện.');
  if (producerId && target.producerId !== producerId) {
    throw new Error('Bạn chỉ có thể duyệt giờ tình nguyện cho nhà vườn của mình.');
  }

  const nowIso = new Date().toISOString();
  const updated = {
    ...target,
    status: decision,
    reviewNote: String(reviewNote || '').trim() || (decision === 'approved' ? 'Chủ vườn đã xác nhận.' : 'Chủ vườn từ chối xác nhận.'),
    reviewedAt: nowIso
  };

  savePilotState({
    ...state,
    volunteerLogs: state.volunteerLogs.map((l) => (l.id === logId ? updated : l)),
    auditLogs: [
      {
        id: `aud-${Date.now()}`,
        actorLabel: 'Chủ vườn (Chế độ thử vai)',
        action: decision === 'approved' ? 'VOLUNTEER_LOG_APPROVED' : 'VOLUNTEER_LOG_REJECTED',
        targetLabel: `${target.memberName} (${target.hours} giờ)`,
        detail: updated.reviewNote,
        createdAt: nowIso
      },
      ...state.auditLogs
    ]
  });

  return updated;
}

// --- ONE-TAP YOUTH SUPPORT REQUESTS ---

export function fetchSupportRequests(producerId = PRIMARY_FARMER_PRODUCER_ID) {
  const state = loadPilotState();
  const all = state.supportRequests || [];
  if (!producerId || producerId === 'all') return all;
  return all.filter((r) => r.producerId === producerId);
}

export function createSupportRequest({
  producerId = PRIMARY_FARMER_PRODUCER_ID,
  topic,
  note = '',
  assignedYouth = 'Đoàn viên Minh Anh (Phường Xuân An)'
}) {
  const state = loadPilotState();
  const producer = state.producers.find((p) => p.id === producerId) || state.producers[0];
  const cleanTopic = String(topic || '').trim();
  if (cleanTopic.length < 3) {
    throw new Error('Vui lòng chọn hoặc nhập nội dung cần thanh niên hỗ trợ.');
  }
  const entry = {
    id: `sup-${Date.now()}`,
    producerId: producer.id,
    producerName: producer.businessName.split('—')[0].trim(),
    topic: cleanTopic,
    assignedYouth,
    note: String(note || '').trim(),
    status: 'open',
    createdAt: new Date().toISOString()
  };

  savePilotState({
    ...state,
    supportRequests: [entry, ...(state.supportRequests || [])],
    auditLogs: [
      {
        id: `aud-${Date.now()}`,
        actorLabel: producer.ownerName,
        action: 'FARMER_CALL_YOUTH_SUPPORT',
        targetLabel: assignedYouth,
        detail: cleanTopic,
        createdAt: entry.createdAt
      },
      ...state.auditLogs
    ]
  });

  return entry;
}

export function updateSupportRequestStatus(requestId, status) {
  const state = loadPilotState();
  const next = (state.supportRequests || []).map((r) =>
    r.id === requestId ? { ...r, status } : r
  );
  savePilotState({ ...state, supportRequests: next });
  return next.find((r) => r.id === requestId) || null;
}

// --- PUBLIC CATALOG & PRODUCERS ---

async function loadCatalogState(synced) {
  const local = loadPilotState();
  if (!synced) return local;
  try {
    const remote = await loadPublicStorefront();
    const localDrafts = local.products.filter((product) => product.id.startsWith('quick-'));
    // Preserve enriched local metadata (pickupPoint, coords, visitPackages, photos)
    const localProducerMap = new Map(local.producers.map((p) => [p.id, p]));
    const localProductMap = new Map(local.products.map((p) => [p.id, p]));
    const mergedProducers = remote.producers.map((rp) => ({
      ...(localProducerMap.get(rp.id) || {}),
      ...rp
    }));
    const mergedProducts = remote.products.map((rp) => ({
      ...(localProductMap.get(rp.id) || {}),
      ...rp,
      imageUrl: localProductMap.get(rp.id)?.imageUrl || rp.imageUrl
    }));
    return {
      ...local,
      producers: mergedProducers,
      products: [...localDrafts, ...mergedProducts]
    };
  } catch {
    return local;
  }
}

export async function fetchPublicCatalog({ q = '', category = 'all', platform = 'all', sort = 'featured', page = 1, pageSize = 8 } = {}) {
  if (hasRemoteApi()) {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (category && category !== 'all') params.set('category', category);
    if (platform && platform !== 'all') params.set('platform', platform);
    if (sort) params.set('sort', sort);
    params.set('page', String(page));
    params.set('pageSize', String(pageSize));
    const res = await apiRequest(`/products?${params.toString()}`);
    return { sourceMode: 'api', ...res };
  }

  const synced = hasStorefrontSync();
  const state = await loadCatalogState(synced);
  const qNorm = normalizeVi(q);
  const producerMap = new Map(state.producers.map((p) => [p.id, p]));

  let items = state.products.filter((p) => p.status === 'published');
  if (category && category !== 'all') {
    items = items.filter((p) => p.categoryId === category);
  }
  if (platform && platform !== 'all') {
    if (platform === 'direct_ocop') {
      items = items.filter((p) => p.status === 'published');
    } else {
      items = items.filter((p) => p.listings?.some((l) => l.platform === platform && l.status === 'active'));
    }
  }
  if (qNorm) {
    items = items.filter((p) => {
      const producer = producerMap.get(p.producerId);
      const haystack = normalizeVi(
        `${p.title} ${p.sku} ${p.area} ${p.description} ${producer?.businessName || ''} ${producer?.area || ''}`
      );
      return haystack.includes(qNorm);
    });
  }

  const enriched = items.map((p) => ({
    ...p,
    producer: producerMap.get(p.producerId) || null
  }));

  enriched.sort((a, b) => {
    if (sort === 'commission_desc') return b.commissionRateBps - a.commissionRateBps;
    if (sort === 'price_asc') return a.priceVnd - b.priceVnd;
    if (sort === 'price_desc') return b.priceVnd - a.priceVnd;
    return (b.soldCountDemo || 0) - (a.soldCountDemo || 0);
  });

  const total = enriched.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;

  return {
    sourceMode: synced ? 'api' : 'demo',
    items: enriched.slice(start, start + pageSize),
    total,
    page: safePage,
    pageSize,
    totalPages,
    producersCount: state.producers.length
  };
}

export async function fetchProductBySlug(slug) {
  if (hasRemoteApi()) {
    const product = await apiRequest(`/products/${encodeURIComponent(slug)}`);
    return { sourceMode: 'api', product };
  }
  const synced = hasStorefrontSync();
  const state = await loadCatalogState(synced);
  const product = state.products.find((p) => p.slug === slug && p.status === 'published');
  const sourceMode = synced ? 'api' : 'demo';
  if (!product) return { sourceMode, product: null };
  const producer = state.producers.find((pr) => pr.id === product.producerId) || null;
  const seasonLog = product.batchCode ? await loadSeasonLog(product.batchCode) : null;
  return {
    sourceMode,
    product: { ...product, producer, seasonLog }
  };
}

export async function fetchProducerBySlug(slug) {
  if (hasRemoteApi()) {
    const data = await apiRequest(`/producers/${encodeURIComponent(slug)}`);
    return { sourceMode: 'api', ...data };
  }
  const synced = hasStorefrontSync();
  const state = await loadCatalogState(synced);
  const sourceMode = synced ? 'api' : 'demo';
  const producer = state.producers.find((p) => p.slug === slug) || null;
  if (!producer) return { sourceMode, producer: null, products: [] };
  const products = state.products.filter((p) => p.producerId === producer.id && p.status === 'published');
  return { sourceMode, producer, products };
}

export async function submitPilotApplication(payload, { turnstileToken = '' } = {}) {
  if (hasRemoteApi()) {
    return apiRequest('/pilot-applications', {
      method: 'POST',
      body: { ...payload, turnstileToken }
    });
  }
  const state = loadPilotState();
  const entry = {
    id: `app-${Date.now()}`,
    ...payload,
    createdAt: new Date().toISOString()
  };
  const next = {
    ...state,
    pilotApplications: [entry, ...(state.pilotApplications || [])],
    auditLogs: [
      {
        id: `aud-${Date.now()}`,
        actorLabel: payload.applicantName || 'Đăng ký tham gia',
        action: 'PILOT_APPLICATION_DEMO',
        targetLabel: payload.businessName || 'Cơ sở mới',
        detail: 'Lưu yêu cầu tham gia chương trình thử nghiệm tại chế độ cục bộ.',
        createdAt: new Date().toISOString()
      },
      ...state.auditLogs
    ]
  };
  savePilotState(next);
  return entry;
}

// --- SELLER OPERATIONS ---

export async function fetchSellerProducts({ producerId, token } = {}) {
  if (hasRemoteApi()) {
    return apiRequest('/seller/products', { token });
  }
  const state = loadPilotState();
  const items = producerId ? state.products.filter((p) => p.producerId === producerId) : [];
  const producer = state.producers.find((p) => p.id === producerId) || null;
  return { items, producer };
}

export async function upsertSellerProduct({ id, producerId, payload, token } = {}) {
  if (hasRemoteApi()) {
    if (id) {
      return apiRequest(`/seller/products/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: payload,
        token
      });
    }
    return apiRequest('/seller/products', {
      method: 'POST',
      body: payload,
      token
    });
  }

  const state = loadPilotState();
  const producer = state.producers.find((p) => p.id === producerId);
  if (!producer) {
    throw new Error('Không tìm thấy quyền cơ sở OCOP cho tài khoản này.');
  }

  const normalizedListings = (payload.listings || []).map((lst, idx) => {
    const check = validateMarketplaceListingUrl(lst.url, lst.platform);
    if (!check.valid) {
      throw new Error(`Link sàn #${idx + 1}: ${check.reason}`);
    }
    return {
      id: lst.id || `lst-${Date.now()}-${idx}`,
      platform: lst.platform,
      shopId: lst.shopId || `shop_${producerId.slice(-6)}_${lst.platform}`,
      externalItemId: lst.externalItemId || `EXT-${Date.now()}`,
      url: check.url,
      status: 'active',
      isDemoTarget: true
    };
  });

  const nowIso = new Date().toISOString();
  let savedProduct;
  let nextProducts;

  if (id) {
    const existing = state.products.find((p) => p.id === id);
    if (!existing) throw new Error('Không tìm thấy sản phẩm để cập nhật.');
    if (existing.producerId !== producerId) {
      throw new Error('Từ chối truy cập: Sản phẩm thuộc cơ sở khác.');
    }
    savedProduct = {
      ...existing,
      title: payload.title.trim(),
      categoryId: payload.categoryId,
      unit: payload.unit.trim(),
      spec: payload.spec.trim(),
      priceVnd: Math.round(Number(payload.priceVnd)),
      stock: Math.round(Number(payload.stock)),
      commissionRateBps: Math.round(Number(payload.commissionRateBps)),
      description: payload.description.trim(),
      story: payload.story?.trim() || producer.story,
      imageUrl: payload.imageUrl || existing.imageUrl,
      listings: normalizedListings,
      priceUpdatedAt: nowIso
    };
    nextProducts = state.products.map((p) => (p.id === id ? savedProduct : p));
  } else {
    const baseSlug = slugifyVi(payload.title) || `san-pham-${Date.now()}`;
    const uniqueSlug = state.products.some((p) => p.slug === baseSlug) ? `${baseSlug}-${Date.now().toString().slice(-4)}` : baseSlug;
    const sku = (payload.sku || `OCOP-DN-${String(state.products.length + 1).padStart(3, '0')}`).toUpperCase();
    savedProduct = {
      id: `sku-${Date.now()}`,
      sku,
      batchCode: `LK-${String(Date.now()).slice(-4)}`,
      slug: uniqueSlug,
      producerId,
      categoryId: payload.categoryId,
      title: payload.title.trim(),
      unit: payload.unit.trim(),
      spec: payload.spec.trim(),
      area: producer.area,
      priceVnd: Math.round(Number(payload.priceVnd)),
      priceUpdatedAt: nowIso,
      stock: Math.round(Number(payload.stock)),
      commissionRateBps: Math.round(Number(payload.commissionRateBps)),
      commissionCondition: 'Áp dụng cho đơn hoàn thành trên kênh liên kết.',
      status: 'draft',
      certStatus: producer.verified ? 'verified_pilot' : 'pending_review',
      ocopStars: producer.ocopStars,
      mediaKitReady: Boolean(payload.imageUrl),
      accentHex: '#0759BA',
      secondaryHex: '#15803D',
      description: payload.description.trim(),
      story: payload.story?.trim() || producer.story,
      soldCountDemo: 0,
      listings: normalizedListings,
      imageUrl:
        payload.imageUrl ||
        buildProductArtworkDataUri({
          title: payload.title,
          area: producer.area,
          tag: `OCOP ${producer.ocopStars}★ · ${sku}`
        })
    };
    nextProducts = [savedProduct, ...state.products];
  }

  savePilotState({
    ...state,
    products: nextProducts,
    auditLogs: [
      {
        id: `aud-${Date.now()}`,
        actorLabel: producer.ownerName,
        action: id ? 'SELLER_UPDATE_PRODUCT' : 'SELLER_CREATE_DRAFT',
        targetLabel: savedProduct.sku,
        detail: `${id ? 'Cập nhật' : 'Tạo bản nháp'} "${savedProduct.title}".`,
        createdAt: nowIso
      },
      ...state.auditLogs
    ]
  });

  return savedProduct;
}

export async function submitSellerProductForReview({ id, producerId, token } = {}) {
  if (hasRemoteApi()) {
    return apiRequest(`/seller/products/${encodeURIComponent(id)}/submit`, {
      method: 'POST',
      token
    });
  }
  const state = loadPilotState();
  const target = state.products.find((p) => p.id === id);
  if (!target) throw new Error('Không tìm thấy sản phẩm.');
  if (target.producerId !== producerId) {
    throw new Error('Từ chối truy cập: Không thể gửi duyệt sản phẩm của cơ sở khác.');
  }
  if (!target.listings || target.listings.length === 0) {
    throw new Error('Cần gắn ít nhất 1 liên kết kênh trước khi gửi duyệt.');
  }
  const updated = { ...target, status: 'pending_review', reviewNote: '' };
  savePilotState({
    ...state,
    products: state.products.map((p) => (p.id === id ? updated : p)),
    auditLogs: [
      {
        id: `aud-${Date.now()}`,
        actorLabel: 'Chủ cơ sở (Chế độ thử vai)',
        action: 'SELLER_SUBMIT_REVIEW',
        targetLabel: target.sku,
        detail: `Gửi duyệt công bố "${target.title}".`,
        createdAt: new Date().toISOString()
      },
      ...state.auditLogs
    ]
  });
  return updated;
}

export async function fetchSellerOrders({ producerId, token } = {}) {
  if (hasRemoteApi()) {
    return apiRequest('/seller/orders', { token });
  }
  if (hasStorefrontSync() && token) return fetchStorefrontOrders({ producerId, token });
  const state = loadPilotState();
  return state.orders.filter((o) => o.producerId === producerId);
}

export async function updateSellerOrderStatus({ orderId, producerId, nextStatus, token }) {
  if (hasStorefrontSync() && token) return updateStorefrontOrderStatus({ orderId, producerId, nextStatus, token });
  const state = loadPilotState();
  const target = state.orders.find((o) => o.id === orderId);
  if (!target) throw new Error('Không tìm thấy đơn hàng.');
  if (producerId && target.producerId !== producerId) {
    throw new Error('Không thể xử lý đơn của nhà vườn khác.');
  }

  const nowIso = new Date().toISOString();
  const addedLedger = [];

  if (target.affiliateId && target.commissionVnd > 0) {
    const existingForOrder = state.ledger.filter(
      (l) => l.orderId === target.id && l.accountType === 'affiliate_payable'
    );
    const pendingAmount = existingForOrder
      .filter((l) => l.state === 'pending')
      .reduce((acc, r) => acc + (r.direction === 'credit' ? r.amountVnd : -r.amountVnd), 0);
    const netCredited = existingForOrder.reduce(
      (acc, r) => acc + (r.direction === 'credit' ? r.amountVnd : -r.amountVnd),
      0
    );

    if (nextStatus === 'completed' && pendingAmount > 0) {
      const txGroupId = `tx-rel-${Date.now()}`;
      const note = `Nhà vườn hoàn thành đơn ${target.orderCode || target.externalOrderId} — mở khóa hoa hồng mẫu`;
      addedLedger.push(
        {
          id: `ldg-rel-1-${Date.now()}`,
          txGroupId,
          orderId: target.id,
          affiliateId: target.affiliateId,
          affiliateCode: target.affiliateCode || '',
          accountType: 'affiliate_payable',
          direction: 'debit',
          amountVnd: pendingAmount,
          state: 'pending',
          note,
          createdAt: nowIso
        },
        {
          id: `ldg-rel-2-${Date.now()}`,
          txGroupId,
          orderId: target.id,
          affiliateId: target.affiliateId,
          affiliateCode: target.affiliateCode || '',
          accountType: 'affiliate_payable',
          direction: 'credit',
          amountVnd: pendingAmount,
          state: 'available',
          note,
          createdAt: nowIso
        }
      );
    } else if ((nextStatus === 'cancelled' || nextStatus === 'refunded') && netCredited > 0) {
      const txGroupId = `tx-rev-${Date.now()}`;
      const note = `Bút toán đảo do hủy đơn ${target.orderCode || target.externalOrderId}`;
      addedLedger.push(
        {
          id: `ldg-rev-d-${Date.now()}`,
          txGroupId,
          orderId: target.id,
          affiliateId: target.affiliateId,
          affiliateCode: target.affiliateCode || '',
          accountType: 'affiliate_payable',
          direction: 'debit',
          amountVnd: netCredited,
          state: 'clawed_back',
          note,
          createdAt: nowIso
        },
        {
          id: `ldg-rev-c-${Date.now()}`,
          txGroupId,
          orderId: target.id,
          affiliateId: target.affiliateId,
          affiliateCode: target.affiliateCode || '',
          accountType: 'platform_escrow',
          direction: 'credit',
          amountVnd: netCredited,
          state: 'clawed_back',
          note,
          createdAt: nowIso
        }
      );
    }
  }

  const updated = { ...target, status: nextStatus, updatedAt: nowIso };
  savePilotState({
    ...state,
    orders: state.orders.map((o) => (o.id === orderId ? updated : o)),
    ledger: [...addedLedger, ...state.ledger],
    auditLogs: [
      {
        id: `aud-${Date.now()}`,
        actorLabel: 'Nhà vườn (Chế độ thử vai)',
        action: 'SELLER_UPDATE_ORDER_STATUS',
        targetLabel: target.orderCode || target.externalOrderId,
        detail: `Cập nhật trạng thái xử lý đơn → ${nextStatus}.`,
        createdAt: nowIso
      },
      ...state.auditLogs
    ]
  });
  return updated;
}

// --- YOUTH REFERRAL OPERATIONS (ĐOÀN VIÊN GIỚI THIỆU) ---

export async function fetchAffiliateLinks({ affiliateId, token } = {}) {
  if (hasRemoteApi()) {
    return apiRequest('/affiliate/links', { token });
  }
  const state = loadPilotState();
  const productMap = new Map(state.products.map((p) => [p.id, p]));
  return state.affiliateLinks
    .filter((l) => l.affiliateId === affiliateId)
    .map((l) => ({
      ...l,
      product: productMap.get(l.productId) || null
    }));
}

export async function createAffiliateLink({ affiliateId, affiliateName, productId, platform = 'direct_ocop', token } = {}) {
  if (hasRemoteApi()) {
    return apiRequest('/affiliate/links', {
      method: 'POST',
      body: { productId, platform },
      token
    });
  }
  if (!affiliateId) {
    throw new Error('Vui lòng chọn vai trò Đoàn viên hỗ trợ để tạo link giới thiệu cá nhân.');
  }
  const state = loadPilotState();
  const product = state.products.find((p) => p.id === productId && p.status === 'published');
  if (!product) {
    throw new Error('Chỉ có thể tạo link cho sản phẩm đã công bố.');
  }

  let resolvedPlatform = platform || 'direct_ocop';
  let resolvedUrl = '';
  let isDemoTarget = true;

  if (resolvedPlatform === 'direct_ocop') {
    const fallbackListing = product.listings?.[0];
    resolvedUrl = fallbackListing?.url || `https://shopee.vn/san-pham-ocop-${product.slug}`;
  } else {
    const listing =
      product.listings?.find((l) => l.platform === resolvedPlatform && l.status === 'active') || product.listings?.[0];
    if (!listing) {
      throw new Error('Sản phẩm này chưa có đường dẫn kênh đối tác hợp lệ.');
    }
    const urlCheck = validateMarketplaceListingUrl(listing.url, listing.platform);
    if (!urlCheck.valid) {
      throw new Error(`Link đích chưa hợp lệ: ${urlCheck.reason}`);
    }
    resolvedPlatform = listing.platform;
    resolvedUrl = urlCheck.url;
    isDemoTarget = Boolean(listing.isDemoTarget);
  }

  let code = generateAffiliateCode(10);
  while (state.affiliateLinks.some((l) => l.code === code)) {
    code = generateAffiliateCode(10);
  }

  const created = {
    id: `aff-link-${Date.now()}`,
    code,
    affiliateId,
    affiliateName: affiliateName || 'Đoàn viên hỗ trợ (Mẫu)',
    productId: product.id,
    platform: resolvedPlatform,
    targetUrl: resolvedUrl,
    isDemoTarget,
    active: true,
    clicksCount: 0,
    createdAt: new Date().toISOString()
  };

  savePilotState({
    ...state,
    affiliateLinks: [created, ...state.affiliateLinks],
    auditLogs: [
      {
        id: `aud-${Date.now()}`,
        actorLabel: created.affiliateName,
        action: 'AFFILIATE_CREATE_LINK',
        targetLabel: `${product.sku} (${resolvedPlatform})`,
        detail: `Tạo link giới thiệu mã ${code}.`,
        createdAt: created.createdAt
      },
      ...state.auditLogs
    ]
  });

  return { ...created, product };
}

export async function deactivateAffiliateLink({ id, affiliateId, token } = {}) {
  if (hasRemoteApi()) {
    return apiRequest(`/affiliate/links/${encodeURIComponent(id)}/deactivate`, {
      method: 'PATCH',
      token
    });
  }
  const state = loadPilotState();
  const target = state.affiliateLinks.find((l) => l.id === id);
  if (!target) throw new Error('Không tìm thấy liên kết.');
  if (target.affiliateId !== affiliateId) {
    throw new Error('Từ chối truy cập: Không thể khóa liên kết của đoàn viên khác.');
  }
  const updated = { ...target, active: false };
  savePilotState({
    ...state,
    affiliateLinks: state.affiliateLinks.map((l) => (l.id === id ? updated : l))
  });
  return updated;
}

export async function lookupRedirectCode(code) {
  if (hasRemoteApi()) {
    return apiRequest(`/redirects/${encodeURIComponent(code)}`);
  }
  const state = loadPilotState();
  const link = state.affiliateLinks.find((l) => l.code === code);
  if (!link) return null;
  const product = state.products.find((p) => p.id === link.productId && p.status === 'published') || null;
  const producer = product ? state.producers.find((pr) => pr.id === product.producerId) || null : null;
  return {
    id: link.id,
    code: link.code,
    active: link.active,
    platform: link.platform,
    affiliateId: link.affiliateId,
    affiliateName: link.affiliateName,
    isDemoTarget: Boolean(link.isDemoTarget),
    clicksCount: link.clicksCount,
    product: product ? { ...product, producer } : null
  };
}

export async function recordDirectReferralVisit(code) {
  const state = loadPilotState();
  const link = state.affiliateLinks.find((l) => l.code === code);
  if (!link) throw new Error('Không tìm thấy mã liên kết giới thiệu.');
  if (!link.active) throw new Error('Liên kết giới thiệu này đã bị tạm khóa.');
  const product = state.products.find((p) => p.id === link.productId && p.status === 'published');
  if (!product) throw new Error('Sản phẩm của liên kết này hiện không còn khả dụng.');

  const updated = { ...link, clicksCount: (link.clicksCount || 0) + 1 };
  savePilotState({
    ...state,
    affiliateLinks: state.affiliateLinks.map((l) => (l.id === link.id ? updated : l))
  });

  const referral = setActiveReferral({
    code: link.code,
    affiliateLinkId: link.id,
    affiliateId: link.affiliateId,
    affiliateName: link.affiliateName,
    productId: product.id,
    productTitle: product.title
  });

  return {
    referral,
    product,
    clicksCount: updated.clicksCount
  };
}

export async function recordIntentionalVisit(code) {
  if (hasRemoteApi()) {
    return apiRequest(`/redirects/${encodeURIComponent(code)}/visit`, { method: 'POST', body: {} });
  }
  const state = loadPilotState();
  const link = state.affiliateLinks.find((l) => l.code === code);
  if (!link) throw new Error('Không tìm thấy mã liên kết chia sẻ.');
  if (!link.active) throw new Error('Liên kết chia sẻ này đã bị chủ sở hữu vô hiệu hóa.');
  const check = validateMarketplaceListingUrl(link.targetUrl, link.platform === 'direct_ocop' ? undefined : link.platform);
  if (!check.valid) throw new Error('URL đích không đạt kiểm tra an toàn tên miền sàn.');

  const updated = { ...link, clicksCount: (link.clicksCount || 0) + 1 };
  savePilotState({
    ...state,
    affiliateLinks: state.affiliateLinks.map((l) => (l.id === link.id ? updated : l))
  });

  return {
    targetUrl: check.url,
    platform: link.platform,
    clicksCount: updated.clicksCount
  };
}

export async function fetchAffiliateCommission({ affiliateId, token } = {}) {
  if (hasRemoteApi()) {
    return apiRequest('/affiliate/commission', { token });
  }
  const state = loadPilotState();
  const entries = state.ledger.filter((e) => e.affiliateId === affiliateId && e.accountType === 'affiliate_payable');
  const ordersMap = new Map(state.orders.map((o) => [o.id, o]));
  const attributedOrders = state.orders.filter((o) => o.affiliateId === affiliateId);

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
    orders: attributedOrders,
    entries: entries.map((e) => ({
      ...e,
      order: ordersMap.get(e.orderId) || null
    }))
  };
}

// --- OPS & IMPORT / RECONCILIATION ---

export async function reviewProductOps({ productId, decision, note = '', token } = {}) {
  if (hasRemoteApi()) {
    return apiRequest(`/ops/products/${encodeURIComponent(productId)}/review`, {
      method: 'POST',
      body: { decision, note },
      token
    });
  }
  const state = loadPilotState();
  const product = state.products.find((p) => p.id === productId);
  if (!product) throw new Error('Không tìm thấy sản phẩm cần duyệt.');
  const nextStatus = decision === 'approve' ? 'published' : 'needs_revision';
  const updated = {
    ...product,
    status: nextStatus,
    certStatus: decision === 'approve' ? 'verified_pilot' : product.certStatus,
    reviewNote: note.trim()
  };
  savePilotState({
    ...state,
    products: state.products.map((p) => (p.id === productId ? updated : p)),
    auditLogs: [
      {
        id: `aud-${Date.now()}`,
        actorLabel: 'Điều phối (Chế độ thử vai)',
        action: decision === 'approve' ? 'OPS_APPROVE_PRODUCT' : 'OPS_REQUEST_REVISION',
        targetLabel: product.sku,
        detail: decision === 'approve' ? `Duyệt công bố "${product.title}".` : `Yêu cầu sửa "${product.title}": ${note}`,
        createdAt: new Date().toISOString()
      },
      ...state.auditLogs
    ]
  });
  return updated;
}

export async function commitOrderImportRows({ rows, producerScopeId = null, token } = {}) {
  if (hasRemoteApi()) {
    const preview = await apiRequest('/ops/imports/preview', {
      method: 'POST',
      body: { rows },
      token
    });
    return apiRequest(`/ops/imports/${encodeURIComponent(preview.batchId)}/commit`, {
      method: 'POST',
      body: {},
      token
    });
  }

  const state = loadPilotState();
  const existingKeys = new Set(
    state.orders.map((o) => `${o.platform}::${o.shopId}::${o.externalOrderId}`)
  );
  const productBySku = new Map(state.products.map((p) => [p.sku.toUpperCase(), p]));
  const linkByCode = new Map(state.affiliateLinks.map((l) => [l.code, l]));

  let insertedCount = 0;
  let duplicateCount = 0;
  const rejected = [];
  const newOrders = [];
  const newLedgerRows = [];

  rows.forEach((row) => {
    const key = `${row.platform}::${row.shopId}::${row.externalOrderId}`;
    if (existingKeys.has(key)) {
      duplicateCount += 1;
      return;
    }
    const product = productBySku.get(row.sku.toUpperCase());
    if (!product) {
      rejected.push({ line: row.line, reason: `Không tìm thấy SKU "${row.sku}" trong hệ thống.` });
      return;
    }
    if (producerScopeId && product.producerId !== producerScopeId) {
      rejected.push({ line: row.line, reason: `SKU "${row.sku}" không thuộc quyền cơ sở của bạn.` });
      return;
    }

    existingKeys.add(key);
    const link = row.affiliateCode ? linkByCode.get(row.affiliateCode) : null;
    const commissionVnd = link ? calculateCommissionVnd(row.netAmountVnd, product.commissionRateBps) : 0;
    const orderId = `ord-imp-${Date.now()}-${insertedCount}`;
    const ledgerState = row.status === 'completed' ? 'available' : row.status === 'refunded' || row.status === 'cancelled' ? 'clawed_back' : 'pending';

    newOrders.push({
      id: orderId,
      orderCode: row.externalOrderId,
      platform: row.platform,
      shopId: row.shopId,
      externalOrderId: row.externalOrderId,
      producerId: product.producerId,
      productId: product.id,
      sku: product.sku,
      productTitle: product.title,
      quantity: row.quantity,
      grossAmountVnd: row.grossAmountVnd,
      netAmountVnd: row.netAmountVnd,
      commissionRateBps: product.commissionRateBps,
      commissionVnd,
      affiliateCode: link ? link.code : '',
      affiliateLinkId: link ? link.id : null,
      affiliateId: link ? link.affiliateId : null,
      affiliateName: link ? link.affiliateName : 'Chưa gán (thiếu mã giới thiệu hợp lệ)',
      attributionStatus: link ? 'attributed' : 'unassigned',
      status: row.status,
      source: 'csv_import',
      orderedAt: row.orderedAt || new Date().toISOString()
    });

    if (link && commissionVnd > 0 && row.status !== 'cancelled' && row.status !== 'refunded') {
      const txGroupId = `tx-${orderId}`;
      const note = `Import CSV đơn ${row.externalOrderId} (${row.platform})`;
      const ts = new Date().toISOString();
      newLedgerRows.push(
        {
          id: `ldg-d-${orderId}`,
          txGroupId,
          orderId,
          affiliateId: link.affiliateId,
          affiliateCode: link.code,
          accountType: 'platform_escrow',
          direction: 'debit',
          amountVnd: commissionVnd,
          state: ledgerState,
          note,
          createdAt: ts
        },
        {
          id: `ldg-c-${orderId}`,
          txGroupId,
          orderId,
          affiliateId: link.affiliateId,
          affiliateCode: link.code,
          accountType: 'affiliate_payable',
          direction: 'credit',
          amountVnd: commissionVnd,
          state: ledgerState,
          note,
          createdAt: ts
        }
      );
    }

    insertedCount += 1;
  });

  savePilotState({
    ...state,
    orders: [...newOrders, ...state.orders],
    ledger: [...newLedgerRows, ...state.ledger],
    auditLogs: [
      {
        id: `aud-${Date.now()}`,
        actorLabel: producerScopeId ? 'Chủ cơ sở (Chế độ thử vai)' : 'Điều phối (Chế độ thử vai)',
        action: 'IMPORT_ORDERS_CSV',
        targetLabel: `${insertedCount} đơn mới / ${duplicateCount} trùng`,
        detail: `Chống trùng theo platform + shop_id + external_order_id.`,
        createdAt: new Date().toISOString()
      },
      ...state.auditLogs
    ]
  });

  return { insertedCount, duplicateCount, rejected };
}

export async function reconcileOrderOps({ orderId, nextStatus, reason = '', token } = {}) {
  if (hasRemoteApi()) {
    return apiRequest('/ops/reconciliations', {
      method: 'POST',
      body: { orderId, nextStatus, reason },
      token
    });
  }
  const state = loadPilotState();
  const order = state.orders.find((o) => o.id === orderId);
  if (!order) throw new Error('Không tìm thấy đơn hàng.');

  const allowedTransitions = {
    placed: ['confirmed', 'completed', 'cancelled'],
    confirmed: ['completed', 'cancelled', 'refunded'],
    completed: ['refunded'],
    cancelled: [],
    refunded: []
  };
  if (!allowedTransitions[order.status]?.includes(nextStatus)) {
    throw new Error(`Không thể chuyển trạng thái từ "${order.status}" sang "${nextStatus}".`);
  }

  const ts = new Date().toISOString();
  const addedLedger = [];
  const existingForOrder = state.ledger.filter((l) => l.orderId === order.id && l.accountType === 'affiliate_payable');
  const netCredited = existingForOrder.reduce((acc, r) => acc + (r.direction === 'credit' ? r.amountVnd : -r.amountVnd), 0);

  if ((nextStatus === 'refunded' || nextStatus === 'cancelled') && netCredited > 0 && order.affiliateId) {
    const txGroupId = `tx-rev-${Date.now()}`;
    const note = `Bút toán đảo hoàn/hủy đơn ${order.externalOrderId}: ${reason || 'Hoàn trả đơn'}`;
    addedLedger.push(
      {
        id: `ldg-rev-d-${Date.now()}`,
        txGroupId,
        orderId: order.id,
        affiliateId: order.affiliateId,
        affiliateCode: order.affiliateCode || '',
        accountType: 'affiliate_payable',
        direction: 'debit',
        amountVnd: netCredited,
        state: 'clawed_back',
        note,
        createdAt: ts
      },
      {
        id: `ldg-rev-c-${Date.now()}`,
        txGroupId,
        orderId: order.id,
        affiliateId: order.affiliateId,
        affiliateCode: order.affiliateCode || '',
        accountType: 'platform_escrow',
        direction: 'credit',
        amountVnd: netCredited,
        state: 'clawed_back',
        note,
        createdAt: ts
      }
    );
  } else if (nextStatus === 'completed' && order.affiliateId && order.commissionVnd > 0) {
    if (netCredited === 0) {
      const txGroupId = `tx-avail-${Date.now()}`;
      const note = `Chốt hoàn thành đơn ${order.externalOrderId}`;
      addedLedger.push(
        {
          id: `ldg-avail-d-${Date.now()}`,
          txGroupId,
          orderId: order.id,
          affiliateId: order.affiliateId,
          affiliateCode: order.affiliateCode || '',
          accountType: 'platform_escrow',
          direction: 'debit',
          amountVnd: order.commissionVnd,
          state: 'available',
          note,
          createdAt: ts
        },
        {
          id: `ldg-avail-c-${Date.now()}`,
          txGroupId,
          orderId: order.id,
          affiliateId: order.affiliateId,
          affiliateCode: order.affiliateCode || '',
          accountType: 'affiliate_payable',
          direction: 'credit',
          amountVnd: order.commissionVnd,
          state: 'available',
          note,
          createdAt: ts
        }
      );
    } else {
      const pendingAmount = existingForOrder
        .filter((l) => l.state === 'pending')
        .reduce((acc, r) => acc + (r.direction === 'credit' ? r.amountVnd : -r.amountVnd), 0);
      if (pendingAmount > 0) {
        const txGroupId = `tx-rel-${Date.now()}`;
        const note = `Giải phóng hoa hồng khả dụng đơn ${order.externalOrderId}`;
        addedLedger.push(
          {
            id: `ldg-rel-1-${Date.now()}`,
            txGroupId,
            orderId: order.id,
            affiliateId: order.affiliateId,
            affiliateCode: order.affiliateCode || '',
            accountType: 'affiliate_payable',
            direction: 'debit',
            amountVnd: pendingAmount,
            state: 'pending',
            note,
            createdAt: ts
          },
          {
            id: `ldg-rel-2-${Date.now()}`,
            txGroupId,
            orderId: order.id,
            affiliateId: order.affiliateId,
            affiliateCode: order.affiliateCode || '',
            accountType: 'affiliate_payable',
            direction: 'credit',
            amountVnd: pendingAmount,
            state: 'available',
            note,
            createdAt: ts
          }
        );
      }
    }
  }

  const updatedOrder = { ...order, status: nextStatus };
  savePilotState({
    ...state,
    orders: state.orders.map((o) => (o.id === order.id ? updatedOrder : o)),
    ledger: [...addedLedger, ...state.ledger],
    auditLogs: [
      {
        id: `aud-${Date.now()}`,
        actorLabel: 'Điều phối (Chế độ thử vai)',
        action: `ORDER_STATUS_${nextStatus.toUpperCase()}`,
        targetLabel: order.externalOrderId,
        detail: reason || `Cập nhật trạng thái đơn từ ${order.status} → ${nextStatus}.`,
        createdAt: ts
      },
      ...state.auditLogs
    ]
  });

  return updatedOrder;
}

export async function fetchOpsDashboard({ platform = 'all', token } = {}) {
  if (hasRemoteApi()) {
    const query = platform && platform !== 'all' ? `?platform=${encodeURIComponent(platform)}` : '';
    return apiRequest(`/ops/metrics${query}`, { token });
  }

  const state = loadPilotState();
  const ordersFiltered =
    platform && platform !== 'all' ? state.orders.filter((o) => o.platform === platform) : state.orders;
  const linksFiltered =
    platform && platform !== 'all'
      ? state.affiliateLinks.filter((l) => l.platform === platform)
      : state.affiliateLinks;

  const grossRevenueVnd = ordersFiltered
    .filter((o) => o.status !== 'cancelled' && o.status !== 'refunded')
    .reduce((sum, o) => sum + o.grossAmountVnd, 0);
  const totalClicks = linksFiltered.reduce((sum, l) => sum + (l.clicksCount || 0), 0);

  const payableRows = state.ledger.filter((l) => l.accountType === 'affiliate_payable');
  const totalCommissionAvailable = payableRows
    .filter((l) => l.state === 'available')
    .reduce((sum, r) => sum + (r.direction === 'credit' ? r.amountVnd : -r.amountVnd), 0);
  const totalCommissionPending = payableRows
    .filter((l) => l.state === 'pending')
    .reduce((sum, r) => sum + (r.direction === 'credit' ? r.amountVnd : -r.amountVnd), 0);

  const productStatsMap = new Map();
  for (const ord of ordersFiltered) {
    if (ord.status === 'cancelled' || ord.status === 'refunded') continue;
    const prev = productStatsMap.get(ord.sku) || {
      sku: ord.sku,
      title: ord.productTitle,
      orders: 0,
      revenueVnd: 0
    };
    prev.orders += 1;
    prev.revenueVnd += ord.grossAmountVnd;
    productStatsMap.set(ord.sku, prev);
  }

  const affiliateStatsMap = new Map();
  for (const ord of ordersFiltered) {
    if (!ord.affiliateId || ord.status === 'cancelled' || ord.status === 'refunded') continue;
    const prev = affiliateStatsMap.get(ord.affiliateId) || {
      affiliateId: ord.affiliateId,
      affiliateName: ord.affiliateName,
      orders: 0,
      commissionVnd: 0,
      revenueVnd: 0
    };
    prev.orders += 1;
    prev.revenueVnd += ord.grossAmountVnd;
    prev.commissionVnd += ord.commissionVnd;
    affiliateStatsMap.set(ord.affiliateId, prev);
  }

  return {
    metrics: {
      producersCount: state.producers.length,
      publishedProductsCount: state.products.filter((p) => p.status === 'published').length,
      pendingProductsCount: state.products.filter((p) => p.status === 'pending_review').length,
      totalClicks,
      ordersCount: ordersFiltered.length,
      grossRevenueVnd,
      commissionAvailableVnd: Math.max(0, totalCommissionAvailable),
      commissionPendingVnd: Math.max(0, totalCommissionPending)
    },
    topProducts: Array.from(productStatsMap.values()).sort((a, b) => b.revenueVnd - a.revenueVnd).slice(0, 5),
    topAffiliates: Array.from(affiliateStatsMap.values()).sort((a, b) => b.commissionVnd - a.commissionVnd).slice(0, 5),
    products: state.products,
    orders: ordersFiltered,
    ledger: state.ledger,
    auditLogs: state.auditLogs
  };
}
