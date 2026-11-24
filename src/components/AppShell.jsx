import React, { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  ClipboardList,
  HeartHandshake,
  MapPinned,
  Mic,
  PackageSearch,
  Radio,
  Share2,
  ShoppingBag,
  ShoppingCart,
  Store,
  Type,
  UserRound,
  Video,
  Wallet,
  WifiOff
} from 'lucide-react';
import { BRANDING_EMBLEMS } from '../data/pilotData';
import { DEMO_PERSONAS } from '../services/authService';
import { loadCart } from '../services/ocopStore';
import AccountDialog from './AccountDialog';

const LARGE_TEXT_KEY = 'ocop_de3_large_text_v1';

const mainNavLinks = [
  { to: '/', name: 'Cửa hàng', Icon: ShoppingBag, end: true },
  { to: '/gian-hang/nha-vuon-ba-tu', name: 'Nhà vườn', Icon: Store },
  { to: '/ban-do-vuon', name: 'Bản đồ', Icon: MapPinned },
  { to: '/lich-livestream', name: 'Livestream', Icon: Radio },
  { to: '/tra-cuu-don', name: 'Tra cứu đơn', Icon: PackageSearch },
  { to: '/tinh-nguyen', name: 'Tình nguyện', Icon: HeartHandshake }
];

const sellerSubNav = [
  { to: '/chu-co-so/dang-nhanh', name: 'Đăng nhanh (Ảnh & Giọng)', Icon: Mic },
  { to: '/chu-co-so/don-hang', name: 'Quản lý đơn vườn', Icon: ClipboardList },
  { to: '/chu-co-so/san-pham', name: 'Sản phẩm của vườn', Icon: Store },
  { to: '/tinh-nguyen', name: 'Duyệt giờ tình nguyện', Icon: HeartHandshake },
  { to: '/chu-co-so/video-studio', name: 'Xưởng quay video', Icon: Video }
];

const youthSubNav = [
  { to: '/affiliate/kham-pha', name: 'Chọn sản phẩm & Tạo link', Icon: Share2 },
  { to: '/affiliate/link-kit', name: 'Link & Bộ chia sẻ', Icon: Radio },
  { to: '/affiliate/hoa-hong', name: 'Đối soát & Hoa hồng', Icon: Wallet },
  { to: '/tinh-nguyen', name: 'Ghi giờ tình nguyện', Icon: HeartHandshake }
];

