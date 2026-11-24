import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Camera,
  Mic,
  MicOff,
  Sparkles,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  MapPin,
  Truck,
  CalendarClock,
  Radio,
  Sprout,
  PackageCheck,
  ClipboardCheck,
  QrCode,
  UserCheck
} from 'lucide-react';
import {
  addDemoLivestream,
  addToCart,
  fetchLivestreamSchedule,
  loadSeasonLog,
  loadCart,
  submitCartOrder,
  publishQuickGardenProduct,
  updateCartQuantity
} from '../services/ocopStore';
import { formatVnd } from '../utils/formatters';
import { PRIMARY_FARMER_PRODUCER_ID } from '../data/pilotData';

// =========================================================================
// MÀN 2: ĐĂNG SẢN PHẨM NHANH BẰNG ẢNH VÀ GIỌNG NÓI
// =========================================================================
const SIMULATED_VOICE_SAMPLES = [
  {
    label: 'Mẫu giọng nói 1: Chôm chôm nhãn chín vườn',
    transcript: 'Chôm chôm nhãn Long Khánh chín đỏ vườn Ba Tư giá bốn mươi lăm nghìn đồng một ký còn một trăm hai mươi ký hái sáng nay',
    parsed: {
      title: 'Chôm chôm nhãn Long Khánh chín đỏ (1 kg)',
      priceVnd: '45000',
      stockKg: '120',
      batchCode: 'LK-CC-2511',
      description: 'Hái sáng sớm tại vườn Ba Tư 2,5 ha Long Khánh, trái giòn ngọt tróc hạt.'
    }
  },
  {
    label: 'Mẫu giọng nói 2: Sầu riêng Ri6 cắt già',
    transcript: 'Sầu riêng Ri6 cơm vàng hạt lép vườn Ba Tư giá một trăm mười lăm nghìn đồng một ký số lượng sáu mươi ký bao ăn tại vườn',
    parsed: {
      title: 'Sầu riêng Ri6 cắt già vườn Ba Tư (1 kg)',
      priceVnd: '115000',
      stockKg: '60',
      batchCode: 'LK-SR-2511',
      description: 'Sầu riêng Ri6 Long Khánh cơm vàng đậm, không sượng, có nhật ký mùa vụ QR.'
    }
  }
];

function parseVietnameseTranscript(text) {
  const clean = String(text || '').trim();
  const priceMatch = clean.match(/(\d{2,3})\s*(?:nghin|ngan|k)\b/i) || clean.match(/(\d{5,7})/);
  let detectedPrice = '';
  if (priceMatch) {
    const num = Number(priceMatch[1]);
    detectedPrice = num < 1000 ? String(num * 1000) : String(num);
  }
  const stockMatch = clean.match(/(\d{1,4})\s*(?:kg|ky|kilogam)\b/i);
  return {
    title: clean ? clean.split(/giá|gia|còn|con/i)[0].trim().slice(0, 90) : '',
    priceVnd: detectedPrice,
    stockKg: stockMatch ? stockMatch[1] : ''
  };
}

