import {
  INITIAL_AFFILIATE_LINKS,
  INITIAL_AUDIT_LOGS,
  INITIAL_LEDGER,
  INITIAL_LIVESTREAM_SCHEDULE,
  INITIAL_ORDERS,
  INITIAL_PRODUCERS,
  INITIAL_PRODUCTS,
  INITIAL_SEASON_LOGS,
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

const STORE_KEY = 'ocop_de3_pilot_state_v2';
const CART_KEY = 'ocop_de3_cart_v1';
const STATE_VERSION = 2;

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
    Array.isArray(data.livestreams)
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
  return initial;
}

export function hasRemoteApi() {
  return Boolean(getApiBaseUrl());
}

export function getStaticReferenceData() {
  return {
    categories: PRODUCT_CATEGORIES,
    videoTemplates: VIDEO_TEMPLATES,
    roadmap: PILOT_ROADMAP_90_DAYS
  };
}

// --- CART & CHECKOUT (MÀN 4 & LUỒNG XUYÊN SUỐT MÀN 3 -> 4 -> 5) ---

export function loadCart() {
  return loadJson(CART_KEY, [], (arr) => Array.isArray(arr));
}

export function saveCart(items) {
  saveJson(CART_KEY, items);
  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    window.dispatchEvent(new CustomEvent('ocop-cart-updated', { detail: { count: items.reduce((s, i) => s + i.quantity, 0) } }));
  }
  return items;
}

