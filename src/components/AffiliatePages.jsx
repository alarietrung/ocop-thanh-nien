import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Share2,
  Copy,
  Check,
  ExternalLink,
  Download,
  Ban,
  Compass,
  Link2,
  Wallet,
  AlertTriangle,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import {
  createAffiliateLink,
  deactivateAffiliateLink,
  fetchAffiliateCommission,
  fetchAffiliateLinks,
  fetchPublicCatalog
} from '../services/ocopStore';
import { formatBpsPercent, formatDateTimeVn, formatVnd, normalizeVi, PLATFORM_META } from '../utils/formatters';
import { OcopStarBadge, OrderStatusBadge, PlatformBadge } from './StatusBadges';

function AffiliateRoleGate({ onSwitchAffiliate }) {
  return (
    <div className="bg-surface border border-amber-300 rounded-2xl p-6 sm:p-8 text-center space-y-4 max-w-xl mx-auto">
      <AlertTriangle className="w-10 h-10 text-brand mx-auto" aria-hidden="true" />
      <h1 className="text-xl font-bold text-ink">Khu vực dành cho Đoàn viên hỗ trợ bán hàng</h1>
      <p className="text-sm text-muted">
        Bấm nút dưới để bật chế độ thử vai Đoàn viên Minh Anh (dữ liệu mẫu cục bộ, không cấp quyền hệ thống thật) để tạo link giới thiệu, tải bộ chia sẻ và xem đối soát hoa hồng ước tính.
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        <button
          type="button"
          onClick={onSwitchAffiliate}
          className="min-h-[46px] px-5 rounded-xl bg-brand hover:bg-brand-hover text-white text-sm font-bold"
        >
          Bật chế độ thử vai Đoàn viên Minh Anh
        </button>
        <Link
          to="/"
          className="min-h-[46px] px-5 rounded-xl border border-line bg-canvas text-sm font-semibold text-ink inline-flex items-center"
        >
          Về cửa hàng
        </Link>
      </div>
    </div>
  );
}

function buildShareHref(code) {
  const isFile = typeof window !== 'undefined' && window.location.protocol === 'file:';
  if (isFile) return `#/r/${code}`;
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const basePath = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');
  return `${origin}${basePath}/r/${code}`;
}

