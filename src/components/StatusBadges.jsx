import React from 'react';
import {
  Award,
  CheckCircle2,
  Clock3,
  AlertTriangle,
  FileEdit,
  Database,
  FileSpreadsheet,
  Store
} from 'lucide-react';
import { PLATFORM_META } from '../utils/formatters';

export function OcopStarBadge({ stars = 4 }) {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-300 tabular-nums">
      <Award className="w-3.5 h-3.5 text-accent shrink-0" aria-hidden="true" />
      <span>OCOP {stars} sao</span>
    </span>
  );
}

export function ProductStatusBadge({ status }) {
  const map = {
    published: {
      label: 'Đã công bố',
      cls: 'bg-emerald-50 text-emerald-900 border-emerald-300',
      Icon: CheckCircle2
    },
    pending_review: {
      label: 'Chờ duyệt',
      cls: 'bg-amber-50 text-amber-900 border-amber-300',
      Icon: Clock3
    },
    needs_revision: {
      label: 'Cần sửa',
      cls: 'bg-rose-50 text-rose-900 border-rose-300',
      Icon: AlertTriangle
    },
    draft: {
      label: 'Bản nháp',
      cls: 'bg-stone-100 text-stone-800 border-stone-300',
      Icon: FileEdit
    }
  };
  const item = map[status] || map.draft;
  const Icon = item.Icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${item.cls}`}>
      <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
      <span>{item.label}</span>
    </span>
  );
}

export function PlatformBadge({ platform }) {
  const meta = PLATFORM_META[platform] || {
    label: platform || 'Sàn TMĐT',
    badgeClass: 'bg-stone-700 text-white'
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold tracking-tight ${meta.badgeClass}`}>
      {meta.label}
    </span>
  );
}

export function OrderSourceBadge({ source }) {
  if (source === 'cart_demo') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-900 border border-emerald-200">
        <Store className="w-3.5 h-3.5" aria-hidden="true" />
        <span>Đơn đặt từ Giỏ hàng (Demo)</span>
      </span>
    );
  }
  if (source === 'csv_import') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-sky-50 text-sky-900 border border-sky-200">
        <FileSpreadsheet className="w-3.5 h-3.5" aria-hidden="true" />
        <span>Import CSV mẫu</span>
      </span>
    );
  }
  if (source === 'partner_api') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-900 border border-emerald-300">
        <Store className="w-3.5 h-3.5" aria-hidden="true" />
        <span>API Sàn chính thức</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-900 border border-amber-200">
      <Database className="w-3.5 h-3.5" aria-hidden="true" />
      <span>Dữ liệu Demo Pilot</span>
    </span>
  );
}

export function OrderStatusBadge({ status }) {
  const map = {
    placed: { label: 'Mới đặt', cls: 'bg-stone-100 text-stone-800 border-stone-300' },
    confirmed: { label: 'Đã xác nhận', cls: 'bg-sky-50 text-sky-900 border-sky-200' },
    completed: { label: 'Hoàn thành', cls: 'bg-emerald-50 text-emerald-900 border-emerald-300' },
    cancelled: { label: 'Đã hủy', cls: 'bg-stone-200 text-stone-700 border-stone-300' },
    refunded: { label: 'Hoàn trả', cls: 'bg-rose-50 text-rose-900 border-rose-300' }
  };
  const info = map[status] || map.placed;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${info.cls}`}>
      {info.label}
    </span>
  );
}
