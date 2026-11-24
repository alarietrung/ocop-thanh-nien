import React from 'react';
import {
  Award,
  CheckCircle2,
  Clock3,
  AlertTriangle,
  FileEdit,
  Database,
  FileSpreadsheet,
  Store,
  Cloud
} from 'lucide-react';
import { PLATFORM_META } from '../utils/formatters';

export function OcopStarBadge({ stars = 4, showIllustrative = true }) {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-950 border border-amber-300 tabular-nums">
      <Award className="w-3.5 h-3.5 text-amber-700 shrink-0" aria-hidden="true" />
      <span>
        OCOP {stars} sao{showIllustrative ? ' (minh họa)' : ''}
      </span>
    </span>
  );
}

export function ProductStatusBadge({ status }) {
  const map = {
    published: {
      label: 'Đang mở bán',
      cls: 'bg-emerald-50 text-emerald-900 border-emerald-300',
      Icon: CheckCircle2
    },
    pending_review: {
      label: 'Chờ duyệt',
      cls: 'bg-amber-50 text-amber-900 border-amber-300',
      Icon: Clock3
    },
    needs_revision: {
      label: 'Cần bổ sung',
      cls: 'bg-rose-50 text-rose-900 border-rose-300',
      Icon: AlertTriangle
    },
    draft: {
      label: 'Bản nháp',
      cls: 'bg-slate-100 text-slate-800 border-slate-300',
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
    label: platform || 'Kênh đối tác',
    badgeClass: 'bg-slate-700 text-white'
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold tracking-tight ${meta.badgeClass}`}>
      {meta.label}
    </span>
  );
}

export function OrderSourceBadge({ source }) {
  if (source === 'supabase') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-900 border border-blue-200">
        <Cloud className="w-3.5 h-3.5" aria-hidden="true" />
        <span>Đơn máy chủ (Supabase)</span>
      </span>
    );
  }
  if (source === 'cart_demo') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-900 border border-emerald-200">
        <Store className="w-3.5 h-3.5" aria-hidden="true" />
        <span>Đặt trực tiếp Chợ OCOP</span>
      </span>
    );
  }
  if (source === 'csv_import') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-sky-50 text-sky-900 border border-sky-200">
        <FileSpreadsheet className="w-3.5 h-3.5" aria-hidden="true" />
        <span>Nhập từ CSV mẫu</span>
      </span>
    );
  }
  if (source === 'partner_api') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-900 border border-emerald-300">
        <Store className="w-3.5 h-3.5" aria-hidden="true" />
        <span>Kênh đối tác</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-900 border border-amber-200">
      <Database className="w-3.5 h-3.5" aria-hidden="true" />
      <span>Dữ liệu mẫu trải nghiệm</span>
    </span>
  );
}

export function OrderStatusBadge({ status }) {
  const map = {
    placed: { label: 'Mới đặt — Chờ nhà vườn nhận', cls: 'bg-amber-50 text-amber-950 border-amber-300' },
    confirmed: { label: 'Nhà vườn đã nhận đơn', cls: 'bg-blue-50 text-blue-950 border-blue-300' },
    completed: { label: 'Đã hoàn thành', cls: 'bg-emerald-50 text-emerald-900 border-emerald-300' },
    cancelled: { label: 'Đã hủy', cls: 'bg-slate-200 text-slate-800 border-slate-300' },
    refunded: { label: 'Đã hoàn trả', cls: 'bg-rose-50 text-rose-900 border-rose-300' }
  };
  const info = map[status] || map.placed;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${info.cls}`}>
      {info.label}
    </span>
  );
}
