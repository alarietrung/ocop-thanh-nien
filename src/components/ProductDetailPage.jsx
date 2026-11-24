import React, { useEffect, useState } from 'react';
import TraceDialog from './TraceDialog';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ExternalLink,
  MapPin,
  ShieldCheck,
  ShieldAlert,
  Phone,
  Share2,
  Copy,
  Check,
  Store,
  Video,
  QrCode,
  ShoppingCart,
  ArrowRight,
  Mic,
  Sprout,
  UserCheck
} from 'lucide-react';
import {
  addToCart,
  createAffiliateLink,
  fetchProducerBySlug,
  fetchProductBySlug,
  fetchSeasonLogByBatch
} from '../services/ocopStore';
import { formatBpsPercent, formatDateTimeVn, formatVnd, PLATFORM_META } from '../utils/formatters';
import { buildTraceQrSvgDataUri } from '../utils/qrSvg';
import { OcopStarBadge, PlatformBadge } from './StatusBadges';

// =========================================================================
// MÀN 3: CHI TIẾT SẢN PHẨM (+ QR TRUY XUẤT & NHẬT KÝ MÙA VỤ + THÊM GIỎ HÀNG)
// =========================================================================
export function ProductDetailPage({ session, onQuickSwitchAffiliate }) {
  const [traceOpen, setTraceOpen] = useState(false);
  const { slug } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [qty, setQty] = useState(1);
  const [cartFeedback, setCartFeedback] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('');
  const [createdLink, setCreatedLink] = useState(null);
  const [creating, setCreating] = useState(false);
  const [copyStatus, setCopyStatus] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setErrorMsg('');
      try {
        const res = await fetchProductBySlug(slug);
        if (!cancelled) {
          setProduct(res.product);
          setSelectedPlatform(res.product?.listings?.[0]?.platform || 'tiktok');
        }
      } catch (err) {
        if (!cancelled) setErrorMsg(err?.message || 'Không thể tải chi tiết sản phẩm.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  function handleAddCart({ goToCart = false } = {}) {
    if (!product) return;
    addToCart(product, qty);
    setCartFeedback(`Đã thêm ${qty} × ${product.title} vào giỏ hàng!`);
    if (goToCart) {
      navigate('/gio-hang');
    }
  }

  async function handleGenerateAffiliateLink() {
    if (!product) return;
    setCreating(true);
    setCopyStatus('');
    try {
      let affiliateId = session?.persona?.affiliateId || session?.user?.id;
      let affiliateName = session?.persona?.name || session?.user?.email;
      const isAffiliate =
        session?.mode === 'supabase'
          ? session?.user?.role === 'affiliate'
          : session?.persona?.role === 'affiliate';

      if (!isAffiliate || !affiliateId) {
        if (session?.mode === 'demo' && typeof onQuickSwitchAffiliate === 'function') {
          const switched = onQuickSwitchAffiliate();
          affiliateId = switched?.persona?.affiliateId;
          affiliateName = switched?.persona?.name;
        } else {
          throw new Error('Cần đăng nhập tài khoản Đoàn viên Affiliate để tạo link.');
        }
      }

      const link = await createAffiliateLink({
        affiliateId,
        affiliateName,
        productId: product.id,
        platform: selectedPlatform,
        token: session?.accessToken
      });
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const basePath = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');
      const shareUrl = `${origin}${basePath}/r/${link.code}`;
      const caption = `[OCOP Đồng Nai] ${product.title} — Giá tham khảo ${formatVnd(product.priceVnd)}. Đặt hàng chính hãng tại: ${shareUrl}`;
      setCreatedLink({ ...link, shareUrl, caption });
    } catch (err) {
      setCopyStatus(err?.message || 'Không thể tạo link chia sẻ.');
    } finally {
      setCreating(false);
    }
  }

  async function copyText(text, label) {
    try {
      await navigator.clipboard.writeText(text);
      setCopyStatus(`Đã sao chép ${label}!`);
    } catch {
      setCopyStatus(`Không thể sao chép tự động; vui lòng copy ${label} thủ công.`);
    }
  }

  if (loading) {
    return (
      <div className="bg-surface border border-line rounded-2xl p-6 animate-pulse space-y-4">
        <div className="h-6 bg-stone-200 rounded w-1/3" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="aspect-[4/3] bg-stone-200 rounded-2xl" />
          <div className="space-y-3">
            <div className="h-8 bg-stone-200 rounded w-3/4" />
            <div className="h-24 bg-stone-200 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (errorMsg || !product) {
    return (
      <div className="bg-surface border border-line rounded-2xl p-8 text-center space-y-4">
        <h1 className="text-xl font-bold text-ink">{errorMsg || 'Không tìm thấy sản phẩm OCOP'}</h1>
        <p className="text-sm text-muted">Sản phẩm có thể đang chờ duyệt hoặc đường dẫn không còn hợp lệ.</p>
        <Link
          to="/gian-hang/nha-vuon-ba-tu"
          className="min-h-[44px] px-5 rounded-xl bg-brand text-white text-sm font-semibold inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          <span>Về Hồ sơ Nhà vườn Ba Tư</span>
        </Link>
      </div>
    );
  }

  const producer = product.producer;
  const batchCode = product.batchCode || product.sku;
  const seasonLog = product.seasonLog === undefined ? fetchSeasonLogByBatch(batchCode) : product.seasonLog;
  const traceRelativeUrl = '/nhat-ky/' + encodeURIComponent(batchCode);
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const basePath = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');
  const fullTraceUrl = `${origin}${basePath}${traceRelativeUrl}`;
  const hostedTrace = /^https?:/.test(fullTraceUrl) && !/^(localhost|127\.0\.0\.1|\[::1\])$/.test(window.location.hostname);
  const qrDataUri = buildTraceQrSvgDataUri(fullTraceUrl);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/"
            className="min-h-[44px] px-3.5 rounded-xl border border-line bg-surface hover:bg-canvas text-sm font-semibold text-ink inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            <span>Về danh mục</span>
          </Link>
          {traceOpen && <TraceDialog batchCode={batchCode} qrSrc={qrDataUri} traceRoute={traceRelativeUrl} publicLink={hostedTrace} onClose={() => setTraceOpen(false)} />}

          {producer && (
            <Link
              to={`/gian-hang/${producer.slug}`}
              className="min-h-[44px] px-3.5 rounded-xl border border-line bg-surface hover:border-brand text-sm font-semibold text-ink inline-flex items-center gap-2"
            >
              <Store className="w-4 h-4 text-brand" aria-hidden="true" />
              <span>Hồ sơ {producer.businessName.split('—')[0]}</span>
            </Link>
          )}
        </div>
        <span className="font-mono text-xs text-muted">
          SKU: {product.sku} · Lô: {batchCode}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Product Artwork + QR Truy xuất & Nhật ký mùa vụ */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-surface border border-line rounded-2xl overflow-hidden">
            <img
              src={product.imageUrl}
              alt={product.title}
              width="640"
              height="480"
              className="w-full aspect-[4/3] object-cover"
            />
          </div>

          {/* QR Truy xuất mùa vụ */}
          <section className="bg-surface border border-blue-300 rounded-2xl p-5 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-brand flex items-center gap-1.5">
                  <QrCode className="w-4 h-4" aria-hidden="true" />
                  <span>QR Truy xuất Nhật ký mùa vụ</span>
                </p>
                <h2 className="text-base font-bold text-ink mt-0.5">
                  Minh bạch chăm sóc → thu hoạch → đóng gói (Lô {batchCode})
                </h2>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <img
                src={qrDataUri}
                alt={`Mã QR dẫn tới nhật ký mùa vụ ${batchCode}`}
                width="148"
                height="148"
                className="w-36 h-36 rounded-xl border border-line bg-white shrink-0"
              />
              <div className="space-y-2 flex-1">
                {seasonLog?.milestones?.map((m) => (
                  <div key={m.stage} className="text-xs border-l-2 border-brand pl-2.5">
                    <p className="font-bold text-ink">
                      {m.stage} <span className="font-mono text-muted">({m.date})</span>
                    </p>
                    <p className="text-muted line-clamp-1">{m.detail}</p>
                  </div>
                ))}
                <div className="flex flex-wrap gap-2 pt-1">
                  <button type="button" className="ocop-secondary" onClick={() => setTraceOpen(true)}><QrCode size={16} /> Phóng to QR</button>
                  <Link
                    to={traceRelativeUrl}
                    className="min-h-[44px] px-4 rounded-xl bg-ink hover:bg-stone-800 text-white text-xs sm:text-sm font-semibold inline-flex items-center gap-2"
                  >
                    <Sprout className="w-4 h-4 text-emerald-400" aria-hidden="true" />
                    <span>Mở nhật ký mùa vụ đầy đủ</span>
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </Link>
                </div>
              </div>
            </div>
          </section>

          {producer && (
            <section className="bg-surface border border-line rounded-2xl p-5 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted">Chủ vườn / Cơ sở sản xuất</p>
                  <h2 className="text-lg font-bold text-ink mt-0.5">{producer.businessName}</h2>
                </div>
                <Link
                  to={`/gian-hang/${producer.slug}`}
                  className="min-h-[44px] px-3.5 rounded-xl border border-line bg-canvas hover:border-brand text-xs sm:text-sm font-semibold text-ink inline-flex items-center gap-1.5 shrink-0"
                >
                  <Store className="w-4 h-4 text-brand" aria-hidden="true" />
                  <span>Hồ sơ nhà vườn</span>
                </Link>
              </div>
              <p className="text-sm text-muted leading-relaxed">{producer.story}</p>
              <div className="pt-2 border-t border-line text-xs text-muted space-y-1.5">
                <p className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-brand shrink-0" aria-hidden="true" />
                  <span>{producer.area}</span>
                </p>
                <p className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-brand shrink-0" aria-hidden="true" />
                  <span>{producer.publicContact}</span>
                </p>
              </div>
            </section>
          )}
        </div>

        {/* Right: Pricing, Add to Cart, Marketplace Links & Affiliate */}
        <div className="lg:col-span-6 space-y-4">
          <section className="bg-surface border border-line rounded-2xl p-5 sm:p-6 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <OcopStarBadge stars={product.ocopStars} />
              {product.certStatus === 'verified_pilot' ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-emerald-900 border border-blue-200">
                  <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>OCOP minh họa (Dữ liệu mẫu)</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-200">
                  <ShieldAlert className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Chứng nhận chưa kiểm chứng bản gốc</span>
                </span>
              )}
            </div>

            <h1 className="text-2xl font-bold text-ink leading-snug">{product.title}</h1>

            <div className="p-4 rounded-xl bg-canvas border border-line flex flex-wrap items-baseline justify-between gap-3 tabular-nums">
              <div>
                <p className="text-xs text-muted">Giá tham khảo ({product.unit})</p>
                <p className="text-2xl font-extrabold text-ink">{formatVnd(product.priceVnd)}</p>
                <p className="text-[11px] text-muted mt-1">
                  Cập nhật giá: {formatDateTimeVn(product.priceUpdatedAt)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted">Số lượng hiện có</p>
                <p className="text-xl font-bold text-brand">{product.stock} {product.unit}</p>
                <p className="text-[11px] text-accent mt-0.5">
                  Hoa hồng CTV mẫu: {formatBpsPercent(product.commissionRateBps)}
                </p>
              </div>
            </div>

            <div className="space-y-2 text-sm text-ink leading-relaxed">
              <p>
                <span className="font-semibold">Quy cách:</span> {product.spec}
              </p>
              <p className="text-muted">{product.description}</p>
            </div>

            {/* Đặt hàng trực tiếp / Thêm vào giỏ hàng -> Màn 4 */}
            <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-300 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-bold text-ink">Đặt mua sản phẩm mẫu</span>
                <div className="inline-flex items-center gap-2 tabular-nums">
                  <label htmlFor="detail-qty" className="text-xs font-semibold text-muted">
                    Số lượng:
                  </label>
                  <input
                    id="detail-qty"
                    type="number"
                    min="1"
                    max="99"
                    value={qty}
                    onChange={(e) => setQty(Math.max(1, Math.min(99, Number(e.target.value) || 1)))}
                    className="w-20 min-h-[44px] px-3 rounded-xl border border-line bg-surface text-sm font-bold text-center"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={() => handleAddCart({ goToCart: false })}
                  className="flex-1 min-h-[48px] px-4 rounded-xl border border-brand bg-surface hover:bg-blue-50 text-brand text-sm font-bold inline-flex items-center justify-center gap-2"
                >
                  <ShoppingCart className="w-4 h-4" aria-hidden="true" />
                  <span>Thêm vào giỏ hàng</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAddCart({ goToCart: true })}
                  className="flex-1 min-h-[48px] px-5 rounded-xl bg-brand hover:bg-brand-hover text-white text-sm font-bold inline-flex items-center justify-center gap-2"
                >
                  <span>Đặt hàng ngay</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>

              {cartFeedback && (
                <p className="text-xs font-semibold text-brand flex items-center justify-between gap-2" role="status">
                  <span>{cartFeedback}</span>
                  <Link to="/gio-hang" className="underline font-bold">
                    Mở giỏ hàng →
                  </Link>
                </p>
              )}
            </div>

            {/* Marketplace Links */}
            <div className="space-y-2 pt-2 border-t border-line">
              <h2 className="text-sm font-bold text-ink">Hoặc xem gian hàng trên sàn đối tác</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {product.listings?.map((lst) => (
                  <a
                    key={lst.id}
                    href={lst.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-h-[44px] px-3.5 py-2 rounded-xl border border-line bg-canvas hover:border-brand flex items-center justify-between gap-2 text-sm font-semibold text-ink"
                  >
                    <span className="inline-flex items-center gap-2">
                      <PlatformBadge platform={lst.platform} />
                      <span className="text-xs text-muted">{lst.isDemoTarget ? 'Đích demo' : 'Chính thức'}</span>
                    </span>
                    <ExternalLink className="w-4 h-4 text-muted shrink-0" aria-hidden="true" />
                  </a>
                ))}
              </div>
            </div>
          </section>

          {/* Affiliate Quick Link Generator */}
          <section className="bg-surface border border-line rounded-2xl p-5 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted">Mở rộng · Đoàn viên Affiliate</p>
                <h2 className="text-base font-bold text-ink">Tạo &amp; sao chép link chia sẻ cá nhân</h2>
              </div>
              <Link
                to="/chu-co-so/video-studio"
                className="min-h-[40px] px-3 rounded-xl border border-line bg-canvas text-xs font-semibold text-ink inline-flex items-center gap-1.5"
              >
                <Video className="w-4 h-4 text-accent" aria-hidden="true" />
                <span>Kịch bản quay</span>
              </Link>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5">
              <div className="flex-1">
                <label htmlFor="detail-aff-platform" className="sr-only">
                  Chọn sàn đích cho link chia sẻ
                </label>
                <select
                  id="detail-aff-platform"
                  value={selectedPlatform}
                  onChange={(e) => setSelectedPlatform(e.target.value)}
                  className="w-full min-h-[44px] px-3 rounded-xl border border-line bg-canvas text-sm text-ink"
                >
                  {product.listings?.map((lst) => (
                    <option key={lst.id} value={lst.platform}>
                      {PLATFORM_META[lst.platform]?.label || lst.platform}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                disabled={creating}
                onClick={handleGenerateAffiliateLink}
                className="min-h-[44px] px-4 rounded-xl border border-brand bg-blue-50 text-brand text-sm font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <Share2 className="w-4 h-4" aria-hidden="true" />
                <span>{creating ? 'Đang tạo...' : 'Tạo link Affiliate mẫu'}</span>
              </button>
            </div>

            {copyStatus && (
              <p className="text-xs font-medium text-brand bg-blue-50 border border-blue-200 rounded-xl px-3 py-2" aria-live="polite">
                {copyStatus}
              </p>
            )}

            {createdLink && (
              <div className="p-3.5 rounded-xl bg-canvas border border-line space-y-2">
                <code className="block p-2 rounded-lg bg-surface border border-line font-mono text-xs text-ink break-all">
                  {createdLink.shareUrl}
                </code>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => copyText(createdLink.shareUrl, 'đường dẫn affiliate')}
                    className="min-h-[40px] px-3 rounded-xl bg-ink text-white text-xs font-semibold inline-flex items-center gap-1.5"
                  >
                    <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Sao chép link</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => copyText(createdLink.caption, 'caption đăng bài')}
                    className="min-h-[40px] px-3 rounded-xl border border-line bg-surface text-xs font-semibold text-ink inline-flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5 text-brand" aria-hidden="true" />
                    <span>Sao chép caption</span>
                  </button>
                  <Link
                    to={`/r/${createdLink.code}`}
                    className="min-h-[40px] px-3 rounded-xl border border-blue-300 bg-blue-50 text-xs font-semibold text-brand inline-flex items-center gap-1.5"
                  >
                    <span>Mở /r/{createdLink.code}</span>
                    <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                  </Link>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

// =========================================================================
// MÀN 1: HỒ SƠ NHÀ VƯỜN (NỔI BẬT NHÀ VƯỜN BA TƯ — 2,5 HA LONG KHÁNH)
// =========================================================================
export function ProducerDetailPage() {
  const { slug } = useParams();
  const [data, setData] = useState({ producer: null, products: [] });
  const [loading, setLoading] = useState(true);
  const [addedSlug, setAddedSlug] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await fetchProducerBySlug(slug || 'nha-vuon-ba-tu');
        if (!cancelled) setData(res);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (loading) {
    return <div className="bg-surface border border-line rounded-2xl p-6 animate-pulse h-48" />;
  }

  if (!data.producer) {
    return (
      <div className="bg-surface border border-line rounded-2xl p-8 text-center space-y-3">
        <h1 className="text-xl font-bold text-ink">Không tìm thấy hồ sơ nhà vườn OCOP</h1>
        <Link to="/" className="min-h-[44px] px-5 rounded-xl bg-brand text-white text-sm font-semibold inline-flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          <span>Quay lại danh mục</span>
        </Link>
      </div>
    );
  }

  const isBaTu = data.producer.slug === 'nha-vuon-ba-tu';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link
          to="/"
          className="min-h-[44px] px-3.5 rounded-xl border border-line bg-surface text-sm font-semibold text-ink inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          <span>Về Chợ OCOP</span>
        </Link>
        <Link
          to="/chu-co-so/dang-nhanh"
          className="min-h-[44px] px-4 rounded-xl bg-brand hover:bg-brand-hover text-white text-sm font-semibold inline-flex items-center gap-2"
        >
          <Mic className="w-4 h-4" aria-hidden="true" />
          <span>Đăng sản phẩm nhanh ảnh &amp; mic</span>
        </Link>
      </div>

      {/* Hồ sơ nhà vườn */}
      <section className="bg-surface border border-line rounded-2xl p-5 sm:p-7 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-brand">Hồ sơ nhà vườn</span>
            <OcopStarBadge stars={data.producer.ocopStars} />
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 border border-amber-200 text-amber-900">
            {data.producer.certStatusLabel}
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-ink">{data.producer.businessName}</h1>
        <p className="text-sm sm:text-base text-muted leading-relaxed">{data.producer.story}</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
          <div className="p-3.5 rounded-xl bg-canvas border border-line text-xs space-y-1">
            <p className="font-bold text-ink flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-brand shrink-0" aria-hidden="true" />
              <span>Vị trí &amp; Quy mô vườn</span>
            </p>
            <p className="text-muted">{data.producer.area}</p>
            {data.producer.farmSize && <p className="font-semibold text-ink">{data.producer.farmSize}</p>}
          </div>
          <div className="p-3.5 rounded-xl bg-canvas border border-line text-xs space-y-1">
            <p className="font-bold text-ink flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-brand shrink-0" aria-hidden="true" />
              <span>Chứng nhận OCOP minh họa</span>
            </p>
            <p className="text-muted">Mã tham chiếu mẫu: <span className="font-mono">{data.producer.certRefNo}</span></p>
            <p className="text-muted">{data.producer.publicContact}</p>
          </div>
          <div className="p-3.5 rounded-xl bg-canvas border border-line text-xs space-y-1">
            <p className="font-bold text-ink flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-accent shrink-0" aria-hidden="true" />
              <span>Thanh niên hỗ trợ tại vườn</span>
            </p>
            {isBaTu ? (
              <>
                <p className="text-ink">1. Đoàn viên Minh Anh (Phường Xuân An)</p>
                <p className="text-ink">2. Đoàn viên Hoàng Phúc (CĐ Đồng Nai)</p>
              </>
            ) : (
              <p className="text-muted">Đội hình thanh niên chuyển đổi số địa phương</p>
            )}
          </div>
        </div>
      </section>

      {/* Sản phẩm của nhà vườn */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-bold text-ink">
            Sản phẩm từ vườn ({data.products.length} mặt hàng · 38.000–120.000 ₫/kg)
          </h2>
          <Link to="/gio-hang" className="text-sm font-bold text-brand underline">
            Mở giỏ hàng →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.products.map((product) => (
            <article key={product.id} className="bg-surface border border-line rounded-2xl overflow-hidden flex flex-col justify-between">
              <Link to={`/san-pham/${product.slug}`} className="block bg-canvas border-b border-line">
                <img
                  src={product.imageUrl}
                  alt={product.title}
                  width="640"
                  height="480"
                  className="w-full aspect-[4/3] object-cover"
                />
              </Link>
              <div className="p-4 space-y-2.5 flex-1 flex flex-col justify-between">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-muted">
                    <span className="font-mono">{product.sku}</span>
                    <span className="font-mono">Lô QR: {product.batchCode || product.sku}</span>
                  </div>
                  <h3 className="font-bold text-ink text-base leading-snug">{product.title}</h3>
                  <div className="flex items-baseline justify-between tabular-nums">
                    <span className="font-extrabold text-lg text-ink">{formatVnd(product.priceVnd)}</span>
                    <span className="text-xs text-muted">/ {product.unit}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <Link
                    to={`/san-pham/${product.slug}`}
                    className="flex-1 min-h-[44px] px-3 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs sm:text-sm font-semibold inline-flex items-center justify-center gap-1.5"
                  >
                    <QrCode className="w-4 h-4" aria-hidden="true" />
                    <span>Chi tiết &amp; QR</span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      addToCart(product, 1);
                      setAddedSlug(product.slug);
                    }}
                    className="min-h-[44px] px-3 rounded-xl border border-line bg-canvas hover:border-brand text-xs sm:text-sm font-semibold text-ink inline-flex items-center gap-1"
                  >
                    <ShoppingCart className="w-4 h-4 text-brand" aria-hidden="true" />
                    <span>{addedSlug === product.slug ? 'Đã thêm' : 'Giỏ'}</span>
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
