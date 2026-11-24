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
  UserCheck,
  Clock,
  HeartHandshake,
  MapPinned,
  BellRing,
  CalendarClock,
  CheckCircle2
} from 'lucide-react';
import {
  addToCart,
  createAffiliateLink,
  createSupportRequest,
  fetchProducerBySlug,
  fetchProductBySlug,
  fetchSeasonLogByBatch,
  fetchSupportRequests,
  getVolunteerTotals
} from '../services/ocopStore';
import { formatBpsPercent, formatDateTimeVn, formatVnd, PLATFORM_META } from '../utils/formatters';
import { buildPublicTraceUrl, buildTraceQrSvgDataUri } from '../utils/qrSvg';
import { OcopStarBadge, PlatformBadge } from './StatusBadges';

// =========================================================================
// MÀN 3: CHI TIẾT SẢN PHẨM (+ QR TRUY XUẤT & NHẬT KÝ MÙA VỤ + MUA TRỰC TIẾP)
// =========================================================================
export function ProductDetailPage({ session, onQuickSwitchAffiliate }) {
  const [traceOpen, setTraceOpen] = useState(false);
  const { slug } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [qty, setQty] = useState(1);
  const [preorderMode, setPreorderMode] = useState(false);
  const [cartFeedback, setCartFeedback] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('direct_ocop');
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
          setSelectedPlatform('direct_ocop');
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
    addToCart(product, qty, { preorder: preorderMode });
    setCartFeedback(
      `Đã thêm ${qty} × ${product.title}${preorderMode ? ' (đặt trước đợt hái minh họa)' : ''} vào giỏ hàng!`
    );
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
        if (session?.mode !== 'supabase' && typeof onQuickSwitchAffiliate === 'function') {
          const switched = onQuickSwitchAffiliate();
          affiliateId = switched?.persona?.affiliateId;
          affiliateName = switched?.persona?.name;
        } else {
          throw new Error('Cần chọn vai trò Đoàn viên hỗ trợ để tạo link giới thiệu.');
        }
      }

      const link = await createAffiliateLink({
        affiliateId,
        affiliateName,
        productId: product.id,
        platform: selectedPlatform,
        token: session?.accessToken
      });
      const isFile = typeof window !== 'undefined' && window.location.protocol === 'file:';
      const origin = typeof window !== 'undefined' && !isFile ? window.location.origin : '';
      const basePath = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');
      const shareUrl = isFile ? `#/r/${link.code}` : `${origin}${basePath}/r/${link.code}`;
      const caption = `[Chợ OCOP Thanh Niên Đồng Nai] ${product.title} — Giá tham khảo ${formatVnd(product.priceVnd)}. Xem nhật ký QR & đặt mua tại: ${shareUrl}`;
      setCreatedLink({ ...link, shareUrl, caption });
    } catch (err) {
      setCopyStatus(err?.message || 'Không thể tạo link giới thiệu.');
    } finally {
      setCreating(false);
    }
  }

  async function copyText(text, label) {
    try {
      await navigator.clipboard.writeText(text);
      setCopyStatus(`Đã sao chép ${label}!`);
    } catch {
      setCopyStatus(`Không thể sao chép tự động; vui lòng sao chép ${label} thủ công.`);
    }
  }

  if (loading) {
    return (
      <div className="bg-surface border border-line rounded-2xl p-6 animate-pulse space-y-4">
        <div className="h-6 bg-blue-100 rounded w-1/3" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="aspect-[4/3] bg-blue-100 rounded-2xl" />
          <div className="space-y-3">
            <div className="h-8 bg-blue-100 rounded w-3/4" />
            <div className="h-24 bg-blue-100 rounded" />
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
  const publicTraceUrl = buildPublicTraceUrl(batchCode);
  const qrDataUri = buildTraceQrSvgDataUri(publicTraceUrl);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/"
            className="min-h-[44px] px-3.5 rounded-xl border border-line bg-surface hover:bg-canvas text-sm font-semibold text-ink inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            <span>Về cửa hàng</span>
          </Link>
          {traceOpen && (
            <TraceDialog
              batchCode={batchCode}
              qrSrc={qrDataUri}
              publicUrl={publicTraceUrl}
              traceRoute={traceRelativeUrl}
              onClose={() => setTraceOpen(false)}
            />
          )}

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
          Mã SP: {product.sku} · Lô QR: {batchCode}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Product Photo + Real QR Traceability & Season Log */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-surface border border-line rounded-2xl overflow-hidden">
            <img
              src={product.imageUrl}
              alt={product.title}
              width="640"
              height="480"
              className="w-full aspect-[4/3] object-cover"
            />
            {(seasonLog?.harvestedAtLabel || seasonLog?.verifiedByYouth) && (
              <div className="p-3.5 bg-blue-50/70 border-t border-blue-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                {seasonLog?.harvestedAtLabel && (
                  <span className="inline-flex items-center gap-1.5 font-bold text-ink">
                    <Clock className="w-4 h-4 text-brand shrink-0" aria-hidden="true" />
                    <span>{seasonLog.harvestedAtLabel}</span>
                  </span>
                )}
                {seasonLog?.verifiedByYouth && (
                  <span className="inline-flex items-center gap-1 text-brand font-semibold">
                    <UserCheck className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>{seasonLog.verifiedByYouth}</span>
                  </span>
                )}
              </div>
            )}
          </div>

          {/* QR Truy xuất mùa vụ — Real public URL + 4-module white border */}
          <section className="bg-surface border-2 border-blue-200 rounded-2xl p-5 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-brand flex items-center gap-1.5">
                  <QrCode className="w-4 h-4" aria-hidden="true" />
                  <span>Mã QR truy xuất nhật ký mùa vụ</span>
                </p>
                <h2 className="text-base sm:text-lg font-bold text-ink mt-0.5">
                  Chăm sóc → Thu hoạch → Đóng gói (Lô {batchCode})
                </h2>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="p-2 rounded-2xl bg-white border border-line shadow-sm shrink-0">
                <img
                  src={qrDataUri}
                  alt={`Mã QR dẫn tới nhật ký mùa vụ ${batchCode}`}
                  data-qr-url={publicTraceUrl}
                  width="156"
                  height="156"
                  className="w-36 h-36 sm:w-40 sm:h-40 block"
                />
              </div>
              <div className="space-y-2.5 flex-1 min-w-0">
                {seasonLog?.milestones?.slice(0, 3).map((m) => (
                  <div key={`${m.stage}-${m.date}`} className="text-xs sm:text-sm border-l-2 border-brand pl-2.5">
                    <p className="font-bold text-ink">
                      {m.stage} <span className="font-mono text-xs text-muted">({m.date})</span>
                    </p>
                    <p className="text-xs text-muted line-clamp-2">{m.detail}</p>
                  </div>
                ))}
                <p className="font-mono text-[11px] text-muted break-all bg-canvas rounded-lg px-2.5 py-1.5 border border-line">
                  URL trong QR: {publicTraceUrl}
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    className="ocop-secondary"
                    onClick={() => setTraceOpen(true)}
                  >
                    <QrCode size={16} aria-hidden="true" />
                    <span>Phóng to QR</span>
                  </button>
                  <Link
                    to={traceRelativeUrl}
                    className="min-h-[44px] px-4 rounded-xl bg-ink hover:bg-slate-800 text-white text-sm font-semibold inline-flex items-center gap-2"
                  >
                    <Sprout className="w-4 h-4 text-emerald-400" aria-hidden="true" />
                    <span>Xem nhật ký mùa vụ</span>
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
                  <p className="text-xs font-bold uppercase tracking-wider text-muted">Nhà vườn / Cơ sở sản xuất</p>
                  <h2 className="text-lg font-bold text-ink mt-0.5">{producer.businessName}</h2>
                </div>
                <Link
                  to={`/gian-hang/${producer.slug}`}
                  className="min-h-[44px] px-3.5 rounded-xl border border-line bg-canvas hover:border-brand text-sm font-semibold text-ink inline-flex items-center gap-1.5 shrink-0"
                >
                  <Store className="w-4 h-4 text-brand" aria-hidden="true" />
                  <span>Xem hồ sơ</span>
                </Link>
              </div>
              <p className="text-sm text-muted leading-relaxed">{producer.story}</p>
              <div className="pt-2 border-t border-line text-xs sm:text-sm text-muted space-y-1.5">
                <p className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-brand shrink-0" aria-hidden="true" />
                  <span>{producer.area}</span>
                </p>
                <p className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-brand shrink-0" aria-hidden="true" />
                  <span>{producer.pickupPoint || producer.publicContact}</span>
                </p>
              </div>
            </section>
          )}
        </div>

        {/* Right: Primary Direct Checkout + Youth Referral Link + Secondary Partner Channels */}
        <div className="lg:col-span-6 space-y-4">
          <section className="bg-surface border border-line rounded-2xl p-5 sm:p-6 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <OcopStarBadge stars={product.ocopStars} />
              {product.certStatus === 'verified_pilot' ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-950 border border-blue-200">
                  <ShieldCheck className="w-3.5 h-3.5 text-brand" aria-hidden="true" />
                  <span>Hồ sơ minh họa (Dữ liệu mẫu)</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-950 border border-amber-200">
                  <ShieldAlert className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Chứng nhận chưa kiểm chứng bản gốc</span>
                </span>
              )}
            </div>

            <h1 className="text-2xl font-extrabold text-ink leading-snug">{product.title}</h1>

            <div className="p-4 rounded-xl bg-canvas border border-line flex flex-wrap items-baseline justify-between gap-3 tabular-nums">
              <div>
                <p className="text-xs text-muted">Giá tại vườn ({product.unit})</p>
                <p className="text-2xl sm:text-3xl font-extrabold text-ink">{formatVnd(product.priceVnd)}</p>
                <p className="text-xs text-muted mt-1">
                  Cập nhật: {formatDateTimeVn(product.priceUpdatedAt)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted">Số lượng hiện có</p>
                <p className="text-xl font-bold text-brand">
                  {product.stock} {product.unit}
                </p>
                <p className="text-xs text-muted mt-0.5">
                  Mức ghi nhận CTV mẫu: {formatBpsPercent(product.commissionRateBps)}
                </p>
              </div>
            </div>

            <div className="space-y-2 text-sm sm:text-base text-ink leading-relaxed">
              <p>
                <span className="font-semibold">Quy cách:</span> {product.spec}
              </p>
              <p className="text-muted text-sm">{product.description}</p>
            </div>

            {/* Đặt hàng trực tiếp / Thêm vào giỏ hàng -> Màn 4 */}
            <div className="p-4 sm:p-5 rounded-2xl bg-blue-50/80 border-2 border-brand/30 space-y-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-base font-bold text-ink">Đặt mua trực tiếp từ nhà vườn</span>
                <div className="inline-flex items-center gap-2 tabular-nums">
                  <label htmlFor="detail-qty" className="text-sm font-semibold text-muted">
                    Số lượng:
                  </label>
                  <input
                    id="detail-qty"
                    type="number"
                    min="1"
                    max="99"
                    value={qty}
                    onChange={(e) => setQty(Math.max(1, Math.min(99, Number(e.target.value) || 1)))}
                    className="w-20 min-h-[44px] px-3 rounded-xl border border-line bg-surface text-base font-bold text-center"
                  />
                </div>
              </div>

              {product.preorderWindow && (
                <label className="flex items-start gap-2.5 p-3 rounded-xl bg-white border border-blue-200 cursor-pointer text-xs sm:text-sm">
                  <input
                    type="checkbox"
                    checked={preorderMode}
                    onChange={(e) => setPreorderMode(e.target.checked)}
                    className="mt-1 h-4 w-4 accent-brand shrink-0"
                  />
                  <span>
                    <strong className="text-ink">Giữ suất đặt trước mùa vụ (Minh họa):</strong>{' '}
                    <span className="text-muted">{product.preorderWindow}. Nhà vườn liên hệ xác nhận, không thu cọc.</span>
                  </span>
                </label>
              )}

              <div className="flex flex-col sm:flex-row gap-2.5">
                <button
                  type="button"
                  onClick={() => handleAddCart({ goToCart: false })}
                  className="flex-1 min-h-[48px] px-4 rounded-xl border-2 border-brand bg-surface hover:bg-blue-50 text-brand text-sm font-bold inline-flex items-center justify-center gap-2"
                >
                  <ShoppingCart className="w-4 h-4" aria-hidden="true" />
                  <span>Thêm vào giỏ hàng</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAddCart({ goToCart: true })}
                  className="flex-1 min-h-[48px] px-5 rounded-xl bg-brand hover:bg-brand-hover text-white text-sm font-bold inline-flex items-center justify-center gap-2 shadow-sm"
                >
                  <span>Đặt hàng ngay</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>

              <p className="text-xs text-muted">
                Chọn giao tận nơi hoặc nhận trực tiếp tại vườn (0 ₫). Không thu cọc hay thanh toán trực tuyến thật.
              </p>

              {cartFeedback && (
                <p className="text-sm font-semibold text-brand flex flex-wrap items-center justify-between gap-2 bg-white border border-blue-200 rounded-xl px-3 py-2" role="status">
                  <span>{cartFeedback}</span>
                  <Link to="/gio-hang" className="underline font-bold">
                    Mở giỏ hàng →
                  </Link>
                </p>
              )}
            </div>

            {/* Youth Referral Link Generator (Việt hóa hoàn toàn) */}
            <div className="pt-3 border-t border-line space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-brand">
                    Đoàn viên giới thiệu bán hàng
                  </p>
                  <h2 className="text-base font-bold text-ink">Tạo link giới thiệu &amp; đối soát hoa hồng</h2>
                </div>
                <Link
                  to="/chu-co-so/video-studio"
                  className="min-h-[44px] px-3 rounded-xl border border-line bg-canvas text-xs sm:text-sm font-semibold text-ink inline-flex items-center gap-1.5"
                >
                  <Video className="w-4 h-4 text-brand" aria-hidden="true" />
                  <span>Kịch bản quay</span>
                </Link>
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5">
                <div className="flex-1">
                  <label htmlFor="detail-aff-platform" className="sr-only">
                    Chọn kênh cho link giới thiệu
                  </label>
                  <select
                    id="detail-aff-platform"
                    value={selectedPlatform}
                    onChange={(e) => setSelectedPlatform(e.target.value)}
                    className="w-full min-h-[44px] px-3 rounded-xl border border-line bg-canvas text-sm text-ink"
                  >
                    <option value="direct_ocop">Đặt trực tiếp trên Chợ OCOP (khuyên dùng)</option>
                    {product.listings?.map((lst) => (
                      <option key={lst.id} value={lst.platform}>
                        Kênh đối tác: {PLATFORM_META[lst.platform]?.label || lst.platform}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  disabled={creating}
                  onClick={handleGenerateAffiliateLink}
                  className="min-h-[44px] px-4 rounded-xl border border-brand bg-blue-50 hover:bg-blue-100 text-brand text-sm font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  <Share2 className="w-4 h-4" aria-hidden="true" />
                  <span>{creating ? 'Đang tạo...' : 'Tạo link giới thiệu'}</span>
                </button>
              </div>

              {copyStatus && (
                <p className="text-xs sm:text-sm font-medium text-brand bg-blue-50 border border-blue-200 rounded-xl px-3 py-2" aria-live="polite">
                  {copyStatus}
                </p>
              )}

              {createdLink && (
                <div className="p-3.5 rounded-xl bg-canvas border border-line space-y-2.5">
                  <code className="block p-2.5 rounded-lg bg-surface border border-line font-mono text-xs text-ink break-all">
                    {createdLink.shareUrl}
                  </code>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => copyText(createdLink.shareUrl, 'link giới thiệu')}
                      className="min-h-[44px] px-3.5 rounded-xl bg-ink text-white text-xs sm:text-sm font-semibold inline-flex items-center gap-1.5"
                    >
                      <Copy className="w-4 h-4" aria-hidden="true" />
                      <span>Sao chép link</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => copyText(createdLink.caption, 'nội dung chia sẻ')}
                      className="min-h-[44px] px-3.5 rounded-xl border border-line bg-surface text-xs sm:text-sm font-semibold text-ink inline-flex items-center gap-1.5"
                    >
                      <Check className="w-4 h-4 text-brand" aria-hidden="true" />
                      <span>Sao chép lời giới thiệu</span>
                    </button>
                    <Link
                      to={`/r/${createdLink.code}`}
                      className="min-h-[44px] px-3.5 rounded-xl border border-brand bg-blue-50 text-xs sm:text-sm font-semibold text-brand inline-flex items-center gap-1.5"
                    >
                      <span>Bấm thử link /r/{createdLink.code}</span>
                      <ArrowRight className="w-4 h-4" aria-hidden="true" />
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Secondary optional partner channels */}
            {product.listings?.length > 0 && (
              <details className="pt-2 border-t border-line">
                <summary className="cursor-pointer text-xs sm:text-sm font-semibold text-muted hover:text-brand py-1">
                  Xem thêm kênh sàn đối tác liên kết (minh họa)
                </summary>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                  {product.listings.map((lst) => (
                    <a
                      key={lst.id}
                      href={lst.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="min-h-[44px] px-3.5 py-2 rounded-xl border border-line bg-canvas hover:border-brand flex items-center justify-between gap-2 text-sm font-semibold text-ink"
                    >
                      <span className="inline-flex items-center gap-2">
                        <PlatformBadge platform={lst.platform} />
                        <span className="text-xs text-muted">
                          {lst.isDemoTarget ? 'Liên kết minh họa' : 'Chính thức'}
                        </span>
                      </span>
                      <ExternalLink className="w-4 h-4 text-muted shrink-0" aria-hidden="true" />
                    </a>
                  ))}
                </div>
              </details>
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
  const [supportRequests, setSupportRequests] = useState([]);
  const [supportNotice, setSupportNotice] = useState('');
  const [volunteerTotals, setVolunteerTotals] = useState([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await fetchProducerBySlug(slug || 'nha-vuon-ba-tu');
        if (!cancelled) {
          setData(res);
          if (res.producer?.id) {
            setSupportRequests(fetchSupportRequests(res.producer.id));
          }
          setVolunteerTotals(getVolunteerTotals());
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  function handleOneTapSupport(topic, youthLabel) {
    if (!data.producer) return;
    const created = createSupportRequest({
      producerId: data.producer.id,
      topic,
      assignedYouth: youthLabel,
      note: 'Yêu cầu hỗ trợ một chạm từ trang Hồ sơ nhà vườn.'
    });
    setSupportRequests(fetchSupportRequests(data.producer.id));
    setSupportNotice(`Đã gửi yêu cầu "${created.topic}" tới ${created.assignedYouth} (đã lưu trên thiết bị).`);
  }

  if (loading) {
    return <div className="bg-surface border border-line rounded-2xl p-6 animate-pulse h-48" />;
  }

  if (!data.producer) {
    return (
      <div className="bg-surface border border-line rounded-2xl p-8 text-center space-y-3">
        <h1 className="text-xl font-bold text-ink">Không tìm thấy hồ sơ nhà vườn OCOP</h1>
        <Link
          to="/"
          className="min-h-[44px] px-5 rounded-xl bg-brand text-white text-sm font-semibold inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          <span>Quay lại cửa hàng</span>
        </Link>
      </div>
    );
  }

  const isBaTu = data.producer.slug === 'nha-vuon-ba-tu';
  const prices = data.products.map((p) => p.priceVnd).filter((n) => Number.isFinite(n));
  const minPrice = prices.length ? Math.min(...prices) : 38000;
  const maxPrice = prices.length ? Math.max(...prices) : 120000;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link
          to="/"
          className="min-h-[44px] px-3.5 rounded-xl border border-line bg-surface hover:border-brand text-sm font-semibold text-ink inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          <span>Về Chợ OCOP</span>
        </Link>
        <div className="flex flex-wrap gap-2">
          <Link
            to={`/ban-do-vuon?garden=${encodeURIComponent(data.producer.slug)}`}
            className="min-h-[44px] px-4 rounded-xl border border-brand bg-blue-50 hover:bg-blue-100 text-brand text-sm font-semibold inline-flex items-center gap-2"
          >
            <MapPinned className="w-4 h-4" aria-hidden="true" />
            <span>Bản đồ &amp; Đặt lịch tham quan</span>
          </Link>
          <Link
            to="/chu-co-so/dang-nhanh"
            className="min-h-[44px] px-4 rounded-xl bg-brand hover:bg-brand-hover text-white text-sm font-semibold inline-flex items-center gap-2"
          >
            <Mic className="w-4 h-4" aria-hidden="true" />
            <span>Đăng sản phẩm nhanh (Ảnh &amp; Giọng)</span>
          </Link>
        </div>
      </div>

      {/* Hồ sơ nhà vườn */}
      <section className="bg-surface border border-line rounded-2xl p-5 sm:p-7 space-y-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-brand">
              Màn 1 · Hồ sơ nhà vườn
            </span>
            <OcopStarBadge stars={data.producer.ocopStars} />
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 border border-amber-200 text-amber-950">
            {data.producer.certStatusLabel}
          </span>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink">{data.producer.businessName}</h1>
          <p className="text-sm sm:text-base text-muted leading-relaxed">{data.producer.story}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-1">
          <div className="p-4 rounded-xl bg-canvas border border-line text-sm space-y-1.5">
            <p className="font-bold text-ink flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-brand shrink-0" aria-hidden="true" />
              <span>Vị trí &amp; Quy mô vườn</span>
            </p>
            <p className="text-muted text-xs sm:text-sm">{data.producer.area}</p>
            {data.producer.farmSize && <p className="font-semibold text-ink text-xs sm:text-sm">{data.producer.farmSize}</p>}
            {data.producer.coords && (
              <p className="font-mono text-xs text-muted">
                Tọa độ minh họa: {data.producer.coords.lat.toFixed(4)}°N, {data.producer.coords.lng.toFixed(4)}°E
              </p>
            )}
          </div>

          <div className="p-4 rounded-xl bg-canvas border border-line text-sm space-y-1.5">
            <p className="font-bold text-ink flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-brand shrink-0" aria-hidden="true" />
              <span>Hạng sao OCOP &amp; Điểm nhận</span>
            </p>
            <p className="text-xs sm:text-sm text-ink font-semibold">
              OCOP {data.producer.ocopStars} sao (Minh họa · Mã {data.producer.certRefNo})
            </p>
            <p className="text-xs text-muted">
              {data.producer.pickupPoint || data.producer.publicContact}
            </p>
            {data.producer.pickupHours && (
              <p className="text-xs text-brand font-semibold">Giờ nhận tại vườn: {data.producer.pickupHours}</p>
            )}
          </div>

          <div className="p-4 rounded-xl bg-canvas border border-line text-sm space-y-2">
            <p className="font-bold text-ink flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-brand shrink-0" aria-hidden="true" />
              <span>2 thanh niên hỗ trợ tại vườn</span>
            </p>
            {isBaTu ? (
              <div className="space-y-1.5 text-xs sm:text-sm">
                {volunteerTotals.map((m) => (
                  <div key={m.id} className="flex items-center justify-between gap-2 bg-white rounded-lg px-2.5 py-1.5 border border-line">
                    <div className="min-w-0">
                      <p className="font-semibold text-ink truncate">{m.name}</p>
                      <p className="text-[11px] text-muted truncate">{m.unit}</p>
                    </div>
                    <span className="shrink-0 font-mono text-xs font-bold text-brand">
                      {m.approvedHours}h duyệt
                    </span>
                  </div>
                ))}
                <Link
                  to="/tinh-nguyen"
                  className="inline-flex items-center gap-1 text-xs font-bold text-brand hover:underline pt-1"
                >
                  <HeartHandshake className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Xem &amp; duyệt giờ tình nguyện →</span>
                </Link>
              </div>
            ) : (
              <p className="text-xs sm:text-sm text-muted">
                Đội hình thanh niên chuyển đổi số địa phương hỗ trợ quay dựng &amp; gắn tem QR.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* One-Tap Youth Support Box for 50-year-old Farmer */}
      <section className="bg-surface border-2 border-blue-200 rounded-2xl p-5 space-y-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-brand flex items-center gap-1.5">
              <BellRing className="w-4 h-4" aria-hidden="true" />
              <span>Hỗ trợ nhanh một chạm cho chủ vườn</span>
            </p>
            <h2 className="text-lg font-bold text-ink mt-0.5">
              Gọi Thanh niên hỗ trợ tận vườn (1 chạm)
            </h2>
          </div>
          <Link
            to="/lich-livestream"
            className="min-h-[44px] px-3.5 rounded-xl border border-line bg-canvas hover:border-brand text-xs sm:text-sm font-semibold text-ink inline-flex items-center gap-1.5"
          >
            <CalendarClock className="w-4 h-4 text-brand" aria-hidden="true" />
            <span>Xem lịch livestream vườn</span>
          </Link>
        </div>

        <p className="text-xs sm:text-sm text-muted">
          Chú Ba Tư không cần rành công nghệ — bấm 1 trong 3 nút lớn dưới đây để nhắn đoàn viên phường/xã ghé vườn hỗ trợ.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <button
            type="button"
            onClick={() =>
              handleOneTapSupport(
                'Hỗ trợ chụp ảnh & đăng sản phẩm mới',
                'Đoàn viên Minh Anh (Phường Xuân An)'
              )
            }
            className="min-h-[52px] px-4 py-2.5 rounded-xl bg-brand hover:bg-brand-hover text-white text-sm font-bold text-left inline-flex items-center gap-2 shadow-sm"
          >
            <Mic className="w-5 h-5 shrink-0" aria-hidden="true" />
            <span>Nhờ chụp ảnh &amp; đăng bán</span>
          </button>
          <button
            type="button"
            onClick={() =>
              handleOneTapSupport(
                'Hỗ trợ in & dán tem QR nhật ký lô mới',
                'Đoàn viên Minh Anh (Phường Xuân An)'
              )
            }
            className="min-h-[52px] px-4 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 border border-brand text-brand text-sm font-bold text-left inline-flex items-center gap-2"
          >
            <QrCode className="w-5 h-5 shrink-0" aria-hidden="true" />
            <span>Nhờ dán tem QR mùa vụ</span>
          </button>
          <button
            type="button"
            onClick={() =>
              handleOneTapSupport(
                'Hỗ trợ quay & dẫn phiên livestream cuối tuần',
                'Đoàn viên Hoàng Phúc (CĐ Đồng Nai)'
              )
            }
            className="min-h-[52px] px-4 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 border border-brand text-brand text-sm font-bold text-left inline-flex items-center gap-2"
          >
            <Video className="w-5 h-5 shrink-0" aria-hidden="true" />
            <span>Nhờ hỗ trợ livestream</span>
          </button>
        </div>

        {supportNotice && (
          <p className="text-sm font-semibold text-emerald-900 bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-2" role="status">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-700" aria-hidden="true" />
            <span>{supportNotice}</span>
          </p>
        )}

        {supportRequests.length > 0 && (
          <div className="pt-2 border-t border-line space-y-2">
            <p className="text-xs font-bold text-muted">Yêu cầu hỗ trợ gần đây ({supportRequests.length}):</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {supportRequests.slice(0, 4).map((req) => (
                <div key={req.id} className="p-3 rounded-xl bg-canvas border border-line text-xs flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-bold text-ink truncate">{req.topic}</p>
                    <p className="text-muted truncate">{req.assignedYouth} · {formatDateTimeVn(req.createdAt)}</p>
                  </div>
                  <span className="shrink-0 px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-brand font-semibold">
                    Đã gửi
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Sản phẩm của nhà vườn */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg sm:text-xl font-bold text-ink">
            Sản phẩm từ vườn ({data.products.length} mặt hàng · {formatVnd(minPrice)} – {formatVnd(maxPrice)})
          </h2>
          <Link to="/gio-hang" className="text-sm font-bold text-brand hover:underline">
            Mở giỏ hàng →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.products.map((product) => (
            <article
              key={product.id}
              className="bg-surface border border-line rounded-2xl overflow-hidden flex flex-col justify-between hover:border-brand transition"
            >
              <Link to={`/san-pham/${product.slug}`} className="block bg-canvas border-b border-line relative">
                <img
                  src={product.imageUrl}
                  alt={product.title}
                  width="640"
                  height="480"
                  className="w-full aspect-[4/3] object-cover"
                />
                {product.harvestedAtLabel && (
                  <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-lg bg-white/95 px-2 py-1 text-[11px] font-semibold text-ink border border-blue-100">
                    <Clock className="w-3 h-3 text-brand" aria-hidden="true" />
                    <span>{product.harvestedAtLabel}</span>
                  </span>
                )}
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
