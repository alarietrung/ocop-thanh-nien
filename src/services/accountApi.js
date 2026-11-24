import { apiRequest } from './apiClient';
import { getApiBaseUrl } from './storageService';
import { getSupabaseConfig, saveAuthSession } from './authService';

function configured() {
  const cfg = getSupabaseConfig();
  if (!cfg.configured) throw new Error('Tài khoản trực tuyến chưa được kết nối.');
  return cfg;
}

async function authRequest(path, { method = 'POST', body, token, signal } = {}) {
  const cfg = configured();
  const result = await fetch(cfg.url + '/auth/v1' + path, {
    method,
    headers: {
      apikey: cfg.publishableKey,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: 'Bearer ' + token } : {})
    },
    body: body ? JSON.stringify(body) : undefined,
    signal
  });
  const data = await result.json().catch(() => ({}));
  if (!result.ok) {
    const message = result.status === 429
      ? 'Anh vừa gửi nhiều yêu cầu. Vui lòng thử lại sau ít phút.'
      : data?.msg || data?.error_description || 'Không thể xử lý yêu cầu. Vui lòng thử lại.';
    const error = new Error(message);
    error.status = result.status;
    throw error;
  }
  return data;
}

export function accountPath(route) {
  const base = new URL(import.meta.env.BASE_URL, window.location.href);
  return new URL(route, base).href;
}

export async function signInAccount({email,password}) {
  const data = await authRequest('/token?grant_type=password',{body:{email,password}});
  if (!data.access_token) throw new Error('Không nhận được phiên đăng nhập.');
  const me = getApiBaseUrl() ? await apiRequest('/me',{token:data.access_token}).catch(() => null) : null;
  const session = {
    accessToken:data.access_token,
    refreshToken:data.refresh_token,
    expiresAt:Date.now()+(Number(data.expires_in)||3600)*1000,
    user:{id:data.user?.id,email:data.user?.email,role:me?.role||'public',producerId:me?.producerId||null}
  };
  saveAuthSession(session);
  return {mode:'supabase',...session};
}

export async function registerAccount({email,password}) {
  const redirect = accountPath('tai-khoan/xac-nhan');
  await authRequest('/signup?'+new URLSearchParams({redirect_to:redirect}),{body:{email,password}});
}

export async function requestAccountRecovery(email) {
  const redirect = accountPath('tai-khoan/dat-lai-mat-khau');
  await authRequest('/recover?'+new URLSearchParams({redirect_to:redirect}),{body:{email}});
}

export function takeRecoveryToken() {
  if (window.location.protocol === 'file:') return '';
  const params = new URLSearchParams(window.location.hash.slice(1));
  const token = params.get('type') === 'recovery' ? params.get('access_token') : '';
  window.history.replaceState(window.history.state,'',window.location.pathname);
  return token || '';
}

export async function resetAccountPassword(password, token) {
  if (!token) throw new Error('Liên kết đặt lại mật khẩu thiếu hoặc hết hạn. Hãy yêu cầu liên kết mới.');
  await authRequest('/user',{method:'PUT',body:{password},token});
}
