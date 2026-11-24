import React, { useEffect, useState } from 'react';
import orchardPhoto from '../assets/orchard/orchard.webp';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Search,
  FilterX,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  ShoppingCart,
  ChevronLeft,
  ChevronRight,
  Store,
  QrCode,
  Radio,
  MapPinned,
  Clock
} from 'lucide-react';
import { PRODUCT_CATEGORIES } from '../data/pilotData';
import { addToCart, fetchPublicCatalog } from '../services/ocopStore';
import { formatVnd } from '../utils/formatters';
import { OcopStarBadge } from './StatusBadges';

export default function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const qParam = searchParams.get('q') || '';
  const categoryParam = searchParams.get('cat') || 'all';
  const platformParam = searchParams.get('platform') || 'all';
  const sortParam = searchParams.get('sort') || 'featured';
  const pageParam = Math.max(1, Number(searchParams.get('page')) || 1);

  const [searchInput, setSearchInput] = useState(qParam);
  const [catalog, setCatalog] = useState({
    sourceMode: 'demo',
    items: [],
    total: 0,
    page: 1,
    totalPages: 1,
    producersCount: 0
  });
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [addedId, setAddedId] = useState('');
  const [liveStatusMsg, setLiveStatusMsg] = useState('');

  useEffect(() => {
    setSearchInput(qParam);
  }, [qParam]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setErrorMsg('');
      try {
        const res = await fetchPublicCatalog({
          q: qParam,
          category: categoryParam,
          platform: platformParam,
          sort: sortParam,
          page: pageParam,
          pageSize: 8
        });
        if (!cancelled) {
          setCatalog(res);
        }
      } catch (err) {
        if (!cancelled) {
          setErrorMsg(err?.message || 'Không thể tải danh mục sản phẩm OCOP.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [qParam, categoryParam, platformParam, sortParam, pageParam]);

  function updateQuery(patch) {
    const next = new URLSearchParams(searchParams);
    Object.entries(patch).forEach(([k, v]) => {
      if (!v || v === 'all' || (k === 'page' && Number(v) <= 1)) {
        next.delete(k);
      } else {
        next.set(k, String(v));
      }
    });
    setSearchParams(next);
  }

  function handleSearchSubmit(e) {
    e.preventDefault();
    updateQuery({ q: searchInput.trim(), page: 1 });
  }

  function clearFilters() {
    setSearchInput('');
    setSearchParams(new URLSearchParams());
  }

  function handleAddCart(product) {
    addToCart(product, 1);
    setAddedId(product.id);
    setLiveStatusMsg(`Đã thêm ${product.title} vào giỏ hàng.`);
    setTimeout(() => setAddedId(''), 1800);
  }

  const hasActiveFilters = Boolean(
    qParam || categoryParam !== 'all' || platformParam !== 'all' || sortParam !== 'featured'
  );

  return (
    <div className="space-y-5">
      {/* Featured Storefront Banner: Direct purchase + QR traceability */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#003477] via-[#0759BA] to-[#0277BD] text-white sm:grid sm:grid-cols-[1.45fr_1fr] shadow-sm">
        <div className="relative z-10 space-y-3 p-5 sm:p-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-xs font-semibold text-blue-50">
            <Store className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Mua trực tiếp tại vườn Long Khánh &amp; Truy xuất QR · Dữ liệu mô phỏng</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white leading-tight">
            Chợ OCOP Thanh Niên Đồng Nai
          </h1>
          <p className="text-sm sm:text-base text-blue-50 leading-relaxed">
            Đặt nông sản tươi trực tiếp từ <strong>Nhà vườn Ba Tư (2,5 ha Long Khánh · 38.000–120.000 ₫/kg)</strong> và các cơ sở Đồng Nai, quét mã QR kiểm chứng nhật ký mùa vụ hoặc hẹn ghé vườn hái trái cuối tuần.
          </p>

          <div className="flex flex-wrap gap-2 pt-2">
            <Link
              to="/gian-hang/nha-vuon-ba-tu"
              className="min-h-[46px] px-4 rounded-xl bg-white text-brand hover:bg-blue-50 text-sm font-bold inline-flex items-center gap-2 transition shadow-sm"
            >
              <Store className="w-4 h-4" aria-hidden="true" />
              <span>Hồ sơ Nhà vườn Ba Tư</span>
            </Link>
            <Link
              to="/ban-do-vuon"
              className="min-h-[46px] px-3.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/30 text-sm font-semibold text-white inline-flex items-center gap-1.5"
            >
              <MapPinned className="w-4 h-4" aria-hidden="true" />
              <span>Bản đồ &amp; Tham quan vườn</span>
            </Link>
            <Link
              to="/lich-livestream"
              className="min-h-[46px] px-3.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/30 text-sm font-semibold text-white inline-flex items-center gap-1.5"
            >
              <Radio className="w-4 h-4" aria-hidden="true" />
              <span>Lịch livestream</span>
            </Link>
          </div>
        </div>
        <img
          src={orchardPhoto}
          alt="Vườn chôm chôm và sầu riêng Long Khánh, Đồng Nai"
          width="560"
          height="560"
          fetchPriority="high"
          className="h-52 w-full object-cover sm:h-full sm:min-h-60"
        />
      </section>

      {/* Search & Filters */}
      <section aria-label="Tìm kiếm và lọc sản phẩm" className="bg-surface border border-line rounded-2xl p-4 space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <label htmlFor="catalog-search" className="sr-only">
              Tìm kiếm nông sản và sản phẩm OCOP
            </label>
            <Search className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
            <input
              id="catalog-search"
              type="search"
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                updateQuery({ q: e.target.value.trim(), page: 1 });
              }}
              placeholder="Tìm chôm chôm, sầu riêng, măng cụt, vỏ bưởi Tân Triều, hạt điều..."
              className="w-full min-h-[46px] pl-10 pr-3 rounded-xl border border-line bg-canvas text-sm text-ink placeholder:text-muted"
            />
          </div>
          <div className="grid grid-cols-2 sm:flex gap-2">
            <div>
              <label htmlFor="filter-platform" className="sr-only">
                Lọc theo kênh bán
              </label>
              <select
                id="filter-platform"
                value={platformParam}
                onChange={(e) => updateQuery({ platform: e.target.value, page: 1 })}
                className="w-full min-h-[46px] px-3 rounded-xl border border-line bg-surface text-sm text-ink"
              >
                <option value="all">Tất cả kênh bán</option>
                <option value="direct_ocop">Đặt trực tiếp tại vườn</option>
                <option value="tiktok">Kênh đối tác TikTok</option>
                <option value="shopee">Kênh đối tác Shopee</option>
                <option value="lazada">Kênh đối tác Lazada</option>
              </select>
            </div>
            <div>
              <label htmlFor="filter-sort" className="sr-only">
                Sắp xếp sản phẩm
              </label>
              <select
                id="filter-sort"
                value={sortParam}
                onChange={(e) => updateQuery({ sort: e.target.value, page: 1 })}
                className="w-full min-h-[46px] px-3 rounded-xl border border-line bg-surface text-sm text-ink"
              >
                <option value="featured">Sắp xếp: Nổi bật</option>
                <option value="price_asc">Giá thấp đến cao</option>
                <option value="price_desc">Giá cao đến thấp</option>
                <option value="commission_desc">Mức hỗ trợ CTV cao</option>
              </select>
            </div>
          </div>
        </form>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {PRODUCT_CATEGORIES.map((cat) => {
            const active = categoryParam === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => updateQuery({ cat: cat.id, page: 1 })}
                className={`min-h-[44px] px-3.5 rounded-xl text-xs sm:text-sm font-semibold shrink-0 border transition ${
                  active
                    ? 'bg-brand text-white border-brand'
                    : 'bg-canvas text-ink border-line hover:border-brand'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="min-h-[44px] px-3.5 rounded-xl text-xs sm:text-sm font-semibold shrink-0 border border-amber-300 bg-amber-50 text-amber-950 inline-flex items-center gap-1.5"
            >
              <FilterX className="w-4 h-4" aria-hidden="true" />
              <span>Xóa bộ lọc</span>
            </button>
          )}
        </div>
      </section>

      <div aria-live="polite" className="sr-only">
        {liveStatusMsg}
      </div>

      {/* Error State */}
      {errorMsg && (
        <div className="bg-rose-50 border border-rose-300 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3" role="alert">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-700 shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="text-sm font-bold text-rose-950">Không thể tải dữ liệu cửa hàng</p>
              <p className="text-xs text-rose-800 mt-0.5">{errorMsg}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => updateQuery({})}
            className="min-h-[44px] px-4 rounded-xl bg-surface border border-rose-300 text-sm font-semibold text-rose-900 inline-flex items-center gap-2 self-start"
          >
            <RefreshCw className="w-4 h-4" aria-hidden="true" />
            <span>Thử tải lại</span>
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" aria-busy="true">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-surface border border-line rounded-2xl p-4 space-y-3 animate-pulse">
              <div className="aspect-[4/3] rounded-xl bg-blue-100/70" />
              <div className="h-4 bg-blue-100/70 rounded w-3/4" />
              <div className="h-4 bg-blue-100/70 rounded w-1/2" />
              <div className="h-11 bg-blue-100/70 rounded-xl w-full" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !errorMsg && catalog.items.length === 0 && (
        <div className="bg-surface border border-line rounded-2xl p-8 text-center space-y-3">
          <p className="text-base font-bold text-ink">Chưa tìm thấy sản phẩm phù hợp bộ lọc</p>
          <p className="text-sm text-muted">
            Hãy thử tìm &ldquo;chôm chôm&rdquo;, &ldquo;sầu riêng&rdquo;, &ldquo;măng cụt&rdquo;, &ldquo;vỏ bưởi&rdquo; hoặc xóa bộ lọc hiện tại.
          </p>
          <button
            type="button"
            onClick={clearFilters}
            className="min-h-[44px] px-5 rounded-xl bg-brand hover:bg-brand-hover text-white text-sm font-semibold inline-flex items-center gap-2"
          >
            <FilterX className="w-4 h-4" aria-hidden="true" />
            <span>Xóa toàn bộ bộ lọc</span>
          </button>
        </div>
      )}

      {/* Product Grid */}
      {!loading && !errorMsg && catalog.items.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {catalog.items.map((product, index) => (
              <article
                key={product.id}
                className="bg-surface border border-line rounded-2xl overflow-hidden flex flex-col justify-between transition hover:border-brand hover:shadow-sm"
              >
                <div>
                  <Link to={`/san-pham/${product.slug}`} className="block bg-canvas border-b border-line relative">
                    <img
                      src={product.imageUrl}
                      alt={`${product.title} — ${product.area}`}
                      width="640"
                      height="480"
                      loading={index < 4 ? 'eager' : 'lazy'}
                      className="w-full aspect-[4/3] object-cover"
                    />
                    {product.harvestedAtLabel && (
                      <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-lg bg-white/95 px-2 py-1 text-[11px] font-semibold text-ink shadow-sm border border-blue-100">
                        <Clock className="w-3 h-3 text-brand" aria-hidden="true" />
                        <span>{product.harvestedAtLabel}</span>
                      </span>
                    )}
                  </Link>
                  <div className="p-4 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-1.5">
                      <OcopStarBadge stars={product.ocopStars} showIllustrative={false} />
                      <span className="font-mono text-xs text-muted tabular-nums">
                        Lô {product.batchCode || product.sku}
                      </span>
                    </div>

                    <h2 className="text-base font-bold text-ink leading-snug line-clamp-2">
                      <Link to={`/san-pham/${product.slug}`} className="hover:text-brand">
                        {product.title}
                      </Link>
                    </h2>

                    {product.producer && (
                      <Link
                        to={`/gian-hang/${product.producer.slug}`}
                        className="text-xs text-brand font-semibold hover:underline block truncate"
                      >
                        {product.producer.businessName}
                      </Link>
                    )}

                    <div className="flex items-baseline justify-between gap-2 pt-1 tabular-nums">
                      <span className="text-lg font-extrabold text-ink">{formatVnd(product.priceVnd)}</span>
                      <span className="text-xs text-muted">/ {product.unit}</span>
                    </div>
                  </div>
                </div>

                <div className="px-4 pb-4 pt-1 flex items-center gap-2">
                  <Link
                    to={`/san-pham/${product.slug}`}
                    className="flex-1 min-h-[44px] px-3 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs sm:text-sm font-semibold inline-flex items-center justify-center gap-1.5 transition"
                  >
                    <QrCode className="w-4 h-4" aria-hidden="true" />
                    <span>Chi tiết &amp; QR</span>
                    <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleAddCart(product)}
                    aria-label={`Thêm ${product.title} vào giỏ hàng`}
                    className="min-h-[44px] min-w-[44px] px-3 rounded-xl border border-line bg-canvas hover:border-brand text-ink inline-flex items-center justify-center gap-1 text-xs sm:text-sm font-semibold"
                  >
                    <ShoppingCart className="w-4 h-4 text-brand" aria-hidden="true" />
                    <span>{addedId === product.id ? 'Đã thêm' : 'Giỏ'}</span>
                  </button>
                </div>
              </article>
            ))}
          </div>

          {/* Pagination */}
          {catalog.totalPages > 1 && (
            <nav aria-label="Phân trang danh mục" className="flex items-center justify-between bg-surface border border-line rounded-2xl px-4 py-3 tabular-nums">
              <p className="text-xs sm:text-sm text-muted">
                Trang {catalog.page} / {catalog.totalPages} · {catalog.total} sản phẩm
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={catalog.page <= 1}
                  onClick={() => updateQuery({ page: catalog.page - 1 })}
                  className="min-h-[44px] px-3.5 rounded-xl border border-line bg-canvas text-sm font-semibold disabled:opacity-40 inline-flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                  <span>Trước</span>
                </button>
                <button
                  type="button"
                  disabled={catalog.page >= catalog.totalPages}
                  onClick={() => updateQuery({ page: catalog.page + 1 })}
                  className="min-h-[44px] px-3.5 rounded-xl border border-line bg-canvas text-sm font-semibold disabled:opacity-40 inline-flex items-center gap-1"
                >
                  <span>Sau</span>
                  <ChevronRight className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </nav>
          )}
        </>
      )}
    </div>
  );
}
