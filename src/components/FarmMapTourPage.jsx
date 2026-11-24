import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Calendar,
  CheckCircle2,
  Compass,
  ExternalLink,
  List,
  Map as MapIcon,
  MapPin,
  Store,
  Users,
  WifiOff,
  ZoomIn,
  ZoomOut,
  RotateCcw
} from 'lucide-react';
import { createVisitRequest, fetchAllProducers, fetchVisitRequests } from '../services/ocopStore';
import { formatDateTimeVn } from '../utils/formatters';
import { OcopStarBadge } from './StatusBadges';

export default function FarmMapTourPage({ isOnline = true }) {
  const [searchParams] = useSearchParams();
  const producers = fetchAllProducers();
  const initialSlug = searchParams.get('garden') || 'nha-vuon-ba-tu';
  const initialGarden = producers.find((p) => p.slug === initialSlug) || producers[0];

  const [selectedId, setSelectedId] = useState(initialGarden?.id || producers[0]?.id);
  const [viewMode, setViewMode] = useState(isOnline ? 'map' : 'list');
  const [zoom, setZoom] = useState(1);

  const selectedGarden = producers.find((p) => p.id === selectedId) || producers[0];
  const packages = selectedGarden?.visitPackages || [];

  const [packageName, setPackageName] = useState(packages[0]?.name || '');
  const [timeSlot, setTimeSlot] = useState(packages[0]?.slots?.[0] || 'Sáng 08:00 – 10:00');
  const [visitDate, setVisitDate] = useState('2026-11-29');
  const [guestsCount, setGuestsCount] = useState('3');
  const [visitorName, setVisitorName] = useState('');
  const [visitorPhone, setVisitorPhone] = useState('');
  const [note, setNote] = useState('');
  const [requests, setRequests] = useState(() => fetchVisitRequests('all'));
  const [feedback, setFeedback] = useState({ type: '', text: '' });

  // Auto-switch to offline list fallback when browser goes offline
  useEffect(() => {
    if (!isOnline) {
      setViewMode('list');
    }
  }, [isOnline]);

  useEffect(() => {
    const firstPkg = selectedGarden?.visitPackages?.[0];
    setPackageName(firstPkg?.name || 'Tham quan nhà vườn & trải nghiệm nông sản');
    setTimeSlot(firstPkg?.slots?.[0] || 'Sáng 08:00 – 10:00');
    setFeedback({ type: '', text: '' });
  }, [selectedId, selectedGarden]);

  const activePackage = packages.find((p) => p.name === packageName) || packages[0];

  function handleSubmitVisit(e) {
    e.preventDefault();
    setFeedback({ type: '', text: '' });
    try {
      const created = createVisitRequest({
        producerId: selectedGarden.id,
        packageName,
        visitorName,
        visitorPhone,
        visitDate,
        timeSlot,
        guestsCount: Number(guestsCount),
        note
      });
      setRequests(fetchVisitRequests('all'));
      setVisitorName('');
      setVisitorPhone('');
      setNote('');
      setFeedback({
        type: 'success',
        text: `Đã lưu yêu cầu tham quan ${created.producerName} cho ${created.guestsCount} khách (${created.visitDate} · ${created.timeSlot}). Thanh toán trực tiếp tại vườn, không thu cọc online.`
      });
    } catch (err) {
      setFeedback({ type: 'error', text: err?.message || 'Chưa thể lưu yêu cầu tham quan.' });
    }
  }

  return (
    <div className="space-y-5">
      <section className="bg-surface border border-line rounded-2xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-bold uppercase tracking-wider text-brand flex items-center gap-1.5">
              <Compass className="w-4 h-4" aria-hidden="true" />
              <span>Điểm cộng B · Bản đồ tương tác &amp; Trải nghiệm nhà vườn</span>
            </p>
            {!isOnline && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 border border-amber-300 text-amber-950">
                <WifiOff className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Chế độ danh sách ngoại tuyến</span>
              </span>
            )}
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-ink">
            Bản đồ du lịch nhà vườn &amp; Cơ sở OCOP Đồng Nai
          </h1>
          <p className="text-sm text-muted">
            Bấm trực tiếp điểm ghim nhà vườn để xem vị trí minh họa, chọn suất trải nghiệm hái trái tại vườn và lưu yêu cầu tham quan (không thu cọc trực tuyến).
          </p>
        </div>

        <div className="flex flex-wrap gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setViewMode('map')}
            aria-pressed={viewMode === 'map'}
            className={`min-h-[44px] px-4 rounded-xl border text-sm font-bold inline-flex items-center gap-1.5 ${
              viewMode === 'map'
                ? 'bg-brand text-white border-brand'
                : 'bg-canvas text-ink border-line hover:border-brand'
            }`}
          >
            <MapIcon className="w-4 h-4" aria-hidden="true" />
            <span>Bản đồ tương tác</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            aria-pressed={viewMode === 'list'}
            className={`min-h-[44px] px-4 rounded-xl border text-sm font-bold inline-flex items-center gap-1.5 ${
              viewMode === 'list'
                ? 'bg-brand text-white border-brand'
                : 'bg-canvas text-ink border-line hover:border-brand'
            }`}
          >
            <List className="w-4 h-4" aria-hidden="true" />
            <span>Danh sách (Offline)</span>
          </button>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Interactive Vector Map of Dong Nai OR Offline List Fallback */}
        <section className="lg:col-span-7 bg-surface border border-line rounded-2xl p-4 sm:p-5 space-y-3.5">
          {viewMode === 'map' ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-bold text-ink">
                  Chọn 1 trong {producers.length} điểm nhà vườn OCOP Đồng Nai
                </p>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    aria-label="Phóng to bản đồ"
                    onClick={() => setZoom((z) => Math.min(1.5, Math.round((z + 0.15) * 100) / 100))}
                    className="min-h-[44px] min-w-[44px] rounded-xl border border-line bg-canvas hover:border-brand grid place-items-center text-ink"
                  >
                    <ZoomIn className="w-4 h-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    aria-label="Thu nhỏ bản đồ"
                    onClick={() => setZoom((z) => Math.max(0.85, Math.round((z - 0.15) * 100) / 100))}
                    className="min-h-[44px] min-w-[44px] rounded-xl border border-line bg-canvas hover:border-brand grid place-items-center text-ink"
                  >
                    <ZoomOut className="w-4 h-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    aria-label="Đặt lại góc nhìn bản đồ"
                    onClick={() => setZoom(1)}
                    className="min-h-[44px] px-3 rounded-xl border border-line bg-canvas hover:border-brand text-xs font-semibold text-ink inline-flex items-center gap-1"
                  >
                    <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>{Math.round(zoom * 100)}%</span>
                  </button>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-2xl border border-blue-200 bg-gradient-to-br from-[#E6F2FF] via-[#F4F9FF] to-[#E8F6EE] aspect-[4/3]">
                <div
                  className="w-full h-full transition-transform duration-200 origin-center relative"
                  style={{ transform: `scale(${zoom})` }}
                >
                  {/* Stylized Dong Nai geographical outline, river & highway corridors */}
                  <svg
                    viewBox="0 0 100 100"
                    className="w-full h-full block"
                    role="img"
                    aria-label="Bản đồ tương tác các nhà vườn OCOP tỉnh Đồng Nai (tọa độ giả lập minh họa)"
                  >
                    <defs>
                      <pattern id="mapGrid" width="10" height="10" patternUnits="userSpaceOnUse">
                        <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#CBDDF4" strokeWidth="0.3" />
                      </pattern>
                    </defs>
                    <rect width="100" height="100" fill="url(#mapGrid)" />

                    {/* Stylized Dong Nai province silhouette */}
                    <path
                      d="M 18 46 L 26 28 L 46 16 L 72 15 L 86 30 L 89 58 L 76 80 L 52 87 L 28 76 L 16 62 Z"
                      fill="#FFFFFF"
                      fillOpacity="0.88"
                      stroke="#7BB2E8"
                      strokeWidth="0.9"
                    />

                    {/* Dong Nai river curve */}
                    <path
                      d="M 48 16 C 36 30, 32 42, 26 52 C 22 60, 26 70, 34 78"
                      fill="none"
                      stroke="#60A5FA"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      opacity="0.7"
                    />
                    <text x="19" y="69" fontSize="2.6" fill="#1D4ED8" fontWeight="600">
                      Sông Đồng Nai
                    </text>

                    {/* Highway QL1A & QL20 stylized corridors */}
                    <path
                      d="M 22 58 Q 42 56, 60 57 T 84 56"
                      fill="none"
                      stroke="#94A3B8"
                      strokeWidth="0.8"
                      strokeDasharray="1.8 1.2"
                    />
                    <path
                      d="M 52 57 Q 60 42, 68 28"
                      fill="none"
                      stroke="#94A3B8"
                      strokeWidth="0.8"
                      strokeDasharray="1.8 1.2"
                    />
                    <text x="33" y="61" fontSize="2.4" fill="#64748B">QL1A</text>
                    <text x="64" y="42" fontSize="2.4" fill="#64748B">QL20</text>
                    <text x="20" y="55" fontSize="2.6" fill="#475569" fontWeight="700">Biên Hòa</text>
                    <text x="58" y="63" fontSize="2.7" fill="#0759BA" fontWeight="800">TP. Long Khánh</text>
                  </svg>

                  {/* Interactive accessible HTML pin buttons over SVG */}
                  {producers.map((p) => {
                    const isSelected = p.id === selectedGarden.id;
                    const x = p.coords?.mapX ?? 50;
                    const y = p.coords?.mapY ?? 50;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setSelectedId(p.id)}
                        style={{ left: `${x}%`, top: `${y}%` }}
                        aria-label={`Chọn điểm ${p.businessName} tại ${p.area}`}
                        aria-pressed={isSelected}
                        className={`absolute -translate-x-1/2 -translate-y-1/2 min-h-[44px] min-w-[44px] flex items-center justify-center group focus-visible:z-30 ${
                          isSelected ? 'z-20' : 'z-10'
                        }`}
                      >
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-[11px] font-bold shadow-md border transition whitespace-nowrap ${
                            isSelected
                              ? 'bg-brand text-white border-white scale-110 ring-4 ring-blue-300/60'
                              : 'bg-white text-ink border-brand/40 hover:bg-blue-50'
                          }`}
                        >
                          <MapPin className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                          <span>
                            {p.slug === 'nha-vuon-ba-tu'
                              ? 'Vườn Ba Tư'
                              : p.area.replace(/^(Huyện|TP\.)\s*/i, '').split(',')[0]}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted bg-canvas border border-line rounded-xl p-3">
                <span>
                  <strong>Nguồn &amp; Minh họa:</strong> Tọa độ giả lập minh họa theo địa bàn hành chính Đồng Nai · Tham khảo địa lý OpenStreetMap contributors (ODbL).
                </span>
                {selectedGarden?.coords && (
                  <a
                    href={`https://www.openstreetmap.org/?mlat=${selectedGarden.coords.lat}&mlon=${selectedGarden.coords.lng}#map=12/${selectedGarden.coords.lat}/${selectedGarden.coords.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-brand underline inline-flex items-center gap-1 shrink-0"
                  >
                    <span>Mở OpenStreetMap</span>
                    <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                  </a>
                )}
              </div>
            </>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-bold text-ink">
                  Danh sách {producers.length} nhà vườn Đồng Nai (Hoạt động đầy đủ khi ngoại tuyến)
                </p>
              </div>
              <div className="space-y-2.5">
                {producers.map((p) => {
                  const active = p.id === selectedGarden.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedId(p.id)}
                      className={`w-full text-left p-4 rounded-xl border transition space-y-1 ${
                        active
                          ? 'bg-blue-50 border-brand ring-1 ring-brand'
                          : 'bg-canvas border-line hover:border-brand'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-bold text-sm sm:text-base text-ink">{p.businessName}</span>
                        <OcopStarBadge stars={p.ocopStars} showIllustrative={false} />
                      </div>
                      <p className="text-xs text-muted">
                        {p.area} · {p.farmSize}
                      </p>
                      {p.coords && (
                        <p className="font-mono text-[11px] text-brand">
                          Tọa độ minh họa: {p.coords.lat.toFixed(4)}°N, {p.coords.lng.toFixed(4)}°E
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quick garden pills below map */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {producers.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelectedId(p.id)}
                className={`min-h-[40px] px-3 rounded-xl text-xs font-semibold border transition ${
                  p.id === selectedGarden.id
                    ? 'bg-ink text-white border-ink'
                    : 'bg-canvas text-ink border-line hover:border-brand'
                }`}
              >
                {p.businessName.split('—')[0].trim()}
              </button>
            ))}
          </div>
        </section>

        {/* Right: Selected Garden Detail + Booking Form */}
        <section className="lg:col-span-5 bg-surface border border-line rounded-2xl p-5 space-y-4 h-fit">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <OcopStarBadge stars={selectedGarden.ocopStars} />
              <Link
                to={`/gian-hang/${selectedGarden.slug}`}
                className="text-xs sm:text-sm font-bold text-brand hover:underline inline-flex items-center gap-1"
              >
                <Store className="w-4 h-4" aria-hidden="true" />
                <span>Vào gian hàng →</span>
              </Link>
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-ink">{selectedGarden.businessName}</h2>
            <p className="text-xs sm:text-sm text-muted">{selectedGarden.story}</p>
            <div className="p-3 rounded-xl bg-canvas border border-line text-xs space-y-1">
              <p className="font-semibold text-ink flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-brand shrink-0" aria-hidden="true" />
                <span>{selectedGarden.pickupPoint}</span>
              </p>
              {selectedGarden.coords && (
                <p className="font-mono text-muted">
                  Tọa độ giả lập: {selectedGarden.coords.lat.toFixed(4)}°N, {selectedGarden.coords.lng.toFixed(4)}°E
                </p>
              )}
              <p className="text-muted">{selectedGarden.distanceNote}</p>
            </div>
          </div>

          {/* Package highlights */}
          {activePackage && (
            <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 space-y-1.5 text-xs sm:text-sm">
              <p className="font-bold text-brand">{activePackage.name}</p>
              <p className="text-xs text-ink font-medium">{activePackage.priceNote}</p>
              <ul className="list-disc pl-5 text-xs text-muted space-y-0.5">
                {activePackage.highlights.map((h) => (
                  <li key={h}>{h}</li>
                ))}
              </ul>
            </div>
          )}

          {feedback.text && (
            <div
              role={feedback.type === 'error' ? 'alert' : 'status'}
              className={`rounded-xl border p-3 text-sm font-medium ${
                feedback.type === 'error'
                  ? 'bg-rose-50 border-rose-300 text-rose-900'
                  : 'bg-emerald-50 border-emerald-300 text-emerald-950'
              }`}
            >
              {feedback.text}
            </div>
          )}

          <form onSubmit={handleSubmitVisit} className="space-y-3" noValidate>
            <h3 className="text-base font-bold text-ink">Đặt suất trải nghiệm tại vườn (Minh họa)</h3>

            {packages.length > 1 && (
              <div>
                <label htmlFor="tour-pkg" className="ocop-label">Chọn gói trải nghiệm</label>
                <select
                  id="tour-pkg"
                  value={packageName}
                  onChange={(e) => {
                    const nextPkg = packages.find((p) => p.name === e.target.value);
                    setPackageName(e.target.value);
                    if (nextPkg?.slots?.[0]) setTimeSlot(nextPkg.slots[0]);
                  }}
                  className="ocop-field"
                >
                  {packages.map((p) => (
                    <option key={p.id} value={p.name}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="tour-date" className="ocop-label">Ngày ghé vườn</label>
                <input
                  id="tour-date"
                  type="date"
                  required
                  value={visitDate}
                  onChange={(e) => setVisitDate(e.target.value)}
                  className="ocop-field tabular-nums"
                />
              </div>
              <div>
                <label htmlFor="tour-guests" className="ocop-label">Số khách</label>
                <input
                  id="tour-guests"
                  type="number"
                  min="1"
                  max="30"
                  required
                  value={guestsCount}
                  onChange={(e) => setGuestsCount(e.target.value)}
                  className="ocop-field tabular-nums"
                />
              </div>
            </div>

            <div>
              <span className="ocop-label">Chọn suất tham quan</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(activePackage?.slots || ['Sáng 08:00 – 10:00', 'Chiều 14:30 – 16:30']).map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setTimeSlot(slot)}
                    className={`min-h-[44px] px-3 rounded-xl border text-xs sm:text-sm font-semibold ${
                      timeSlot === slot
                        ? 'bg-brand text-white border-brand'
                        : 'bg-canvas text-ink border-line hover:border-brand'
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="tour-name" className="ocop-label">Họ tên liên hệ</label>
                <input
                  id="tour-name"
                  required
                  value={visitorName}
                  onChange={(e) => setVisitorName(e.target.value)}
                  placeholder="VD: Trần Minh Khôi"
                  className="ocop-field"
                />
              </div>
              <div>
                <label htmlFor="tour-phone" className="ocop-label">Số điện thoại</label>
                <input
                  id="tour-phone"
                  required
                  value={visitorPhone}
                  onChange={(e) => setVisitorPhone(e.target.value)}
                  placeholder="VD: 0908112233"
                  className="ocop-field tabular-nums"
                />
              </div>
            </div>

            <div>
              <label htmlFor="tour-note" className="ocop-label">Ghi chú (tùy chọn)</label>
              <input
                id="tour-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="VD: Đi gia đình có trẻ nhỏ, muốn hái chôm chôm..."
                className="ocop-field"
              />
            </div>

            <button type="submit" className="ocop-primary w-full min-h-[48px]">
              <Calendar className="w-4 h-4" aria-hidden="true" />
              <span>Lưu yêu cầu tham quan vườn</span>
            </button>
          </form>
        </section>
      </div>

      {/* Saved Visit Requests List */}
      <section className="bg-surface border border-line rounded-2xl p-5 space-y-3">
        <h2 className="text-base sm:text-lg font-bold text-ink flex items-center gap-2">
          <Users className="w-5 h-5 text-brand" aria-hidden="true" />
          <span>Yêu cầu tham quan vườn đã lưu ({requests.length})</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {requests.map((r) => (
            <article key={r.id} className="p-4 rounded-xl bg-canvas border border-line space-y-1.5 text-xs sm:text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-bold text-ink">{r.producerName}</span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Đã lưu yêu cầu</span>
                </span>
              </div>
              <p className="text-brand font-semibold">{r.packageName}</p>
              <p className="text-muted tabular-nums">
                Ngày {r.visitDate} · {r.timeSlot} · <strong>{r.guestsCount} khách</strong>
              </p>
              <p className="text-muted">
                Liên hệ: <strong className="text-ink">{r.visitorName}</strong> ({r.visitorPhone})
              </p>
              {r.note && <p className="text-xs text-muted">Ghi chú: {r.note}</p>}
              <p className="text-[11px] text-muted">Tạo lúc {formatDateTimeVn(r.createdAt)}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