export function QuickPublishVoicePage() {
  const [imageDataUrl, setImageDataUrl] = useState('');
  const [imageLabel, setImageLabel] = useState('Chưa chọn ảnh (sẽ dùng khung minh họa nếu bỏ trống)');
  const [listening, setListening] = useState(false);
  const [voiceMode, setVoiceMode] = useState('manual');
  const [rawTranscript, setRawTranscript] = useState('');
  const [title, setTitle] = useState('');
  const [priceVnd, setPriceVnd] = useState('45000');
  const [stockKg, setStockKg] = useState('80');
  const [batchCode, setBatchCode] = useState('LK-CC-2511');
  const [description, setDescription] = useState('');
  const [statusMsg, setStatusMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [publishedProduct, setPublishedProduct] = useState(null);

  const recognitionRef = useRef(null);

  const hasSpeechApi =
    typeof window !== 'undefined' &&
    Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  function handlePhotoUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Vui lòng chọn tệp ảnh hợp lệ (JPG, PNG, WebP).');
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      setErrorMsg('Ảnh không vượt quá 3MB.');
      return;
    }
    setErrorMsg('');
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setImageDataUrl(reader.result);
        setImageLabel(`Đã tải ảnh: ${file.name}`);
      }
    };
    reader.readAsDataURL(file);
  }

  function startSpeechRecognition() {
    setErrorMsg('');
    if (!hasSpeechApi) {
      applySimulatedVoice(SIMULATED_VOICE_SAMPLES[0]);
      setErrorMsg('Trình duyệt không hỗ trợ Web Speech API — đã chuyển sang nhận dạng giọng nói mô phỏng để bạn sửa và thử ngay.');
      return;
    }
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    try {
      const rec = new SpeechRec();
      rec.lang = 'vi-VN';
      rec.interimResults = false;
      rec.maxAlternatives = 1;
      rec.onstart = () => setListening(true);
      rec.onend = () => setListening(false);
      rec.onerror = () => {
        setListening(false);
        setErrorMsg('Không thu được giọng nói từ micro. Bạn có thể bấm nút "Chạy nhận dạng giọng nói mô phỏng" hoặc nhập tay bên dưới.');
      };
      rec.onresult = (event) => {
        const text = event.results?.[0]?.[0]?.transcript || '';
        setRawTranscript(text);
        setVoiceMode('speech_api');
        const parsed = parseVietnameseTranscript(text);
        if (parsed.title) setTitle(parsed.title);
        if (parsed.priceVnd) setPriceVnd(parsed.priceVnd);
        if (parsed.stockKg) setStockKg(parsed.stockKg);
        setDescription(`${text}. Thu hoạch tại Nhà vườn Ba Tư, Long Khánh.`);
        setStatusMsg('Đã nhận dạng giọng nói thật (Web Speech API). Vui lòng xem lại và chỉnh sửa trước khi xác nhận đăng.');
      };
      recognitionRef.current = rec;
      rec.start();
    } catch {
      setListening(false);
      setErrorMsg('Không mở được micro. Vui lòng dùng nhận dạng mô phỏng hoặc nhập tay.');
    }
  }

  function applySimulatedVoice(sample) {
    setErrorMsg('');
    setVoiceMode('simulated_voice');
    setRawTranscript(sample.transcript);
    setTitle(sample.parsed.title);
    setPriceVnd(sample.parsed.priceVnd);
    setStockKg(sample.parsed.stockKg);
    setBatchCode(sample.parsed.batchCode);
    setDescription(sample.parsed.description);
    setStatusMsg('Nhận dạng mô phỏng (Speech Demo): Đã điền nội dung mẫu vào ô xem lại để chủ vườn kiểm tra & chỉnh sửa.');
  }

  function handlePublishSubmit(e) {
    e.preventDefault();
    setErrorMsg('');
    setStatusMsg('');
    try {
      const created = publishQuickGardenProduct({
        producerId: PRIMARY_FARMER_PRODUCER_ID,
        title,
        priceVnd: Number(priceVnd),
        stockKg: Number(stockKg),
        batchCode,
        description,
        imageDataUrl,
        voiceInputMode: voiceMode
      });
      setPublishedProduct(created);
      setStatusMsg(`Đã đăng thử "${created.title}" trong trình duyệt này, kèm nhật ký lô ${created.batchCode}.`);
    } catch (err) {
      setErrorMsg(err?.message || 'Không thể đăng sản phẩm nhanh.');
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <section className="bg-surface border border-line rounded-2xl p-5 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-bold uppercase tracking-wider text-brand">
            Đăng sản phẩm nhanh bằng ảnh &amp; giọng nói
          </p>
          <span className="text-xs px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-900 font-semibold">
            Nhà vườn Ba Tư · Long Khánh
          </span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-ink">
          Chụp ảnh trái cây + Bấm Mic nói để tạo tin bán hàng
        </h1>
        <p className="text-xs sm:text-sm text-muted">
          Thiết kế 3 bước cho nông dân lớn tuổi: (1) Chọn/chụp ảnh → (2) Bấm Mic hoặc dùng giọng nói mô phỏng → (3) Xem lại, sửa và xác nhận đăng mẫu.
        </p>
      </section>

      {errorMsg && (
        <div className="bg-rose-50 border border-rose-300 rounded-2xl p-4 text-sm text-rose-900" role="alert">
          {errorMsg}
        </div>
      )}
      {statusMsg && (
        <div className="bg-blue-50 border border-blue-300 rounded-2xl p-4 text-sm text-emerald-950 font-medium" role="status">
          {statusMsg}
        </div>
      )}

      {publishedProduct && (
        <section className="bg-surface border-2 border-brand rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-brand font-bold">
            <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
            <span>Đã đăng mẫu sản phẩm mới thành công!</span>
          </div>
          <p className="text-sm text-ink">
            <strong>{publishedProduct.title}</strong> · {formatVnd(publishedProduct.priceVnd)}/kg · Mã lô QR:{' '}
            <span className="font-mono font-bold">{publishedProduct.batchCode}</span>
          </p>
          <div className="flex flex-wrap gap-2">
            <Link
              to={`/san-pham/${publishedProduct.slug}`}
              className="min-h-[44px] px-4 rounded-xl bg-brand text-white text-sm font-semibold inline-flex items-center gap-2"
            >
              <span>Chi tiết &amp; QR sản phẩm vừa đăng</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
            <Link
              to="/gian-hang/nha-vuon-ba-tu"
              className="min-h-[44px] px-4 rounded-xl border border-line bg-canvas text-sm font-semibold text-ink inline-flex items-center"
            >
              Xem trong Hồ sơ nhà vườn
            </Link>
          </div>
        </section>
      )}

      <form onSubmit={handlePublishSubmit} className="space-y-5">
        {/* Bước 1: Ảnh & Bước 2: Mic */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <section className="bg-surface border border-line rounded-2xl p-5 space-y-3">
            <h2 className="text-base font-bold text-ink">Bước 1: Chọn hoặc chụp ảnh sản phẩm</h2>
            <div className="flex flex-wrap items-center gap-2">
              <label
                htmlFor="quick-photo-input"
                className="min-h-[48px] px-4 rounded-xl bg-canvas border border-line hover:border-brand text-sm font-semibold text-ink inline-flex items-center gap-2 cursor-pointer"
              >
                <Camera className="w-5 h-5 text-brand" aria-hidden="true" />
                <span>Chụp ảnh / Chọn từ máy</span>
              </label>
              <input
                id="quick-photo-input"
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoUpload}
                className="sr-only"
              />
            </div>
            <p className="text-xs text-muted">{imageLabel}</p>
            {imageDataUrl && (
              <img
                src={imageDataUrl}
                alt="Ảnh sản phẩm vừa chọn"
                className="w-full h-44 object-cover rounded-xl border border-line"
              />
            )}
          </section>

          <section className="bg-surface border border-line rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base font-bold text-ink">Bước 2: Bấm Mic đọc thông tin</h2>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-canvas border border-line text-muted">
                {voiceMode === 'speech_api'
                  ? 'Web Speech thật'
                  : voiceMode === 'simulated_voice'
                    ? 'Nhận dạng mô phỏng'
                    : 'Nhập tay / Chờ mic'}
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={startSpeechRecognition}
                className={`min-h-[48px] px-4 rounded-xl text-sm font-bold inline-flex items-center gap-2 ${
                  listening
                    ? 'bg-rose-700 text-white'
                    : 'bg-brand hover:bg-brand-hover text-white'
                }`}
              >
                {listening ? <MicOff className="w-5 h-5" aria-hidden="true" /> : <Mic className="w-5 h-5" aria-hidden="true" />}
                <span>{listening ? 'Đang nghe tiếng Việt...' : 'Bấm Mic để nói'}</span>
              </button>
              <button
                type="button"
                onClick={() => applySimulatedVoice(SIMULATED_VOICE_SAMPLES[0])}
                className="min-h-[48px] px-3.5 rounded-xl border border-amber-300 bg-amber-50 text-xs sm:text-sm font-semibold text-amber-950 inline-flex items-center gap-1.5"
              >
                <Sparkles className="w-4 h-4 text-accent" aria-hidden="true" />
                <span>Chạy nhận dạng mô phỏng</span>
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {SIMULATED_VOICE_SAMPLES.map((s) => (
                <button
                  key={s.label}
                  type="button"
                  onClick={() => applySimulatedVoice(s)}
                  className="text-xs px-2.5 py-1.5 rounded-lg bg-canvas border border-line hover:border-brand text-ink font-medium"
                >
                  {s.label}
                </button>
              ))}
            </div>

            {rawTranscript && (
              <div className="p-3 rounded-xl bg-canvas border border-line text-xs text-ink">
                <p className="font-semibold text-muted mb-1">
                  Nội dung thu được ({voiceMode === 'speech_api' ? 'Micro thật' : 'Bản mô phỏng Demo'}):
                </p>
                <p>&ldquo;{rawTranscript}&rdquo;</p>
              </div>
            )}
          </section>
        </div>

        {/* Bước 3: Xem lại và sửa */}
        <section className="bg-surface border border-line rounded-2xl p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-bold text-ink">
              Bước 3: Xem lại, chỉnh sửa nội dung &amp; Xác nhận đăng mẫu
            </h2>
            <span className="text-xs text-muted">Có thể sửa tay mọi ô bất kỳ lúc nào</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label htmlFor="qp-title" className="block text-xs font-semibold text-ink mb-1">
                Tên sản phẩm (kèm đơn vị kg)
              </label>
              <input
                id="qp-title"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="VD: Chôm chôm nhãn Long Khánh hái sáng (1 kg)"
                className="w-full min-h-[44px] px-3 rounded-xl border border-line bg-canvas text-sm"
              />
            </div>

            <div>
              <label htmlFor="qp-price" className="block text-xs font-semibold text-ink mb-1">
                Giá bán tham khảo (VNĐ / kg)
              </label>
              <input
                id="qp-price"
                type="number"
                required
                min="5000"
                max="50000000"
                value={priceVnd}
                onChange={(e) => setPriceVnd(e.target.value)}
                className="w-full min-h-[44px] px-3 rounded-xl border border-line bg-canvas text-sm tabular-nums"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="qp-stock" className="block text-xs font-semibold text-ink mb-1">
                  Số lượng (kg)
                </label>
                <input
                  id="qp-stock"
                  type="number"
                  required
                  min="1"
                  max="100000"
                  value={stockKg}
                  onChange={(e) => setStockKg(e.target.value)}
                  className="w-full min-h-[44px] px-3 rounded-xl border border-line bg-canvas text-sm tabular-nums"
                />
              </div>
              <div>
                <label htmlFor="qp-batch" className="block text-xs font-semibold text-ink mb-1">
                  Mã lô nhật ký QR
                </label>
                <input
                  id="qp-batch"
                  value={batchCode}
                  onChange={(e) => setBatchCode(e.target.value)}
                  className="w-full min-h-[44px] px-3 rounded-xl border border-line bg-canvas text-xs font-mono"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="qp-desc" className="block text-xs font-semibold text-ink mb-1">
                Mô tả ngắn (độ chín, cách hái, giao vườn)
              </label>
              <textarea
                id="qp-desc"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ghi chú ngắn cho khách mua..."
                className="w-full p-3 rounded-xl border border-line bg-canvas text-sm"
              />
            </div>
          </div>

          <div className="flex flex-wrap justify-end gap-2 pt-2">
            <Link
              to="/gian-hang/nha-vuon-ba-tu"
              className="min-h-[44px] px-4 rounded-xl border border-line bg-canvas text-sm font-semibold text-ink inline-flex items-center"
            >
              Về Hồ sơ nhà vườn
            </Link>
            <button
              type="submit"
              className="min-h-[48px] px-6 rounded-xl bg-brand hover:bg-brand-hover text-white text-sm font-bold inline-flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
              <span>Xác nhận đăng mẫu lên gian hàng</span>
            </button>
          </div>
        </section>
      </form>
    </div>
  );
}

