import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  LockKeyhole,
  LogOut,
  Mail,
  ShieldCheck,
  Store,
  Users,
  X
} from 'lucide-react';
import { DEMO_PERSONAS, getSupabaseConfig } from '../services/authService';
import { registerAccount, requestAccountRecovery, signInAccount } from '../services/accountApi';

const forms = {
  login: {
    title: 'Đăng nhập tài khoản',
    detail: 'Đăng nhập bằng email Supabase để quản lý đơn thật theo quyền nhà vườn (RLS).',
    cta: 'Đăng nhập'
  },
  register: {
    title: 'Đăng ký tài khoản mới',
    detail: 'Tạo tài khoản bằng email cá nhân. Hệ thống sẽ gửi thư xác nhận vào hộp thư của bạn.',
    cta: 'Tạo tài khoản'
  },
  recovery: {
    title: 'Quên / Khôi phục mật khẩu',
    detail: 'Nhập email đã đăng ký để nhận liên kết đặt lại mật khẩu an toàn.',
    cta: 'Gửi liên kết khôi phục'
  }
};

export default function AccountDialog({
  session,
  onChange,
  onSelectPersona,
  onSignOut,
  onClose,
  initialMode = 'login'
}) {
  const dialog = useRef(null);
  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [show, setShow] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const isOnlineAuth = getSupabaseConfig().configured;
  const loggedIn = session?.mode === 'supabase';
  const markUrl = `${import.meta.env.BASE_URL}branding/ocop-mark-256.png`;

  useEffect(() => {
    const element = dialog.current;
    if (element && !element.open) {
      element.showModal();
    }
    return () => {
      if (element?.open) element.close();
    };
  }, []);

  function switchMode(next) {
    setMode(next);
    setStatus('');
    setError('');
    setPassword('');
    setConfirmPassword('');
    setShow(false);
  }

  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    setError('');
    setStatus('');

    const trimmedEmail = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError('Vui lòng nhập địa chỉ email đúng định dạng (ví dụ: ten@example.com).');
      return;
    }

    if (mode !== 'recovery') {
      if (password.length < 8) {
        setError('Mật khẩu cần tối thiểu 8 ký tự.');
        return;
      }
      if (mode === 'register' && password !== confirmPassword) {
        setError('Mật khẩu nhập lại chưa khớp. Vui lòng kiểm tra lại.');
        return;
      }
    }

    if (!isOnlineAuth) {
      setError(
        'Môi trường cục bộ chưa cấu hình biến Supabase Auth (VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY). Bạn có thể chọn "Chế độ thử vai trò" bên dưới để kiểm thử đầy đủ giao diện bằng dữ liệu giả lập.'
      );
      return;
    }

    setBusy(true);
    try {
      const details = { email: trimmedEmail, password };
      if (mode === 'login') {
        onChange(await signInAccount(details));
        onClose();
      } else if (mode === 'recovery') {
        await requestAccountRecovery(details.email);
        setStatus(
          'Nếu email này đã đăng ký, hệ thống đã gửi liên kết đặt lại mật khẩu. Vui lòng kiểm tra hộp thư đến và thư rác.'
        );
      } else {
        await registerAccount(details);
        setStatus('Đã gửi thư xác nhận tài khoản. Vui lòng mở email xác nhận rồi quay lại đăng nhập.');
      }
    } catch (failure) {
      setError(
        failure.message === 'Failed to fetch'
          ? 'Không kết nối được dịch vụ xác thực tài khoản. Vui lòng kiểm tra mạng và thử lại.'
          : failure.message
      );
    } finally {
      setBusy(false);
    }
  }

  function handlePickDemoPersona(personaId) {
    if (typeof onSelectPersona === 'function') {
      onSelectPersona(personaId);
      onClose();
    }
  }

  const info = forms[mode];
  const quickPersonas = DEMO_PERSONAS.filter((p) =>
    ['public', 'seller-batu', 'seller-tantrieu', 'affiliate-vy', 'ops-coordinator'].includes(p.id)
  );

  return (
    <dialog
      ref={dialog}
      className="ocop-dialog"
      aria-labelledby="account-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="overflow-hidden rounded-[inherit] bg-white">
        <div className="ocop-dialog-hero flex justify-between gap-4 p-5 sm:p-6">
          <div>
            <span className="inline-flex rounded-2xl bg-white p-1.5 shadow-sm">
              <img src={markUrl} alt="Biểu trưng Chợ OCOP Thanh Niên" className="h-8 w-8 object-contain" />
            </span>
            <h2 id="account-title" className="mt-3 text-xl sm:text-2xl font-extrabold">
              {loggedIn ? 'Tài khoản trực tuyến của bạn' : info.title}
            </h2>
            <p className="mt-1 text-sm text-blue-100">
              {loggedIn ? 'Đã xác thực qua Supabase Auth' : info.detail}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng hộp thoại tài khoản"
            className="h-11 w-11 shrink-0 rounded-xl bg-white/15 grid place-items-center hover:bg-white/25"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        {loggedIn ? (
          <div className="space-y-4 p-5 sm:p-6">
            <div className="flex items-center gap-3 rounded-2xl bg-blue-50 border border-blue-200 p-4">
              <Mail className="text-brand shrink-0" size={20} aria-hidden="true" />
              <div className="min-w-0">
                <p className="break-all text-sm font-bold text-ink">{session.user?.email}</p>
                <p className="text-xs text-muted mt-0.5">
                  Vai trò máy chủ: <strong>{session.user?.role || 'public'}</strong>
                  {session.user?.producerId ? ` · Cơ sở: ${session.user.producerId}` : ''}
                </p>
              </div>
            </div>
            <p className="text-xs text-muted">
              Đơn hàng thật được bảo vệ bởi Supabase RLS theo đúng tài khoản nhà vườn và tính giá trên máy chủ.
            </p>
            <button
              type="button"
              className="ocop-secondary w-full"
              onClick={async () => {
                await onSignOut();
                onClose();
              }}
            >
              <LogOut size={17} aria-hidden="true" />
              <span>Đăng xuất tài khoản trực tuyến</span>
            </button>
          </div>
        ) : (
          <div className="space-y-5 p-5 sm:p-6">
            {/* Tabs Đăng nhập / Đăng ký / Quên mật khẩu */}
            <div className="grid grid-cols-3 gap-1.5 rounded-2xl bg-slate-100 p-1">
              {[
                { id: 'login', label: 'Đăng nhập' },
                { id: 'register', label: 'Đăng ký' },
                { id: 'recovery', label: 'Khôi phục' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => switchMode(tab.id)}
                  className={`min-h-[44px] rounded-xl text-xs sm:text-sm font-semibold transition ${
                    mode === tab.id ? 'bg-white text-brand shadow-sm' : 'text-muted hover:text-ink'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {!isOnlineAuth && (
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-xs sm:text-sm text-blue-950 space-y-1">
                <p className="font-semibold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-brand shrink-0" aria-hidden="true" />
                  <span>Môi trường cục bộ chưa nối máy chủ Supabase Auth</span>
                </p>
                <p className="text-xs text-blue-900">
                  Biểu mẫu vẫn kiểm tra hợp lệ phía giao diện. Để bấm thử đầy đủ 6 màn hình và duyệt đơn ngay, chọn{' '}
                  <strong>Chế độ thử vai trò</strong> ở mục dưới.
                </p>
              </div>
            )}

            {status && (
              <p
                role="status"
                className="flex gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-sm text-emerald-950"
              >
                <CheckCircle2 className="shrink-0 mt-0.5" size={18} aria-hidden="true" />
                <span>{status}</span>
              </p>
            )}
            {error && (
              <p
                role="alert"
                className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-sm text-rose-900"
              >
                {error}
              </p>
            )}

            <form className="space-y-3.5" onSubmit={submit} noValidate>
              <div>
                <label htmlFor="account-email" className="ocop-label">
                  Email tài khoản
                </label>
                <input
                  id="account-email"
                  className="ocop-field"
                  type="email"
                  autoComplete="email"
                  placeholder="ten@example.com"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>

              {mode !== 'recovery' && (
                <div>
                  <div className="flex justify-between gap-2">
                    <label htmlFor="account-password" className="ocop-label">
                      Mật khẩu {mode === 'register' ? '(tối thiểu 8 ký tự)' : ''}
                    </label>
                    {mode === 'login' && (
                      <button
                        type="button"
                        className="text-xs sm:text-sm font-semibold text-brand hover:underline"
                        onClick={() => switchMode('recovery')}
                      >
                        Quên mật khẩu?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      id="account-password"
                      className="ocop-field pr-14"
                      type={show ? 'text' : 'password'}
                      autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                      minLength={8}
                      required
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                    />
                    <button
                      type="button"
                      className="absolute right-1 top-1 w-11 h-11 grid place-items-center text-muted hover:text-brand"
                      aria-label={show ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                      onClick={() => setShow(!show)}
                    >
                      {show ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                    </button>
                  </div>
                </div>
              )}

              {mode === 'register' && (
                <div>
                  <label htmlFor="account-confirm-password" className="ocop-label">
                    Nhập lại mật khẩu
                  </label>
                  <input
                    id="account-confirm-password"
                    className="ocop-field"
                    type={show ? 'text' : 'password'}
                    autoComplete="new-password"
                    minLength={8}
                    required
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                  />
                </div>
              )}

              <button disabled={busy} type="submit" className="ocop-primary w-full">
                {mode === 'recovery' ? <Mail size={16} aria-hidden="true" /> : <LockKeyhole size={16} aria-hidden="true" />}
                <span>{busy ? 'Đang xử lý…' : info.cta}</span>
                <ArrowRight size={16} aria-hidden="true" />
              </button>
            </form>

            {mode !== 'login' && (
              <button
                type="button"
                className="flex mx-auto min-h-[44px] items-center gap-1 px-3 text-sm font-semibold text-brand"
                onClick={() => switchMode('login')}
              >
                <ArrowLeft size={15} aria-hidden="true" />
                <span>Quay về đăng nhập</span>
              </button>
            )}

            {/* Demo role switching — strictly local simulated data, NEVER grants real Supabase rights */}
            {typeof onSelectPersona === 'function' && (
              <div className="pt-4 border-t border-line space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-brand flex items-center gap-1.5">
                    <Users className="w-4 h-4" aria-hidden="true" />
                    <span>Chế độ thử vai trò (Dữ liệu mẫu cục bộ)</span>
                  </p>
                </div>
                <p className="text-xs text-muted">
                  Dùng để trải nghiệm nhanh giao diện Chủ vườn, Đoàn viên hoặc Điều phối với dữ liệu giả lập trên thiết bị này.{' '}
                  <strong>Không cấp quyền tài khoản hay máy chủ Supabase thật.</strong>
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {quickPersonas.map((p) => {
                    const active = session?.mode === 'demo' && session?.persona?.id === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handlePickDemoPersona(p.id)}
                        className={`min-h-[44px] px-3 py-2 rounded-xl border text-left transition text-xs font-semibold flex items-center gap-2 ${
                          active
                            ? 'bg-blue-50 border-brand text-brand'
                            : 'bg-canvas border-line text-ink hover:border-brand'
                        }`}
                      >
                        <Store className="w-4 h-4 shrink-0 text-brand" aria-hidden="true" />
                        <span className="truncate">{p.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </dialog>
  );
}
