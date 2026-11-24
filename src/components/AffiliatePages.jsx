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
  Sparkles
} from 'lucide-react';
import {
  createAffiliateLink,
  deactivateAffiliateLink,
  fetchAffiliateCommission,
  fetchAffiliateLinks,
  fetchPublicCatalog
} from '../services/ocopStore';
import { formatBpsPercent, formatDateTimeVn, formatVnd, normalizeVi, PLATFORM_META } from '../utils/formatters';
import { OcopStarBadge, PlatformBadge } from './StatusBadges';

function AffiliateRoleGate({ onSwitchAffiliate }) {
  return (
    <div className="bg-surface border border-amber-300 rounded-2xl p-6 sm:p-8 text-center space-y-4 max-w-xl mx-auto">
      <AlertTriangle className="w-10 h-10 text-accent mx-auto" aria-hidden="true" />
      <h1 className="text-xl font-bold text-ink">Khu vực dành cho Đoàn viên Affiliate</h1>
      <p className="text-sm text-muted">
        Bạn chưa kích hoạt vai trò Đoàn viên Affiliate. Chuyển nhanh sang tài khoản Đoàn viên mẫu (Nguyễn Thảo Vy) để bấm tạo link, tải Media Kit và kiểm tra ví hoa hồng.
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        <button
          type="button"
          onClick={onSwitchAffiliate}
          className="min-h-[44px] px-5 rounded-xl bg-brand hover:bg-brand-hover text-white text-sm font-semibold"
        >
          Tham gia với tài khoản Đoàn viên mẫu
        </button>
        <Link
          to="/"
          className="min-h-[44px] px-5 rounded-xl border border-line bg-canvas text-sm font-semibold text-ink inline-flex items-center"
        >
          Về danh mục sản phẩm
        </Link>
      </div>
    </div>
  );
}