// =========================================================================
// TRANG NHẬT KÝ MÙA VỤ (MỞ TỪ MÃ QR TRONG MÀN 3)
// =========================================================================
export function SeasonLogPage() {
  const { batchCode } = useParams();
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [addedNotice, setAddedNotice] = useState(false);
  useEffect(() => {
    let active = true;
    setAddedNotice(false);
    loadSeasonLog(batchCode).then(log => {
      if (active) setResult({ batchCode, log });
    }).catch(() => {
      if (active) setResult({ batchCode, error: 'Chưa tải được nhật ký mùa vụ. Vui lòng thử lại.' });
    });
    return () => { active = false; };
  }, [batchCode]);

  if (result?.batchCode !== batchCode) return <p role="status" className="p-6 text-muted">Đang tải nhật ký mùa vụ…</p>;
  if (result.error) return <p role="alert" className="p-6 text-muted">{result.error}</p>;
  const log = result.log;

  if (!log) {
    return (
      <div className="max-w-xl mx-auto bg-surface border border-line rounded-2xl p-8 text-center space-y-4">
        <QrCode className="w-10 h-10 text-accent mx-auto" aria-hidden="true" />
        <h1 className="text-xl font-bold text-ink">Chưa có nhật ký cho mã lô {batchCode}</h1>
        <Link
          to="/gian-hang/nha-vuon-ba-tu"
          className="min-h-[44px] px-5 rounded-xl bg-brand text-white text-sm font-semibold inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          <span>Về Hồ sơ Nhà vườn Ba Tư</span>
        </Link>
      </div>
    );
  }

  function handleAddFromLog() {
    if (!log.product) return;
    addToCart(log.product, 1);
    setAddedNotice(true);
  }

  const stageIcons = [Sprout, ClipboardCheck, PackageCheck];

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        {log.product ? (
          <Link
            to={`/san-pham/${log.product.slug}`}
            className="min-h-[44px] px-3.5 rounded-xl border border-line bg-surface text-sm font-semibold text-ink inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            <span>Quay lại Chi tiết sản phẩm</span>
          </Link>
        ) : (
          <Link
            to="/gian-hang/nha-vuon-ba-tu"
            className="min-h-[44px] px-3.5 rounded-xl border border-line bg-surface text-sm font-semibold text-ink inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            <span>Về Hồ sơ nhà vườn</span>
          </Link>
        )}
        <span className="font-mono text-xs px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-brand font-bold">
          Mã lô QR: {log.batchCode}
        </span>
      </div>

      <section className="bg-surface border border-line rounded-2xl p-5 sm:p-6 space-y-2">
        <p className="text-xs font-bold uppercase tracking-wider text-brand">
          Truy xuất nguồn gốc · Nhật ký mùa vụ (Dữ liệu mẫu)
        </p>
        <h1 className="text-xl sm:text-2xl font-bold text-ink">{log.productTitle}</h1>
        <p className="text-sm text-muted">
          Cơ sở: <strong>{log.producerName}</strong> · {log.harvestWindow}
        </p>
      </section>

      <section aria-label="Các mốc chăm sóc, thu hoạch và đóng gói" className="space-y-3">
        {log.milestones.map((m, idx) => {
          const Icon = stageIcons[idx] || CheckCircle2;
          return (
            <article key={m.stage} className="bg-surface border border-line rounded-2xl p-4 sm:p-5 flex gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-brand flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5" aria-hidden="true" />
              </div>
              <div className="space-y-1 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-base font-bold text-ink">{m.stage}</h2>
                  <span className="font-mono text-xs font-semibold text-accent tabular-nums">{m.date}</span>
                </div>
                <p className="text-xs text-muted flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-brand shrink-0" aria-hidden="true" />
                  <span>{m.location}</span>
                </p>
                <p className="text-sm text-ink leading-relaxed pt-1">{m.detail}</p>
                <p className="text-xs text-muted">Người ghi nhận: {m.inspector}</p>
              </div>
            </article>
          );
        })}
      </section>

      {log.product && (
        <section className="bg-surface border border-blue-300 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="tabular-nums">
            <p className="text-xs text-muted">Giá tại vườn ({log.product.unit})</p>
            <p className="text-xl font-extrabold text-ink">{formatVnd(log.product.priceVnd)}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleAddFromLog}
              className="min-h-[44px] px-4 rounded-xl border border-brand bg-blue-50 text-brand text-sm font-semibold inline-flex items-center gap-2"
            >
              <ShoppingCart className="w-4 h-4" aria-hidden="true" />
              <span>{addedNotice ? 'Đã thêm vào giỏ!' : 'Thêm vào giỏ hàng'}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                if (!addedNotice) addToCart(log.product, 1);
                navigate('/gio-hang');
              }}
              className="min-h-[44px] px-5 rounded-xl bg-brand hover:bg-brand-hover text-white text-sm font-semibold inline-flex items-center gap-2"
            >
              <span>Đặt hàng ngay</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </section>
      )}
    </div>
  );
}

