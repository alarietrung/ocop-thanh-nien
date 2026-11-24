import React, { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Plus,
  Send,
  Sparkles,
  ImagePlus,
  Video,
  Camera,
  RotateCcw,
  Download,
  Upload,
  Square,
  Play,
  SwitchCamera,
  AlertTriangle,
  FileSpreadsheet,
  CheckCircle2,
  PackageOpen,
  Trash2,
  Search,
  PackageSearch,
  Mic,
  HeartHandshake
} from 'lucide-react';
import { PRODUCT_CATEGORIES, SAMPLE_CSV_IMPORT_TEMPLATE, VIDEO_TEMPLATES } from '../data/pilotData';
import {
  commitOrderImportRows,
  fetchAllProducers,
  fetchPublicCatalog,
  fetchSellerOrders,
  fetchSellerProducts,
  submitSellerProductForReview,
  updateSellerOrderStatus,
  upsertSellerProduct
} from '../services/ocopStore';
import {
  formatBpsPercent,
  formatDateTimeVn,
  formatVnd,
  parseOrderImportCsv
} from '../utils/formatters';
import { OrderSourceBadge, OrderStatusBadge, PlatformBadge, ProductStatusBadge } from './StatusBadges';

function SellerRoleGate({ onSwitchSeller, roleLabel = 'Chủ cơ sở OCOP' }) {
  return (
    <div className="bg-surface border border-amber-300 rounded-2xl p-6 sm:p-8 text-center space-y-4 max-w-xl mx-auto">
      <AlertTriangle className="w-10 h-10 text-accent mx-auto" aria-hidden="true" />
      <h1 className="text-xl font-bold text-ink">Khu vực dành cho {roleLabel}</h1>
      <p className="text-sm text-muted">
        Bạn đang ở vai trò Khách tham quan hoặc vai trò khác. Trong bản Pilot Demo, bấm nút dưới để chuyển sang tài khoản chủ cơ sở mẫu (Làng bưởi Tân Triều) hoặc chọn vai trò khác ở góc trên.
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        <button
          type="button"
          onClick={onSwitchSeller}
          className="min-h-[44px] px-5 rounded-xl bg-brand hover:bg-brand-hover text-white text-sm font-semibold"
        >
          Chuyển sang Chủ cơ sở mẫu (Demo)
        </button>
        <Link
          to="/"
          className="min-h-[44px] px-5 rounded-xl border border-line bg-canvas text-sm font-semibold text-ink inline-flex items-center"
        >
          Về danh mục công khai
        </Link>
      </div>
    </div>
  );
}

