import React, { useState } from 'react';
import { CalendarCheck, Presentation, Smartphone, CheckCircle2, Send, Info } from 'lucide-react';
import { PILOT_ROADMAP_90_DAYS } from '../data/pilotData';
import { submitPilotApplication } from '../services/ocopStore';
import { getTurnstileSiteKey } from '../services/authService';

export default function PilotOverviewPage() {
  const [applicantName, setApplicantName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [area, setArea] = useState('Định Quán');
  const [productNote, setProductNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const turnstileKey = getTurnstileSiteKey();

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setStatusMessage('');
    setErrorMessage('');
    try {
      await submitPilotApplication({
        applicantName: applicantName.trim(),
        businessName: businessName.trim(),
        area,
        productNote: productNote.trim()
      });
      setStatusMessage('Đã ghi nhận đăng ký tham gia chương trình Pilot OCOP Đồng Nai (dữ liệu mẫu khi chưa nối API).');
      setApplicantName('');
      setBusinessName('');
      setProductNote('');
    } catch (err) {
      setErrorMessage(err?.message || 'Không thể gửi đăng ký tham gia.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="bg-surface border border-line rounded-2xl p-5 sm:p-7 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-2 max-w-3xl">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand">
            <CalendarCheck className="w-4 h-4" aria-hidden="true" />
            <span>Hồ sơ triển khai thử nghiệm &amp; Bài nộp Hackathon 2026</span>
          </div>
          <h1 className="text-2xl font-bold text-ink">Kế hoạch 90 ngày ra mắt 10 sản phẩm OCOP Đồng Nai</h1>
          <p className="text-sm text-muted leading-relaxed">
            Phân tách rõ giữa <strong>chỉ tiêu KPI mục tiêu</strong> trong kế hoạch 90 ngày và <strong>trạng thái kiểm chứng kỹ thuật hiện tại</strong> của bản mẫu.
          </p>
        </div>
        <a
          href={`${import.meta.env.BASE_URL}pitch-deck.html`}
          target="_blank"
          rel="noopener noreferrer"
          className="min-h-[44px] px-5 rounded-xl bg-brand hover:bg-brand-hover text-white text-sm font-semibold inline-flex items-center justify-center gap-2 shrink-0"
        >
          <Presentation className="w-4 h-4" aria-hidden="true" />
          <span>Mở Pitch Deck 10 slide</span>
        </a>
      </section>

      {/* 3-phase 90-day timeline */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {PILOT_ROADMAP_90_DAYS.map((step) => (
          <article key={step.phase} className="bg-surface border border-line rounded-2xl p-5 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <span className="inline-block px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-bold text-brand">
                {step.phase}
              </span>
              <h2 className="text-lg font-bold text-ink">{step.title}</h2>
              <ul className="space-y-1.5 text-sm text-ink list-disc pl-5">
                {step.actions.map((act) => (
                  <li key={act}>{act}</li>
                ))}
              </ul>
            </div>
            <div className="space-y-2 pt-3 border-t border-line">
              <p className="text-xs font-bold uppercase tracking-wider text-accent">Chỉ tiêu KPI mục tiêu (Chưa đo thực địa)</p>
              <ul className="space-y-1 text-xs text-muted">
                {step.targetKpis.map((kpi) => (
                  <li key={kpi} className="flex items-start gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-brand shrink-0 mt-0.5" aria-hidden="true" />
                    <span>{kpi}</span>
                  </li>
                ))}
              </ul>
              <p className="text-xs bg-canvas border border-line rounded-lg p-2.5 text-ink">
                <span className="font-semibold">Thực trạng hiện tại:</span> {step.measuredStatus}
              </p>
            </div>
          </article>
        ))}
      </section>

      {/* PWA Install Guide + Pilot Registration Form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-surface border border-line rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-brand" aria-hidden="true" />
            <h2 className="text-lg font-bold text-ink">Cài ứng dụng PWA trên điện thoại &amp; PC</h2>
          </div>
          <p className="text-sm text-muted">
            Chợ OCOP Thanh Niên hỗ trợ cài trực tiếp từ trình duyệt mà không cần tải file APK nặng, dùng chung ngay cho chủ cơ sở quay video và đoàn viên lấy link.
          </p>
          <div className="space-y-3 text-sm">
            <div className="p-3.5 rounded-xl bg-canvas border border-line">
              <p className="font-bold text-ink">Android (Chrome / Edge)</p>
              <p className="text-xs text-muted mt-1">
                Mở link Cloudflare Pages bằng Chrome → bấm menu 3 chấm góc phải → chọn <strong>Cài đặt ứng dụng</strong> (Install app).
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-canvas border border-line">
              <p className="font-bold text-ink">iPhone / iPad (Safari)</p>
              <p className="text-xs text-muted mt-1">
                Mở bằng Safari → bấm nút <strong>Chia sẻ (Share)</strong> ở thanh dưới → chọn <strong>Thêm vào MH chính</strong> (Add to Home Screen).
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-canvas border border-line">
              <p className="font-bold text-ink">Máy tính Windows / macOS (Chrome / Edge)</p>
              <p className="text-xs text-muted mt-1">
                Nhấn biểu tượng <strong>Cài đặt ứng dụng</strong> ở góc phải thanh địa chỉ để mở dưới dạng cửa sổ độc lập.
              </p>
            </div>
          </div>
        </section>

        <section className="bg-surface border border-line rounded-2xl p-5 sm:p-6 space-y-4">
          <div>
            <h2 className="text-lg font-bold text-ink">Đăng ký cơ sở OCOP tham gia thử nghiệm</h2>
            <p className="text-xs text-muted mt-1">
              Biểu mẫu công khai được thiết kế gắn bảo vệ Cloudflare Turnstile trước khi ghi API để chống gửi rác.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label htmlFor="pilot-name" className="block text-xs font-semibold text-ink mb-1">
                Họ và tên chủ cơ sở / đại diện
              </label>
              <input
                id="pilot-name"
                required
                value={applicantName}
                onChange={(e) => setApplicantName(e.target.value)}
                className="w-full min-h-[44px] px-3 rounded-xl border border-line bg-canvas text-sm"
                placeholder="VD: Lê Văn An"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="pilot-biz" className="block text-xs font-semibold text-ink mb-1">
                  Tên cơ sở / HTX OCOP
                </label>
                <input
                  id="pilot-biz"
                  required
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full min-h-[44px] px-3 rounded-xl border border-line bg-canvas text-sm"
                  placeholder="VD: HTX Bưởi Tân Triều"
                />
              </div>
              <div>
                <label htmlFor="pilot-area" className="block text-xs font-semibold text-ink mb-1">
                  Địa bàn Đồng Nai
                </label>
                <input
                  id="pilot-area"
                  required
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  className="w-full min-h-[44px] px-3 rounded-xl border border-line bg-canvas text-sm"
                />
              </div>
            </div>
            <div>
              <label htmlFor="pilot-note" className="block text-xs font-semibold text-ink mb-1">
                Sản phẩm dự kiến đưa lên sàn
              </label>
              <textarea
                id="pilot-note"
                rows={3}
                required
                value={productNote}
                onChange={(e) => setProductNote(e.target.value)}
                className="w-full p-3 rounded-xl border border-line bg-canvas text-sm"
                placeholder="Mô tả quy cách, hạng sao OCOP hiện có và sàn đã mở (nếu có)..."
              />
            </div>

            <div className="p-3 rounded-xl bg-canvas border border-line text-xs text-muted flex items-center gap-2">
              <Info className="w-4 h-4 text-brand shrink-0" aria-hidden="true" />
              <span>
                {turnstileKey
                  ? 'Turnstile Site Key đã cấu hình — kiểm tra chống bot tự động trước khi gửi.'
                  : 'Chế độ dev/demo chưa gắn VITE_TURNSTILE_SITE_KEY — khi xuất bản cần cấu hình key thật.'}
              </span>
            </div>

            {errorMessage && (
              <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-3" role="alert">
                {errorMessage}
              </p>
            )}
            {statusMessage && (
              <p className="text-xs text-emerald-900 bg-emerald-50 border border-emerald-200 rounded-xl p-3" role="status">
                {statusMessage}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full min-h-[44px] px-5 rounded-xl bg-brand hover:bg-brand-hover text-white text-sm font-semibold inline-flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" aria-hidden="true" />
              <span>{submitting ? 'Đang gửi...' : 'Gửi đăng ký tham gia thử nghiệm'}</span>
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