// =========================================================================
// MÀN 4: GIỎ HÀNG VÀ ĐẶT HÀNG
// =========================================================================
export function CartCheckoutPage() {
  const [cart, setCart] = useState(() => loadCart());
  const [deliveryMethod, setDeliveryMethod] = useState('delivery');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [note, setNote] = useState('');
  const [reviewStep, setReviewStep] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [confirmedOrder, setConfirmedOrder] = useState(null);
  const [placingOrder, setPlacingOrder] = useState(false);
  const orderAttempt = useRef(null);
  const sendingOrder = useRef(false);

  function syncQty(productId, nextQty) {
    const updated = updateCartQuantity(productId, nextQty);
    setCart(updated);
  }

  const subtotalVnd = cart.reduce((sum, i) => sum + i.priceVnd * i.quantity, 0);
  const shippingFeeVnd = deliveryMethod === 'pickup' ? 0 : cart.length > 0 ? 25000 : 0;
  const totalVnd = subtotalVnd + shippingFeeVnd;

  function handleValidateAndReview(e) {
    e.preventDefault();
    setErrorMsg('');
    if (cart.length === 0) {
      setErrorMsg('Giỏ hàng đang trống. Vui lòng thêm sản phẩm trước.');
      return;
    }
    if (customerName.trim().length < 2) {
      setErrorMsg('Vui lòng nhập họ tên người nhận (tối thiểu 2 ký tự).');
      return;
    }
    if (!/^[0-9+\s.-]{8,15}$/.test(customerPhone.trim())) {
      setErrorMsg('Số điện thoại liên hệ chưa hợp lệ (nhập 8–15 chữ số).');
      return;
    }
    if (deliveryMethod === 'delivery' && shippingAddress.trim().length < 6) {
      setErrorMsg('Vui lòng nhập địa chỉ giao hàng cụ thể.');
      return;
    }
    setReviewStep(true);
  }

  async function handleConfirmPlaceOrder() {
    if (sendingOrder.current) return;
    sendingOrder.current = true;
    setPlacingOrder(true);
    setErrorMsg('');
    try {
      orderAttempt.current ||= globalThis.crypto?.randomUUID?.();
      const order = await submitCartOrder({
        customerName,
        customerPhone,
        deliveryMethod,
        shippingAddress,
        note
      }, orderAttempt.current);
      setConfirmedOrder(order);
      setCart([]);
      setReviewStep(false);
    } catch (err) {
      setErrorMsg(err?.message || 'Không thể tạo đơn đặt hàng.');
    } finally {
      sendingOrder.current = false;
      setPlacingOrder(false);
    }
  }

  if (confirmedOrder) {
    return (
      <div className="max-w-2xl mx-auto bg-surface border-2 border-brand rounded-2xl p-6 sm:p-8 space-y-5">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="w-10 h-10 text-brand shrink-0" aria-hidden="true" />
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-brand">Đặt hàng thành công (Dữ liệu mẫu)</p>
            <h1 className="text-xl sm:text-2xl font-bold text-ink">
              Mã đơn: <span className="font-mono">{confirmedOrder.orderCode}</span>
            </h1>
          </div>
        </div>
        <div className="p-4 rounded-xl bg-canvas border border-line space-y-1.5 text-sm tabular-nums">
          <p>
            <strong>Người đặt:</strong> {confirmedOrder.customerName} ({confirmedOrder.customerPhone})
          </p>
          <p>
            <strong>Hình thức nhận:</strong> {confirmedOrder.deliveryLabel}
          </p>
          <p>
            <strong>Tổng thanh toán dự kiến:</strong>{' '}
            <span className="text-lg font-extrabold text-brand">{formatVnd(confirmedOrder.grossAmountVnd)}</span>
          </p>
        </div>
        <p className="text-xs text-muted">
          {confirmedOrder.source === 'supabase' ? 'Đơn mẫu đã được lưu trên hệ thống. Tài khoản nhà vườn có thể xem đơn từ thiết bị khác.' : 'Đơn mẫu đã được lưu trong bản trải nghiệm trên thiết bị này.'}
        </p>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/chu-co-so/don-hang"
            className="min-h-[48px] px-5 rounded-xl bg-brand hover:bg-brand-hover text-white text-sm font-bold inline-flex items-center gap-2"
          >
            <span>Xem đơn trong Quản lý đơn nhà vườn</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Link>
          <Link
            to="/gian-hang/nha-vuon-ba-tu"
            className="min-h-[48px] px-4 rounded-xl border border-line bg-canvas text-sm font-semibold text-ink inline-flex items-center"
          >
            Quay lại Hồ sơ nhà vườn
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <section className="bg-surface border border-line rounded-2xl p-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-brand">Giỏ hàng và đặt hàng</p>
          <h1 className="text-xl sm:text-2xl font-bold text-ink">Giỏ hàng nông sản Đồng Nai</h1>
        </div>
        <Link
          to="/gian-hang/nha-vuon-ba-tu"
          className="min-h-[44px] px-4 rounded-xl border border-line bg-canvas text-sm font-semibold text-ink inline-flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          <span>Chọn thêm từ Nhà vườn Ba Tư</span>
        </Link>
      </section>

      {cart.length === 0 ? (
        <section className="bg-surface border border-line rounded-2xl p-8 text-center space-y-4">
          <ShoppingCart className="w-12 h-12 text-muted mx-auto" aria-hidden="true" />
          <h2 className="text-lg font-bold text-ink">Giỏ hàng của bạn đang trống</h2>
          <p className="text-sm text-muted max-w-md mx-auto">
            Hãy chọn chôm chôm, sầu riêng hoặc măng cụt từ Nhà vườn Ba Tư (38.000đ – 120.000đ/kg) để thử đặt hàng.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Link
              to="/gian-hang/nha-vuon-ba-tu"
              className="min-h-[44px] px-5 rounded-xl bg-brand hover:bg-brand-hover text-white text-sm font-semibold inline-flex items-center gap-2"
            >
              <span>Xem 5 sản phẩm Nhà vườn Ba Tư</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
            <Link
              to="/"
              className="min-h-[44px] px-5 rounded-xl border border-line bg-canvas text-sm font-semibold text-ink inline-flex items-center"
            >
              Xem toàn bộ Chợ OCOP
            </Link>
          </div>
        </section>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left: Cart items */}
          <section className="lg:col-span-7 space-y-3">
            {cart.map((item) => (
              <article key={item.productId} className="bg-surface border border-line rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5 min-w-0">
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-20 h-16 rounded-xl object-cover border border-line shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="font-mono text-[11px] text-muted">{item.sku}</p>
                    <h2 className="text-sm sm:text-base font-bold text-ink line-clamp-2">{item.title}</h2>
                    <p className="text-sm font-bold text-brand tabular-nums mt-0.5">
                      {formatVnd(item.priceVnd)} / {item.unit}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 tabular-nums">
                  <div className="inline-flex items-center border border-line rounded-xl bg-canvas">
                    <button
                      type="button"
                      aria-label={`Giảm số lượng ${item.title}`}
                      onClick={() => syncQty(item.productId, item.quantity - 1)}
                      className="min-h-[44px] min-w-[44px] flex items-center justify-center text-ink"
                    >
                      <Minus className="w-4 h-4" aria-hidden="true" />
                    </button>
                    <span className="px-3 font-bold text-sm">{item.quantity}</span>
                    <button
                      type="button"
                      aria-label={`Tăng số lượng ${item.title}`}
                      onClick={() => syncQty(item.productId, item.quantity + 1)}
                      className="min-h-[44px] min-w-[44px] flex items-center justify-center text-ink"
                    >
                      <Plus className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                  <div className="text-right min-w-[96px]">
                    <p className="font-extrabold text-sm text-ink">{formatVnd(item.priceVnd * item.quantity)}</p>
                  </div>
                  <button
                    type="button"
                    aria-label={`Xóa ${item.title}`}
                    onClick={() => syncQty(item.productId, 0)}
                    className="min-h-[44px] min-w-[44px] rounded-xl border border-rose-200 bg-rose-50 text-rose-800 flex items-center justify-center"
                  >
                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              </article>
            ))}
          </section>

          {/* Right: Delivery choice + Checkout Form */}
          <section className="lg:col-span-5 bg-surface border border-line rounded-2xl p-5 space-y-4 h-fit">
            <h2 className="text-lg font-bold text-ink">Thông tin nhận hàng &amp; Xác nhận</h2>

            {errorMsg && (
              <p className="text-xs sm:text-sm text-rose-800 bg-rose-50 border border-rose-200 rounded-xl p-3" role="alert">
                {errorMsg}
              </p>
            )}

            {!reviewStep ? (
              <form onSubmit={handleValidateAndReview} className="space-y-3">
                <div className="space-y-2">
                  <span className="block text-xs font-semibold text-ink">Chọn cách nhận hàng</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setDeliveryMethod('delivery')}
                      className={`min-h-[48px] p-3 rounded-xl border text-left transition ${
                        deliveryMethod === 'delivery'
                          ? 'bg-blue-50 border-brand text-ink'
                          : 'bg-canvas border-line text-muted'
                      }`}
                    >
                      <span className="flex items-center gap-1.5 text-sm font-bold text-ink">
                        <Truck className="w-4 h-4 text-brand" aria-hidden="true" />
                        <span>Giao tận nơi</span>
                      </span>
                      <span className="block text-[11px] mt-0.5">Phí mẫu: 25.000 ₫</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeliveryMethod('pickup')}
                      className={`min-h-[48px] p-3 rounded-xl border text-left transition ${
                        deliveryMethod === 'pickup'
                          ? 'bg-blue-50 border-brand text-ink'
                          : 'bg-canvas border-line text-muted'
                      }`}
                    >
                      <span className="flex items-center gap-1.5 text-sm font-bold text-ink">
                        <MapPin className="w-4 h-4 text-accent" aria-hidden="true" />
                        <span>Nhận tại vườn</span>
                      </span>
                      <span className="block text-[11px] mt-0.5">0 ₫ · Vườn Ba Tư, Long Khánh</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="ck-name" className="block text-xs font-semibold text-ink mb-1">
                    Họ tên người nhận (dữ liệu đặt thử)
                  </label>
                  <input
                    id="ck-name"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="VD: Khách đặt thử Long Khánh"
                    className="w-full min-h-[44px] px-3 rounded-xl border border-line bg-canvas text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="ck-phone" className="block text-xs font-semibold text-ink mb-1">
                    Số điện thoại liên hệ
                  </label>
                  <input
                    id="ck-phone"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="VD: 0901234567"
                    className="w-full min-h-[44px] px-3 rounded-xl border border-line bg-canvas text-sm tabular-nums"
                  />
                </div>

                {deliveryMethod === 'delivery' ? (
                  <div>
                    <label htmlFor="ck-addr" className="block text-xs font-semibold text-ink mb-1">
                      Địa chỉ giao hàng
                    </label>
                    <input
                      id="ck-addr"
                      required
                      value={shippingAddress}
                      onChange={(e) => setShippingAddress(e.target.value)}
                      placeholder="Số nhà, đường, phường/xã tại Đồng Nai..."
                      className="w-full min-h-[44px] px-3 rounded-xl border border-line bg-canvas text-sm"
                    />
                  </div>
                ) : (
                  <p className="text-xs bg-amber-50 border border-amber-200 rounded-xl p-3 text-amber-950">
                    Điểm hẹn nhận hàng: <strong>Cổng Nhà vườn Ba Tư, Ấp Bảo Vinh, TP. Long Khánh</strong> (khung 07:30 – 17:30 hằng ngày).
                  </p>
                )}

                <div>
                  <label htmlFor="ck-note" className="block text-xs font-semibold text-ink mb-1">
                    Ghi chú cho nhà vườn (tùy chọn)
                  </label>
                  <input
                    id="ck-note"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="VD: Chọn trái chín ăn trong ngày..."
                    className="w-full min-h-[44px] px-3 rounded-xl border border-line bg-canvas text-sm"
                  />
                </div>

                <div className="p-3.5 rounded-xl bg-canvas border border-line space-y-1.5 text-sm tabular-nums">
                  <div className="flex justify-between text-muted">
                    <span>Tạm tính ({cart.reduce((s, i) => s + i.quantity, 0)} đơn vị)</span>
                    <span>{formatVnd(subtotalVnd)}</span>
                  </div>
                  <div className="flex justify-between text-muted">
                    <span>Phí nhận / giao dự kiến</span>
                    <span>{formatVnd(shippingFeeVnd)}</span>
                  </div>
                  <div className="flex justify-between text-base font-extrabold text-ink pt-1 border-t border-line">
                    <span>Tổng cộng</span>
                    <span className="text-brand">{formatVnd(totalVnd)}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full min-h-[48px] px-5 rounded-xl bg-brand hover:bg-brand-hover text-white text-sm font-bold"
                >
                  Xem lại đơn hàng
                </button>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-canvas border border-line space-y-2 text-sm tabular-nums">
                  <p className="font-bold text-ink">Kiểm tra lại trước khi xác nhận:</p>
                  <p>Người nhận: <strong>{customerName}</strong> · {customerPhone}</p>
                  <p>
                    Cách nhận:{' '}
                    <strong>
                      {deliveryMethod === 'pickup' ? 'Nhận tại Nhà vườn Ba Tư (Long Khánh)' : `Giao tận nơi (${shippingAddress})`}
                    </strong>
                  </p>
                  <p className="text-base font-extrabold text-brand">Tổng tiền: {formatVnd(totalVnd)}</p>
                  <p className="text-xs text-muted">Thanh toán tiền mặt khi nhận hàng hoặc khi ghé vườn (Demo).</p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => { orderAttempt.current = null; setReviewStep(false); }}
                    disabled={placingOrder}
                    className="min-h-[48px] px-4 rounded-xl border border-line bg-canvas text-sm font-semibold text-ink"
                  >
                    Sửa lại
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmPlaceOrder}
                    disabled={placingOrder}
                    className="flex-1 min-h-[48px] px-5 rounded-xl bg-brand hover:bg-brand-hover text-white text-sm font-bold"
                  >
                    {placingOrder ? 'Đang gửi đơn…' : 'Xác nhận đặt hàng mẫu'}
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

// =========================================================================
// MÀN 6: LỊCH LIVESTREAM CỦA THANH NIÊN HỖ TRỢ
// =========================================================================
export function LivestreamSchedulePage() {
  const [schedules, setSchedules] = useState(() => fetchLivestreamSchedule());
  const [statusFilter, setStatusFilter] = useState('all');
  const [supporterFilter, setSupporterFilter] = useState('all');
  const [formOpen, setFormOpen] = useState(false);

  const [dateLabel, setDateLabel] = useState('Chủ Nhật · 06/12/2026');
  const [timeRange, setTimeRange] = useState('19:30 – 20:30');
  const [supporterName, setSupporterName] = useState('Đoàn viên Minh Anh (Đoàn phường Xuân An)');
  const [productSummary, setProductSummary] = useState('Chôm chôm nhãn & Sầu riêng Ri6 vườn Ba Tư');
  const [channelLabel, setChannelLabel] = useState('TikTok Shop (Mô phỏng)');
  const [notice, setNotice] = useState('');

  const filtered = schedules.filter((item) => {
    if (statusFilter !== 'all' && item.status !== statusFilter) return false;
    if (supporterFilter !== 'all' && !item.supporterName.includes(supporterFilter)) return false;
    return true;
  });

  function handleAddDemoSchedule(e) {
    e.preventDefault();
    addDemoLivestream({ dateLabel, timeRange, supporterName, productSummary, channelLabel });
    setSchedules(fetchLivestreamSchedule());
    setFormOpen(false);
    setNotice('Đã thêm lịch livestream mẫu mới cho tổ thanh niên hỗ trợ.');
  }

  return (
    <div className="space-y-5">
      <section className="bg-surface border border-line rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-bold uppercase tracking-wider text-brand">
              Lịch livestream của thanh niên hỗ trợ
            </p>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-200">
              Dữ liệu Demo — Không dẫn sang phát sóng thật
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-ink">
            Lịch đồng hành cùng Nhà vườn Ba Tư (Long Khánh)
          </h1>
          <p className="text-xs sm:text-sm text-muted">
            2 đoàn viên phụ trách hỗ trợ quay dựng &amp; phát trực tiếp ngay tại vườn 2,5 ha chôm chôm – sầu riêng.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setFormOpen((v) => !v)}
          className="min-h-[44px] px-4 rounded-xl bg-brand hover:bg-brand-hover text-white text-sm font-semibold inline-flex items-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          <span>{formOpen ? 'Đóng biểu mẫu' : 'Thêm lịch hỗ trợ mẫu'}</span>
        </button>
      </section>

      {notice && (
        <p className="text-sm bg-blue-50 border border-blue-200 text-emerald-950 rounded-xl p-3" role="status">
          {notice}
        </p>
      )}

      {formOpen && (
        <form onSubmit={handleAddDemoSchedule} className="bg-surface border border-blue-300 rounded-2xl p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="ls-date" className="block text-xs font-semibold text-ink mb-1">Ngày phát dự kiến</label>
            <input id="ls-date" required value={dateLabel} onChange={(e) => setDateLabel(e.target.value)} className="w-full min-h-[44px] px-3 rounded-xl border border-line bg-canvas text-sm" />
          </div>
          <div>
            <label htmlFor="ls-time" className="block text-xs font-semibold text-ink mb-1">Khung giờ</label>
            <input id="ls-time" required value={timeRange} onChange={(e) => setTimeRange(e.target.value)} className="w-full min-h-[44px] px-3 rounded-xl border border-line bg-canvas text-sm tabular-nums" />
          </div>
          <div>
            <label htmlFor="ls-sup" className="block text-xs font-semibold text-ink mb-1">Đoàn viên hỗ trợ</label>
            <select id="ls-sup" value={supporterName} onChange={(e) => setSupporterName(e.target.value)} className="w-full min-h-[44px] px-3 rounded-xl border border-line bg-canvas text-sm">
              <option value="Đoàn viên Minh Anh (Đoàn phường Xuân An)">Đoàn viên Minh Anh (Đoàn phường Xuân An)</option>
              <option value="Đoàn viên Hoàng Phúc (Đoàn trường CĐ Đồng Nai)">Đoàn viên Hoàng Phúc (Đoàn trường CĐ Đồng Nai)</option>
            </select>
          </div>
          <div>
            <label htmlFor="ls-ch" className="block text-xs font-semibold text-ink mb-1">Kênh phát mô phỏng</label>
            <input id="ls-ch" required value={channelLabel} onChange={(e) => setChannelLabel(e.target.value)} className="w-full min-h-[44px] px-3 rounded-xl border border-line bg-canvas text-sm" />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="ls-prod" className="block text-xs font-semibold text-ink mb-1">Sản phẩm dự kiến giới thiệu</label>
            <input id="ls-prod" required value={productSummary} onChange={(e) => setProductSummary(e.target.value)} className="w-full min-h-[44px] px-3 rounded-xl border border-line bg-canvas text-sm" />
          </div>
          <div className="sm:col-span-2 flex justify-end">
            <button type="submit" className="min-h-[44px] px-5 rounded-xl bg-brand text-white text-sm font-semibold">
              Lưu lịch livestream mẫu
            </button>
          </div>
        </form>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <select
          aria-label="Lọc trạng thái livestream"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="min-h-[44px] px-3 rounded-xl border border-line bg-surface text-sm"
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="upcoming">Sắp diễn ra</option>
          <option value="preparing">Đang chuẩn bị kịch bản</option>
          <option value="completed_demo">Đã chạy thử nghiệm</option>
        </select>
        <select
          aria-label="Lọc theo đoàn viên hỗ trợ"
          value={supporterFilter}
          onChange={(e) => setSupporterFilter(e.target.value)}
          className="min-h-[44px] px-3 rounded-xl border border-line bg-surface text-sm"
        >
          <option value="all">Cả 2 đoàn viên hỗ trợ</option>
          <option value="Minh Anh">Đoàn viên Minh Anh</option>
          <option value="Hoàng Phúc">Đoàn viên Hoàng Phúc</option>
        </select>
      </div>

      {/* Schedule cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((item) => {
          const badge =
            item.status === 'upcoming'
              ? { label: 'Sắp diễn ra', cls: 'bg-blue-50 text-emerald-900 border-blue-300' }
              : item.status === 'preparing'
                ? { label: 'Đang chuẩn bị', cls: 'bg-amber-50 text-amber-900 border-amber-300' }
                : { label: 'Đã thử nghiệm mẫu', cls: 'bg-stone-100 text-stone-700 border-stone-300' };
          return (
            <article key={item.id} className="bg-surface border border-line rounded-2xl p-5 space-y-3 flex flex-col justify-between">
              <div className="space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${badge.cls}`}>
                    <Radio className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>{badge.label}</span>
                  </span>
                  <span className="font-mono text-xs font-semibold text-ink tabular-nums inline-flex items-center gap-1">
                    <CalendarClock className="w-4 h-4 text-brand" aria-hidden="true" />
                    {item.dateLabel} · {item.timeRange}
                  </span>
                </div>

                <h2 className="text-base font-bold text-ink">{item.productSummary}</h2>

                <div className="text-xs text-muted space-y-1">
                  <p className="flex items-center gap-1.5 text-ink font-medium">
                    <UserCheck className="w-4 h-4 text-brand shrink-0" aria-hidden="true" />
                    <span>{item.supporterName}</span>
                  </p>
                  <p>Vai trò: {item.supporterRole}</p>
                  <p>Kênh dự kiến: {item.channelLabel}</p>
                </div>

                <p className="text-xs bg-canvas border border-line rounded-xl p-3 text-muted">
                  Chuẩn bị tại vườn: {item.note}
                </p>
              </div>

              <div className="pt-2 border-t border-line flex items-center justify-between text-xs">
                <Link to="/gian-hang/nha-vuon-ba-tu" className="font-semibold text-brand underline">
                  Xem gian hàng Nhà vườn Ba Tư
                </Link>
                <span className="text-muted">Không mở luồng phát sóng thật</span>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