export function addToCart(product, quantity = 1) {
  if (!product?.id) throw new Error('Thiếu thông tin sản phẩm.');
  const qty = Math.max(1, Math.min(99, Math.round(Number(quantity) || 1)));
  const current = loadCart();
  const idx = current.findIndex((i) => i.productId === product.id);
  let next;
  if (idx >= 0) {
    next = current.map((item, i) =>
      i === idx ? { ...item, quantity: Math.min(99, item.quantity + qty) } : item
    );
  } else {
    next = [
      ...current,
      {
        productId: product.id,
        producerId: product.producerId,
        sku: product.sku,
        slug: product.slug,
        title: product.title,
        unit: product.unit,
        priceVnd: product.priceVnd,
        imageUrl: product.imageUrl,
        batchCode: product.batchCode || '',
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

export function placeCartOrder({ customerName, customerPhone, deliveryMethod, shippingAddress, note = '' }) {
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
  if (deliveryMethod === 'delivery' && cleanAddr.length < 6) {
    throw new Error('Vui lòng nhập địa chỉ giao hàng cụ thể khi chọn Giao tận nơi.');
  }

  const state = loadPilotState();
  const subtotalVnd = cart.reduce((sum, item) => sum + item.priceVnd * item.quantity, 0);
  const shippingFeeVnd = deliveryMethod === 'pickup' ? 0 : 25000;
  const grossAmountVnd = subtotalVnd + shippingFeeVnd;
  const orderCode = `DON-LK-${String(Date.now()).slice(-6)}`;
  const primaryItem = cart[0];
  const targetProducerId = primaryItem.producerId || PRIMARY_FARMER_PRODUCER_ID;
  const totalQty = cart.reduce((sum, i) => sum + i.quantity, 0);

  const createdOrder = {
    id: `ord-cart-${Date.now()}`,
    orderCode,
    platform: 'direct_ocop',
    shopId: 'vuon_ba_tu',
    externalOrderId: orderCode,
    producerId: targetProducerId,
    productId: primaryItem.productId,
    sku: primaryItem.sku,
    productTitle:
      cart.length === 1
        ? primaryItem.title
        : `${primaryItem.title} (+${cart.length - 1} món khác)`,
    quantity: totalQty,
    items: cart.map((i) => ({
      productId: i.productId,
      sku: i.sku,
      title: i.title,
      quantity: i.quantity,
      unitPriceVnd: i.priceVnd
    })),
    deliveryMethod,
    deliveryLabel:
      deliveryMethod === 'pickup'
        ? 'Nhận trực tiếp tại Nhà vườn Ba Tư (Long Khánh)'
        : `Giao tận nơi: ${cleanAddr}`,
    customerName: cleanName,
    customerPhone: cleanPhone,
    shippingAddress:
      deliveryMethod === 'pickup' ? 'Cổng Nhà vườn Ba Tư, Ấp Bảo Vinh, Long Khánh' : cleanAddr,
    note: String(note || '').trim(),
    shippingFeeVnd,
    grossAmountVnd,
    netAmountVnd: subtotalVnd,
    commissionRateBps: 1000,
    commissionVnd: 0,
    affiliateLinkId: null,
    affiliateId: null,
    affiliateName: 'Đặt trực tiếp từ Chợ OCOP (Dữ liệu mẫu)',
    attributionStatus: 'unassigned',
    status: 'placed',
    source: 'cart_demo',
    orderedAt: new Date().toISOString()
  };

  savePilotState({
    ...state,
    orders: [createdOrder, ...state.orders],
    auditLogs: [
      {
        id: `aud-${Date.now()}`,
        actorLabel: cleanName,
        action: 'CART_ORDER_CREATED',
        targetLabel: orderCode,
        detail: `Đặt đơn mẫu (${createdOrder.deliveryLabel}) trị giá ${grossAmountVnd}đ.`,
        createdAt: createdOrder.orderedAt
      },
      ...state.auditLogs
    ]
  });

  clearCart();
  return createdOrder;
}

// --- SEASON LOGS (TRUY XUẤT QR MÀN 3) ---

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
    harvestWindow: 'Mùa vụ 2026 (Mẫu)',
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

// --- QUICK PUBLISH WITH IMAGE & VOICE (MÀN 2) ---

export function publishQuickGardenProduct({
  producerId = PRIMARY_FARMER_PRODUCER_ID,
  title,
  priceVnd,
  stockKg,
  description,
  imageDataUrl = '',
  batchCode = '',
  voiceInputMode = 'manual'
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
    throw new Error('Giá bán/kg phải nằm trong khoảng 5.000đ – 50.000.000đ.');
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

  const newProduct = {
    id: `quick-${Date.now()}`,
    sku,
    batchCode: resolvedBatch,
    slug: uniqueSlug,
    producerId: producer.id,
    categoryId: 'trai-cay-tuoi',
    title: cleanTitle,
    unit: '1 kg',
    spec: 'Thu hái tại vườn, đăng nhanh bằng ảnh & giọng nói (Mẫu).',
    area: producer.area,
    priceVnd: cleanPrice,
    priceUpdatedAt: nowIso,
    stock: cleanStock,
    commissionRateBps: 1000,
    commissionCondition: 'Sản phẩm đăng thử nghiệm từ Màn 2.',
    status: 'published',
    certStatus: 'verified_pilot',
    ocopStars: producer.ocopStars,
    mediaKitReady: true,
    accentHex: '#15803D',
    secondaryHex: '#B45309',
    description:
      String(description || '').trim() ||
      `${cleanTitle} thu hoạch trực tiếp tại ${producer.businessName}.`,
    story: `Đăng nhanh qua giọng nói (${voiceInputMode === 'speech_api' ? 'Web Speech API' : voiceInputMode === 'simulated_voice' ? 'Nhận dạng giọng nói mô phỏng' : 'Nhập tay'}).`,
    soldCountDemo: 0,
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
      milestones: [
        {
          stage: 'Chăm sóc tại vườn',
          date: '18/09/2026',
          location: producer.area,
          detail: 'Chăm sóc hữu cơ tại vườn Long Khánh (mẫu).',
          inspector: producer.ownerName
        },
        {
          stage: 'Thu hoạch & Đăng bán nhanh',
          date: new Date().toLocaleDateString('vi-VN'),
          location: producer.area,
          detail: `${cleanTitle} — đăng qua ảnh và nhận dạng giọng nói.`,
          inspector: producer.ownerName
        },
        {
          stage: 'Đóng gói chuẩn bị giao',
          date: new Date().toLocaleDateString('vi-VN'),
          location: producer.area,
          detail: `Sẵn sàng ${cleanStock} kg, gắn tem truy xuất ${resolvedBatch}.`,
          inspector: 'Chờ khách đặt thử'
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

  return newProduct;
}

// --- LIVESTREAM SCHEDULE (MÀN 6) ---

export function fetchLivestreamSchedule() {
  const state = loadPilotState();
  return state.livestreams || [];
}

export function addDemoLivestream({ dateLabel, timeRange, supporterName, productSummary, channelLabel, note = '' }) {
  const state = loadPilotState();
  const entry = {
    id: `live-${Date.now()}`,
    dateLabel: String(dateLabel || '').trim() || 'Thứ Bảy · 05/12/2026',
    timeRange: String(timeRange || '').trim() || '19:30 – 20:30',
    supporterName: String(supporterName || '').trim() || 'Đoàn viên Minh Anh (Đoàn phường Xuân An)',
    supporterRole: 'Hỗ trợ quay trực tiếp tại vườn (Mẫu)',
    producerId: PRIMARY_FARMER_PRODUCER_ID,
    producerName: 'Nhà vườn Ba Tư (Long Khánh)',
    productSkus: ['NVBT-01', 'NVBT-02'],
    productSummary: String(productSummary || '').trim() || 'Chôm chôm & Sầu riêng Long Khánh',
    channelLabel: String(channelLabel || '').trim() || 'TikTok Shop (Mô phỏng)',
    status: 'upcoming',
    note: String(note || '').trim() || 'Lịch hỗ trợ thử nghiệm — không phát sóng thật.'
  };
  savePilotState({
    ...state,
    livestreams: [entry, ...(state.livestreams || [])]
  });
  return entry;
}

// --- PUBLIC CATALOG & PRODUCERS ---

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

  const state = loadPilotState();
  const qNorm = normalizeVi(q);
  const producerMap = new Map(state.producers.map((p) => [p.id, p]));

  let items = state.products.filter((p) => p.status === 'published');
  if (category && category !== 'all') {
    items = items.filter((p) => p.categoryId === category);
  }
  if (platform && platform !== 'all') {
    items = items.filter((p) => p.listings?.some((l) => l.platform === platform && l.status === 'active'));
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
    sourceMode: 'demo',
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
  const state = loadPilotState();
  const product = state.products.find((p) => p.slug === slug && p.status === 'published');
  if (!product) return { sourceMode: 'demo', product: null };
  const producer = state.producers.find((pr) => pr.id === product.producerId) || null;
  return {
    sourceMode: 'demo',
    product: { ...product, producer }
  };
}

export async function fetchProducerBySlug(slug) {
  if (hasRemoteApi()) {
    const data = await apiRequest(`/producers/${encodeURIComponent(slug)}`);
    return { sourceMode: 'api', ...data };
  }
  const state = loadPilotState();
  const producer = state.producers.find((p) => p.slug === slug) || null;
  if (!producer) return { sourceMode: 'demo', producer: null, products: [] };
  const products = state.products.filter((p) => p.producerId === producer.id && p.status === 'published');
  return { sourceMode: 'demo', producer, products };
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
        actorLabel: payload.applicantName || 'Đăng ký pilot',
        action: 'PILOT_APPLICATION_DEMO',
        targetLabel: payload.businessName || 'Cơ sở mới',
        detail: 'Lưu yêu cầu tham gia pilot tại chế độ demo cục bộ.',
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
      commissionCondition: 'Áp dụng cho đơn hoàn thành trên sàn liên kết.',
      status: 'draft',
      certStatus: producer.verified ? 'verified_pilot' : 'pending_review',
      ocopStars: producer.ocopStars,
      mediaKitReady: Boolean(payload.imageUrl),
      accentHex: '#15803D',
      secondaryHex: '#B45309',
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
    throw new Error('Cần gắn ít nhất 1 liên kết sàn (TikTok Shop / Shopee / Lazada) trước khi gửi duyệt.');
  }
  const updated = { ...target, status: 'pending_review', reviewNote: '' };
  savePilotState({
    ...state,
    products: state.products.map((p) => (p.id === id ? updated : p)),
    auditLogs: [
      {
        id: `aud-${Date.now()}`,
        actorLabel: 'Chủ cơ sở (Demo)',
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
  const state = loadPilotState();
  return state.orders.filter((o) => o.producerId === producerId);
}

export async function updateSellerOrderStatus({ orderId, producerId, nextStatus }) {
  const state = loadPilotState();
  const target = state.orders.find((o) => o.id === orderId);
  if (!target) throw new Error('Không tìm thấy đơn hàng.');
  if (producerId && target.producerId !== producerId) {
    throw new Error('Không thể xử lý đơn của nhà vườn khác.');
  }
  const updated = { ...target, status: nextStatus };
  savePilotState({
    ...state,
    orders: state.orders.map((o) => (o.id === orderId ? updated : o)),
    auditLogs: [
      {
        id: `aud-${Date.now()}`,
        actorLabel: 'Nhà vườn (Demo)',
        action: 'SELLER_UPDATE_ORDER_STATUS',
        targetLabel: target.orderCode || target.externalOrderId,
        detail: `Cập nhật trạng thái xử lý đơn → ${nextStatus}.`,
        createdAt: new Date().toISOString()
      },
      ...state.auditLogs
    ]
  });
  return updated;
}

// --- AFFILIATE OPERATIONS ---

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

export async function createAffiliateLink({ affiliateId, affiliateName, productId, platform, token } = {}) {
  if (hasRemoteApi()) {
    return apiRequest('/affiliate/links', {
      method: 'POST',
      body: { productId, platform },
      token
    });
  }
  if (!affiliateId) {
    throw new Error('Vui lòng đăng nhập hoặc chọn vai trò Đoàn viên Affiliate để tạo link cá nhân.');
  }
  const state = loadPilotState();
  const product = state.products.find((p) => p.id === productId && p.status === 'published');
  if (!product) {
    throw new Error('Chỉ có thể tạo link cho sản phẩm OCOP đã được duyệt công bố.');
  }
  const listing =
    product.listings?.find((l) => l.platform === platform && l.status === 'active') || product.listings?.[0];
  if (!listing) {
    throw new Error('Sản phẩm này chưa có đường dẫn sàn hợp lệ.');
  }
  const urlCheck = validateMarketplaceListingUrl(listing.url, listing.platform);
  if (!urlCheck.valid) {
    throw new Error(`Link đích chưa hợp lệ: ${urlCheck.reason}`);
  }

  let code = generateAffiliateCode(10);
  while (state.affiliateLinks.some((l) => l.code === code)) {
    code = generateAffiliateCode(10);
  }

  const created = {
    id: `aff-link-${Date.now()}`,
    code,
    affiliateId,
    affiliateName: affiliateName || 'Đoàn viên Affiliate (Demo)',
    productId: product.id,
    platform: listing.platform,
    targetUrl: urlCheck.url,
    isDemoTarget: Boolean(listing.isDemoTarget),
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
        targetLabel: `${product.sku} (${listing.platform})`,
        detail: `Tạo mã link ${code}.`,
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
    code: link.code,
    active: link.active,
    platform: link.platform,
    affiliateName: link.affiliateName,
    isDemoTarget: Boolean(link.isDemoTarget),
    clicksCount: link.clicksCount,
    product: product ? { ...product, producer } : null
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
  const check = validateMarketplaceListingUrl(link.targetUrl, link.platform);
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
        actorLabel: 'Điều phối Ops (Demo)',
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
      affiliateLinkId: link ? link.id : null,
      affiliateId: link ? link.affiliateId : null,
      affiliateName: link ? link.affiliateName : 'Chưa gán (thiếu mã affiliate hợp lệ)',
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
        actorLabel: producerScopeId ? 'Chủ cơ sở (Demo)' : 'Điều phối Ops (Demo)',
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
    const note = `Bút toán đảo hoàn/hủy đơn ${order.externalOrderId}: ${reason || 'Hoàn trả sàn'}`;
    addedLedger.push(
      {
        id: `ldg-rev-d-${Date.now()}`,
        txGroupId,
        orderId: order.id,
        affiliateId: order.affiliateId,
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
        actorLabel: 'Điều phối Ops (Demo)',
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
