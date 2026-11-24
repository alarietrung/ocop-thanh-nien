import { loadJson, saveJson } from './storageService';
import { PRIMARY_FARMER_PRODUCER_ID } from '../data/pilotData';
import { productionStorefront } from '../config/productionStorefront';

const DEMO_SESSION_KEY = 'ocop_de3_demo_session_v1';
const SUPABASE_SESSION_KEY = 'ocop_de3_supabase_session_v1';

export const DEMO_PERSONAS = [
  {
    id: 'public',
    role: 'public',
    label: 'Khách tham quan / Người mua',
    name: 'Khách mua Chợ OCOP',
    subtitle: 'Xem Hồ sơ Nhà vườn Ba Tư, quét QR nhật ký, đặt hàng & tra cứu đơn',
    producerId: PRIMARY_FARMER_PRODUCER_ID,
    affiliateId: null
  },
  {
    id: 'seller-batu',
    role: 'seller',
    label: 'Chủ vườn Ba Tư — Long Khánh (2,5 ha)',
    name: 'Chú Ba Tư (Chế độ thử vai)',
    subtitle: 'Đăng nhanh ảnh/giọng nói/AI, xử lý đơn vườn & duyệt giờ tình nguyện',
    producerId: PRIMARY_FARMER_PRODUCER_ID,
    affiliateId: null
  },
  {
    id: 'seller-tantrieu',
    role: 'seller',
    label: 'Chủ cơ sở — Làng bưởi Tân Triều',
    name: 'Trần Thị Thu Hà (Chế độ thử vai)',
    subtitle: 'Quản lý sản phẩm & xử lý đơn tách riêng của cơ sở Tân Triều',
    producerId: 'prod-tan-trieu-pomelo',
    affiliateId: null
  },
  {
    id: 'seller-dinhquan',
    role: 'seller',
    label: 'Chủ cơ sở — HTX Điều Định Quán',
    name: 'Nguyễn Văn Hùng (Chế độ thử vai)',
    subtitle: 'Quản lý sản phẩm & đơn hàng tách riêng của HTX Định Quán',
    producerId: 'prod-dinh-quan-cashew',
    affiliateId: null
  },
  {
    id: 'affiliate-vy',
    role: 'affiliate',
    label: 'Đoàn viên hỗ trợ — Minh Anh (Xuân An)',
    name: 'Đoàn viên Minh Anh (Chế độ thử vai)',
    subtitle: 'Tạo link giới thiệu, đối soát đơn/hoa hồng & ghi giờ tình nguyện',
    producerId: null,
    affiliateId: 'aff-member-1'
  },
  {
    id: 'affiliate-bao',
    role: 'affiliate',
    label: 'Đoàn viên hỗ trợ — Hoàng Phúc (CĐ Đồng Nai)',
    name: 'Đoàn viên Hoàng Phúc (Chế độ thử vai)',
    subtitle: 'Quản lý link giới thiệu & ghi nhật ký giờ tình nguyện',
    producerId: null,
    affiliateId: 'aff-member-2'
  },
  {
    id: 'ops-coordinator',
    role: 'ops',
    label: 'Điều phối Tỉnh đoàn / Sở Công Thương',
    name: 'Cán bộ Điều phối (Chế độ thử vai)',
    subtitle: 'Duyệt sản phẩm, đối soát đơn & xem nhật ký hệ thống mẫu',
    producerId: null,
    affiliateId: null
  }
];

export function getSupabaseConfig() {
  const production = globalThis.location?.hostname === productionStorefront.hostname;
  const url = String(import.meta.env?.VITE_SUPABASE_URL || (production ? productionStorefront.supabaseUrl : '')).trim().replace(/\/+$/, '');
  const publishableKey = String(import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY || (production ? productionStorefront.publishableKey : '')).trim();
  return {
    configured: Boolean(url && publishableKey),
    storefront: production || import.meta.env?.VITE_OCOP_STORE_SYNC === 'true',
    url,
    publishableKey
  };
}

export function getTurnstileSiteKey() {
  return String(import.meta.env?.VITE_TURNSTILE_SITE_KEY || '').trim();
}

export function loadActiveSession() {
  const supaSession = loadJson(SUPABASE_SESSION_KEY, null, (v) => Boolean(v?.accessToken));
  if (supaSession && supaSession.expiresAt && supaSession.expiresAt > Date.now()) {
    return {
      mode: 'supabase',
      ...supaSession
    };
  }
  const demoId = loadJson(DEMO_SESSION_KEY, 'public', (v) => typeof v === 'string');
  const persona = DEMO_PERSONAS.find((p) => p.id === demoId) || DEMO_PERSONAS[0];
  return {
    mode: 'demo',
    accessToken: '',
    persona
  };
}

// Chuyển vai trải nghiệm cục bộ — KHÔNG cấp quyền máy chủ hay Supabase RLS thật
export function setDemoPersona(personaId) {
  const persona = DEMO_PERSONAS.find((p) => p.id === personaId) || DEMO_PERSONAS[0];
  saveJson(DEMO_SESSION_KEY, persona.id);
  return {
    mode: 'demo',
    accessToken: '',
    persona
  };
}

export function saveAuthSession(session) {
  saveJson(SUPABASE_SESSION_KEY, session);
}

export async function signOutSession() {
  const cfg = getSupabaseConfig();
  const supa = loadJson(SUPABASE_SESSION_KEY, null);
  if (cfg.configured && supa?.accessToken) {
    try {
      await fetch(`${cfg.url}/auth/v1/logout`, {
        method: 'POST',
        headers: {
          apikey: cfg.publishableKey,
          Authorization: `Bearer ${supa.accessToken}`
        }
      });
    } catch {
      // Ignore network errors on sign out
    }
  }
  saveJson(SUPABASE_SESSION_KEY, null);
  return setDemoPersona('public');
}
