import { INITIAL_PRODUCTS } from '../data/pilotData';
import { getSupabaseConfig, loadActiveSession } from './authService';

const localImages = new Map(INITIAL_PRODUCTS.map(({ id, imageUrl }) => [id, imageUrl]));

export function hasStorefrontSync() {
  const config = getSupabaseConfig();
  return config.configured && config.storefront;
}

async function request(path, { query, method = 'GET', body, token, prefer } = {}) {
  const { url, publishableKey } = getSupabaseConfig();
  const endpoint = new URL(`${url}/rest/v1/${path}`);
  if (query) endpoint.search = new URLSearchParams(query).toString();
  const response = await fetch(endpoint, {
    method,
    headers: {
      apikey: publishableKey,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(prefer ? { Prefer: prefer } : {})
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(12000)
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const message = data?.code === '22023' ? data.message :
      response.status === 409 ? 'Mã đơn này đã được ghi nhận. Vui lòng kiểm tra trước khi đặt lại.' :
      'Chưa thể kết nối dữ liệu Chợ OCOP. Vui lòng thử lại.';
    throw new Error(message);
  }
  return data;
}

function publicProduct({ data, price_vnd, stock, batch_code }) {
  return { ...data, priceVnd: price_vnd, stock, batchCode: batch_code, imageUrl: data.imageUrl || localImages.get(data.id) };
}

export async function loadPublicStorefront() {
  const [gardens, products] = await Promise.all([
    request('ocop_gardens', { query: { select: 'data', order: 'id.asc', limit: '250' } }),
    request('ocop_catalog', { query: { select: 'data,price_vnd,stock,batch_code', order: 'id.asc', limit: '250' } })
  ]);
  return { producers: gardens.map(row => row.data), products: products.map(publicProduct) };
}

export async function loadStorefrontSeason(batchCode, product) {
  const [logs, products] = await Promise.all([
    request('ocop_season_logs', { query: { select: 'data', batch_code: `eq.${batchCode}` } }),
    product ? [product] : request('ocop_catalog', {
      query: { select: 'data,price_vnd,stock,batch_code', batch_code: `eq.${batchCode}` }
    }).then(rows => rows.map(publicProduct))
  ]);
  return logs[0] ? { ...logs[0].data, product: products[0] || null } : null;
}

export async function saveStorefrontOrder({ orderId, cart, customerName, customerPhone, deliveryMethod, shippingAddress, note }) {
  const { accessToken } = loadActiveSession();
  const result = await request('rpc/ocop_place_order', {
    method: 'POST', token: accessToken,
    body: {
      order_id: orderId,
      cart: cart.map(({ productId, quantity }) => ({ productId, quantity })),
      buyer_name: customerName, buyer_phone: customerPhone,
      receive_method: deliveryMethod, address: shippingAddress, order_note: note
    }
  });
  return {
    ...result,
    customerName: customerName.trim(), customerPhone: customerPhone.trim(),
    deliveryLabel: deliveryMethod === 'pickup' ? 'Nhận trực tiếp tại nhà vườn' : `Giao tận nơi: ${shippingAddress.trim()}`,
    grossAmountVnd: result.subtotalVnd + result.shippingFeeVnd,
    source: 'supabase'
  };
}

export async function fetchStorefrontMembership(token) {
  const rows = await request('ocop_seller_memberships', {
    token, query: { select: 'producer_id', order: 'producer_id.asc', limit: '1' }
  });
  return rows[0] ? { role: 'seller', producerId: rows[0].producer_id } : { role: 'public' };
}

export async function fetchStorefrontOrders({ producerId, token }) {
  const rows = await request('ocop_direct_orders', {
    token, query: { select: 'id,producer_id,items,customer_name,customer_phone,delivery_method,shipping_address,subtotal_vnd,shipping_fee_vnd,status,ordered_at',
      producer_id: `eq.${producerId}`, order: 'ordered_at.desc', limit: '100' }
  });
  return rows.map(row => {
    const orderCode = `OCOP-${row.id.replaceAll('-', '').slice(0, 12).toUpperCase()}`;
    return {
      id: row.id, orderCode, externalOrderId: orderCode, producerId: row.producer_id,
      platform: 'direct_ocop', source: 'supabase', status: row.status, orderedAt: row.ordered_at,
      productTitle: row.items.map(item => item.title).join(', '), items: row.items,
      quantity: row.items.reduce((sum, item) => sum + item.quantity, 0),
      deliveryLabel: row.delivery_method === 'pickup' ? 'Nhận trực tiếp tại nhà vườn' : `Giao tận nơi: ${row.shipping_address}`,
      customerName: row.customer_name, customerPhone: row.customer_phone,
      grossAmountVnd: row.subtotal_vnd + row.shipping_fee_vnd, netAmountVnd: row.subtotal_vnd,
      shippingFeeVnd: row.shipping_fee_vnd, commissionVnd: 0, attributionStatus: 'unassigned'
    };
  });
}

export async function updateStorefrontOrderStatus({ orderId, producerId, nextStatus, token }) {
  const rows = await request('ocop_direct_orders', {
    token, method: 'PATCH', prefer: 'return=representation', body: { status: nextStatus },
    query: { id: `eq.${orderId}`, producer_id: `eq.${producerId}`, select: 'id,status' }
  });
  if (!rows?.[0]) throw new Error('Không tìm thấy đơn hàng thuộc nhà vườn của anh.');
  return rows[0];
}