// =========================================================================
// MÀN 1 ĐOÀN VIÊN: CHỌN SẢN PHẨM & TẠO LINK GIỚI THIỆU
// =========================================================================
export function AffiliateDiscoverPage({ session, onQuickSwitchAffiliate }) {
  const isAffiliate =
    session?.mode === 'supabase' ? session?.user?.role === 'affiliate' : session?.persona?.role === 'affiliate';
  const affiliateId = session?.persona?.affiliateId || session?.user?.id || null;
  const affiliateName = session?.persona?.name || session?.user?.email || '';

  const [products, setProducts] = useState([]);
  const [query, setQuery] = useState('');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [createdBanner, setCreatedBanner] = useState(null);
  const [statusMsg, setStatusMsg] = useState('');

  useEffect(() => {
    fetchPublicCatalog({ pageSize: 50 }).then((res) => {
      setProducts(res.items || []);
      setLoading(false);
    });
  }, []);

  if (!isAffiliate || !affiliateId) {
    return <AffiliateRoleGate onSwitchAffiliate={onQuickSwitchAffiliate} />;
  }

  const qNorm = normalizeVi(query);
  const visible = products.filter((p) => {
    if (
      platformFilter !== 'all' &&
      platformFilter !== 'direct_ocop' &&
      !p.listings?.some((l) => l.platform === platformFilter)
    ) {
      return false;
    }
    if (qNorm && !normalizeVi(`${p.title} ${p.sku} ${p.area}`).includes(qNorm)) return false;
    return true;
  });

  async function handleCreateLink(product, chosenPlatform) {
    try {
      const created = await createAffiliateLink({
        affiliateId,
        affiliateName,
        productId: product.id,
        platform: chosenPlatform,
        token: session?.accessToken
      });
      const shareUrl = buildShareHref(created.code);
      setCreatedBanner({ ...created, shareUrl, title: product.title });
      setStatusMsg(`Đã tạo link giới thiệu ${created.code} cho ${product.title}.`);
    } catch (err) {
      setStatusMsg(err?.message || 'Không thể tạo link giới thiệu.');
    }
  }

  return (
    <div className="space-y-5">
      <section className="bg-surface border border-line rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-brand flex items-center gap-1.5">
            <Compass className="w-4 h-4" aria-hidden="true" />
            <span>Khu vực Đoàn viên hỗ trợ · Bước 1/3</span>
          </p>
          <h1 className="text-xl sm:text-2xl font-extrabold text-ink">Chọn nông sản &amp; Tạo link giới thiệu</h1>
          <p className="text-sm text-muted mt-1">
            Xin chào <strong>{affiliateName}</strong> — tạo link giới thiệu để khách bấm mua trực tiếp tại Chợ OCOP và tự động đối soát đơn + hoa hồng ước tính.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <Link to="/affiliate/link-kit" className="ocop-secondary">
            <Link2 className="w-4 h-4" aria-hidden="true" />
            <span>Link &amp; Bộ chia sẻ</span>
          </Link>
          <Link to="/affiliate/hoa-hong" className="ocop-primary">
            <Wallet className="w-4 h-4" aria-hidden="true" />
            <span>Đối soát hoa hồng</span>
          </Link>
        </div>
      </section>

      <div className="flex flex-col sm:flex-row gap-2.5">
        <input
          type="search"
          aria-label="Tìm nông sản OCOP để giới thiệu"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Tìm theo tên nông sản, mã SP, địa bàn..."
          className="flex-1 min-h-[44px] px-3.5 rounded-xl border border-line bg-surface text-sm"
        />
        <select
          aria-label="Lọc theo kênh giới thiệu"
          value={platformFilter}
          onChange={(e) => setPlatformFilter(e.target.value)}
          className="min-h-[44px] px-3 rounded-xl border border-line bg-surface text-sm"
        >
          <option value="all">Ưu tiên mua trực tiếp Chợ OCOP</option>
          <option value="direct_ocop">Đặt trực tiếp Chợ OCOP</option>
          <option value="tiktok">Kênh đối tác TikTok</option>
          <option value="shopee">Kênh đối tác Shopee</option>
          <option value="lazada">Kênh đối tác Lazada</option>
        </select>
      </div>

      {statusMsg && (
        <p className="text-sm font-medium text-blue-950 bg-blue-50 border border-blue-200 rounded-xl p-3" role="status">
          {statusMsg}
        </p>
      )}

      {createdBanner && (
        <div className="bg-blue-50 border-2 border-brand rounded-2xl p-4 space-y-2.5">
          <p className="text-sm font-bold text-ink">Link giới thiệu vừa tạo: {createdBanner.title}</p>
          <div className="flex flex-wrap items-center gap-2">
            <code className="flex-1 px-3 py-2 rounded-xl bg-surface border border-line font-mono text-xs break-all">
              {createdBanner.shareUrl}
            </code>
            <button
              type="button"
              onClick={() => navigator.clipboard?.writeText(createdBanner.shareUrl)}
              className="min-h-[44px] px-4 rounded-xl bg-brand text-white text-xs sm:text-sm font-semibold inline-flex items-center gap-1.5"
            >
              <Copy className="w-4 h-4" aria-hidden="true" />
              <span>Sao chép link</span>
            </button>
            <Link
              to={`/r/${createdBanner.code}`}
              className="min-h-[44px] px-4 rounded-xl border border-brand bg-white text-xs sm:text-sm font-bold text-brand inline-flex items-center gap-1.5"
            >
              <span>Bấm thử /r/{createdBanner.code}</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      )}

      {loading ? (
        <div className="bg-surface border border-line rounded-2xl p-6 animate-pulse h-40" />
      ) : visible.length === 0 ? (
        <div className="bg-surface border border-line rounded-2xl p-8 text-center text-sm text-muted">
          Không tìm thấy sản phẩm nào khớp từ khóa.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {visible.map((p) => {
            const targetPlatform = platformFilter === 'all' ? 'direct_ocop' : platformFilter;
            return (
              <article key={p.id} className="bg-surface border border-line rounded-2xl p-4 flex flex-col justify-between gap-3">
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <OcopStarBadge stars={p.ocopStars} showIllustrative={false} />
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-canvas border border-line text-muted">
                      Bộ chia sẻ sẵn sàng
                    </span>
                  </div>
                  <h2 className="text-base font-bold text-ink leading-snug">{p.title}</h2>
                  <p className="text-xs text-muted">{p.commissionCondition}</p>
                  <div className="flex items-baseline justify-between tabular-nums pt-1">
                    <span className="font-extrabold text-lg text-ink">{formatVnd(p.priceVnd)}</span>
                    <span className="text-sm font-bold text-brand">
                      Hoa hồng ước tính {formatBpsPercent(p.commissionRateBps)}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <PlatformBadge platform="direct_ocop" />
                    {p.listings?.map((lst) => (
                      <PlatformBadge key={lst.id} platform={lst.platform} />
                    ))}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleCreateLink(p, targetPlatform)}
                  className="w-full min-h-[46px] px-4 rounded-xl bg-brand hover:bg-brand-hover text-white text-sm font-bold inline-flex items-center justify-center gap-2"
                >
                  <Share2 className="w-4 h-4" aria-hidden="true" />
                  <span>
                    Tạo link giới thiệu ({PLATFORM_META[targetPlatform]?.shortLabel || 'OCOP'})
                  </span>
                </button>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

// =========================================================================
// MÀN 2 ĐOÀN VIÊN: LINK GIỚI THIỆU & BỘ CHIA SẺ
// =========================================================================
export function AffiliateLinksPage({ session, onQuickSwitchAffiliate }) {
  const isAffiliate =
    session?.mode === 'supabase' ? session?.user?.role === 'affiliate' : session?.persona?.role === 'affiliate';
  const affiliateId = session?.persona?.affiliateId || session?.user?.id || null;

  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState('');
  const [notice, setNotice] = useState('');

  async function refresh() {
    if (!isAffiliate || !affiliateId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await fetchAffiliateLinks({ affiliateId, token: session?.accessToken });
      setLinks(data || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [affiliateId, isAffiliate]);

  if (!isAffiliate || !affiliateId) {
    return <AffiliateRoleGate onSwitchAffiliate={onQuickSwitchAffiliate} />;
  }

  async function handleCopy(text, id, label) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setNotice(`Đã sao chép ${label}.`);
      setTimeout(() => setCopiedId(''), 2000);
    } catch {
      setNotice('Trình duyệt chặn tự động sao chép; vui lòng sao chép thủ công.');
    }
  }

  async function handleShare(link) {
    const shareUrl = buildShareHref(link.code);
    const title = link.product?.title || 'Đặc sản OCOP Đồng Nai';
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title,
          text: `Ủng hộ ${title} tại Chợ OCOP Thanh Niên Đồng Nai:`,
          url: shareUrl
        });
        return;
      } catch {
        // user cancelled -> fall through to copy
      }
    }
    await handleCopy(shareUrl, `share-${link.id}`, 'đường dẫn chia sẻ');
  }

  async function handleDeactivate(link) {
    try {
      await deactivateAffiliateLink({
        id: link.id,
        affiliateId,
        token: session?.accessToken
      });
      setNotice(`Đã tạm khóa link ${link.code}.`);
      await refresh();
    } catch (err) {
      setNotice(err?.message || 'Không thể khóa link.');
    }
  }

  function downloadKitBrief(link) {
    const title = link.product?.title || link.productId;
    const shareUrl = buildShareHref(link.code);
    const content = [
      `BỘ CHIA SẺ NÔNG SẢN ĐỒNG NAI — ${title}`,
      `Mã sản phẩm: ${link.product?.sku || ''}`,
      `Giá tham khảo: ${formatVnd(link.product?.priceVnd || 0)}`,
      `Link giới thiệu cá nhân: ${shareUrl}`,
      '',
      'LỜI GIỚI THIỆU GỢI Ý:',
      `Đặc sản ${link.product?.area || 'Đồng Nai'} có nhật ký mùa vụ QR minh bạch! ${link.product?.spec || ''}`,
      `Đặt mua trực tiếp ủng hộ nhà vườn tại: ${shareUrl}`
    ].join('\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bo-chia-se-${link.code}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-5">
      <section className="bg-surface border border-line rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-brand">Khu vực Đoàn viên hỗ trợ · Bước 2/3</p>
          <h1 className="text-xl sm:text-2xl font-extrabold text-ink">Link giới thiệu &amp; Bộ chia sẻ ({links.length})</h1>
          <p className="text-sm text-muted mt-1">
            Mỗi đường dẫn <span className="font-mono">/r/:code</span> chỉ đếm lượt bấm hợp lệ khi khách chủ động nhấn mua, rồi tự động gắn đơn vào sổ đối soát hoa hồng.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <Link to="/affiliate/hoa-hong" className="ocop-secondary">
            <Wallet className="w-4 h-4" aria-hidden="true" />
            <span>Xem đối soát &amp; hoa hồng</span>
          </Link>
          <Link to="/affiliate/kham-pha" className="ocop-primary">
            <Sparkles className="w-4 h-4" aria-hidden="true" />
            <span>Tạo thêm link mới</span>
          </Link>
        </div>
      </section>

      {notice && (
        <p className="text-sm font-medium bg-blue-50 border border-blue-200 text-blue-950 rounded-xl p-3" role="status">
          {notice}
        </p>
      )}

      {loading ? (
        <div className="bg-surface border border-line rounded-2xl p-6 animate-pulse h-36" />
      ) : links.length === 0 ? (
        <div className="bg-surface border border-line rounded-2xl p-8 text-center space-y-3">
          <p className="font-bold text-ink">Bạn chưa có link giới thiệu nào</p>
          <Link to="/affiliate/kham-pha" className="ocop-primary">
            Chọn sản phẩm đầu tiên
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {links.map((link) => {
            const shareUrl = buildShareHref(link.code);
            const caption = `[Chợ OCOP Thanh Niên Đồng Nai] ${link.product?.title || ''} — ${formatVnd(link.product?.priceVnd || 0)}. Xem QR & đặt mua tại: ${shareUrl}`;
            return (
              <article key={link.id} className="bg-surface border border-line rounded-2xl p-4 sm:p-5 space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <PlatformBadge platform={link.platform} />
                      <span className="font-mono text-xs font-bold text-ink">/{link.code}</span>
                      {!link.active && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-200 text-slate-800">
                          Đã khóa
                        </span>
                      )}
                    </div>
                    <h2 className="text-base font-bold text-ink">{link.product?.title || link.productId}</h2>
                  </div>
                  <div className="text-right tabular-nums">
                    <p className="text-xs text-muted">Lượt bấm hợp lệ</p>
                    <p className="text-lg font-extrabold text-brand">{link.clicksCount || 0}</p>
                  </div>
                </div>

                <code className="block px-3 py-2 rounded-xl bg-canvas border border-line font-mono text-xs text-ink break-all">
                  {shareUrl}
                </code>

                <div className="flex flex-wrap gap-2">
                  <Link
                    to={`/r/${link.code}`}
                    className="min-h-[44px] px-4 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs sm:text-sm font-bold inline-flex items-center gap-1.5"
                  >
                    <span>Bấm thử /r/{link.code} (mua hàng)</span>
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleCopy(shareUrl, `url-${link.id}`, 'link giới thiệu')}
                    className="min-h-[44px] px-3.5 rounded-xl border border-line bg-canvas text-xs sm:text-sm font-semibold text-ink inline-flex items-center gap-1.5"
                  >
                    {copiedId === `url-${link.id}` ? <Check className="w-4 h-4 text-brand" /> : <Copy className="w-4 h-4" />}
                    <span>Sao chép link</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopy(caption, `cap-${link.id}`, 'lời giới thiệu mẫu')}
                    className="min-h-[44px] px-3.5 rounded-xl border border-line bg-canvas text-xs sm:text-sm font-semibold text-ink inline-flex items-center gap-1.5"
                  >
                    <Copy className="w-4 h-4" aria-hidden="true" />
                    <span>Sao chép lời giới thiệu</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleShare(link)}
                    className="min-h-[44px] px-3.5 rounded-xl border border-line bg-canvas text-xs sm:text-sm font-semibold text-ink inline-flex items-center gap-1.5"
                  >
                    <Share2 className="w-4 h-4 text-brand" aria-hidden="true" />
                    <span>Chia sẻ</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => downloadKitBrief(link)}
                    className="min-h-[44px] px-3.5 rounded-xl border border-line bg-canvas text-xs sm:text-sm font-semibold text-ink inline-flex items-center gap-1.5"
                  >
                    <Download className="w-4 h-4 text-brand" aria-hidden="true" />
                    <span>Tải bộ chia sẻ (.txt)</span>
                  </button>
                  {link.active && (
                    <button
                      type="button"
                      onClick={() => handleDeactivate(link)}
                      className="min-h-[44px] px-3.5 rounded-xl border border-rose-200 bg-rose-50 text-xs sm:text-sm font-semibold text-rose-900 inline-flex items-center gap-1.5"
                    >
                      <Ban className="w-4 h-4" aria-hidden="true" />
                      <span>Khóa link</span>
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

// =========================================================================
// MÀN 3 ĐOÀN VIÊN: ĐỐI SOÁT ĐƠN TỪ LINK & HOA HỒNG ƯỚC TÍNH
// =========================================================================
export function AffiliateCommissionPage({ session, onQuickSwitchAffiliate }) {
  const isAffiliate =
    session?.mode === 'supabase' ? session?.user?.role === 'affiliate' : session?.persona?.role === 'affiliate';
  const affiliateId = session?.persona?.affiliateId || session?.user?.id || null;

  const [data, setData] = useState({
    summary: { pendingVnd: 0, availableVnd: 0, paidVnd: 0, clawedBackVnd: 0 },
    orders: [],
    entries: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAffiliate || !affiliateId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchAffiliateCommission({ affiliateId, token: session?.accessToken }).then((res) => {
      setData(res);
      setLoading(false);
    });
  }, [affiliateId, isAffiliate, session?.accessToken]);

  if (!isAffiliate || !affiliateId) {
    return <AffiliateRoleGate onSwitchAffiliate={onQuickSwitchAffiliate} />;
  }

  return (
    <div className="space-y-5">
      <section className="bg-surface border border-line rounded-2xl p-5 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-bold uppercase tracking-wider text-brand flex items-center gap-1.5">
            <Wallet className="w-4 h-4" aria-hidden="true" />
            <span>Khu vực Đoàn viên hỗ trợ · Bước 3/3</span>
          </p>
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-950 border border-amber-200">
            Đối soát minh họa — Không chi trả tiền thật
          </span>
        </div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-ink">
          Đối soát đơn hàng từ link giới thiệu &amp; Hoa hồng ước tính
        </h1>
        <p className="text-sm text-muted">
          Mọi đơn khách bấm từ link <span className="font-mono">/r/:code</span> và đặt mua đều hiển thị rõ mã đơn, mã giới thiệu, trạng thái xử lý của nhà vườn và hoa hồng ước tính.
        </p>
      </section>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 tabular-nums">
        <div className="bg-surface border border-line rounded-2xl p-4">
          <p className="text-xs font-semibold text-muted">Hoa hồng ước tính (Đơn đang xử lý)</p>
          <p className="text-2xl font-extrabold text-amber-800 mt-1">{formatVnd(data.summary.pendingVnd)}</p>
        </div>
        <div className="bg-surface border-2 border-blue-200 rounded-2xl p-4">
          <p className="text-xs font-semibold text-muted">Khả dụng (Đơn đã hoàn thành mẫu)</p>
          <p className="text-2xl font-extrabold text-brand mt-1">{formatVnd(data.summary.availableVnd)}</p>
        </div>
        <div className="bg-surface border border-line rounded-2xl p-4">
          <p className="text-xs font-semibold text-muted">Tổng đơn ghi nhận / Bút toán đảo</p>
          <p className="text-2xl font-extrabold text-ink mt-1">
            {data.orders?.length || 0} đơn{' '}
            <span className="text-xs font-semibold text-rose-700">
              (Đảo: {formatVnd(data.summary.clawedBackVnd)})
            </span>
          </p>
        </div>
      </div>

      {/* Attributed Orders Reconciliation Table/Cards */}
      <section className="bg-surface border border-line rounded-2xl p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base sm:text-lg font-bold text-ink">
            Đơn hàng đối soát theo link giới thiệu ({data.orders?.length || 0})
          </h2>
          <Link to="/affiliate/link-kit" className="text-xs sm:text-sm font-bold text-brand hover:underline">
            Về danh sách link →
          </Link>
        </div>

        {loading ? (
          <div className="bg-canvas rounded-xl p-6 animate-pulse h-28" />
        ) : !data.orders || data.orders.length === 0 ? (
          <div className="bg-canvas border border-line rounded-xl p-6 text-center text-sm text-muted">
            Chưa có đơn hàng nào từ link giới thiệu của bạn. Hãy bấm thử 1 link trong mục &ldquo;Link &amp; Bộ chia sẻ&rdquo; rồi đặt mua mẫu!
          </div>
        ) : (
          <div className="space-y-2.5">
            {data.orders.map((ord) => (
              <article
                key={ord.id}
                className="p-4 rounded-xl bg-canvas border border-line flex flex-col sm:flex-row sm:items-center justify-between gap-3 tabular-nums"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-sm font-extrabold text-brand">
                      {ord.orderCode || ord.externalOrderId}
                    </span>
                    <OrderStatusBadge status={ord.status} />
                    {ord.affiliateCode && (
                      <span className="font-mono text-xs px-2 py-0.5 rounded bg-blue-50 border border-blue-200 text-brand font-bold">
                        Link: /{ord.affiliateCode}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-bold text-ink">{ord.productTitle}</p>
                  <p className="text-xs text-muted">
                    Giá trị tính hoa hồng: {formatVnd(ord.netAmountVnd || ord.grossAmountVnd)} ×{' '}
                    {formatBpsPercent(ord.commissionRateBps || 1000)} · {formatDateTimeVn(ord.orderedAt)}
                  </p>
                </div>
                <div className="sm:text-right shrink-0 space-y-1">
                  <p className="text-xs text-muted">Hoa hồng ước tính</p>
                  <p className="text-lg font-extrabold text-brand">+{formatVnd(ord.commissionVnd)}</p>
                  <Link
                    to={`/tra-cuu-don?code=${encodeURIComponent(ord.orderCode || ord.externalOrderId)}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline"
                  >
                    <span>Tra cứu đơn</span>
                    <ExternalLink className="w-3 h-3" aria-hidden="true" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Append-only Ledger Entries */}
      <section className="space-y-3">
        <h2 className="text-base font-bold text-ink">Chi tiết sổ bút toán hoa hồng (Chỉ ghi nối)</h2>
        {loading ? (
          <div className="bg-surface border border-line rounded-2xl p-6 animate-pulse h-32" />
        ) : data.entries.length === 0 ? (
          <div className="bg-surface border border-line rounded-2xl p-8 text-center text-sm text-muted">
            Chưa có bút toán hoa hồng nào cho tài khoản này.
          </div>
        ) : (
          <div className="space-y-2.5">
            {data.entries.map((entry) => {
              const isCredit = entry.direction === 'credit';
              return (
                <article
                  key={entry.id}
                  className="bg-surface border border-line rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 tabular-nums"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${
                          entry.state === 'available'
                            ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                            : entry.state === 'clawed_back'
                              ? 'bg-rose-50 text-rose-900 border-rose-200'
                              : 'bg-amber-50 text-amber-950 border-amber-200'
                        }`}
                      >
                        {entry.state === 'available'
                          ? 'Khả dụng (Đã hoàn thành)'
                          : entry.state === 'clawed_back'
                            ? 'Bút toán đảo / Hủy'
                            : entry.state === 'paid'
                              ? 'Đã chi trả mẫu'
                              : 'Ước tính — Chờ hoàn thành'}
                      </span>
                      {entry.order && <PlatformBadge platform={entry.order.platform} />}
                      <span className="font-mono text-xs text-muted">
                        {entry.order?.orderCode || entry.order?.externalOrderId || entry.orderId}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-ink">
                      {entry.order?.productTitle || 'Đơn hàng giới thiệu'}
                    </p>
                    <p className="text-xs text-muted">{entry.note}</p>
                  </div>
                  <div className="text-left sm:text-right shrink-0">
                    <p className={`text-lg font-extrabold ${isCredit ? 'text-brand' : 'text-rose-700'}`}>
                      {isCredit ? '+' : '-'}
                      {formatVnd(entry.amountVnd)}
                    </p>
                    <p className="text-xs text-muted">{formatDateTimeVn(entry.createdAt)}</p>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
