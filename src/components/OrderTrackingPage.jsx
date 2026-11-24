import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  MapPin,
  PackageCheck,
  PackageSearch,
  Search,
  Store,
  UserCheck,
  XCircle
} from 'lucide-react';
import { lookupBuyerOrders } from '../services/ocopStore';
import { formatDateTimeVn, formatVnd } from '../utils/formatters';
import { OrderSourceBadge, OrderStatusBadge } from './StatusBadges';

const STEPS = [
  { key: 'placed', label: 'Khách đã đặt đơn', Icon: Clock },
  { key: 'confirmed', label: 'Nhà vườn đã nhận đơn', Icon: CheckCircle2 },
  { key: 'completed', label: 'Đã hoàn thành giao/nhận', Icon: PackageCheck }
];

function stepIndexForStatus(status) {
  if (status === 'completed') return 2;
  if (status === 'confirmed') return 1;
  if (status === 'placed') return 0;
  return -1;
}

export default function OrderTrackingPage({ session, onOpenSellerOrder }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCode = searchParams.get('code') || '';
  const [query, setQuery] = useState(initialCode);
  const [orders, setOrders] = useState(() => lookupBuyerOrders(initialCode));

  useEffect(() => {
    const code = searchParams.get('code') || '';
    setQuery(code);
    setOrders(lookupBuyerOrders(code));
  }, [searchParams]);

  function handleSearchSubmit(e) {
    e.preventDefault();
    const trimmed = query.trim();
    const next = new URLSearchParams();
    if (trimmed) next.set('code', trimmed);
    setSearchParams(next);
    setOrders(lookupBuyerOrders(trimmed));
  }

  function handleRefresh() {
    setOrders(lookupBuyerOrders(query.trim()));
  }

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <section className="bg-surface border border-line rounded-2xl p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-brand flex items-center gap-1.5">
              <PackageSearch className="w-4 h-4" aria-hidden="true" />
              <span>Tra cứu trạng thái đơn hàng của khách</span>
            </p>
            <h1 className="text-xl sm:text-2xl font-extrabold text-ink mt-0.5">
              Kiểm tra đơn đặt tại Chợ OCOP Thanh Niên
            </h1>
          </div>
          <Link
            to="/"
            className="min-h-[44px] px-3.5 rounded-xl border border-line bg-canvas text-sm font-semibold text-ink inline-flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            <span>Về cửa hàng</span>
          </Link>
        </div>

        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <label htmlFor="track-order-query" className="sr-only">
              Nhập mã đơn hàng hoặc số điện thoại
            </label>
            <Search className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
            <input
              id="track-order-query"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Nhập mã đơn (VD: DON-LK-...) hoặc 4 số cuối điện thoại"
              className="w-full min-h-[46px] pl-10 pr-3 rounded-xl border border-line bg-canvas text-sm font-mono"
            />
          </div>
          <button type="submit" className="ocop-primary px-5">
            Tra cứu đơn
          </button>
          <button type="button" onClick={handleRefresh} className="ocop-secondary">
            Cập nhật mới nhất
          </button>
        </form>
        <p className="text-xs text-muted">
          Trạng thái đơn được lưu bền vững trên thiết bị cho chế độ trải nghiệm mẫu — khi nhà vườn bấm <strong>Nhận đơn</strong>, khách tra cứu lại (kể cả sau khi tải lại trang) sẽ thấy trạng thái mới ngay.
        </p>
      </section>

      {orders.length === 0 ? (
        <section className="bg-surface border border-line rounded-2xl p-8 text-center space-y-3">
          <PackageSearch className="w-10 h-10 text-muted mx-auto" aria-hidden="true" />
          <h2 className="text-lg font-bold text-ink">Không tìm thấy đơn hàng khớp &ldquo;{query}&rdquo;</h2>
          <p className="text-sm text-muted">
            Hãy kiểm tra lại mã đơn (ví dụ <span className="font-mono">DON-LK-2411-02</span>) hoặc xóa ô tìm kiếm để xem các đơn gần đây.
          </p>
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setSearchParams(new URLSearchParams());
              setOrders(lookupBuyerOrders(''));
            }}
            className="ocop-primary"
          >
            Xem các đơn gần đây
          </button>
        </section>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const activeStep = stepIndexForStatus(order.status);
            const isCancelled = order.status === 'cancelled' || order.status === 'refunded';
            return (
              <article
                key={order.id}
                className="bg-surface border border-line rounded-2xl p-5 space-y-4 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-base font-extrabold text-brand">
                        {order.orderCode || order.externalOrderId}
                      </span>
                      <OrderStatusBadge status={order.status} />
                      <OrderSourceBadge source={order.source} />
                    </div>
                    <p className="text-xs text-muted">
                      Đặt lúc: {formatDateTimeVn(order.orderedAt)}
                      {order.updatedAt ? ` · Cập nhật: ${formatDateTimeVn(order.updatedAt)}` : ''}
                    </p>
                  </div>
                  <div className="text-right tabular-nums">
                    <p className="text-xs text-muted">Tổng dự kiến</p>
                    <p className="text-lg font-extrabold text-ink">{formatVnd(order.grossAmountVnd)}</p>
                  </div>
                </div>

                {/* Progress Stepper */}
                {isCancelled ? (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-sm font-semibold text-rose-900 flex items-center gap-2">
                    <XCircle className="w-5 h-5 shrink-0" aria-hidden="true" />
                    <span>Đơn hàng đã chuyển sang trạng thái: {order.status === 'cancelled' ? 'Đã hủy' : 'Đã hoàn trả'}.</span>
                  </div>
                ) : (
                  <ol className="grid grid-cols-1 sm:grid-cols-3 gap-2.5" aria-label="Tiến độ xử lý đơn hàng">
                    {STEPS.map((step, idx) => {
                      const done = activeStep >= idx;
                      const StepIcon = step.Icon;
                      return (
                        <li
                          key={step.key}
                          className={`p-3 rounded-xl border flex items-center gap-2.5 text-xs sm:text-sm font-semibold ${
                            done
                              ? 'bg-blue-50 border-brand text-brand'
                              : 'bg-canvas border-line text-muted'
                          }`}
                        >
                          <StepIcon className="w-4 h-4 shrink-0" aria-hidden="true" />
                          <span>
                            {idx + 1}. {step.label}
                          </span>
                        </li>
                      );
                    })}
                  </ol>
                )}

                <div className="p-3.5 rounded-xl bg-canvas border border-line text-xs sm:text-sm space-y-1.5">
                  <p className="font-bold text-ink">
                    {order.producerName || 'Nhà vườn Đồng Nai'} · {order.productTitle}
                  </p>
                  <p className="text-muted flex items-start gap-1.5">
                    <MapPin className="w-4 h-4 text-brand shrink-0 mt-0.5" aria-hidden="true" />
                    <span>{order.deliveryLabel}</span>
                  </p>
                  {order.customerName && (
                    <p className="text-muted">
                      Người nhận: <strong className="text-ink">{order.customerName}</strong> ({order.customerPhone})
                    </p>
                  )}
                  {order.affiliateCode && (
                    <p className="text-emerald-900 flex items-center gap-1.5 pt-1">
                      <UserCheck className="w-4 h-4 text-emerald-700 shrink-0" aria-hidden="true" />
                      <span>
                        Ghi nhận giới thiệu: <strong>{order.affiliateName}</strong> (Mã{' '}
                        <span className="font-mono font-bold">{order.affiliateCode}</span>) · Hoa hồng ước tính{' '}
                        <strong>{formatVnd(order.commissionVnd)}</strong>
                      </span>
                    </p>
                  )}
                </div>

                {session?.mode !== 'supabase' && typeof onOpenSellerOrder === 'function' && (
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-line">
                    <span className="text-xs text-muted">
                      Chế độ trải nghiệm mẫu: bấm nút bên phải để đóng vai Nhà vườn mở đúng đơn này và xác nhận.
                    </span>
                    <button
                      type="button"
                      onClick={() => onOpenSellerOrder(order)}
                      className="min-h-[44px] px-4 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs sm:text-sm font-bold inline-flex items-center gap-1.5"
                    >
                      <Store className="w-4 h-4" aria-hidden="true" />
                      <span>
                        {order.status === 'placed' ? 'Thử vai Nhà vườn để Nhận đơn' : 'Mở trong Quản lý đơn vườn'}
                      </span>
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
