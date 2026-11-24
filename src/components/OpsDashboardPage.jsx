import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  Download,
  RotateCcw,
  ShieldCheck,
  FileSpreadsheet
} from 'lucide-react';
import { SAMPLE_CSV_IMPORT_TEMPLATE } from '../data/pilotData';
import {
  commitOrderImportRows,
  fetchOpsDashboard,
  reconcileOrderOps,
  reviewProductOps
} from '../services/ocopStore';
import {
  buildSafeCsv,
  formatBpsPercent,
  formatDateTimeVn,
  formatVnd,
  parseOrderImportCsv
} from '../utils/formatters';
import { OrderSourceBadge, OrderStatusBadge, PlatformBadge, ProductStatusBadge } from './StatusBadges';

export default function OpsDashboardPage({ session, onQuickSwitchOps }) {
  const isOps = session?.mode === 'supabase' ? session?.user?.role === 'ops' : session?.persona?.role === 'ops';

  const [platform, setPlatform] = useState('all');
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState('');
  const [revisionNotes, setRevisionNotes] = useState({});
  const [csvText, setCsvText] = useState(SAMPLE_CSV_IMPORT_TEMPLATE);
  const [csvPreview, setCsvPreview] = useState(null);

  async function refresh() {
    if (!isOps) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await fetchOpsDashboard({ platform, token: session?.accessToken });
      setDashboard(data);
    } catch (err) {
      setNotice(err?.message || 'Không thể tải dữ liệu điều phối.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [platform, isOps]);

  if (!isOps) {
    return (
      <div className="bg-surface border border-amber-300 rounded-2xl p-6 sm:p-8 text-center space-y-4 max-w-xl mx-auto">
        <AlertTriangle className="w-10 h-10 text-accent mx-auto" aria-hidden="true" />
        <h1 className="text-xl font-bold text-ink">Bàn điều phối Tỉnh đoàn / Sở Công Thương</h1>
        <p className="text-sm text-muted">
          Chỉ tài khoản có vai trò Điều phối (Ops) mới được duyệt sản phẩm, đối soát đơn và xem sổ cái toàn hệ thống. Dữ liệu vận hành riêng không công khai cho khách.
        </p>
        <button
          type="button"
          onClick={onQuickSwitchOps}
          className="min-h-[44px] px-5 rounded-xl bg-brand hover:bg-brand-hover text-white text-sm font-semibold"
        >
          Chuyển sang Điều phối viên mẫu (Demo)
        </button>
      </div>
    );
  }

  async function handleReviewProduct(product, decision) {
    const note = revisionNotes[product.id] || '';
    if (decision === 'request_revision' && !note.trim()) {
      setNotice('Vui lòng nhập lý do yêu cầu sửa trước khi trả hồ sơ cho chủ cơ sở.');
      return;
    }
    if (typeof window !== 'undefined' && !window.confirm(`Xác nhận ${decision === 'approve' ? 'duyệt công bố' : 'yêu cầu sửa'} SKU ${product.sku}?`)) {
      return;
    }
    try {
      await reviewProductOps({ productId: product.id, decision, note, token: session?.accessToken });
      setNotice(`Đã cập nhật trạng thái duyệt cho ${product.sku}.`);
      await refresh();
    } catch (err) {
      setNotice(err?.message || 'Không thể duyệt sản phẩm.');
    }
  }

  async function handleReconcileOrder(order, nextStatus) {
    const actionLabel = nextStatus === 'refunded' ? 'Hoàn đơn & sinh bút toán đảo hoa hồng' : 'Chốt hoàn thành & mở khóa hoa hồng';
    if (typeof window !== 'undefined' && !window.confirm(`${actionLabel} cho đơn ${order.externalOrderId}?`)) {
      return;
    }
    try {
      await reconcileOrderOps({
        orderId: order.id,
        nextStatus,
        reason: nextStatus === 'refunded' ? 'Đối soát hoàn trả từ sàn' : 'Đã qua thời hạn đổi trả',
        token: session?.accessToken
      });
      setNotice(`Đã cập nhật đơn ${order.externalOrderId} → ${nextStatus}.`);
      await refresh();
    } catch (err) {
      setNotice(err?.message || 'Lỗi đối soát đơn hàng.');
    }
  }

  function exportOrdersCsv() {
    if (!dashboard?.orders?.length) return;
    const csv = buildSafeCsv(
      [
        { key: 'externalOrderId', label: 'Mã đơn sàn' },
        { key: 'platform', label: 'Sàn' },
        { key: 'sku', label: 'SKU' },
        { key: 'productTitle', label: 'Sản phẩm' },
        { key: 'grossAmountVnd', label: 'Doanh thu (VND)' },
        { key: 'commissionVnd', label: 'Hoa hồng (VND)' },
        { key: 'affiliateName', label: 'Affiliate' },
        { key: 'status', label: 'Trạng thái' },
        { key: 'source', label: 'Nguồn dữ liệu' }
      ],
      dashboard.orders
    );
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ocop-dong-nai-orders-pilot.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <section className="bg-surface border border-line rounded-2xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-brand flex items-center gap-1.5">
            <BarChart3 className="w-4 h-4" aria-hidden="true" />
            <span>Điều phối Pilot · Tách bạch số liệu Pilot &amp; Sàn chính thức</span>
          </p>
          <h1 className="text-xl sm:text-2xl font-bold text-ink">Dashboard Vận hành &amp; Đối soát OCOP</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            aria-label="Lọc số liệu theo sàn"
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            className="min-h-[44px] px-3 rounded-xl border border-line bg-canvas text-sm"
          >
            <option value="all">Tất cả sàn (Pilot)</option>
            <option value="tiktok">TikTok Shop</option>
            <option value="shopee">Shopee</option>
            <option value="lazada">Lazada</option>
          </select>
          <button
            type="button"
            onClick={exportOrdersCsv}
            className="min-h-[44px] px-4 rounded-xl border border-line bg-canvas hover:border-brand text-sm font-semibold text-ink inline-flex items-center gap-2"
          >
            <Download className="w-4 h-4 text-brand" aria-hidden="true" />
            <span>Xuất CSV an toàn</span>
          </button>
        </div>
      </section>

      {notice && (
        <p className="text-sm bg-emerald-50 border border-emerald-200 text-emerald-950 rounded-xl p-3.5" role="status">
          {notice}
        </p>
      )}

      {loading || !dashboard ? (
        <div className="bg-surface border border-line rounded-2xl p-6 animate-pulse h-48" />
      ) : (
        <>
          {/* KPI Cards with metric definitions */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 tabular-nums">
            <div className="bg-surface border border-line rounded-2xl p-4">
              <p className="text-xs text-muted">Gian hàng / SKU công bố</p>
              <p className="text-2xl font-extrabold text-ink mt-1">
                {dashboard.metrics.producersCount} / {dashboard.metrics.publishedProductsCount}
              </p>
              <p className="text-[11px] text-muted mt-1">
                Chờ duyệt: {dashboard.metrics.pendingProductsCount} SKU
              </p>
            </div>
            <div className="bg-surface border border-line rounded-2xl p-4">
              <p className="text-xs text-muted">Lượt bấm có chủ ý</p>
              <p className="text-2xl font-extrabold text-brand mt-1">{dashboard.metrics.totalClicks}</p>
              <p className="text-[11px] text-muted mt-1">Không tính bot preview tin nhắn</p>
            </div>
            <div className="bg-surface border border-line rounded-2xl p-4">
              <p className="text-xs text-muted">Doanh thu mẫu (Đơn hợp lệ)</p>
              <p className="text-2xl font-extrabold text-ink mt-1">
                {formatVnd(dashboard.metrics.grossRevenueVnd)}
              </p>
              <p className="text-[11px] text-muted mt-1">Tổng {dashboard.metrics.ordersCount} đơn demo/import</p>
            </div>
            <div className="bg-surface border border-line rounded-2xl p-4">
              <p className="text-xs text-muted">Hoa hồng khả dụng / Chờ</p>
              <p className="text-xl font-extrabold text-accent mt-1">
                {formatVnd(dashboard.metrics.commissionAvailableVnd)}
              </p>
              <p className="text-[11px] text-muted mt-1">
                Chờ đối soát: {formatVnd(dashboard.metrics.commissionPendingVnd)}
              </p>
            </div>
          </div>

          {/* Top Products & Top Affiliates */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <section className="bg-surface border border-line rounded-2xl p-5 space-y-3">
              <h2 className="text-base font-bold text-ink">Top Sản phẩm (Theo đơn Pilot hiện có)</h2>
              <div className="space-y-2 tabular-nums">
                {dashboard.topProducts.map((tp) => (
                  <div key={tp.sku} className="p-3 rounded-xl bg-canvas border border-line flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-ink truncate">{tp.title}</p>
                      <p className="text-xs text-muted font-mono">{tp.sku} · {tp.orders} đơn</p>
                    </div>
                    <span className="font-bold text-sm text-ink shrink-0">{formatVnd(tp.revenueVnd)}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="bg-surface border border-line rounded-2xl p-5 space-y-3">
              <h2 className="text-base font-bold text-ink">Top Đoàn viên Affiliate (Theo sổ cái Pilot)</h2>
              <div className="space-y-2 tabular-nums">
                {dashboard.topAffiliates.map((ta) => (
                  <div key={ta.affiliateId} className="p-3 rounded-xl bg-canvas border border-line flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-ink truncate">{ta.affiliateName}</p>
                      <p className="text-xs text-muted">{ta.orders} đơn giới thiệu · Doanh số {formatVnd(ta.revenueVnd)}</p>
                    </div>
                    <span className="font-bold text-sm text-brand shrink-0">{formatVnd(ta.commissionVnd)}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Product Approval Queue */}
          <section className="bg-surface border border-line rounded-2xl p-5 space-y-3">
            <h2 className="text-base font-bold text-ink flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-brand" aria-hidden="true" />
              <span>Duyệt hồ sơ &amp; Sản phẩm OCOP</span>
            </h2>
            <div className="space-y-3">
              {dashboard.products.slice(0, 12).map((p) => (
                <div key={p.id} className="p-3.5 rounded-xl bg-canvas border border-line flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <ProductStatusBadge status={p.status} />
                      <span className="font-mono text-xs text-muted">{p.sku}</span>
                      <span className="text-xs text-muted">{p.area}</span>
                    </div>
                    <p className="font-bold text-sm text-ink">{p.title}</p>
                    <p className="text-xs text-muted">
                      {formatVnd(p.priceVnd)} · Hoa hồng {formatBpsPercent(p.commissionRateBps)}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="text"
                      aria-label={`Lý do điều chỉnh cho ${p.sku}`}
                      placeholder="Ghi chú nếu yêu cầu sửa..."
                      value={revisionNotes[p.id] || ''}
                      onChange={(e) => setRevisionNotes((prev) => ({ ...prev, [p.id]: e.target.value }))}
                      className="min-h-[44px] px-3 rounded-xl border border-line bg-surface text-xs"
                    />
                    {p.status !== 'published' && (
                      <button
                        type="button"
                        onClick={() => handleReviewProduct(p, 'approve')}
                        className="min-h-[44px] px-3.5 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs font-semibold inline-flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                        <span>Duyệt công bố</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleReviewProduct(p, 'request_revision')}
                      className="min-h-[44px] px-3.5 rounded-xl border border-rose-200 bg-rose-50 text-xs font-semibold text-rose-900"
                    >
                      Yêu cầu sửa
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Order Reconciliation & Reversal Test */}
          <section className="bg-surface border border-line rounded-2xl p-5 space-y-3">
            <h2 className="text-base font-bold text-ink">Đối soát đơn &amp; Bút toán đảo (Double-Entry Append-Only)</h2>
            <div className="space-y-2.5">
              {dashboard.orders.map((o) => (
                <div key={o.id} className="p-3.5 rounded-xl bg-canvas border border-line flex flex-col lg:flex-row lg:items-center justify-between gap-3 tabular-nums">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <PlatformBadge platform={o.platform} />
                      <OrderStatusBadge status={o.status} />
                      <OrderSourceBadge source={o.source} />
                      <span className="font-mono text-xs text-muted">{o.externalOrderId}</span>
                    </div>
                    <p className="text-sm font-bold text-ink">{o.productTitle}</p>
                    <p className="text-xs text-muted">
                      Doanh thu: {formatVnd(o.grossAmountVnd)} · Hoa hồng: {formatVnd(o.commissionVnd)} · {o.affiliateName}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 shrink-0">
                    {(o.status === 'placed' || o.status === 'confirmed') && (
                      <button
                        type="button"
                        onClick={() => handleReconcileOrder(o, 'completed')}
                        className="min-h-[44px] px-3.5 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs font-semibold"
                      >
                        Chốt hoàn thành
                      </button>
                    )}
                    {(o.status === 'confirmed' || o.status === 'completed') && (
                      <button
                        type="button"
                        onClick={() => handleReconcileOrder(o, 'refunded')}
                        className="min-h-[44px] px-3.5 rounded-xl border border-rose-200 bg-rose-50 text-xs font-semibold text-rose-900 inline-flex items-center gap-1"
                      >
                        <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Hoàn đơn (Đảo bút toán)</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Global CSV Import + Audit Logs */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <section className="bg-surface border border-line rounded-2xl p-5 space-y-3">
              <h2 className="text-base font-bold text-ink flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-brand" aria-hidden="true" />
                <span>Import đơn mẫu toàn cục (Ops)</span>
              </h2>
              <textarea
                rows={4}
                aria-label="Nội dung CSV đơn mẫu Ops"
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                className="w-full p-3 rounded-xl border border-line bg-canvas font-mono text-xs"
              />
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setCsvPreview(parseOrderImportCsv(csvText))}
                  className="min-h-[44px] px-4 rounded-xl border border-line bg-canvas text-xs font-semibold text-ink"
                >
                  Preview kiểm lỗi
                </button>
                {csvPreview && csvPreview.rows.length > 0 && (
                  <button
                    type="button"
                    onClick={async () => {
                      const res = await commitOrderImportRows({ rows: csvPreview.rows, token: session?.accessToken });
                      setNotice(`Ops đã nạp ${res.insertedCount} đơn mới (${res.duplicateCount} đơn trùng đã bỏ qua).`);
                      await refresh();
                    }}
                    className="min-h-[44px] px-4 rounded-xl bg-brand text-white text-xs font-semibold"
                  >
                    Xác nhận commit {csvPreview.rows.length} dòng
                  </button>
                )}
              </div>
              {csvPreview && (
                <p className="text-xs text-muted">
                  Hợp lệ: {csvPreview.rows.length} · Lỗi: {csvPreview.errors.length}
                </p>
              )}
            </section>

            <section className="bg-surface border border-line rounded-2xl p-5 space-y-3">
              <h2 className="text-base font-bold text-ink">Nhật ký Audit Log gần nhất</h2>
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {dashboard.auditLogs.slice(0, 12).map((log) => (
                  <div key={log.id} className="p-2.5 rounded-xl bg-canvas border border-line text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono font-bold text-ink">{log.action}</span>
                      <span className="text-muted tabular-nums">{formatDateTimeVn(log.createdAt)}</span>
                    </div>
                    <p className="text-ink mt-0.5">
                      {log.actorLabel} → {log.targetLabel}
                    </p>
                    <p className="text-muted">{log.detail}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
}