export default function AppShell({
  session,
  onAuthSessionChange,
  onSelectPersona,
  onSignOut,
  isOnline,
  children
}) {
  const [open, setOpen] = useState(false);
  const [initialMode, setInitialMode] = useState('login');
  const [cartCount, setCartCount] = useState(() =>
    loadCart().reduce((sum, item) => sum + item.quantity, 0)
  );
  const [largeText, setLargeText] = useState(() => {
    try {
      return window.localStorage.getItem(LARGE_TEXT_KEY) === '1';
    } catch {
      return false;
    }
  });

  const location = useLocation();
  const navigate = useNavigate();

  const isSupabase = session?.mode === 'supabase';
  const activeRole = isSupabase ? session.user?.role : session?.persona?.role || 'public';
  const activePersonaId = session?.persona?.id || 'public';
  const baseUrl = import.meta.env.BASE_URL || '/';
  const projectMarkSrc = `${baseUrl}branding/ocop-mark-256.png`;

  useEffect(() => {
    document.documentElement.classList.toggle('ocop-large-text', largeText);
    try {
      window.localStorage.setItem(LARGE_TEXT_KEY, largeText ? '1' : '0');
    } catch {
      // ignore storage errors
    }
  }, [largeText]);

  useEffect(() => {
    const refresh = () => setCartCount(loadCart().reduce((sum, item) => sum + item.quantity, 0));
    window.addEventListener('ocop-cart-updated', refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener('ocop-cart-updated', refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);

  useEffect(() => {
    const current = new URLSearchParams(location.search);
    const action = current.get('account');
    if (action !== 'login' && action !== 'recovery' && action !== 'register') return;
    setInitialMode(action);
    setOpen(true);
    current.delete('account');
    navigate({ pathname: location.pathname, search: current.toString() }, { replace: true });
  }, [location.search, location.pathname, navigate]);

  function handleQuickRoleSwitch(personaId, targetRoute) {
    if (typeof onSelectPersona === 'function') {
      onSelectPersona(personaId);
    }
    if (targetRoute) {
      navigate(targetRoute);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-canvas text-ink">
      {/* Contextual Offline Banner — ONLY visible when browser is genuinely offline */}
      {!isOnline && (
        <div
          className="flex items-center justify-center gap-2 bg-amber-50 border-b border-amber-200 px-3 py-2 text-xs sm:text-sm font-medium text-amber-950"
          role="status"
        >
          <WifiOff size={16} className="shrink-0" aria-hidden="true" />
          <span>
            Đang ở chế độ ngoại tuyến — Bạn vẫn xem được sản phẩm đã tải, giữ giỏ hàng và lưu nháp nhật ký giọng nói trên thiết bị.
          </span>
        </div>
      )}

      {/* Main Sticky Header */}
      <header className="sticky top-0 z-30 border-b border-line bg-white/95 shadow-sm backdrop-blur">
        <div className="mx-auto flex min-h-[68px] max-w-7xl items-center justify-between gap-1.5 sm:gap-2 px-2.5 sm:px-6">
          <Link
            to="/"
            className="flex min-w-0 flex-1 xl:flex-none items-center gap-2"
            aria-label="Chợ OCOP Thanh Niên Đồng Nai, về cửa hàng"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-50 border border-blue-200 p-1 shadow-sm">
              <img
                src={projectMarkSrc}
                alt="Logo Chợ OCOP Thanh Niên Đồng Nai"
                width="36"
                height="36"
                className="h-8 w-8 object-contain"
              />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[13px] font-extrabold text-ink sm:text-base leading-tight">
                Chợ OCOP Thanh Niên
              </span>
              <span className="hidden truncate text-xs text-muted sm:block">
                Đồng Nai · Mua tại vườn &amp; QR
              </span>
            </span>
          </Link>

          <nav aria-label="Điều hướng chính" className="hidden xl:flex items-center gap-0.5 shrink-0">
            {mainNavLinks.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={Boolean(item.end)}
                className={({ isActive }) =>
                  `min-h-[44px] inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl px-2.5 text-[13px] font-semibold transition ${
                    isActive ? 'bg-blue-50 text-brand' : 'text-muted hover:text-brand hover:bg-slate-50'
                  }`
                }
              >
                <item.Icon size={15} className="shrink-0" aria-hidden="true" />
                <span>{item.name}</span>
              </NavLink>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <button
              type="button"
              onClick={() => setLargeText((v) => !v)}
              aria-pressed={largeText}
              title="Bật/tắt chế độ chữ lớn dễ đọc cho chủ vườn"
              className={`min-h-[44px] min-w-[44px] px-2 sm:px-3 rounded-xl border text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-1 whitespace-nowrap transition ${
                largeText
                  ? 'border-brand bg-blue-50 text-brand'
                  : 'border-line bg-white text-ink hover:bg-blue-50'
              }`}
            >
              <Type size={15} aria-hidden="true" />
              <span className="hidden md:inline">{largeText ? 'Chữ lớn: Bật' : 'Chữ lớn'}</span>
              <span className="md:hidden">A+</span>
            </button>

            <Link
              className="ocop-secondary min-w-[44px] px-2 sm:px-3 whitespace-nowrap"
              to="/gio-hang"
              aria-label={`Giỏ hàng, ${cartCount} sản phẩm`}
            >
              <ShoppingCart size={17} aria-hidden="true" />
              <span className="hidden sm:inline">Giỏ</span>
              <span className="rounded-full bg-blue-100 px-1.5 py-0.5 text-xs font-bold text-blue-950 tabular-nums">
                {cartCount}
              </span>
            </Link>

            <button
              type="button"
              className="ocop-primary min-w-[44px] px-2.5 sm:px-3.5 whitespace-nowrap"
              onClick={() => {
                setInitialMode('login');
                setOpen(true);
              }}
              aria-label={isSupabase ? 'Tài khoản trực tuyến' : 'Đăng nhập tài khoản'}
            >
              <UserRound size={17} aria-hidden="true" />
              <span className="hidden sm:inline">{isSupabase ? 'Tài khoản' : 'Đăng nhập'}</span>
            </button>
          </div>
        </div>

        {/* Role & Farmer Quick Access Strip — Always visible so judges & farmers never hunt for Seller screens */}
        <div className="border-t border-blue-100 bg-blue-50/80">
          <div className="mx-auto max-w-7xl px-3 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              {isSupabase ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand text-white text-xs font-semibold">
                  Tài khoản thật (Supabase): {session.user?.email}
                </span>
              ) : (
                <>
                  <span className="text-xs font-bold text-brand hidden sm:inline">
                    Thử vai trò (mẫu):
                  </span>
                  <button
                    type="button"
                    onClick={() => handleQuickRoleSwitch('public')}
                    className={`min-h-[44px] px-3 rounded-xl text-xs sm:text-sm font-semibold border transition ${
                      activeRole === 'public'
                        ? 'bg-brand text-white border-brand shadow-sm'
                        : 'bg-white text-ink border-line hover:border-brand'
                    }`}
                  >
                    Khách mua
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickRoleSwitch('seller-batu', '/chu-co-so/don-hang')}
                    className={`min-h-[44px] px-3 rounded-xl text-xs sm:text-sm font-semibold border inline-flex items-center gap-1.5 transition ${
                      activeRole === 'seller'
                        ? 'bg-brand text-white border-brand shadow-sm'
                        : 'bg-white text-brand border-blue-300 hover:bg-blue-100/60'
                    }`}
                  >
                    <Store size={15} aria-hidden="true" />
                    <span>Vào vai Chủ vườn</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickRoleSwitch('affiliate-vy', '/affiliate/link-kit')}
                    className={`min-h-[44px] px-3 rounded-xl text-xs sm:text-sm font-semibold border inline-flex items-center gap-1.5 transition ${
                      activeRole === 'affiliate'
                        ? 'bg-brand text-white border-brand shadow-sm'
                        : 'bg-white text-ink border-line hover:border-brand'
                    }`}
                  >
                    <Share2 size={15} aria-hidden="true" />
                    <span>Đoàn viên</span>
                  </button>
                  <label htmlFor="demo-persona-select" className="sr-only">
                    Chọn nhanh vai trò trải nghiệm mẫu
                  </label>
                  <select
                    id="demo-persona-select"
                    value={activePersonaId}
                    onChange={(e) => {
                      const nextId = e.target.value;
                      const picked = DEMO_PERSONAS.find((p) => p.id === nextId);
                      const dest =
                        picked?.role === 'seller'
                          ? '/chu-co-so/don-hang'
                          : picked?.role === 'affiliate'
                            ? '/affiliate/link-kit'
                            : picked?.role === 'ops'
                              ? '/dieu-phoi'
                              : undefined;
                      handleQuickRoleSwitch(nextId, dest);
                    }}
                    className="min-h-[44px] max-w-[205px] px-2.5 rounded-xl border border-line bg-white text-xs sm:text-sm font-medium text-ink"
                  >
                    {DEMO_PERSONAS.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </>
              )}
            </div>

            {/* Contextual Seller / Youth / Quick links */}
            <div className="flex flex-wrap items-center gap-1.5">
              {activeRole === 'seller' ? (
                sellerSubNav.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `min-h-[44px] px-3 rounded-xl text-xs sm:text-sm font-semibold inline-flex items-center gap-1.5 border transition ${
                        isActive
                          ? 'bg-ink text-white border-ink'
                          : 'bg-white text-ink border-blue-200 hover:border-brand'
                      }`
                    }
                  >
                    <item.Icon size={15} aria-hidden="true" />
                    <span>{item.name}</span>
                  </NavLink>
                ))
              ) : activeRole === 'affiliate' ? (
                youthSubNav.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `min-h-[44px] px-3 rounded-xl text-xs sm:text-sm font-semibold inline-flex items-center gap-1.5 border transition ${
                        isActive
                          ? 'bg-ink text-white border-ink'
                          : 'bg-white text-ink border-blue-200 hover:border-brand'
                      }`
                    }
                  >
                    <item.Icon size={15} aria-hidden="true" />
                    <span>{item.name}</span>
                  </NavLink>
                ))
              ) : (
                <div className="flex flex-wrap items-center gap-1.5">
                  <Link
                    to="/chu-co-so/dang-nhanh"
                    className="min-h-[44px] px-3 rounded-xl bg-white border border-blue-200 hover:border-brand text-xs sm:text-sm font-semibold text-brand inline-flex items-center gap-1.5"
                  >
                    <Mic size={15} aria-hidden="true" />
                    <span>Đăng nhanh ảnh &amp; giọng</span>
                  </Link>
                  <Link
                    to="/tra-cuu-don"
                    className="min-h-[44px] px-3 rounded-xl bg-white border border-line hover:border-brand text-xs sm:text-sm font-semibold text-ink inline-flex items-center gap-1.5 xl:hidden"
                  >
                    <PackageSearch size={15} aria-hidden="true" />
                    <span>Tra cứu đơn</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-3 pb-24 pt-5 sm:px-6 lg:pb-12">
        {children}
      </main>

      {/* Footer with Project Mark + 3 Official Emblems (colors/aspect ratio preserved, source & non-endorsement notice) */}
      <footer className="border-t border-line bg-white px-4 py-8 pb-24 lg:pb-8 text-sm text-muted">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-5 space-y-2.5">
              <div className="flex items-center gap-3">
                <img
                  src={projectMarkSrc}
                  alt="Biểu trưng độc lập Chợ OCOP Thanh Niên Đồng Nai"
                  width="44"
                  height="44"
                  className="h-11 w-11 object-contain"
                />
                <div>
                  <p className="font-extrabold text-base text-ink">Chợ OCOP Thanh Niên Đồng Nai</p>
                  <p className="text-xs text-muted">
                    Đề 03 · Nông sản nhà vườn Long Khánh, truy xuất QR &amp; thanh niên đồng hành
                  </p>
                </div>
              </div>
              <p className="text-xs leading-relaxed text-muted">
                Sản phẩm mẫu phục vụ trình diễn quy trình mua trực tiếp tại vườn, truy xuất nhật ký mùa vụ bằng mã QR, kết nối đoàn viên hỗ trợ livestream và du lịch trải nghiệm nhà vườn. Dữ liệu giả lập, không thu cọc hoặc thanh toán tiền thật.
              </p>
              <div className="flex flex-wrap gap-3 text-xs font-semibold text-brand pt-1">
                <Link to="/gian-hang/nha-vuon-ba-tu" className="hover:underline">Hồ sơ Ba Tư</Link>
                <Link to="/chu-co-so/dang-nhanh" className="hover:underline">Đăng ảnh &amp; giọng</Link>
                <Link to="/ban-do-vuon" className="hover:underline">Bản đồ du lịch</Link>
                <Link to="/tinh-nguyen" className="hover:underline">Giờ tình nguyện</Link>
                <Link to="/tra-cuu-don" className="hover:underline">Tra cứu đơn</Link>
                <Link to="/ke-hoach-pilot" className="hover:underline">Lộ trình 90 ngày</Link>
              </div>
            </div>

            <div className="lg:col-span-7 rounded-2xl border border-line bg-canvas p-4 space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-brand">
                Biểu trưng tổ chức Thanh niên &amp; Sinh viên (Lưu cục bộ · Minh họa bối cảnh)
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {BRANDING_EMBLEMS.map((emblem) => (
                  <div
                    key={emblem.id}
                    className="rounded-xl border border-line bg-white p-3 flex flex-col items-center text-center gap-2"
                  >
                    <div className="h-14 flex items-center justify-center">
                      <img
                        src={`${baseUrl}${emblem.file}`}
                        alt={emblem.alt}
                        height="56"
                        className="h-14 w-auto max-w-[120px] object-contain"
                        loading="lazy"
                      />
                    </div>
                    <p className="text-xs font-bold text-ink leading-snug">{emblem.name}</p>
                    <a
                      href={emblem.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-brand underline hover:text-brand-hover"
                    >
                      Nguồn: {emblem.sourceLabel}
                    </a>
                  </div>
                ))}
              </div>
              <p className="text-[11px] leading-relaxed text-muted">
                <strong>Lưu ý minh bạch:</strong> Ba biểu trưng trên được giữ nguyên màu sắc, tỷ lệ, lưu cục bộ và ghi rõ nguồn chỉ nhằm minh họa không gian phong trào thanh niên đồng hành cùng nông sản Đồng Nai trong bài thi; <strong>không ngụ ý sự bảo trợ hay phê duyệt chính thức</strong> của các tổ chức đối với sản phẩm thử nghiệm này.
              </p>
            </div>
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Navigation */}
      <nav
        aria-label="Menu nhanh trên điện thoại"
        className="fixed inset-x-0 bottom-0 z-30 flex justify-around gap-1 border-t border-line bg-white px-1.5 py-1 pb-[env(safe-area-inset-bottom)] xl:hidden shadow-[0_-4px_16px_rgba(16,36,63,0.06)]"
      >
        {[
          { to: '/', name: 'Cửa hàng', Icon: ShoppingBag, end: true },
          { to: '/gian-hang/nha-vuon-ba-tu', name: 'Nhà vườn', Icon: Store },
          { to: '/ban-do-vuon', name: 'Bản đồ', Icon: MapPinned },
          { to: '/lich-livestream', name: 'Livestream', Icon: Radio },
          activeRole === 'seller'
            ? { to: '/chu-co-so/don-hang', name: 'Đơn vườn', Icon: ClipboardList }
            : { to: '/tinh-nguyen', name: 'Tình nguyện', Icon: HeartHandshake }
        ].map(({ to, name, Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={Boolean(end)}
            className={({ isActive }) =>
              `flex min-h-[52px] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl px-1 text-center text-[11px] font-semibold ${
                isActive ? 'bg-blue-50 text-brand' : 'text-muted'
              }`
            }
          >
            <Icon size={19} aria-hidden="true" />
            <span className="truncate max-w-full">{name}</span>
          </NavLink>
        ))}
      </nav>

      {open && (
        <AccountDialog
          session={session}
          onChange={onAuthSessionChange}
          onSelectPersona={onSelectPersona}
          onSignOut={onSignOut}
          onClose={() => setOpen(false)}
          initialMode={initialMode}
        />
      )}
    </div>
  );
}