// =========================================================================
// MÀN 1 CHỦ CƠ SỞ: SẢN PHẨM CỦA TÔI
// =========================================================================
export function SellerProductsPage({ session, onQuickSwitchSeller }) {
  const isSeller =
    session?.mode === 'supabase' ? session?.user?.role === 'seller' : session?.persona?.role === 'seller';
  const producerId = session?.persona?.producerId || session?.user?.producerIds?.[0] || null;

  const [items, setItems] = useState([]);
  const [producer, setProducer] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [formOpen, setFormOpen] = useState(false);

  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState('hat-say');
  const [unit, setUnit] = useState('Túi 250g');
  const [spec, setSpec] = useState('');
  const [priceVnd, setPriceVnd] = useState('120000');
  const [stock, setStock] = useState('100');
  const [commissionRateBps, setCommissionRateBps] = useState('1200');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [listingPlatform, setListingPlatform] = useState('shopee');
  const [listingUrl, setListingUrl] = useState('https://shopee.vn/san-pham-ocop-dong-nai-pilot-i.1001.1001');
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', text: '' });

  async function refresh() {
    if (!isSeller || !producerId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetchSellerProducts({ producerId, token: session?.accessToken });
      setItems(res.items || []);
      setProducer(res.producer || null);
    } catch (err) {
      setFeedback({ type: 'error', text: err?.message || 'Không thể tải danh sách sản phẩm của cơ sở.' });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [producerId, isSeller]);

  if (!isSeller || !producerId) {
    return <SellerRoleGate onSwitchSeller={onQuickSwitchSeller} />;
  }

  function startNewDraft() {
    setEditingId(null);
    setTitle('');
    setCategoryId('hat-say');
    setUnit('Hộp 300g');
    setSpec('');
    setPriceVnd('125000');
    setStock('120');
    setCommissionRateBps('1200');
    setDescription('');
    setImageUrl('');
    setListingPlatform('shopee');
    setListingUrl('https://shopee.vn/ocop-dong-nai-pilot-i.1011.2026');
    setFormOpen(true);
    setFeedback({ type: '', text: '' });
  }

  function startEdit(product) {
    setEditingId(product.id);
    setTitle(product.title);
    setCategoryId(product.categoryId);
    setUnit(product.unit);
    setSpec(product.spec);
    setPriceVnd(String(product.priceVnd));
    setStock(String(product.stock));
    setCommissionRateBps(String(product.commissionRateBps));
    setDescription(product.description);
    setImageUrl(product.imageUrl || '');
    const firstListing = product.listings?.[0];
    setListingPlatform(firstListing?.platform || 'shopee');
    setListingUrl(firstListing?.url || '');
    setFormOpen(true);
    setFeedback({ type: '', text: '' });
  }

  function applyLocalTemplateSuggestion() {
    const prodName = title.trim() || 'Đặc sản OCOP Đồng Nai';
    const areaName = producer?.area || 'Đồng Nai';
    setSpec((prev) => prev || `Đóng gói ${unit}, hút chân không giữ nguyên hương vị tự nhiên.`);
    setDescription(
      `${prodName} được sản xuất trực tiếp tại ${areaName} bởi ${producer?.businessName || 'cơ sở OCOP địa phương'}. ` +
        `Nguyên liệu chọn lọc, đóng gói chuẩn ${unit}, phù hợp làm quà biếu đặc sản Đồng Nai và đặt mua nhanh qua sàn TMĐT.`
    );
    setFeedback({
      type: 'info',
      text: 'Đã điền gợi ý mô tả mẫu cục bộ (chưa kích hoạt AI cloud). Bạn hãy đọc lại và chỉnh sửa cho đúng thực tế.'
    });
  }

  function handleImageSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setFeedback({ type: 'error', text: 'Chỉ hỗ trợ ảnh định dạng JPEG, PNG hoặc WebP.' });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setFeedback({ type: 'error', text: 'Ảnh tải lên không vượt quá 2MB để đảm bảo tốc độ di động.' });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setImageUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  }

  async function handleSaveProduct(e) {
    e.preventDefault();
    setSaving(true);
    setFeedback({ type: '', text: '' });
    try {
      const saved = await upsertSellerProduct({
        id: editingId,
        producerId,
        token: session?.accessToken,
        payload: {
          title,
          categoryId,
          unit,
          spec,
          priceVnd: Number(priceVnd),
          stock: Number(stock),
          commissionRateBps: Number(commissionRateBps),
          description,
          imageUrl,
          listings: listingUrl.trim()
            ? [{ platform: listingPlatform, url: listingUrl.trim() }]
            : []
        }
      });
      setFormOpen(false);
      setFeedback({
        type: 'success',
        text: `Đã lưu "${saved.title}" (${saved.status === 'draft' ? 'Bản nháp' : 'Đã cập nhật'}).`
      });
      await refresh();
    } catch (err) {
      setFeedback({ type: 'error', text: err?.message || 'Không thể lưu sản phẩm.' });
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmitReview(product) {
    try {
      await submitSellerProductForReview({
        id: product.id,
        producerId,
        token: session?.accessToken
      });
      setFeedback({
        type: 'success',
        text: `Đã gửi duyệt "${product.title}". Điều phối viên sẽ kiểm tra trước khi công bố ra Chợ OCOP.`
      });
      await refresh();
    } catch (err) {
      setFeedback({ type: 'error', text: err?.message || 'Không thể gửi duyệt sản phẩm.' });
    }
  }

  const filteredItems =
    statusFilter === 'all' ? items : items.filter((p) => p.status === statusFilter);

  return (
    <div className="space-y-5">
      {/* Header + 3-tap action bar */}
      <section className="bg-surface border border-line rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-brand">App Chủ cơ sở · Màn 1/3</p>
          <h1 className="text-xl sm:text-2xl font-bold text-ink">
            Sản phẩm của {producer?.businessName || 'Cơ sở OCOP'}
          </h1>
          <p className="text-xs sm:text-sm text-muted mt-1">
            Thao tác gọn 3 chạm: Tạo bản nháp → Gắn link sàn → Gửi duyệt công bố cho Đoàn viên chia sẻ.
          </p>
        </div>
        <button
          type="button"
          onClick={startNewDraft}
          className="min-h-[48px] px-5 rounded-xl bg-brand hover:bg-brand-hover text-white text-sm font-semibold inline-flex items-center justify-center gap-2 shrink-0"
        >
          <Plus className="w-5 h-5" aria-hidden="true" />
          <span>Thêm sản phẩm mới</span>
        </button>
      </section>

      {feedback.text && (
        <div
          role={feedback.type === 'error' ? 'alert' : 'status'}
          className={`rounded-2xl border p-4 text-sm font-medium ${
            feedback.type === 'error'
              ? 'bg-rose-50 border-rose-300 text-rose-900'
              : feedback.type === 'info'
                ? 'bg-amber-50 border-amber-300 text-amber-900'
                : 'bg-blue-50 border-blue-300 text-emerald-950'
          }`}
        >
          {feedback.text}
        </div>
      )}

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { id: 'all', label: `Tất cả (${items.length})` },
          { id: 'draft', label: 'Bản nháp' },
          { id: 'pending_review', label: 'Chờ duyệt' },
          { id: 'needs_revision', label: 'Cần sửa' },
          { id: 'published', label: 'Đã công bố' }
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setStatusFilter(tab.id)}
            className={`min-h-[44px] px-3.5 rounded-xl text-xs sm:text-sm font-medium border shrink-0 ${
              statusFilter === tab.id
                ? 'bg-ink text-white border-ink'
                : 'bg-surface text-ink border-line hover:border-stone-400'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Create / Edit Draft Form */}
      {formOpen && (
        <form onSubmit={handleSaveProduct} className="bg-surface border border-blue-300 rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-bold text-ink">
              {editingId ? 'Chỉnh sửa sản phẩm OCOP' : 'Tạo bản nháp sản phẩm OCOP'}
            </h2>
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              className="min-h-[40px] px-3 rounded-xl border border-line text-xs font-semibold text-muted"
            >
              Đóng biểu mẫu
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label htmlFor="sp-title" className="block text-xs font-semibold text-ink mb-1">
                Tên sản phẩm chuẩn sàn (VD: Vỏ bưởi sấy dẻo Tân Triều 250g)
              </label>
              <input
                id="sp-title"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full min-h-[44px] px-3 rounded-xl border border-line bg-canvas text-sm"
              />
            </div>

            <div>
              <label htmlFor="sp-cat" className="block text-xs font-semibold text-ink mb-1">
                Nhóm sản phẩm
              </label>
              <select
                id="sp-cat"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full min-h-[44px] px-3 rounded-xl border border-line bg-canvas text-sm"
              >
                {PRODUCT_CATEGORIES.filter((c) => c.id !== 'all').map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="sp-unit" className="block text-xs font-semibold text-ink mb-1">
                Đơn vị / Trọng lượng
              </label>
              <input
                id="sp-unit"
                required
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full min-h-[44px] px-3 rounded-xl border border-line bg-canvas text-sm"
              />
            </div>

            <div>
              <label htmlFor="sp-price" className="block text-xs font-semibold text-ink mb-1">
                Giá tham khảo (VNĐ)
              </label>
              <input
                id="sp-price"
                type="number"
                min="1000"
                max="100000000"
                required
                value={priceVnd}
                onChange={(e) => setPriceVnd(e.target.value)}
                className="w-full min-h-[44px] px-3 rounded-xl border border-line bg-canvas text-sm tabular-nums"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="sp-stock" className="block text-xs font-semibold text-ink mb-1">
                  Tồn kho
                </label>
                <input
                  id="sp-stock"
                  type="number"
                  min="0"
                  max="100000"
                  required
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  className="w-full min-h-[44px] px-3 rounded-xl border border-line bg-canvas text-sm tabular-nums"
                />
              </div>
              <div>
                <label htmlFor="sp-bps" className="block text-xs font-semibold text-ink mb-1">
                  Hoa hồng (bps, 1200=12%)
                </label>
                <input
                  id="sp-bps"
                  type="number"
                  min="100"
                  max="5000"
                  step="50"
                  required
                  value={commissionRateBps}
                  onChange={(e) => setCommissionRateBps(e.target.value)}
                  className="w-full min-h-[44px] px-3 rounded-xl border border-line bg-canvas text-sm tabular-nums"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="sp-spec" className="block text-xs font-semibold text-ink mb-1">
                Quy cách đóng gói &amp; bảo quản
              </label>
              <input
                id="sp-spec"
                required
                value={spec}
                onChange={(e) => setSpec(e.target.value)}
                className="w-full min-h-[44px] px-3 rounded-xl border border-line bg-canvas text-sm"
                placeholder="VD: Đóng túi zip bạc 250g, hạn dùng 6 tháng"
              />
            </div>

            <div className="sm:col-span-2 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label htmlFor="sp-desc" className="text-xs font-semibold text-ink">
                  Mô tả sản phẩm (có nút gợi ý mẫu cục bộ)
                </label>
                <button
                  type="button"
                  onClick={applyLocalTemplateSuggestion}
                  className="min-h-[38px] px-3 rounded-lg border border-amber-300 bg-amber-50 text-xs font-semibold text-amber-900 inline-flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Gợi ý mô tả mẫu cục bộ (Chưa bật AI cloud)</span>
                </button>
              </div>
              <textarea
                id="sp-desc"
                rows={3}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-3 rounded-xl border border-line bg-canvas text-sm"
              />
            </div>

            {/* Listing link */}
            <div>
              <label htmlFor="sp-platform" className="block text-xs font-semibold text-ink mb-1">
                Sàn liên kết chính
              </label>
              <select
                id="sp-platform"
                value={listingPlatform}
                onChange={(e) => setListingPlatform(e.target.value)}
                className="w-full min-h-[44px] px-3 rounded-xl border border-line bg-canvas text-sm"
              >
                <option value="tiktok">TikTok Shop (shop.tiktok.com)</option>
                <option value="shopee">Shopee (shopee.vn)</option>
                <option value="lazada">Lazada (www.lazada.vn)</option>
              </select>
            </div>

            <div>
              <label htmlFor="sp-url" className="block text-xs font-semibold text-ink mb-1">
                Đường dẫn sản phẩm trên sàn (HTTPS)
              </label>
              <input
                id="sp-url"
                type="url"
                required
                value={listingUrl}
                onChange={(e) => setListingUrl(e.target.value)}
                className="w-full min-h-[44px] px-3 rounded-xl border border-line bg-canvas text-sm font-mono text-xs"
              />
            </div>

            {/* Image upload */}
            <div className="sm:col-span-2">
              <label htmlFor="sp-img" className="block text-xs font-semibold text-ink mb-1">
                Ảnh sản phẩm (JPEG/PNG/WebP tối đa 2MB)
              </label>
              <div className="flex flex-wrap items-center gap-3">
                <label
                  htmlFor="sp-img"
                  className="min-h-[44px] px-4 rounded-xl border border-line bg-canvas hover:border-brand text-xs sm:text-sm font-semibold text-ink inline-flex items-center gap-2 cursor-pointer"
                >
                  <ImagePlus className="w-4 h-4 text-brand" aria-hidden="true" />
                  <span>Chọn ảnh từ máy / điện thoại</span>
                </label>
                <input
                  id="sp-img"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageSelect}
                  className="sr-only"
                />
                {imageUrl && (
                  <img
                    src={imageUrl}
                    alt="Xem trước ảnh sản phẩm"
                    className="w-16 h-12 object-cover rounded-lg border border-line"
                  />
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              className="min-h-[44px] px-4 rounded-xl border border-line bg-canvas text-sm font-semibold text-ink"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving}
              className="min-h-[44px] px-6 rounded-xl bg-brand hover:bg-brand-hover text-white text-sm font-semibold disabled:opacity-60"
            >
              {saving ? 'Đang lưu...' : 'Lưu bản nháp vào hệ thống'}
            </button>
          </div>
        </form>
      )}

      {/* Product List */}
      {loading ? (
        <div className="bg-surface border border-line rounded-2xl p-6 animate-pulse h-40" />
      ) : filteredItems.length === 0 ? (
        <div className="bg-surface border border-line rounded-2xl p-8 text-center space-y-3">
          <PackageOpen className="w-10 h-10 text-muted mx-auto" aria-hidden="true" />
          <p className="font-bold text-ink">Chưa có sản phẩm nào trong mục này</p>
          <p className="text-sm text-muted">Bấm &ldquo;Thêm sản phẩm mới&rdquo; để tạo bản nháp trong 3 chạm.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredItems.map((p) => (
            <article key={p.id} className="bg-surface border border-line rounded-2xl p-4 flex flex-col justify-between gap-4">
              <div className="flex gap-3.5">
                <img
                  src={p.imageUrl}
                  alt={p.title}
                  width="120"
                  height="90"
                  className="w-24 h-20 rounded-xl object-cover border border-line shrink-0"
                />
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <ProductStatusBadge status={p.status} />
                    <span className="font-mono text-[11px] text-muted">{p.sku}</span>
                  </div>
                  <h2 className="text-base font-bold text-ink leading-snug line-clamp-2">{p.title}</h2>
                  <p className="text-sm font-bold text-ink tabular-nums">
                    {formatVnd(p.priceVnd)} ·{' '}
                    <span className="text-accent">HH {formatBpsPercent(p.commissionRateBps)}</span> · Tồn {p.stock}
                  </p>
                  {p.reviewNote && (
                    <p className="text-xs text-rose-800 bg-rose-50 border border-rose-200 rounded-lg px-2.5 py-1.5">
                      Ghi chú điều phối: {p.reviewNote}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-line">
                <div className="flex flex-wrap gap-1.5">
                  {p.listings?.map((lst) => (
                    <PlatformBadge key={lst.id} platform={lst.platform} />
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => startEdit(p)}
                    className="min-h-[44px] px-3.5 rounded-xl border border-line bg-canvas text-xs sm:text-sm font-semibold text-ink"
                  >
                    Sửa
                  </button>
                  <Link
                    to={`/chu-co-so/video-studio?sku=${encodeURIComponent(p.sku)}`}
                    className="min-h-[44px] px-3.5 rounded-xl border border-line bg-canvas text-xs sm:text-sm font-semibold text-ink inline-flex items-center gap-1.5"
                  >
                    <Video className="w-4 h-4 text-accent" aria-hidden="true" />
                    <span>Quay video</span>
                  </Link>
                  {(p.status === 'draft' || p.status === 'needs_revision') && (
                    <button
                      type="button"
                      onClick={() => handleSubmitReview(p)}
                      className="min-h-[44px] px-4 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs sm:text-sm font-semibold inline-flex items-center gap-1.5"
                    >
                      <Send className="w-4 h-4" aria-hidden="true" />
                      <span>Gửi duyệt</span>
                    </button>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

// =========================================================================
// MÀN 2 CHỦ CƠ SỞ: VIDEO STUDIO TEMPLATE (15s / 30s / 45s)
// =========================================================================
function detectRecorderMime() {
  if (typeof window === 'undefined' || typeof window.MediaRecorder === 'undefined') {
    return null;
  }
  const candidates = [
    { mimeType: 'video/webm;codecs=vp8,opus', ext: 'webm' },
    { mimeType: 'video/webm', ext: 'webm' },
    { mimeType: 'video/mp4;codecs=avc1', ext: 'mp4' },
    { mimeType: 'video/mp4', ext: 'mp4' }
  ];
  for (const item of candidates) {
    if (typeof window.MediaRecorder.isTypeSupported !== 'function' || window.MediaRecorder.isTypeSupported(item.mimeType)) {
      return item;
    }
  }
  return { mimeType: '', ext: 'webm' };
}

export function VideoStudioPage() {
  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('tpl-15s');
  const [facingMode, setFacingMode] = useState('environment');

  const [cameraActive, setCameraActive] = useState(false);
  const [recording, setRecording] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [recordedMedia, setRecordedMedia] = useState(null);
  const [studioStatus, setStudioStatus] = useState('');
  const [studioError, setStudioError] = useState('');

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  const canUseCamera =
    typeof navigator !== 'undefined' &&
    Boolean(navigator.mediaDevices?.getUserMedia) &&
    typeof window !== 'undefined' &&
    typeof window.MediaRecorder !== 'undefined';

  useEffect(() => {
    fetchPublicCatalog({ pageSize: 20 }).then((res) => {
      setProducts(res.items || []);
      if (res.items?.[0]) setSelectedProductId(res.items[0].id);
    });
  }, []);

  function stopCameraTracks() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      try {
        recorderRef.current.stop();
      } catch {
        // ignore stop errors
      }
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    setRecording(false);
  }

  useEffect(() => {
    return () => {
      stopCameraTracks();
      if (recordedMedia?.url) {
        URL.revokeObjectURL(recordedMedia.url);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const product = products.find((p) => p.id === selectedProductId) || products[0];
  const template = VIDEO_TEMPLATES.find((t) => t.id === selectedTemplateId) || VIDEO_TEMPLATES[0];

  const activeScene =
    template.scenes.find((s) => elapsedSec >= s.startSec && elapsedSec < s.endSec) ||
    template.scenes[template.scenes.length - 1];

  function interpolateCue(raw) {
    if (!product) return raw;
    return raw
      .replaceAll('{{productTitle}}', product.title)
      .replaceAll('{{area}}', product.area)
      .replaceAll('{{spec}}', product.spec)
      .replaceAll('{{unit}}', product.unit)
      .replaceAll('{{priceText}}', formatVnd(product.priceVnd))
      .replaceAll('{{businessName}}', product.producer?.businessName || 'Cơ sở OCOP Đồng Nai')
      .replaceAll('{{story}}', product.story || '');
  }

  async function startCamera(nextFacing = facingMode) {
    setStudioError('');
    setStudioStatus('');
    if (!canUseCamera) {
      setStudioError('Trình duyệt hiện tại không hỗ trợ API camera/MediaRecorder trực tiếp. Vui lòng dùng nút Chọn video có sẵn bên dưới.');
      return;
    }
    stopCameraTracks();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: nextFacing }, width: { ideal: 720 }, height: { ideal: 1280 } },
        audio: true
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraActive(true);
      setStudioStatus('Camera đã sẵn sàng. Canh sản phẩm vào khung giữa và bấm Bắt đầu quay.');
    } catch (err) {
      setStudioError(
        err?.name === 'NotAllowedError'
          ? 'Bạn chưa cấp quyền Camera/Micro. Có thể cấp quyền trong trình duyệt hoặc chọn file video có sẵn.'
          : 'Không khởi tạo được camera trên thiết bị này. Vui lòng dùng nút Chọn video có sẵn.'
      );
    }
  }

  function startRecording() {
    if (!streamRef.current) return;
    setStudioError('');
    if (recordedMedia?.url) {
      URL.revokeObjectURL(recordedMedia.url);
      setRecordedMedia(null);
    }
    const mimeCfg = detectRecorderMime();
    try {
      const options = mimeCfg?.mimeType ? { mimeType: mimeCfg.mimeType } : undefined;
      const recorder = new MediaRecorder(streamRef.current, options);
      chunksRef.current = [];
      recorder.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) chunksRef.current.push(ev.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeCfg?.mimeType || 'video/webm' });
        const url = URL.createObjectURL(blob);
        setRecordedMedia({
          url,
          ext: mimeCfg?.ext || 'webm',
          sizeBytes: blob.size,
          source: 'camera'
        });
        setStudioStatus('Đã quay xong! Xem lại video bên dưới hoặc tải về để đăng lên sàn.');
      };
      recorderRef.current = recorder;
      recorder.start(250);
      setElapsedSec(0);
      setRecording(true);
      timerRef.current = setInterval(() => {
        setElapsedSec((prev) => {
          const next = prev + 1;
          if (next >= template.durationSec) {
            stopRecording();
            return template.durationSec;
          }
          return next;
        });
      }, 1000);
    } catch {
      setStudioError('Thiết bị không hỗ trợ ghi hình bằng MediaRecorder. Hãy chọn tệp video quay sẵn bằng camera máy.');
    }
  }

  function stopRecording() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop();
    }
    setRecording(false);
  }

  function handleFileFallback(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setStudioError('');
    if (!file.type.startsWith('video/')) {
      setStudioError('Vui lòng chọn tệp video hợp lệ (.mp4, .mov, .webm).');
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setStudioError('Dung lượng video vượt giới hạn 50MB cho bản pilot di động.');
      return;
    }
    if (recordedMedia?.url) URL.revokeObjectURL(recordedMedia.url);
    const url = URL.createObjectURL(file);
    const ext = file.name.split('.').pop() || 'mp4';
    setRecordedMedia({ url, ext, sizeBytes: file.size, source: 'file_picker' });
    setStudioStatus(`Đã nạp tệp video "${file.name}" (${(file.size / (1024 * 1024)).toFixed(1)} MB) để xem lại.`);
  }

  const progressPct = Math.min(100, Math.round((elapsedSec / template.durationSec) * 100));

  return (
    <div className="space-y-5">
      <section className="bg-surface border border-line rounded-2xl p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-accent">App Chủ cơ sở · Màn 2/3</p>
            <h1 className="text-xl sm:text-2xl font-bold text-ink">Video Studio Template — Nhắc thoại dễ quay</h1>
          </div>
          <span className="text-xs px-3 py-1 rounded-full bg-canvas border border-line text-muted">
            Khung canh góc hiển thị trên màn hình (không chèn chữ vào file video xuất)
          </span>
        </div>

        {/* Select Product & Duration Template */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
          <div>
            <label htmlFor="vs-product" className="block text-xs font-semibold text-ink mb-1">
              1. Chọn sản phẩm cần quay
            </label>
            <select
              id="vs-product"
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full min-h-[44px] px-3 rounded-xl border border-line bg-canvas text-sm"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.sku} — {p.title} ({formatVnd(p.priceVnd)})
                </option>
              ))}
            </select>
          </div>
          <div>
            <span className="block text-xs font-semibold text-ink mb-1">2. Chọn thời lượng mẫu (15 / 30 / 45 giây)</span>
            <div className="grid grid-cols-3 gap-2">
              {VIDEO_TEMPLATES.map((tpl) => (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => {
                    setSelectedTemplateId(tpl.id);
                    setElapsedSec(0);
                  }}
                  className={`min-h-[44px] px-3 rounded-xl text-xs sm:text-sm font-bold border tabular-nums ${
                    selectedTemplateId === tpl.id
                      ? 'bg-brand text-white border-brand'
                      : 'bg-canvas text-ink border-line'
                  }`}
                >
                  {tpl.durationSec} giây
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {studioError && (
        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 text-sm text-amber-950" role="alert">
          {studioError}
        </div>
      )}
      {studioStatus && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3 text-xs sm:text-sm text-emerald-950" role="status">
          {studioStatus}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Teleprompter & Camera */}
        <div className="lg:col-span-7 bg-surface border border-line rounded-2xl p-4 sm:p-5 space-y-4">
          {/* Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-semibold tabular-nums">
              <span className="text-brand">{activeScene.title}</span>
              <span className="text-ink">
                {elapsedSec}s / {template.durationSec}s ({progressPct}%)
              </span>
            </div>
            <div className="h-2.5 rounded-full bg-stone-200 overflow-hidden">
              <div className="h-full bg-brand transition-all duration-300" style={{ width: `${progressPct}%` }} />
            </div>
          </div>

          {/* Giant Teleprompter Cue Box */}
          <div className="p-4 sm:p-5 rounded-2xl bg-stone-900 text-stone-50 space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-amber-300">
              Lời thoại gợi ý (Đọc theo từng cảnh):
            </p>
            <p className="text-lg sm:text-2xl font-bold leading-snug">
              &ldquo;{interpolateCue(activeScene.teleprompter)}&rdquo;
            </p>
            <p className="text-xs sm:text-sm text-stone-300 pt-1">
              Mẹo đặt máy: {activeScene.framingTip}
            </p>
          </div>

          {/* Camera Preview or Placeholder */}
          <div className="relative rounded-2xl overflow-hidden bg-stone-950 aspect-[9/12] sm:aspect-video flex items-center justify-center border border-line">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${cameraActive ? 'block' : 'hidden'}`}
            />
            {!cameraActive && (
              <div className="text-center p-6 space-y-3 text-stone-200">
                <Camera className="w-10 h-10 mx-auto text-emerald-400" aria-hidden="true" />
                <p className="text-sm font-semibold">
                  {canUseCamera
                    ? 'Bấm "Mở camera" để xem khung hình hoặc chọn video có sẵn từ điện thoại'
                    : 'Trình duyệt trên máy này hạn chế quay trực tiếp — dùng nút Chọn file video có sẵn'}
                </p>
              </div>
            )}
            {cameraActive && (
              <div className="pointer-events-none absolute inset-6 border-2 border-dashed border-emerald-400/70 rounded-2xl flex items-end justify-center p-2">
                <span className="bg-stone-900/75 text-white text-[11px] px-2.5 py-1 rounded-full">
                  Khung canh sản phẩm (chỉ hiển thị lúc quay)
                </span>
              </div>
            )}
          </div>

          {/* Studio Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            {!cameraActive ? (
              <button
                type="button"
                onClick={() => startCamera(facingMode)}
                className="min-h-[44px] px-4 rounded-xl bg-brand hover:bg-brand-hover text-white text-sm font-semibold inline-flex items-center gap-2"
              >
                <Camera className="w-4 h-4" aria-hidden="true" />
                <span>Mở camera</span>
              </button>
            ) : !recording ? (
              <button
                type="button"
                onClick={startRecording}
                className="min-h-[44px] px-4 rounded-xl bg-brand hover:bg-brand-hover text-white text-sm font-semibold inline-flex items-center gap-2"
              >
                <Play className="w-4 h-4" aria-hidden="true" />
                <span>Bắt đầu quay ({template.durationSec}s)</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={stopRecording}
                className="min-h-[44px] px-4 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-sm font-semibold inline-flex items-center gap-2"
              >
                <Square className="w-4 h-4" aria-hidden="true" />
                <span>Dừng quay ({elapsedSec}s)</span>
              </button>
            )}

            {cameraActive && !recording && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    const next = facingMode === 'environment' ? 'user' : 'environment';
                    setFacingMode(next);
                    startCamera(next);
                  }}
                  className="min-h-[44px] px-3.5 rounded-xl border border-line bg-canvas text-xs sm:text-sm font-semibold text-ink inline-flex items-center gap-1.5"
                >
                  <SwitchCamera className="w-4 h-4" aria-hidden="true" />
                  <span>Đổi camera</span>
                </button>
                <button
                  type="button"
                  onClick={stopCameraTracks}
                  className="min-h-[44px] px-3.5 rounded-xl border border-line bg-canvas text-xs sm:text-sm font-semibold text-muted"
                >
                  Tắt camera
                </button>
              </>
            )}

            <label
              htmlFor="vs-file-picker"
              className="min-h-[44px] px-4 rounded-xl border border-line bg-canvas hover:border-brand text-xs sm:text-sm font-semibold text-ink inline-flex items-center gap-2 cursor-pointer"
            >
              <Upload className="w-4 h-4 text-brand" aria-hidden="true" />
              <span>Chọn video có sẵn (&lt;=50MB)</span>
            </label>
            <input
              id="vs-file-picker"
              type="file"
              accept="video/*"
              onChange={handleFileFallback}
              className="sr-only"
            />
          </div>
        </div>

        {/* Right: Scene Breakdown + Playback */}
        <div className="lg:col-span-5 space-y-4">
          <section className="bg-surface border border-line rounded-2xl p-4 sm:p-5 space-y-3">
            <h2 className="text-base font-bold text-ink">{template.title}</h2>
            <p className="text-xs text-muted">{template.goal}</p>
            <div className="space-y-2.5">
              {template.scenes.map((scene) => {
                const isCurrent = activeScene.id === scene.id;
                return (
                  <button
                    key={scene.id}
                    type="button"
                    onClick={() => setElapsedSec(scene.startSec)}
                    className={`w-full text-left p-3 rounded-xl border transition ${
                      isCurrent ? 'bg-blue-50 border-brand' : 'bg-canvas border-line hover:border-stone-400'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-bold tabular-nums">
                      <span className="text-ink">{scene.title}</span>
                      <span className="text-brand">
                        {scene.startSec}s – {scene.endSec}s
                      </span>
                    </div>
                    <p className="text-xs text-muted mt-1">{interpolateCue(scene.teleprompter)}</p>
                  </button>
                );
              })}
            </div>
          </section>

          {recordedMedia && (
            <section className="bg-surface border border-blue-300 rounded-2xl p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-ink">Xem lại video vừa tạo</h2>
                <span className="text-xs text-muted tabular-nums">
                  {(recordedMedia.sizeBytes / (1024 * 1024)).toFixed(2)} MB
                </span>
              </div>
              <video src={recordedMedia.url} controls playsInline className="w-full rounded-xl border border-line max-h-72 bg-black" />
              <div className="flex flex-wrap gap-2">
                <a
                  href={recordedMedia.url}
                  download={`ocop-${product?.sku || 'video'}-${template.durationSec}s.${recordedMedia.ext}`}
                  className="flex-1 min-h-[44px] px-4 rounded-xl bg-brand hover:bg-brand-hover text-white text-sm font-semibold inline-flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" aria-hidden="true" />
                  <span>Tải video ({recordedMedia.ext})</span>
                </a>
                <button
                  type="button"
                  onClick={() => {
                    URL.revokeObjectURL(recordedMedia.url);
                    setRecordedMedia(null);
                    setElapsedSec(0);
                  }}
                  className="min-h-[44px] px-4 rounded-xl border border-line bg-canvas text-sm font-semibold text-ink inline-flex items-center gap-1.5"
                >
                  <RotateCcw className="w-4 h-4" aria-hidden="true" />
                  <span>Quay lại</span>
                </button>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

// =========================================================================
// MÀN 5: QUẢN LÝ ĐƠN NHÀ VƯỜN (KHÉP VÒNG NHẬN ĐƠN -> TRA CỨU KHÁCH + RLS THẬT)
// =========================================================================
export function SellerOrdersPage({ session, onQuickSwitchSeller }) {
  const [searchParams] = useSearchParams();
  const highlightCode = (searchParams.get('highlight') || '').trim().toUpperCase();
  const gardenParam = searchParams.get('garden') || '';
  const allProducers = fetchAllProducers();
  const isSupabaseSeller = session?.mode === 'supabase';

  const defaultProducerId = isSupabaseSeller
    ? session?.user?.producerId || session?.user?.producerIds?.[0] || ''
    : gardenParam || session?.persona?.producerId || 'prod-ba-tu-long-khanh';

  const [selectedDemoProducerId, setSelectedDemoProducerId] = useState(defaultProducerId);
  const producerId = isSupabaseSeller ? defaultProducerId : selectedDemoProducerId;

  useEffect(() => {
    if (!isSupabaseSeller && gardenParam) {
      setSelectedDemoProducerId(gardenParam);
    } else if (!isSupabaseSeller && session?.persona?.producerId) {
      setSelectedDemoProducerId(session.persona.producerId);
    }
  }, [gardenParam, isSupabaseSeller, session?.persona?.producerId]);

  const [orders, setOrders] = useState([]);
  const [platformFilter, setPlatformFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState(highlightCode);
  const [loading, setLoading] = useState(true);
  const [csvText, setCsvText] = useState(SAMPLE_CSV_IMPORT_TEMPLATE);
  const [previewResult, setPreviewResult] = useState(null);
  const [importNotice, setImportNotice] = useState('');
  const [lastUpdatedOrderCode, setLastUpdatedOrderCode] = useState('');

  async function loadOrders() {
    if (!producerId) {
      setOrders([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await fetchSellerOrders({
        producerId,
        token: isSupabaseSeller ? session?.accessToken : ''
      });
      setOrders(data || []);
    } catch (err) {
      setImportNotice(err?.message || 'Chưa tải được danh sách đơn hàng.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [producerId, session?.accessToken, isSupabaseSeller]);

  useEffect(() => {
    if (highlightCode) setSearchQuery(highlightCode);
  }, [highlightCode]);

  async function handleQuickStatus(order, nextStatus) {
    try {
      await updateSellerOrderStatus({
        orderId: order.id,
        producerId,
        nextStatus,
        token: isSupabaseSeller ? session?.accessToken : ''
      });
      const code = order.orderCode || order.externalOrderId;
      const statusText =
        nextStatus === 'confirmed'
          ? 'Đã nhận đơn & đang chuẩn bị hàng'
          : nextStatus === 'completed'
            ? 'Hoàn thành giao/nhận'
            : 'Đã hủy đơn';
      setLastUpdatedOrderCode(code);
      setImportNotice(`Đã cập nhật đơn ${code} sang trạng thái: "${statusText}". Khách tra cứu sẽ thấy ngay trạng thái mới!`);
      await loadOrders();
    } catch (err) {
      setImportNotice(err?.message || 'Không thể cập nhật trạng thái đơn.');
    }
  }

  function handlePreviewCsv() {
    setImportNotice('');
    const parsed = parseOrderImportCsv(csvText);
    setPreviewResult(parsed);
  }

  async function handleCommitCsv() {
    if (!previewResult || previewResult.rows.length === 0) return;
    try {
      const res = await commitOrderImportRows({
        rows: previewResult.rows,
        producerScopeId: producerId,
        token: isSupabaseSeller ? session?.accessToken : ''
      });
      setImportNotice(
        `Đã nhập ${res.insertedCount} đơn mới · Bỏ qua ${res.duplicateCount} đơn trùng khóa.` +
          (res.rejected.length > 0 ? ` Từ chối ${res.rejected.length} dòng khác quyền cơ sở hoặc sai mã SP.` : '')
      );
      await loadOrders();
    } catch (err) {
      setImportNotice(err?.message || 'Lỗi khi nạp dữ liệu CSV.');
    }
  }

  const cleanSearch = searchQuery.trim().toUpperCase();
  const filtered = orders.filter((o) => {
    if (platformFilter !== 'all' && o.platform !== platformFilter) return false;
    if (statusFilter !== 'all' && o.status !== statusFilter) return false;
    if (cleanSearch) {
      const hay = `${o.orderCode || ''} ${o.externalOrderId || ''} ${o.customerName || ''} ${o.customerPhone || ''} ${o.productTitle || ''}`.toUpperCase();
      if (!hay.includes(cleanSearch)) return false;
    }
    return true;
  });

  const validRevenue = filtered
    .filter((o) => o.status !== 'cancelled' && o.status !== 'refunded')
    .reduce((sum, o) => sum + o.grossAmountVnd, 0);

  const currentProducer = allProducers.find((p) => p.id === producerId);

  return (
    <div className="space-y-5">
      <section className="bg-surface border border-line rounded-2xl p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-bold uppercase tracking-wider text-brand">
                Màn 5 · Quản lý đơn nhà vườn
              </p>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                  isSupabaseSeller
                    ? 'bg-blue-50 text-brand border-blue-300'
                    : 'bg-amber-50 text-amber-950 border-amber-300'
                }`}
              >
                {isSupabaseSeller
                  ? 'Tài khoản thật · Bảo vệ bởi Supabase RLS theo vườn'
                  : 'Chế độ thử vai trò (Dữ liệu mẫu cục bộ — không cấp quyền hệ thống thật)'}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-ink">
              Đơn hàng tại {currentProducer?.businessName || 'Nhà vườn'}
            </h1>
            <p className="text-sm text-muted">
              Mở đúng đơn khách vừa đặt, bấm <strong>Nhận đơn</strong> hoặc <strong>Hoàn thành</strong>. Trạng thái đồng bộ sang trang Tra cứu của khách và sổ hoa hồng đoàn viên.
            </p>
          </div>

          <div className="px-4 py-3 rounded-xl bg-canvas border border-line tabular-nums shrink-0">
            <p className="text-xs text-muted">Doanh thu lọc hiện tại</p>
            <p className="text-xl font-extrabold text-brand">{formatVnd(validRevenue)}</p>
          </div>
        </div>

        {/* Quick Farmer Actions + Demo Garden Selector */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-line">
          <div className="flex flex-wrap items-center gap-2">
            {!isSupabaseSeller && (
              <>
                <label htmlFor="seller-garden-switch" className="text-xs sm:text-sm font-semibold text-ink">
                  Xem đơn của cơ sở:
                </label>
                <select
                  id="seller-garden-switch"
                  value={producerId}
                  onChange={(e) => setSelectedDemoProducerId(e.target.value)}
                  className="min-h-[44px] px-3 rounded-xl border border-line bg-canvas text-sm font-semibold text-ink"
                >
                  {allProducers.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.businessName}
                    </option>
                  ))}
                </select>
              </>
            )}
            {!isSupabaseSeller && session?.persona?.role !== 'seller' && typeof onQuickSwitchSeller === 'function' && (
              <button
                type="button"
                onClick={() => onQuickSwitchSeller('seller-batu')}
                className="min-h-[44px] px-3.5 rounded-xl bg-blue-50 border border-brand text-brand text-xs sm:text-sm font-bold"
              >
                Bật chế độ thử vai Chủ vườn Ba Tư
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              to="/chu-co-so/dang-nhanh"
              className="min-h-[44px] px-3.5 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs sm:text-sm font-bold inline-flex items-center gap-1.5"
            >
              <Mic className="w-4 h-4" aria-hidden="true" />
              <span>Đăng nhanh ảnh &amp; giọng</span>
            </Link>
            <Link
              to="/tinh-nguyen"
              className="min-h-[44px] px-3.5 rounded-xl border border-brand bg-blue-50 text-brand text-xs sm:text-sm font-bold inline-flex items-center gap-1.5"
            >
              <HeartHandshake className="w-4 h-4" aria-hidden="true" />
              <span>Duyệt giờ tình nguyện</span>
            </Link>
          </div>
        </div>
      </section>

      {importNotice && (
        <div
          className="bg-emerald-50 border border-emerald-300 text-emerald-950 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 text-sm font-semibold"
          role="status"
        >
          <span>{importNotice}</span>
          {lastUpdatedOrderCode && (
            <Link
              to={`/tra-cuu-don?code=${encodeURIComponent(lastUpdatedOrderCode)}`}
              className="min-h-[44px] px-4 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs sm:text-sm font-bold inline-flex items-center gap-1.5 shrink-0"
            >
              <PackageSearch className="w-4 h-4" aria-hidden="true" />
              <span>Kiểm tra trên trang Tra cứu của khách</span>
            </Link>
          )}
        </div>
      )}

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row flex-wrap gap-2.5">
        <div className="relative flex-1 min-w-[220px]">
          <label htmlFor="seller-order-search" className="sr-only">
            Tìm theo mã đơn hoặc tên khách
          </label>
          <Search className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
          <input
            id="seller-order-search"
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo mã đơn (DON-LK-...), tên hoặc SĐT khách..."
            className="w-full min-h-[44px] pl-10 pr-3 rounded-xl border border-line bg-surface text-sm font-mono"
          />
        </div>
        <select
          aria-label="Lọc theo kênh"
          value={platformFilter}
          onChange={(e) => setPlatformFilter(e.target.value)}
          className="min-h-[44px] px-3 rounded-xl border border-line bg-surface text-sm"
        >
          <option value="all">Tất cả kênh</option>
          <option value="direct_ocop">Đặt trực tiếp Chợ OCOP</option>
          <option value="tiktok">TikTok Shop</option>
          <option value="shopee">Shopee</option>
          <option value="lazada">Lazada</option>
        </select>
        <select
          aria-label="Lọc theo trạng thái đơn"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="min-h-[44px] px-3 rounded-xl border border-line bg-surface text-sm"
        >
          <option value="all">Mọi trạng thái</option>
          <option value="placed">Mới đặt — Chờ nhận</option>
          <option value="confirmed">Đã nhận — Chuẩn bị hàng</option>
          <option value="completed">Hoàn thành</option>
          <option value="refunded">Hoàn trả</option>
          <option value="cancelled">Đã hủy</option>
        </select>
      </div>

      {/* Orders: Cards on Mobile, Table on Desktop */}
      {loading ? (
        <div className="bg-surface border border-line rounded-2xl p-6 animate-pulse h-36" />
      ) : filtered.length === 0 ? (
        <div className="bg-surface border border-line rounded-2xl p-8 text-center text-sm text-muted space-y-3">
          <p className="font-semibold text-ink">Chưa có đơn hàng nào khớp bộ lọc cho nhà vườn hiện tại.</p>
          <div className="flex flex-wrap justify-center gap-2">
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="ocop-secondary"
              >
                Xóa từ khóa tìm kiếm
              </button>
            )}
            <Link to="/gian-hang/nha-vuon-ba-tu" className="ocop-primary">
              Mở Hồ sơ Nhà vườn Ba Tư để đặt thử đơn
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {filtered.map((o) => {
              const code = o.orderCode || o.externalOrderId;
              const isHighlighted = Boolean(highlightCode && code.toUpperCase() === highlightCode);
              return (
                <article
                  key={o.id}
                  className={`bg-surface rounded-2xl p-4 space-y-2.5 tabular-nums border-2 ${
                    isHighlighted ? 'border-brand ring-2 ring-blue-200' : 'border-line'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <PlatformBadge platform={o.platform} />
                    <OrderStatusBadge status={o.status} />
                  </div>
                  <p className="font-mono text-sm font-extrabold text-brand">{code}</p>
                  <p className="font-bold text-sm text-ink">{o.productTitle}</p>
                  {o.deliveryLabel && (
                    <p className="text-xs text-brand font-semibold">{o.deliveryLabel}</p>
                  )}
                  {o.customerName && (
                    <p className="text-xs text-muted">
                      Khách: <strong className="text-ink">{o.customerName}</strong> · {o.customerPhone}
                    </p>
                  )}
                  <div className="flex items-center justify-between text-xs text-muted">
                    <span>SL: {o.quantity}</span>
                    <span className="text-base font-extrabold text-ink">{formatVnd(o.grossAmountVnd)}</span>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-line">
                    {o.status === 'placed' && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleQuickStatus(o, 'confirmed')}
                          className="flex-1 min-h-[44px] px-3.5 rounded-xl bg-brand hover:bg-brand-hover text-white text-sm font-bold"
                        >
                          Nhận đơn &amp; Chuẩn bị hàng
                        </button>
                        <button
                          type="button"
                          onClick={() => handleQuickStatus(o, 'cancelled')}
                          className="min-h-[44px] px-3 rounded-xl border border-rose-200 bg-rose-50 text-rose-900 text-xs font-semibold"
                        >
                          Hủy
                        </button>
                      </>
                    )}
                    {o.status === 'confirmed' && (
                      <button
                        type="button"
                        onClick={() => handleQuickStatus(o, 'completed')}
                        className="flex-1 min-h-[44px] px-3.5 rounded-xl bg-ink text-white text-sm font-bold"
                      >
                        Đánh dấu hoàn thành
                      </button>
                    )}
                    <Link
                      to={`/tra-cuu-don?code=${encodeURIComponent(code)}`}
                      className="min-h-[44px] px-3 rounded-xl border border-line bg-canvas text-xs font-semibold text-brand inline-flex items-center"
                    >
                      Tra cứu
                    </Link>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <OrderSourceBadge source={o.source} />
                    <span className="text-xs text-muted">{formatDateTimeVn(o.orderedAt)}</span>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="hidden md:block bg-surface border border-line rounded-2xl overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-line bg-canvas text-xs text-muted">
                  <th className="py-3 px-4 font-semibold">Mã đơn</th>
                  <th className="py-3 px-4 font-semibold">Sản phẩm &amp; Khách đặt</th>
                  <th className="py-3 px-4 font-semibold">Địa điểm nhận / Kênh</th>
                  <th className="py-3 px-4 font-semibold text-right">Tổng tiền</th>
                  <th className="py-3 px-4 font-semibold">Trạng thái &amp; Xử lý</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filtered.map((o) => {
                  const code = o.orderCode || o.externalOrderId;
                  const isHighlighted = Boolean(highlightCode && code.toUpperCase() === highlightCode);
                  return (
                    <tr
                      key={o.id}
                      className={isHighlighted ? 'bg-blue-50/90' : 'hover:bg-canvas/50'}
                    >
                      <td className="py-3.5 px-4 font-mono text-xs font-extrabold text-brand align-top">
                        {code}
                        <p className="font-sans font-normal text-muted mt-0.5">{formatDateTimeVn(o.orderedAt)}</p>
                        <Link
                          to={`/tra-cuu-don?code=${encodeURIComponent(code)}`}
                          className="font-sans text-[11px] font-semibold text-brand underline mt-1 inline-block"
                        >
                          Xem phía khách →
                        </Link>
                      </td>
                      <td className="py-3.5 px-4 align-top">
                        <p className="font-bold text-ink">{o.productTitle}</p>
                        <p className="text-xs text-muted">
                          Mã SP {o.sku} · SL {o.quantity}
                          {o.customerName ? ` · Khách: ${o.customerName} (${o.customerPhone})` : ''}
                        </p>
                        {o.affiliateCode && (
                          <p className="text-xs text-emerald-800 font-medium mt-0.5">
                            Qua link đoàn viên /{o.affiliateCode} (HH ước tính {formatVnd(o.commissionVnd)})
                          </p>
                        )}
                      </td>
                      <td className="py-3.5 px-4 space-y-1 align-top">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <PlatformBadge platform={o.platform} />
                          <OrderSourceBadge source={o.source} />
                        </div>
                        {o.deliveryLabel && <p className="text-xs text-brand font-semibold">{o.deliveryLabel}</p>}
                      </td>
                      <td className="py-3.5 px-4 text-right font-extrabold text-ink align-top">{formatVnd(o.grossAmountVnd)}</td>
                      <td className="py-3.5 px-4 space-y-2 align-top">
                        <div>
                          <OrderStatusBadge status={o.status} />
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {o.status === 'placed' && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleQuickStatus(o, 'confirmed')}
                                className="min-h-[44px] px-3.5 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs font-bold"
                              >
                                Nhận đơn &amp; chuẩn bị
                              </button>
                              <button
                                type="button"
                                onClick={() => handleQuickStatus(o, 'cancelled')}
                                className="min-h-[44px] px-3 rounded-xl border border-rose-200 bg-rose-50 text-rose-900 text-xs font-semibold"
                              >
                                Hủy
                              </button>
                            </>
                          )}
                          {o.status === 'confirmed' && (
                            <button
                              type="button"
                              onClick={() => handleQuickStatus(o, 'completed')}
                              className="min-h-[44px] px-3.5 rounded-xl bg-ink hover:bg-slate-800 text-white text-xs font-bold"
                            >
                              Đánh dấu hoàn thành
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* CSV Import Box (secondary collapsible for advanced seller/ops use) */}
      <details className="bg-surface border border-line rounded-2xl p-5">
        <summary className="cursor-pointer list-none flex flex-wrap items-center justify-between gap-2 font-bold text-ink">
          <span className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-brand" aria-hidden="true" />
            <span>Nhập đơn hàng mẫu từ tệp CSV (Kiểm lỗi &amp; Chống trùng)</span>
          </span>
          <span className="text-xs text-brand font-semibold">Mở rộng / Thu gọn</span>
        </summary>
        <div className="space-y-4 pt-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label htmlFor="seller-csv-input" className="text-xs text-muted">
              Cột bắt buộc: platform, shop_id, external_order_id, sku, quantity, gross_amount_vnd
            </label>
            <button
              type="button"
              onClick={() => setCsvText(SAMPLE_CSV_IMPORT_TEMPLATE)}
              className="text-xs font-semibold text-brand underline min-h-[36px]"
            >
              Nạp lại mẫu chuẩn
            </button>
          </div>
          <textarea
            id="seller-csv-input"
            rows={4}
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            className="w-full p-3 rounded-xl border border-line bg-canvas font-mono text-xs"
          />

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handlePreviewCsv}
              className="min-h-[44px] px-4 rounded-xl border border-line bg-canvas text-sm font-semibold text-ink"
            >
              Kiểm tra trước (Xem lỗi)
            </button>
            {previewResult && previewResult.rows.length > 0 && (
              <button
                type="button"
                onClick={handleCommitCsv}
                className="min-h-[44px] px-5 rounded-xl bg-brand hover:bg-brand-hover text-white text-sm font-semibold inline-flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                <span>Xác nhận nhập {previewResult.rows.length} dòng hợp lệ</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setPreviewResult(null)}
              className="min-h-[44px] px-3 rounded-xl text-xs font-semibold text-muted inline-flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Xóa xem trước</span>
            </button>
          </div>

          {previewResult && (
            <div className="p-3.5 rounded-xl bg-canvas border border-line text-xs space-y-1.5">
              <p className="font-bold text-ink">
                Kết quả đọc CSV: {previewResult.rows.length} dòng hợp lệ · {previewResult.errors.length} dòng lỗi
              </p>
              {previewResult.errors.map((err, i) => (
                <p key={i} className="text-rose-700">
                  • Dòng {err.line}: {err.message}
                </p>
              ))}
            </div>
          )}
        </div>
      </details>
    </div>
  );
}