// =========================================================================
// MÀN 1 AFFILIATE: KHÁM PHÁ SẢN PHẨM
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
    if (platformFilter !== 'all' && !p.listings?.some((l) => l.platform === platformFilter)) return false;
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
      const baseOrigin = typeof window !== 'undefined' ? window.location.origin : '';
      const basePath = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');
      const shareUrl = `${baseOrigin}${basePath}/r/${created.code}`;
      setCreatedBanner({ ...created, shareUrl, title: product.title });
      setStatusMsg(`Đã tạo link ${created.code} cho ${product.title}.`);
    } catch (err) {
      setStatusMsg(err?.message || 'Không thể tạo link chia sẻ.');
    }
  }

  return (
    <div className="space-y-5">
      <section className="bg-surface border border-line rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-brand flex items-center gap-1.5">
            <Compass className="w-4 h-4" aria-hidden="true" />
            <span>App Đoàn viên Affiliate · Màn 1/3</span>
          </p>
          <h1 className="text-xl sm:text-2xl font-bold text-ink">Khám phá sản phẩm OCOP &amp; Lấy link</h1>
          <p className="text-xs sm:text-sm text-muted mt-1">
            Xin chào <strong>{affiliateName}</strong> — chọn sản phẩm đã công bố, xem tỷ lệ hoa hồng minh bạch và tạo link cá nhân trong 1 chạm.
          </p>
        </div>
        <Link
          to="/affiliate/link-kit"
          className="min-h-[44px] px-4 rounded-xl border border-line bg-canvas text-sm font-semibold text-ink inline-flex items-center gap-2 shrink-0"
        >
          <Link2 className="w-4 h-4 text-brand" aria-hidden="true" />
          <span>Quản lý link đã tạo</span>
        </Link>
      </section>

      <div className="flex flex-col sm:flex-row gap-2.5">
        <input
          type="search"
          aria-label="Tìm sản phẩm OCOP để chia sẻ"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Tìm theo tên sản phẩm, SKU, địa bàn..."
          className="flex-1 min-h-[44px] px-3.5 rounded-xl border border-line bg-surface text-sm"
        />
        <select
          aria-label="Lọc theo sàn khả dụng"
          value={platformFilter}
          onChange={(e) => setPlatformFilter(e.target.value)}
          className="min-h-[44px] px-3 rounded-xl border border-line bg-surface text-sm"
        >
          <option value="all">Mọi sàn TMĐT</option>
          <option value="tiktok">TikTok Shop</option>
          <option value="shopee">Shopee</option>
          <option value="lazada">Lazada</option>
        </select>
      </div>

      {statusMsg && (
        <p className="text-xs sm:text-sm text-emerald-950 bg-blue-50 border border-blue-200 rounded-xl p-3" role="status">
          {statusMsg}
        </p>
      )}

      {createdBanner && (
        <div className="bg-blue-50 border border-blue-300 rounded-2xl p-4 space-y-2">
          <p className="text-sm font-bold text-ink">Link vừa tạo: {createdBanner.title}</p>
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
              <span>Copy link</span>
            </button>
            <Link
              to={`/r/${createdBanner.code}`}
              className="min-h-[44px] px-4 rounded-xl border border-line bg-surface text-xs sm:text-sm font-semibold text-ink inline-flex items-center gap-1.5"
            >
              <span>Thử /r/{createdBanner.code}</span>
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
            const defaultPlatform =
              platformFilter !== 'all' && p.listings?.some((l) => l.platform === platformFilter)
                ? platformFilter
                : p.listings?.[0]?.platform || 'tiktok';
            return (
              <article key={p.id} className="bg-surface border border-line rounded-2xl p-4 flex flex-col justify-between gap-3">
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <OcopStarBadge stars={p.ocopStars} />
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-canvas border border-line text-muted">
                      {p.mediaKitReady ? 'Media Kit sẵn sàng' : 'Chỉ ảnh cơ bản'}
                    </span>
                  </div>
                  <h2 className="text-base font-bold text-ink leading-snug">{p.title}</h2>
                  <p className="text-xs text-muted">{p.commissionCondition}</p>
                  <div className="flex items-baseline justify-between tabular-nums pt-1">
                    <span className="font-extrabold text-lg text-ink">{formatVnd(p.priceVnd)}</span>
                    <span className="text-sm font-bold text-accent">
                      Hoa hồng {formatBpsPercent(p.commissionRateBps)}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {p.listings?.map((lst) => (
                      <PlatformBadge key={lst.id} platform={lst.platform} />
                    ))}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleCreateLink(p, defaultPlatform)}
                  className="w-full min-h-[44px] px-4 rounded-xl bg-brand hover:bg-brand-hover text-white text-sm font-semibold inline-flex items-center justify-center gap-2"
                >
                  <Share2 className="w-4 h-4" aria-hidden="true" />
                  <span>Tạo link ({PLATFORM_META[defaultPlatform]?.shortLabel || defaultPlatform})</span>
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
// MÀN 2 AFFILIATE: LINK VÀ MEDIA KIT
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

  function buildShareUrl(code) {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const basePath = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');
    return `${origin}${basePath}/r/${code}`;
  }

  async function handleCopy(text, id, label) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setNotice(`Đã sao chép ${label}.`);
      setTimeout(() => setCopiedId(''), 2000);
    } catch {
      setNotice(`Trình duyệt chặn tự động copy; hãy sao chép thủ công.`);
    }
  }

  async function handleShare(link) {
    const shareUrl = buildShareUrl(link.code);
    const title = link.product?.title || 'Đặc sản OCOP Đồng Nai';
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title,
          text: `Ủng hộ ${title} chuẩn OCOP Đồng Nai:`,
          url: shareUrl
        });
        return;
      } catch {
        // user cancelled or unsupported -> fall through to copy
      }
    }
    await handleCopy(shareUrl, `share-${link.id}`, 'đường dẫn chia sẻ (Web Share fallback)');
  }

  async function handleDeactivate(link) {
    try {
      await deactivateAffiliateLink({
        id: link.id,
        affiliateId,
        token: session?.accessToken
      });
      setNotice(`Đã vô hiệu hóa link ${link.code}.`);
      await refresh();
    } catch (err) {
      setNotice(err?.message || 'Không thể vô hiệu hóa link.');
    }
  }

  function downloadKitBrief(link) {
    const title = link.product?.title || link.productId;
    const shareUrl = buildShareUrl(link.code);
    const content = [
      `MEDIA KIT OCOP ĐỒNG NAI — ${title}`,
      `Mã SKU: ${link.product?.sku || ''}`,
      `Giá tham khảo: ${formatVnd(link.product?.priceVnd || 0)}`,
      `Link chia sẻ cá nhân: ${shareUrl}`,
      ``,
      `CAPTION GỢI Ý:`,
      `Đặc sản ${link.product?.area || 'Đồng Nai'} chuẩn OCOP ${link.product?.ocopStars || 4} sao! ${link.product?.spec || ''}`,
      `Đặt hàng ủng hộ nông sản thanh niên tại: ${shareUrl}`
    ].join('\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mediakit-${link.code}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-5">
      <section className="bg-surface border border-line rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-brand">App Đoàn viên Affiliate · Màn 2/3</p>
          <h1 className="text-xl sm:text-2xl font-bold text-ink">Link cá nhân &amp; Media Kit ({links.length})</h1>
          <p className="text-xs sm:text-sm text-muted mt-1">
            Mỗi đường dẫn /r/:code chỉ tính lượt bấm khi khách chủ động chuyển sang sàn, loại bỏ lượt xem trước link của ứng dụng chat.
          </p>
        </div>
        <Link
          to="/affiliate/kham-pha"
          className="min-h-[44px] px-4 rounded-xl bg-brand hover:bg-brand-hover text-white text-sm font-semibold inline-flex items-center gap-2 shrink-0"
        >
          <Sparkles className="w-4 h-4" aria-hidden="true" />
          <span>Tạo thêm link mới</span>
        </Link>
      </section>

      {notice && (
        <p className="text-xs sm:text-sm bg-blue-50 border border-blue-200 text-emerald-950 rounded-xl p-3" role="status">
          {notice}
        </p>
      )}

      {loading ? (
        <div className="bg-surface border border-line rounded-2xl p-6 animate-pulse h-36" />
      ) : links.length === 0 ? (
        <div className="bg-surface border border-line rounded-2xl p-8 text-center space-y-3">
          <p className="font-bold text-ink">Bạn chưa có đường dẫn affiliate nào</p>
          <Link
            to="/affiliate/kham-pha"
            className="min-h-[44px] px-5 rounded-xl bg-brand text-white text-sm font-semibold inline-flex items-center"
          >
            Chọn sản phẩm đầu tiên
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {links.map((link) => {
            const shareUrl = buildShareUrl(link.code);
            const caption = `[OCOP Đồng Nai] ${link.product?.title || ''} — ${formatVnd(link.product?.priceVnd || 0)}. Đặt tại: ${shareUrl}`;
            return (
              <article key={link.id} className="bg-surface border border-line rounded-2xl p-4 sm:p-5 space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <PlatformBadge platform={link.platform} />
                      <span className="font-mono text-xs font-bold text-ink">/{link.code}</span>
                      {!link.active && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-stone-200 text-stone-800">
                          Đã vô hiệu hóa
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
                  <button
                    type="button"
                    onClick={() => handleCopy(shareUrl, `url-${link.id}`, 'link')}
                    className="min-h-[44px] px-4 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs sm:text-sm font-semibold inline-flex items-center gap-1.5"
                  >
                    {copiedId === `url-${link.id}` ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>Copy link</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopy(caption, `cap-${link.id}`, 'caption mẫu')}
                    className="min-h-[44px] px-3.5 rounded-xl border border-line bg-canvas text-xs sm:text-sm font-semibold text-ink inline-flex items-center gap-1.5"
                  >
                    <Copy className="w-4 h-4" aria-hidden="true" />
                    <span>Copy caption</span>
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
                    <Download className="w-4 h-4 text-accent" aria-hidden="true" />
                    <span>Tải Kit (.txt)</span>
                  </button>
                  <Link
                    to={`/r/${link.code}`}
                    className="min-h-[44px] px-3.5 rounded-xl border border-line bg-canvas text-xs sm:text-sm font-semibold text-ink inline-flex items-center gap-1.5"
                  >
                    <span>Mở /r/{link.code}</span>
                    <ExternalLink className="w-4 h-4" aria-hidden="true" />
                  </Link>
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
// MÀN 3 AFFILIATE: HOA HỒNG (APPEND-ONLY LEDGER VIEW)
// =========================================================================
export function AffiliateCommissionPage({ session, onQuickSwitchAffiliate }) {
  const isAffiliate =
    session?.mode === 'supabase' ? session?.user?.role === 'affiliate' : session?.persona?.role === 'affiliate';
  const affiliateId = session?.persona?.affiliateId || session?.user?.id || null;

  const [data, setData] = useState({
    summary: { pendingVnd: 0, availableVnd: 0, paidVnd: 0, clawedBackVnd: 0 },
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
            <span>App Đoàn viên Affiliate · Màn 3/3</span>
          </p>
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-200">
            Dữ liệu đối soát mô phỏng Pilot (Chưa kích hoạt chi trả tiền thật)
          </span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-ink">Sổ hoa hồng minh bạch theo từng đơn</h1>
        <p className="text-xs sm:text-sm text-muted">
          Bản demo không thu thập số tài khoản ngân hàng hay thực hiện chuyển khoản thật. Sổ cái hoạt động theo nguyên tắc chỉ ghi nối (append-only); khi đơn bị hoàn trả, hệ thống ghi thêm bút toán đảo.
        </p>
      </section>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 tabular-nums">
        <div className="bg-surface border border-line rounded-2xl p-4">
          <p className="text-xs text-muted">Chờ hết hạn đổi trả sàn</p>
          <p className="text-2xl font-extrabold text-accent mt-1">{formatVnd(data.summary.pendingVnd)}</p>
        </div>
        <div className="bg-surface border border-blue-300 rounded-2xl p-4">
          <p className="text-xs text-muted">Khả dụng (Đã đối soát mẫu)</p>
          <p className="text-2xl font-extrabold text-brand mt-1">{formatVnd(data.summary.availableVnd)}</p>
        </div>
        <div className="bg-surface border border-line rounded-2xl p-4">
          <p className="text-xs text-muted">Đã đối soát chi trả / Đã hoàn</p>
          <p className="text-2xl font-extrabold text-ink mt-1">
            {formatVnd(data.summary.paidVnd)}{' '}
            <span className="text-xs font-normal text-rose-700">
              (Đảo: {formatVnd(data.summary.clawedBackVnd)})
            </span>
          </p>
        </div>
      </div>

      {/* Ledger entries */}
      {loading ? (
        <div className="bg-surface border border-line rounded-2xl p-6 animate-pulse h-36" />
      ) : data.entries.length === 0 ? (
        <div className="bg-surface border border-line rounded-2xl p-8 text-center text-sm text-muted">
          Chưa có bút toán hoa hồng nào cho tài khoản này.
        </div>
      ) : (
        <div className="space-y-3">
          {data.entries.map((entry) => {
            const isCredit = entry.direction === 'credit';
            return (
              <article key={entry.id} className="bg-surface border border-line rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 tabular-nums">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${
                        entry.state === 'available'
                          ? 'bg-blue-50 text-emerald-900 border-blue-200'
                          : entry.state === 'clawed_back'
                            ? 'bg-rose-50 text-rose-900 border-rose-200'
                            : 'bg-amber-50 text-amber-900 border-amber-200'
                      }`}
                    >
                      {entry.state === 'available'
                        ? 'Khả dụng'
                        : entry.state === 'clawed_back'
                          ? 'Bút toán đảo / Hoàn'
                          : entry.state === 'paid'
                            ? 'Đã chi trả mẫu'
                            : 'Chờ đối soát'}
                    </span>
                    {entry.order && <PlatformBadge platform={entry.order.platform} />}
                    <span className="font-mono text-xs text-muted">{entry.order?.externalOrderId || entry.orderId}</span>
                  </div>
                  <p className="text-sm font-bold text-ink">
                    {entry.order?.productTitle || 'Đơn hàng Pilot'} ({entry.order?.sku || 'SKU'})
                  </p>
                  <p className="text-xs text-muted">
                    {entry.note} · Cơ sở tính: {formatVnd(entry.order?.netAmountVnd || 0)} ×{' '}
                    {formatBpsPercent(entry.order?.commissionRateBps || 0)}
                  </p>
                </div>
                <div className="text-left sm:text-right shrink-0">
                  <p className={`text-lg font-extrabold ${isCredit ? 'text-brand' : 'text-rose-700'}`}>
                    {isCredit ? '+' : '-'}
                    {formatVnd(entry.amountVnd)}
                  </p>
                  <p className="text-[11px] text-muted">{formatDateTimeVn(entry.createdAt)}</p>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
