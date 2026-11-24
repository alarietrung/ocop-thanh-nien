import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ExternalLink, ShieldAlert, MousePointerClick, CheckCircle2 } from 'lucide-react';
import { lookupRedirectCode, recordIntentionalVisit } from '../services/ocopStore';
import { formatVnd, PLATFORM_META } from '../utils/formatters';
import { OcopStarBadge, PlatformBadge } from './StatusBadges';

export default function AffiliateRedirectPage() {
  const { code } = useParams();
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [visiting, setVisiting] = useState(false);
  const [visitResult, setVisitResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setErrorMsg('');
      try {
        const res = await lookupRedirectCode(code);
        if (!cancelled) {
          setInfo(res);
        }
      } catch (err) {
        if (!cancelled) setErrorMsg(err?.message || 'Không thể tải thông tin liên kết chia sẻ.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [code]);

  async function handleConfirmVisit() {
    setVisiting(true);
    setErrorMsg('');
    try {
      const result = await recordIntentionalVisit(code);
      setVisitResult(result);
      setInfo((prev) => (prev ? { ...prev, clicksCount: result.clicksCount } : prev));
      window.open(result.targetUrl, '_blank', 'noopener,noreferrer');
    } catch (err) {
      setErrorMsg(err?.message || 'Không thể chuyển hướng sang sàn đối tác.');
    } finally {
      setVisiting(false);
    }
  }

  if (loading) {
    return <div className="max-w-xl mx-auto bg-surface border border-line rounded-2xl p-6 animate-pulse h-64" />;
  }

  if (!info || !info.product) {
    return (
      <div className="max-w-xl mx-auto bg-surface border border-line rounded-2xl p-6 sm:p-8 text-center space-y-4">
        <ShieldAlert className="w-10 h-10 text-amber-700 mx-auto" aria-hidden="true" />
        <h1 className="text-xl font-bold text-ink">Liên kết chia sẻ không tồn tại</h1>
        <p className="text-sm text-muted">
          Mã <span className="font-mono">{code}</span> chưa được đăng ký hoặc sản phẩm đã ngừng công bố.
        </p>
        <Link
          to="/"
          className="min-h-[44px] px-5 rounded-xl bg-brand text-white text-sm font-semibold inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          <span>Xem Chợ OCOP Đồng Nai</span>
        </Link>
      </div>
    );
  }

  if (!info.active) {
    return (
      <div className="max-w-xl mx-auto bg-surface border border-amber-300 rounded-2xl p-6 sm:p-8 text-center space-y-4">
        <ShieldAlert className="w-10 h-10 text-amber-700 mx-auto" aria-hidden="true" />
        <h1 className="text-xl font-bold text-ink">Liên kết đã bị vô hiệu hóa</h1>
        <p className="text-sm text-muted">
          Mã chia sẻ <span className="font-mono">{info.code}</span> đã được người tạo tạm ngưng nên không còn điều hướng ra sàn.
        </p>
        <Link
          to={`/san-pham/${info.product.slug}`}
          className="min-h-[44px] px-5 rounded-xl bg-brand text-white text-sm font-semibold inline-flex items-center gap-2"
        >
          <span>Xem sản phẩm trên Chợ OCOP</span>
        </Link>
      </div>
    );
  }

  const platformName = PLATFORM_META[info.platform]?.label || info.platform;

  return (
    <div className="max-w-xl mx-auto space-y-4">
      <div className="bg-surface border border-line rounded-2xl overflow-hidden">
        <img
          src={info.product.imageUrl}
          alt={info.product.title}
          width="640"
          height="480"
          className="w-full aspect-[4/3] object-cover border-b border-line"
        />
        <div className="p-5 sm:p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <OcopStarBadge stars={info.product.ocopStars} />
            <PlatformBadge platform={info.platform} />
          </div>

          <div>
            <h1 className="text-xl font-bold text-ink leading-snug">{info.product.title}</h1>
            <p className="text-xs text-muted mt-1">
              Giới thiệu bởi: <span className="font-semibold text-ink">{info.affiliateName}</span> · Mã{' '}
              <span className="font-mono">{info.code}</span>
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-canvas border border-line flex items-center justify-between tabular-nums">
            <div>
              <p className="text-xs text-muted">Giá tham khảo ({info.product.unit})</p>
              <p className="text-xl font-extrabold text-ink">{formatVnd(info.product.priceVnd)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted">Lượt bấm có chủ ý</p>
              <p className="text-base font-bold text-brand inline-flex items-center gap-1">
                <MousePointerClick className="w-4 h-4" aria-hidden="true" />
                <span>{info.clicksCount || 0}</span>
              </p>
            </div>
          </div>

          <p className="text-xs text-muted bg-amber-50 border border-amber-200 rounded-xl p-3">
            Chống đếm ảo: Lượt mở xem trước từ ứng dụng nhắn tin không tính là lượt click. Lượt bấm chỉ được ghi nhận khi bạn chủ động bấm nút đi tới sàn bên dưới.
            {info.isDemoTarget && ' (Đích liên kết hiện đang ở chế độ minh họa pilot.)'}
          </p>

          {errorMsg && (
            <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-3" role="alert">
              {errorMsg}
            </p>
          )}

          {visitResult && (
            <div className="text-xs text-emerald-900 bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="w-4 h-4 text-brand shrink-0" aria-hidden="true" />
                Đã ghi nhận 1 lượt chuyển sàn hợp lệ.
              </span>
              <a
                href={visitResult.targetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-bold shrink-0"
              >
                Mở lại nếu bị chặn popup
              </a>
            </div>
          )}

          <button
            type="button"
            disabled={visiting}
            onClick={handleConfirmVisit}
            className="w-full min-h-[48px] px-5 rounded-xl bg-brand hover:bg-brand-hover text-white text-sm sm:text-base font-bold inline-flex items-center justify-center gap-2 transition"
          >
            <span>{visiting ? 'Đang chuyển tới sàn...' : `Đến trang mua chính hãng trên ${platformName}`}</span>
            <ExternalLink className="w-4 h-4" aria-hidden="true" />
          </button>

          <div className="text-center pt-1">
            <Link to={`/san-pham/${info.product.slug}`} className="text-xs font-semibold text-muted underline hover:text-ink">
              Xem thêm thông tin cơ sở OCOP trước khi sang sàn
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
