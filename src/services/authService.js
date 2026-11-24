import { loadJson, saveJson } from './storageService';
import { PRIMARY_FARMER_PRODUCER_ID } from '../data/pilotData';

const DEMO_SESSION_KEY = 'ocop_de3_demo_session_v1';
const SUPABASE_SESSION_KEY = 'ocop_de3_supabase_session_v1';

export const DEMO_PERSONAS = [
  {
    id: 'public',
    role: 'public',
    label: 'Khách tham quan / Người mua',
    name: 'Khách xem Chợ OCOP',
    subtitle: 'Xem Hồ sơ Nhà vườn Ba Tư, quét QR nhật ký & đặt hàng mẫu',
    producerId: PRIMARY_FARMER_PRODUCER_ID,
    affiliateId: null
  },
  {
    id: 'seller-batu',
    role: 'seller',
    label: 'Nhà vườn Ba Tư — Long Khánh (2,5 ha)',
    name: 'Chú Ba Tư (Giả lập)',
    subtitle: 'Đăng nhanh ảnh/giọng nói, quản lý 5 sản phẩm & xử lý đơn vườn',
    producerId: PRIMARY_FARMER_PRODUCER_ID,
    affiliateId: null
  },
  {
    id: 'seller-tantrieu',
    role: 'seller',
    label: 'Chủ cơ sở OCOP — Làng bưởi Tân Triều',
    name: 'Trần Thị Thu Hà (Giả lập)',
    subtitle: 'Quản lý SKU Tân Triều, Video Studio & Đơn hàng (Demo)',
    producerId: 'prod-tan-trieu-pomelo',
    affiliateId: null
  },
  {
    id: 'seller-dinhquan',
    role: 'seller',
    label: 'Chủ cơ sở OCOP — Điều Định Quán',
    name: 'Nguyễn Văn Hùng (Giả lập)',
    subtitle: 'Quản lý SKU Định Quán, kiểm tra phân tách chủ thể (Demo)',
    producerId: 'prod-dinh-quan-cashew',
    affiliateId: null
  },
  {
    id: 'affiliate-vy',
    role: 'affiliate',
    label: 'Đoàn viên hỗ trợ — Minh Anh (Long Khánh)',
    name: 'Đoàn viên Minh Anh (Giả lập)',
    subtitle: 'Hỗ trợ livestream vườn Ba Tư, lấy link & xem hoa hồng (Demo)',
    producerId: null,
    affiliateId: 'aff-member-1'
  },
  {
    id: 'affiliate-bao',
    role: 'affiliate',
    label: 'Đoàn viên hỗ trợ — Hoàng Phúc',
    name: 'Đoàn viên Hoàng Phúc (Giả lập)',
    subtitle: 'Kiểm tra phân tách link & hoa hồng giữa hai đoàn viên (Demo)',
    producerId: null,
    affiliateId: 'aff-member-2'
  },
  {
    id: 'ops-coordinator',
    role: 'ops',
    label: 'Điều phối Tỉnh đoàn / Sở Công Thương',
    name: 'Cán bộ Điều phối Pilot',
    subtitle: 'Duyệt SKU, Import CSV, Đối soát & Audit Log (Demo)',
    producerId: null,
    affiliateId: null
  }
];

export function getSupabaseConfig() {
  const url = String(import.meta.env?.VITE_SUPABASE_URL || '').trim().replace(/\/+$/, '');
  const publishableKey = String(import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY || '').trim();
  return {
    configured: Boolean(url && publishableKey),
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
