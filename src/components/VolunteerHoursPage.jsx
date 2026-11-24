import React, { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Download,
  HeartHandshake,
  Plus,
  Store,
  UserCheck,
  XCircle
} from 'lucide-react';
import { DEMO_YOUTH_MEMBERS, PRIMARY_FARMER_PRODUCER_ID } from '../data/pilotData';
import {
  addVolunteerLog,
  fetchAllProducers,
  fetchVolunteerLogs,
  getVolunteerTotals,
  reviewVolunteerLog
} from '../services/ocopStore';
import { buildSafeCsv } from '../utils/formatters';

const QUICK_TASKS = [
  'Hỗ trợ chụp ảnh nông sản & đăng bài bằng giọng nói',
  'Gắn tem QR nhật ký mùa vụ tại bàn sơ chế',
  'Hỗ trợ quay dựng & dẫn phiên livestream tại vườn',
  'Hướng dẫn chủ vườn nhận đơn & cập nhật trạng thái'
];

export default function VolunteerHoursPage({ session, onQuickSwitchSeller }) {
  const producers = fetchAllProducers();
  const isSeller =
    session?.mode === 'supabase' ? session?.user?.role === 'seller' : session?.persona?.role === 'seller';
  const sellerProducerId =
    session?.persona?.producerId || session?.user?.producerId || PRIMARY_FARMER_PRODUCER_ID;

  const [logs, setLogs] = useState(() => fetchVolunteerLogs());
  const [statusFilter, setStatusFilter] = useState('all');
  const [memberFilter, setMemberFilter] = useState('all');

  const [memberId, setMemberId] = useState(DEMO_YOUTH_MEMBERS[0].id);
  const [producerId, setProducerId] = useState(PRIMARY_FARMER_PRODUCER_ID);
  const [activityDate, setActivityDate] = useState('2026-11-24');
  const [taskTitle, setTaskTitle] = useState('');
  const [hours, setHours] = useState('2');
  const [note, setNote] = useState('');
  const [rejectNotes, setRejectNotes] = useState({});
  const [feedback, setFeedback] = useState({ type: '', text: '' });

  const totals = getVolunteerTotals(logs);

  const filteredLogs = logs.filter((row) => {
    if (statusFilter !== 'all' && row.status !== statusFilter) return false;
    if (memberFilter !== 'all' && row.memberId !== memberFilter) return false;
    return true;
  });

  function refreshLogs() {
    setLogs(fetchVolunteerLogs());
  }

  function handleAddLog(e) {
    e.preventDefault();
    setFeedback({ type: '', text: '' });
    try {
      const created = addVolunteerLog({
        memberId,
        producerId,
        activityDate,
        taskTitle,
        hours: Number(hours),
        note
      });
      refreshLogs();
      setTaskTitle('');
      setNote('');
      setFeedback({
        type: 'success',
        text: `Đã ghi nhận ${created.hours} giờ tình nguyện cho ${created.memberName} (trạng thái: Chờ chủ vườn duyệt).`
      });
    } catch (err) {
      setFeedback({ type: 'error', text: err?.message || 'Không thể lưu nhật ký giờ tình nguyện.' });
    }
  }

  function handleReview(log, decision) {
    setFeedback({ type: '', text: '' });
    try {
      const updated = reviewVolunteerLog({
        logId: log.id,
        decision,
        reviewNote: rejectNotes[log.id] || '',
        producerId: isSeller ? sellerProducerId : null
      });
      refreshLogs();
      setFeedback({
        type: 'success',
        text:
          decision === 'approved'
            ? `Chủ vườn đã DUYỆT ${updated.hours} giờ cho ${updated.memberName}. Tổng giờ đã duyệt đã tự cập nhật!`
            : `Chủ vườn đã TỪ CHỐI bản ghi của ${updated.memberName}.`
      });
    } catch (err) {
      setFeedback({ type: 'error', text: err?.message || 'Không thể duyệt bản ghi.' });
    }
  }

  function exportVolunteerCsv() {
    const csv = buildSafeCsv(
      [
        { key: 'activityDate', label: 'Ngày' },
        { key: 'memberCode', label: 'Mã đoàn viên' },
        { key: 'memberName', label: 'Họ tên đoàn viên' },
        { key: 'memberUnit', label: 'Đơn vị Đoàn' },
        { key: 'producerName', label: 'Nhà vườn hỗ trợ' },
        { key: 'taskTitle', label: 'Công việc' },
        { key: 'hours', label: 'Số giờ' },
        { key: 'status', label: 'Trạng thái duyệt' }
      ],
      logs
    );
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'nhat-ky-gio-tinh-nguyen-ocop-dong-nai.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-5">
      <section className="bg-surface border border-line rounded-2xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs font-bold uppercase tracking-wider text-brand flex items-center gap-1.5">
            <HeartHandshake className="w-4 h-4" aria-hidden="true" />
            <span>Điểm cộng C · Nhật ký giờ tình nguyện Đoàn viên</span>
          </p>
          <h1 className="text-xl sm:text-2xl font-extrabold text-ink">
            Ghi nhận &amp; Chủ vườn duyệt giờ tình nguyện hỗ trợ nông dân
          </h1>
          <p className="text-sm text-muted">
            Minh bạch đóng góp của 2 đoàn viên hỗ trợ tại Nhà vườn Ba Tư theo ngày, vườn, công việc và số giờ. Chủ vườn bấm duyệt/từ chối để cộng vào tổng giờ đã duyệt.
          </p>
        </div>
        <button
          type="button"
          onClick={exportVolunteerCsv}
          className="min-h-[44px] px-4 rounded-xl border border-line bg-canvas hover:border-brand text-sm font-semibold text-ink inline-flex items-center gap-2 shrink-0"
        >
          <Download className="w-4 h-4 text-brand" aria-hidden="true" />
          <span>Xuất bảng giờ (CSV)</span>
        </button>
      </section>

      {/* Summary Cards for the 2 Demo Youth Members */}
      <section aria-label="Tổng giờ tình nguyện đã duyệt cho 2 đoàn viên" className="grid grid-cols-1 md:grid-cols-2 gap-4 tabular-nums">
        {totals.map((m) => (
          <article key={m.id} className="bg-surface border-2 border-blue-200 rounded-2xl p-5 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-mono text-xs text-brand font-bold">{m.code}</p>
                <h2 className="text-lg font-extrabold text-ink">{m.name}</h2>
                <p className="text-xs sm:text-sm text-muted">{m.unit}</p>
              </div>
              <div className="text-right px-3.5 py-2 rounded-xl bg-blue-50 border border-blue-200">
                <p className="text-xs font-semibold text-brand">Tổng giờ đã duyệt</p>
                <p className="text-2xl font-extrabold text-brand">{m.approvedHours} giờ</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-line text-xs sm:text-sm">
              <span className="text-amber-900 font-semibold">Chờ duyệt: {m.pendingHours} giờ</span>
              <span className="text-muted">
                Tổng lượt ghi: {m.totalEntries} {m.rejectedCount > 0 ? `· Từ chối: ${m.rejectedCount}` : ''}
              </span>
            </div>
          </article>
        ))}
      </section>

      {feedback.text && (
        <div
          role={feedback.type === 'error' ? 'alert' : 'status'}
          className={`rounded-2xl border p-4 text-sm font-semibold ${
            feedback.type === 'error'
              ? 'bg-rose-50 border-rose-300 text-rose-900'
              : 'bg-emerald-50 border-emerald-300 text-emerald-950'
          }`}
        >
          {feedback.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Log new volunteer hours */}
        <section className="lg:col-span-5 bg-surface border border-line rounded-2xl p-5 space-y-4 h-fit">
          <h2 className="text-lg font-bold text-ink flex items-center gap-2">
            <Plus className="w-5 h-5 text-brand" aria-hidden="true" />
            <span>Ghi nhật ký giờ tình nguyện mới</span>
          </h2>

          <form onSubmit={handleAddLog} className="space-y-3.5" noValidate>
            <div>
              <label htmlFor="vol-member" className="ocop-label">Đoàn viên thực hiện</label>
              <select
                id="vol-member"
                value={memberId}
                onChange={(e) => setMemberId(e.target.value)}
                className="ocop-field"
              >
                {DEMO_YOUTH_MEMBERS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} — {m.unit}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="vol-garden" className="ocop-label">Nhà vườn được hỗ trợ</label>
              <select
                id="vol-garden"
                value={producerId}
                onChange={(e) => setProducerId(e.target.value)}
                className="ocop-field"
              >
                {producers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.businessName}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="vol-date" className="ocop-label">Ngày thực hiện</label>
                <input
                  id="vol-date"
                  type="date"
                  required
                  value={activityDate}
                  onChange={(e) => setActivityDate(e.target.value)}
                  className="ocop-field tabular-nums"
                />
              </div>
              <div>
                <label htmlFor="vol-hours" className="ocop-label">Số giờ (0,5 – 12)</label>
                <input
                  id="vol-hours"
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="12"
                  required
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  className="ocop-field tabular-nums"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="vol-task" className="ocop-label">Công việc hỗ trợ tại vườn</label>
              <input
                id="vol-task"
                required
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="VD: Hỗ trợ chụp ảnh, dán mã QR, quay livestream..."
                className="ocop-field"
              />
              <div className="flex flex-wrap gap-1.5 pt-1">
                {QUICK_TASKS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTaskTitle(t)}
                    className="min-h-[38px] px-2.5 py-1 rounded-lg bg-canvas border border-line hover:border-brand text-xs font-medium text-ink text-left"
                  >
                    + {t}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="vol-note" className="ocop-label">Ghi chú minh chứng (tùy chọn)</label>
              <input
                id="vol-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="VD: Đã đăng xong 2 lô chôm chôm và kiểm thử QR..."
                className="ocop-field"
              />
            </div>

            <button type="submit" className="ocop-primary w-full min-h-[48px]">
              <UserCheck className="w-4 h-4" aria-hidden="true" />
              <span>Gửi nhật ký chờ chủ vườn duyệt</span>
            </button>
          </form>
        </section>

        {/* Right: Logs list + Farmer Approve / Reject controls */}
        <section className="lg:col-span-7 space-y-4">
          <div className="bg-surface border border-line rounded-2xl p-4 flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex flex-wrap gap-2">
              <select
                aria-label="Lọc trạng thái duyệt giờ"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="min-h-[44px] px-3 rounded-xl border border-line bg-canvas text-sm font-medium"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="pending">Chờ chủ vườn duyệt</option>
                <option value="approved">Đã duyệt</option>
                <option value="rejected">Từ chối</option>
              </select>
              <select
                aria-label="Lọc theo đoàn viên"
                value={memberFilter}
                onChange={(e) => setMemberFilter(e.target.value)}
                className="min-h-[44px] px-3 rounded-xl border border-line bg-canvas text-sm font-medium"
              >
                <option value="all">Cả 2 đoàn viên</option>
                {DEMO_YOUTH_MEMBERS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            {!isSeller && session?.mode !== 'supabase' && typeof onQuickSwitchSeller === 'function' && (
              <button
                type="button"
                onClick={onQuickSwitchSeller}
                className="min-h-[44px] px-4 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs sm:text-sm font-bold inline-flex items-center gap-1.5"
              >
                <Store className="w-4 h-4" aria-hidden="true" />
                <span>Bật vai Chủ vườn Ba Tư để duyệt giờ</span>
              </button>
            )}
          </div>

          {filteredLogs.length === 0 ? (
            <div className="bg-surface border border-line rounded-2xl p-8 text-center text-sm text-muted">
              Chưa có bản ghi giờ tình nguyện nào khớp bộ lọc.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredLogs.map((row) => {
                const badge =
                  row.status === 'approved'
                    ? { label: 'Đã duyệt', cls: 'bg-emerald-50 text-emerald-900 border-emerald-300', Icon: CheckCircle2 }
                    : row.status === 'rejected'
                      ? { label: 'Từ chối', cls: 'bg-rose-50 text-rose-900 border-rose-300', Icon: XCircle }
                      : { label: 'Chờ chủ vườn duyệt', cls: 'bg-amber-50 text-amber-950 border-amber-300', Icon: Clock };
                const BadgeIcon = badge.Icon;
                const canReview = isSeller && row.status === 'pending' && row.producerId === sellerProducerId;

                return (
                  <article key={row.id} className="bg-surface border border-line rounded-2xl p-4 sm:p-5 space-y-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badge.cls}`}>
                            <BadgeIcon className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>{badge.label}</span>
                          </span>
                          <span className="font-mono text-xs text-muted">{row.activityDate}</span>
                          <span className="text-xs font-semibold text-brand">{row.producerName}</span>
                        </div>
                        <h3 className="text-base font-bold text-ink">{row.taskTitle}</h3>
                        <p className="text-xs sm:text-sm text-muted">
                          <strong className="text-ink">{row.memberName}</strong> ({row.memberUnit})
                        </p>
                      </div>
                      <span className="px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 font-mono text-sm font-extrabold text-brand tabular-nums shrink-0">
                        {row.hours} giờ
                      </span>
                    </div>

                    {row.note && <p className="text-xs sm:text-sm text-muted bg-canvas rounded-xl p-3 border border-line">{row.note}</p>}
                    {row.reviewNote && (
                      <p className="text-xs text-ink font-medium">
                        Phản hồi chủ vườn: <span className="text-muted">{row.reviewNote}</span>
                      </p>
                    )}

                    {canReview && (
                      <div className="pt-3 border-t border-line flex flex-col sm:flex-row sm:items-center gap-2">
                        <input
                          type="text"
                          aria-label={`Ghi chú duyệt cho ${row.memberName}`}
                          value={rejectNotes[row.id] || ''}
                          onChange={(e) =>
                            setRejectNotes((prev) => ({ ...prev, [row.id]: e.target.value }))
                          }
                          placeholder="Ghi chú xác nhận hoặc lý do từ chối (tùy chọn)..."
                          className="flex-1 min-h-[44px] px-3 rounded-xl border border-line bg-canvas text-xs sm:text-sm"
                        />
                        <div className="flex gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleReview(row, 'approved')}
                            className="min-h-[44px] px-4 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs sm:text-sm font-bold inline-flex items-center gap-1.5"
                          >
                            <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                            <span>Duyệt giờ</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleReview(row, 'rejected')}
                            className="min-h-[44px] px-4 rounded-xl border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-900 text-xs sm:text-sm font-bold inline-flex items-center gap-1.5"
                          >
                            <XCircle className="w-4 h-4" aria-hidden="true" />
                            <span>Từ chối</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
