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
  UserCheck,
  Save,
  Eye,
  Wand2,
  AlertTriangle,
  CalendarPlus,
  PlayCircle,
  X,
  Users,
  Clock,
  Store,
  WifiOff,
  PackageSearch,
  Send
} from 'lucide-react';
import orchardPhoto from '../assets/orchard/orchard.webp';
import {
  addDemoLivestream,
  addSeasonNoteDraft,
  addToCart,
  clearActiveReferral,
  clearQuickPublishDraft,
  deleteSeasonNoteDraft,
  fetchLivestreamSchedule,
  fetchPublicCatalog,
  getActiveReferral,
  getShippingFeeForMethod,
  groupCartByProducer,
  loadCart,
  loadQuickPublishDraft,
  loadSeasonLog,
  loadSeasonNoteDrafts,
  publishQuickGardenProduct,
  saveQuickPublishDraft,
  submitMultiGardenOrder,
  syncSeasonNoteDraftToBatch,
  updateCartQuantity
} from '../services/ocopStore';
import {
  buildTemplateDescriptionSuggestion,
  requestAiProductDescription
} from '../services/aiDescribeService';
import { formatDateTimeVn, formatVnd } from '../utils/formatters';
import { downloadLivestreamIcs } from '../utils/icsCalendar';
import { PRIMARY_FARMER_PRODUCER_ID, SAMPLE_UPLOAD_PHOTOS } from '../data/pilotData';

// =========================================================================
// MÀN 2: ĐĂNG SẢN PHẨM NHANH BẰNG ẢNH, GIỌNG NÓI & AI GEMINI FLASH (ĐIỂM CỘNG A)
// =========================================================================
const SIMULATED_VOICE_SAMPLES = [
  {
    label: 'Mẫu giọng nói 1: Chôm chôm nhãn (45k/kg)',
    transcript:
      'Chôm chôm nhãn Long Khánh chín đỏ vườn Ba Tư giá bốn mươi lăm nghìn đồng một ký còn một trăm hai mươi ký hái sáng nay',
    parsed: {
      title: 'Chôm chôm nhãn Long Khánh chín đỏ (1 kg)',
      priceVnd: '45000',
      stockKg: '120',
      batchCode: 'LK-CC-2511',
      description: 'Hái sáng sớm tại vườn Ba Tư 2,5 ha Long Khánh, trái giòn ngọt tróc hạt.'
    }
  },
  {
    label: 'Mẫu giọng nói 2: Sầu riêng Ri6 (115k/kg)',
    transcript:
      'Sầu riêng Ri6 cơm vàng hạt lép vườn Ba Tư giá một trăm mười lăm nghìn đồng một ký số lượng sáu mươi ký bao ăn tại vườn',
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

export function QuickPublishVoicePage({ session, isOnline = true }) {
  const savedDraft = loadQuickPublishDraft();

  const [imageDataUrl, setImageDataUrl] = useState(savedDraft?.imageDataUrl || '');
  const [imageLabel, setImageLabel] = useState(
    savedDraft?.imageLabel || 'Chưa chọn ảnh — chọn ảnh từ điện thoại hoặc bấm 1 ảnh mẫu bên dưới'
  );
  const [listening, setListening] = useState(false);
  const [voiceMode, setVoiceMode] = useState(savedDraft?.voiceMode || 'manual');
  const [rawTranscript, setRawTranscript] = useState(savedDraft?.rawTranscript || '');
  const [title, setTitle] = useState(savedDraft?.title || '');
  const [priceVnd, setPriceVnd] = useState(savedDraft?.priceVnd || '45000');
  const [stockKg, setStockKg] = useState(savedDraft?.stockKg || '80');
  const [batchCode, setBatchCode] = useState(savedDraft?.batchCode || 'LK-CC-2511');
  const [description, setDescription] = useState(savedDraft?.description || '');
  const [descriptionSource, setDescriptionSource] = useState(savedDraft?.descriptionSource || 'manual');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiBanner, setAiBanner] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [statusMsg, setStatusMsg] = useState(
    savedDraft?.savedAt ? `Đã khôi phục bản nháp lưu lúc ${formatDateTimeVn(savedDraft.savedAt)}.` : ''
  );
  const [errorMsg, setErrorMsg] = useState('');
  const [publishedProduct, setPublishedProduct] = useState(null);

  // Offline voice season log notes
  const [seasonDrafts, setSeasonDrafts] = useState(() => loadSeasonNoteDrafts());
  const [noteBatch, setNoteBatch] = useState('LK-CC-2411');
  const [noteStage, setNoteStage] = useState('Chăm sóc / Tỉa trái tại vườn');
  const [noteDetail, setNoteDetail] = useState('');
  const [noteMode, setNoteMode] = useState('manual');
  const [noteNotice, setNoteNotice] = useState('');

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
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setErrorMsg('Chỉ hỗ trợ ảnh định dạng JPG, PNG hoặc WebP.');
      return;
    }
    if (file.size > 3.5 * 1024 * 1024) {
      setErrorMsg('Ảnh không vượt quá 3,5 MB để gửi phân tích AI và tải nhanh trên di động.');
      return;
    }
    setErrorMsg('');
    setAiBanner(null);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setImageDataUrl(reader.result);
        setImageLabel(`Đã chọn ảnh: ${file.name} (${(file.size / 1024).toFixed(0)} KB)`);
      }
    };
    reader.readAsDataURL(file);
  }

  function handlePickSamplePhoto(sample) {
    setErrorMsg('');
    setAiBanner(null);
    setImageDataUrl(sample.src);
    setImageLabel(`${sample.label} (ảnh mẫu có sẵn)`);
    if (!title.trim()) {
      setTitle(sample.defaultTitle);
    }
  }

  async function handleRequestAiDescription() {
    if (!imageDataUrl) {
      setErrorMsg('Vui lòng chọn hoặc chụp một ảnh nông sản ở Bước 1 trước khi gọi AI gợi ý mô tả.');
      return;
    }
    setErrorMsg('');
    setAiLoading(true);
    setAiBanner(null);
    try {
      const res = await requestAiProductDescription({
        imageDataUrl,
        productHint: title,
        areaHint: 'Long Khánh, Đồng Nai',
        producerHint: 'Nhà vườn Ba Tư',
        accessToken: session?.mode === 'supabase' ? session.accessToken : ''
      });

      if (res.ok && res.suggestion) {
        if (!title.trim() && res.suggestion.titleSuggestion) {
          setTitle(res.suggestion.titleSuggestion);
        }
        const highlightsText = res.suggestion.highlights?.length
          ? `\n• ${res.suggestion.highlights.join('\n• ')}`
          : '';
        setDescription(`${res.suggestion.description}${highlightsText}`);
        setDescriptionSource('gemini_flash');
        setAiBanner({
          type: 'success',
          title: `Gợi ý từ AI Gemini Flash (${res.model})`,
          message: 'AI đã viết gợi ý mô tả từ ảnh nông sản. Chủ vườn có thể sửa lại bất kỳ câu chữ nào trước khi đăng.'
        });
      } else {
        setAiBanner({
          type: 'fallback',
          code: res.code,
          title: 'Chưa kết nối được AI Gemini Flash trực tuyến',
          message:
            res.message ||
            'Máy chủ chưa cấu hình GEMINI_API_KEY hoặc đang ngoại tuyến. Bạn có thể bấm "Dùng Gợi ý mẫu" ngay bên dưới hoặc tự nhập tay.'
        });
      }
    } catch (err) {
      setAiBanner({
        type: 'fallback',
        title: 'Chưa gọi được AI gợi ý',
        message: err?.message || 'Bạn có thể bấm "Dùng Gợi ý mẫu" hoặc tự nhập mô tả thủ công.'
      });
    } finally {
      setAiLoading(false);
    }
  }

  function handleApplyTemplateFallback() {
    const built = buildTemplateDescriptionSuggestion({
      productHint: title,
      areaHint: 'Long Khánh, Đồng Nai',
      producerHint: 'Nhà vườn Ba Tư'
    });
    if (!title.trim()) {
      setTitle(built.suggestion.titleSuggestion);
    }
    setDescription(built.suggestion.description);
    setDescriptionSource('template_fallback');
    setAiBanner({
      type: 'template',
      title: 'Gợi ý mẫu (Minh họa — chưa dùng Gemini API)',
      message: 'Đã điền mô tả mẫu tiếng Việt để chủ vườn xem và chỉnh sửa thủ công.'
    });
  }

  function startSpeechRecognition() {
    setErrorMsg('');
    if (!hasSpeechApi) {
      applySimulatedVoice(SIMULATED_VOICE_SAMPLES[0]);
      setErrorMsg(
        'Trình duyệt này chưa bật Web Speech API — đã điền sẵn "Giọng nói mẫu (Mô phỏng)" để bạn sửa và thử ngay.'
      );
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
        setErrorMsg(
          'Không thu được giọng nói từ micro. Bạn hãy bấm một trong hai nút "Giọng nói mẫu (Mô phỏng)" bên dưới hoặc nhập tay.'
        );
      };
      rec.onresult = (event) => {
        const text = event.results?.[0]?.[0]?.transcript || '';
        setRawTranscript(text);
        setVoiceMode('speech_api');
        const parsed = parseVietnameseTranscript(text);
        if (parsed.title) setTitle(parsed.title);
        if (parsed.priceVnd) setPriceVnd(parsed.priceVnd);
        if (parsed.stockKg) setStockKg(parsed.stockKg);
        if (!description.trim()) {
          setDescription(`${text}. Thu hoạch tại Nhà vườn Ba Tư, Long Khánh.`);
        }
        setStatusMsg('Đã nhận dạng giọng nói tiếng Việt thật. Vui lòng xem lại và chỉnh sửa trước khi đăng.');
      };
      recognitionRef.current = rec;
      rec.start();
    } catch {
      setListening(false);
      setErrorMsg('Không mở được micro. Vui lòng dùng nút Giọng nói mẫu (Mô phỏng) hoặc nhập tay.');
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
    setDescriptionSource('voice_sample');
    setStatusMsg('Giọng nói mẫu (Mô phỏng): Đã tự điền tên, giá, số lượng, mã lô và mô tả — bạn có thể chỉnh tay bất kỳ ô nào.');
  }

  function handleSaveDraft() {
    saveQuickPublishDraft({
      title,
      priceVnd,
      stockKg,
      batchCode,
      description,
      imageDataUrl: imageDataUrl.length < 300_000 ? imageDataUrl : '',
      imageLabel,
      voiceMode,
      rawTranscript,
      descriptionSource
    });
    setStatusMsg('Đã lưu bản nháp trên thiết bị này. Khi mở lại trang, nội dung sẽ tự khôi phục.');
  }

  function handleClearDraft() {
    clearQuickPublishDraft();
    setTitle('');
    setPriceVnd('45000');
    setStockKg('80');
    setBatchCode('LK-CC-2511');
    setDescription('');
    setImageDataUrl('');
    setRawTranscript('');
    setAiBanner(null);
    setStatusMsg('Đã xóa bản nháp hiện tại.');
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
        voiceInputMode: voiceMode,
        descriptionSource
      });
      setPublishedProduct(created);
      setShowPreview(false);
      setStatusMsg(
        `Đã đăng "${created.title}" lên gian hàng Nhà vườn Ba Tư và Cửa hàng, kèm mã QR nhật ký lô ${created.batchCode}!`
      );
    } catch (err) {
      setErrorMsg(err?.message || 'Không thể đăng sản phẩm nhanh.');
    }
  }

  function handleSaveOfflineSeasonNote(e) {
    e.preventDefault();
    setNoteNotice('');
    try {
      const saved = addSeasonNoteDraft({
        batchCode: noteBatch,
        stage: noteStage,
        detail: noteDetail,
        inputMode: noteMode,
        isOffline: !isOnline
      });
      setSeasonDrafts(loadSeasonNoteDrafts());
      setNoteDetail('');
      setNoteNotice(
        `Đã lưu nháp nhật ký lô ${saved.batchCode} trên thiết bị${!isOnline ? ' (ngoại tuyến)' : ''}. Bấm "Gắn vào nhật ký QR" để hiển thị ngay trên mã QR.`
      );
    } catch (err) {
      setNoteNotice(err?.message || 'Không thể lưu nháp nhật ký.');
    }
  }

  function handleSyncSeasonNote(draftId) {
    try {
      const updatedLog = syncSeasonNoteDraftToBatch(draftId);
      setSeasonDrafts(loadSeasonNoteDrafts());
      setNoteNotice(`Đã gắn mốc nhật ký mới vào mã QR lô ${updatedLog.batchCode}!`);
    } catch (err) {
      setNoteNotice(err?.message || 'Không thể gắn vào nhật ký.');
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <section className="bg-surface border border-line rounded-2xl p-5 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-bold uppercase tracking-wider text-brand">
            Màn 2 · Menu Chủ vườn · Đăng sản phẩm nhanh
          </p>
          <span className="text-xs px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-brand font-semibold">
            Nhà vườn Ba Tư · Long Khánh
          </span>
        </div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-ink">
          Chụp ảnh + Bấm Mic nói + AI gợi ý mô tả tiếng Việt
        </h1>
        <p className="text-sm text-muted">
          Thiết kế nút lớn dễ bấm cho chủ vườn 50 tuổi: (1) Chọn ảnh &amp; gọi AI Gemini Flash → (2) Bấm Mic đọc tiếng Việt hoặc dùng mẫu mô phỏng → (3) Lưu nháp, xem trước và đăng lên gian hàng.
        </p>
      </section>

      {errorMsg && (
        <div className="bg-rose-50 border border-rose-300 rounded-2xl p-4 text-sm font-medium text-rose-900" role="alert">
          {errorMsg}
        </div>
      )}
      {statusMsg && (
        <div className="bg-blue-50 border border-blue-300 rounded-2xl p-4 text-sm font-semibold text-blue-950" role="status">
          {statusMsg}
        </div>
      )}

      {publishedProduct && (
        <section className="bg-surface border-2 border-brand rounded-2xl p-5 space-y-3 shadow-sm">
          <div className="flex items-center gap-2 text-brand font-extrabold text-base">
            <CheckCircle2 className="w-5 h-5 shrink-0" aria-hidden="true" />
            <span>Đã đăng sản phẩm thành công lên gian hàng!</span>
          </div>
          <p className="text-sm text-ink">
            <strong>{publishedProduct.title}</strong> · {formatVnd(publishedProduct.priceVnd)}/kg · Mã lô QR:{' '}
            <span className="font-mono font-bold text-brand">{publishedProduct.batchCode}</span>
          </p>
          <div className="flex flex-wrap gap-2">
            <Link
              to={`/san-pham/${publishedProduct.slug}`}
              className="min-h-[46px] px-4 rounded-xl bg-brand hover:bg-brand-hover text-white text-sm font-bold inline-flex items-center gap-2"
            >
              <span>Xem trang sản phẩm &amp; Mã QR</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
            <Link
              to="/gian-hang/nha-vuon-ba-tu"
              className="min-h-[46px] px-4 rounded-xl border border-brand bg-blue-50 text-sm font-bold text-brand inline-flex items-center"
            >
              Kiểm tra trong Gian hàng Ba Tư
            </Link>
            <Link
              to="/"
              className="min-h-[46px] px-4 rounded-xl border border-line bg-canvas text-sm font-semibold text-ink inline-flex items-center"
            >
              Xem ngoài Cửa hàng
            </Link>
          </div>
        </section>
      )}

      <form onSubmit={handlePublishSubmit} className="space-y-5">
        {/* Bước 1 (Ảnh + Điểm cộng A: AI Gemini Flash) & Bước 2 (Giọng nói) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <section className="bg-surface border border-line rounded-2xl p-5 space-y-3.5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base font-bold text-ink">Bước 1: Ảnh nông sản &amp; AI viết mô tả</h2>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-brand">
                Điểm cộng A
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <label
                htmlFor="quick-photo-input"
                className="min-h-[48px] px-4 rounded-xl bg-canvas border-2 border-line hover:border-brand text-sm font-bold text-ink inline-flex items-center gap-2 cursor-pointer"
              >
                <Camera className="w-5 h-5 text-brand" aria-hidden="true" />
                <span>Chụp ảnh / Chọn từ máy</span>
              </label>
              <input
                id="quick-photo-input"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                capture="environment"
                onChange={handlePhotoUpload}
                className="sr-only"
              />
            </div>

            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-muted">Hoặc chọn nhanh ảnh nông sản mẫu để thử AI:</p>
              <div className="flex flex-wrap gap-2">
                {SAMPLE_UPLOAD_PHOTOS.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handlePickSamplePhoto(s)}
                    className="min-h-[44px] px-3 rounded-xl border border-line bg-canvas hover:border-brand text-xs sm:text-sm font-semibold text-ink"
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <p className="text-xs text-muted">{imageLabel}</p>

            {imageDataUrl && (
              <div className="space-y-2.5">
                <img
                  src={imageDataUrl}
                  alt="Ảnh nông sản đã chọn"
                  className="w-full h-44 object-cover rounded-xl border border-line"
                />
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={aiLoading}
                    onClick={handleRequestAiDescription}
                    className="flex-1 min-h-[48px] px-4 rounded-xl bg-brand hover:bg-brand-hover text-white text-sm font-bold inline-flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    <Wand2 className="w-4 h-4" aria-hidden="true" />
                    <span>{aiLoading ? 'Đang phân tích ảnh...' : 'AI gợi ý mô tả từ ảnh (Gemini Flash)'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleApplyTemplateFallback}
                    className="min-h-[48px] px-3.5 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-950 text-sm font-semibold inline-flex items-center gap-1.5"
                  >
                    <Sparkles className="w-4 h-4" aria-hidden="true" />
                    <span>Gợi ý mẫu</span>
                  </button>
                </div>
              </div>
            )}

            {aiBanner && (
              <div
                role="status"
                className={`rounded-xl border p-3 text-xs sm:text-sm space-y-2 ${
                  aiBanner.type === 'success'
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                    : aiBanner.type === 'template'
                      ? 'bg-blue-50 border-blue-200 text-blue-950'
                      : 'bg-amber-50 border-amber-300 text-amber-950'
                }`}
              >
                <p className="font-bold">{aiBanner.title}</p>
                <p>{aiBanner.message}</p>
                {aiBanner.type === 'fallback' && (
                  <button
                    type="button"
                    onClick={handleApplyTemplateFallback}
                    className="min-h-[44px] px-3.5 rounded-xl bg-white border border-amber-400 text-amber-950 text-sm font-bold inline-flex items-center gap-1.5"
                  >
                    <Sparkles className="w-4 h-4" aria-hidden="true" />
                    <span>Dùng Gợi ý mẫu (chỉnh sửa được)</span>
                  </button>
                )}
              </div>
            )}
          </section>

          <section className="bg-surface border border-line rounded-2xl p-5 space-y-3.5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base font-bold text-ink">Bước 2: Giọng nói tiếng Việt</h2>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-canvas border border-line text-muted">
                {voiceMode === 'speech_api'
                  ? 'Micro thật (vi-VN)'
                  : voiceMode === 'simulated_voice'
                    ? 'Mẫu mô phỏng'
                    : 'Nhập tay / Chờ mic'}
              </span>
            </div>

            <button
              type="button"
              onClick={startSpeechRecognition}
              className={`w-full min-h-[52px] px-4 rounded-xl text-sm sm:text-base font-bold inline-flex items-center justify-center gap-2 ${
                listening
                  ? 'bg-rose-700 text-white'
                  : 'bg-brand hover:bg-brand-hover text-white shadow-sm'
              }`}
            >
              {listening ? <MicOff className="w-5 h-5" aria-hidden="true" /> : <Mic className="w-5 h-5" aria-hidden="true" />}
              <span>{listening ? 'Đang nghe tiếng Việt...' : 'Bấm Mic nói tên, giá & số lượng'}</span>
            </button>

            <div className="space-y-2">
              <p className="text-xs sm:text-sm font-semibold text-muted">
                Không tiện nói micro? Chọn giọng nói mẫu (ghi rõ mô phỏng):
              </p>
              <div className="grid grid-cols-1 gap-2">
                {SIMULATED_VOICE_SAMPLES.map((s) => (
                  <button
                    key={s.label}
                    type="button"
                    onClick={() => applySimulatedVoice(s)}
                    className="min-h-[46px] px-3.5 py-2 rounded-xl bg-amber-50 border border-amber-300 hover:border-brand text-left text-sm font-semibold text-amber-950 inline-flex items-center gap-2"
                  >
                    <Sparkles className="w-4 h-4 text-amber-700 shrink-0" aria-hidden="true" />
                    <span>{s.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {rawTranscript && (
              <div className="p-3.5 rounded-xl bg-canvas border border-line text-sm text-ink space-y-1">
                <p className="text-xs font-bold text-brand">
                  Nội dung thu được ({voiceMode === 'speech_api' ? 'Nhận giọng nói tiếng Việt' : 'Giọng nói mẫu — Mô phỏng'}):
                </p>
                <p>&ldquo;{rawTranscript}&rdquo;</p>
              </div>
            )}
          </section>
        </div>

        {/* Bước 3: Chỉnh sửa tay, Lưu nháp, Xem trước & Đăng */}
        <section className="bg-surface border border-line rounded-2xl p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base sm:text-lg font-bold text-ink">
              Bước 3: Sửa tay, lưu nháp, xem trước &amp; đăng lên gian hàng
            </h2>
            {descriptionSource !== 'manual' && (
              <span className="text-xs px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-brand font-semibold">
                {descriptionSource === 'gemini_flash'
                  ? 'Nguồn mô tả: AI Gemini Flash (đã mở chỉnh sửa)'
                  : descriptionSource === 'template_fallback'
                    ? 'Nguồn mô tả: Gợi ý mẫu (chỉnh sửa được)'
                    : 'Nguồn mô tả: Mẫu giọng nói (chỉnh sửa được)'}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label htmlFor="qp-title" className="ocop-label">
                Tên sản phẩm (kèm đơn vị kg)
              </label>
              <input
                id="qp-title"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="VD: Chôm chôm nhãn Long Khánh hái sáng (1 kg)"
                className="ocop-field"
              />
            </div>

            <div>
              <label htmlFor="qp-price" className="ocop-label">
                Giá bán tại vườn (VNĐ / kg)
              </label>
              <input
                id="qp-price"
                type="number"
                required
                min="5000"
                max="50000000"
                value={priceVnd}
                onChange={(e) => setPriceVnd(e.target.value)}
                className="ocop-field tabular-nums"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="qp-stock" className="ocop-label">
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
                  className="ocop-field tabular-nums"
                />
              </div>
              <div>
                <label htmlFor="qp-batch" className="ocop-label">
                  Mã lô nhật ký QR
                </label>
                <input
                  id="qp-batch"
                  value={batchCode}
                  onChange={(e) => setBatchCode(e.target.value)}
                  className="ocop-field font-mono text-sm"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="qp-desc" className="ocop-label">
                Mô tả sản phẩm (sửa tay trực tiếp)
              </label>
              <textarea
                id="qp-desc"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Mô tả độ chín, cách thu hoạch, điểm nhận hàng tại vườn..."
                className="w-full p-3.5 rounded-xl border border-line bg-slate-50 focus:bg-white focus:border-brand text-sm"
              />
            </div>
          </div>

          {showPreview && (
            <div className="p-4 rounded-2xl bg-canvas border-2 border-blue-300 space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-brand">
                Xem trước hiển thị ngoài gian hàng
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-4 bg-white rounded-xl border border-line p-3.5">
                {imageDataUrl ? (
                  <img src={imageDataUrl} alt="Ảnh xem trước" className="w-full h-36 object-cover rounded-lg border border-line" />
                ) : (
                  <div className="w-full h-36 rounded-lg bg-blue-50 border border-dashed border-blue-300 grid place-items-center text-xs text-muted text-center p-2">
                    Chưa chọn ảnh (sẽ dùng khung minh họa)
                  </div>
                )}
                <div className="space-y-1.5">
                  <p className="font-mono text-xs text-muted">Nhà vườn Ba Tư · Lô QR: {batchCode || 'Tự tạo'}</p>
                  <h3 className="text-base font-bold text-ink">{title || '(Chưa nhập tên sản phẩm)'}</h3>
                  <p className="text-lg font-extrabold text-brand tabular-nums">
                    {formatVnd(Number(priceVnd) || 0)} <span className="text-xs font-normal text-muted">/ 1 kg · Còn {stockKg || 0} kg</span>
                  </p>
                  <p className="text-xs sm:text-sm text-muted whitespace-pre-line">{description || '(Chưa nhập mô tả)'}</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-line">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleSaveDraft}
                className="min-h-[46px] px-4 rounded-xl border border-line bg-canvas hover:border-brand text-sm font-semibold text-ink inline-flex items-center gap-1.5"
              >
                <Save className="w-4 h-4 text-brand" aria-hidden="true" />
                <span>Lưu nháp</span>
              </button>
              <button
                type="button"
                onClick={() => setShowPreview((v) => !v)}
                className="min-h-[46px] px-4 rounded-xl border border-line bg-canvas hover:border-brand text-sm font-semibold text-ink inline-flex items-center gap-1.5"
              >
                <Eye className="w-4 h-4 text-brand" aria-hidden="true" />
                <span>{showPreview ? 'Ẩn xem trước' : 'Xem trước'}</span>
              </button>
              {savedDraft && (
                <button
                  type="button"
                  onClick={handleClearDraft}
                  className="min-h-[46px] px-3 rounded-xl text-xs sm:text-sm font-semibold text-muted hover:text-rose-700"
                >
                  Xóa nháp
                </button>
              )}
            </div>

            <button
              type="submit"
              className="min-h-[48px] px-6 rounded-xl bg-brand hover:bg-brand-hover text-white text-sm sm:text-base font-bold inline-flex items-center gap-2 shadow-sm"
            >
              <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
              <span>Đăng ngay lên gian hàng</span>
            </button>
          </div>
        </section>
      </form>

      {/* Offline Voice Season Log Drafts (PWA Offline support under orchard canopy) */}
      <section className="bg-surface border border-line rounded-2xl p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-brand flex items-center gap-1.5">
              <Sprout className="w-4 h-4" aria-hidden="true" />
              <span>Nhật ký mùa vụ giọng nói ngoại tuyến (PWA)</span>
            </p>
            <h2 className="text-base sm:text-lg font-bold text-ink mt-0.5">
              Ghi nhanh mốc chăm sóc ngay dưới tán vườn (kể cả khi sóng yếu)
            </h2>
          </div>
          {!isOnline && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-300 text-xs font-semibold text-amber-950">
              <WifiOff className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Đang lưu cục bộ ngoại tuyến</span>
            </span>
          )}
        </div>

        <form onSubmit={handleSaveOfflineSeasonNote} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label htmlFor="sn-batch" className="ocop-label">Mã lô QR</label>
            <select
              id="sn-batch"
              value={noteBatch}
              onChange={(e) => setNoteBatch(e.target.value)}
              className="ocop-field font-mono"
            >
              <option value="LK-CC-2411">LK-CC-2411 (Chôm chôm nhãn)</option>
              <option value="LK-SR-2411">LK-SR-2411 (Sầu riêng Ri6)</option>
              <option value="LK-CT-2411">LK-CT-2411 (Chôm chôm Thái)</option>
              <option value="LK-MT-2411">LK-MT-2411 (Sầu riêng Monthong)</option>
              <option value="LK-MC-2411">LK-MC-2411 (Măng cụt)</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="sn-stage" className="ocop-label">Giai đoạn mùa vụ</label>
            <input
              id="sn-stage"
              value={noteStage}
              onChange={(e) => setNoteStage(e.target.value)}
              className="ocop-field"
            />
          </div>
          <div className="sm:col-span-3 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label htmlFor="sn-detail" className="ocop-label mb-0">Nội dung ghi chép tại vườn</label>
              <button
                type="button"
                onClick={() => {
                  setNoteMode('simulated_voice');
                  setNoteDetail('Hôm nay tỉa trái đợt 2 lô A1, giữ trái đều và kiểm tra không có sâu đục trái.');
                }}
                className="min-h-[40px] px-3 rounded-xl border border-amber-300 bg-amber-50 text-xs sm:text-sm font-semibold text-amber-950 inline-flex items-center gap-1.5"
              >
                <Mic className="w-4 h-4" aria-hidden="true" />
                <span>Điền câu đọc mẫu (Mô phỏng)</span>
              </button>
            </div>
            <input
              id="sn-detail"
              value={noteDetail}
              onChange={(e) => setNoteDetail(e.target.value)}
              placeholder="VD: Hôm nay tỉa trái đợt 2 lô A1, tưới nước sáng sớm..."
              className="ocop-field"
            />
          </div>
          <div className="sm:col-span-3 flex justify-end">
            <button type="submit" className="ocop-primary">
              <Save className="w-4 h-4" aria-hidden="true" />
              <span>Lưu nháp nhật ký (offline)</span>
            </button>
          </div>
        </form>

        {noteNotice && (
          <p className="text-sm font-semibold text-brand bg-blue-50 border border-blue-200 rounded-xl p-3" role="status">
            {noteNotice}
          </p>
        )}

        {seasonDrafts.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-line">
            <p className="text-xs font-bold text-muted">Danh sách nháp nhật ký trên thiết bị ({seasonDrafts.length}):</p>
            {seasonDrafts.map((d) => (
              <div key={d.id} className="p-3 rounded-xl bg-canvas border border-line flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs sm:text-sm">
                <div className="space-y-0.5">
                  <p className="font-bold text-ink">
                    <span className="font-mono text-brand mr-1.5">{d.batchCode}</span>
                    {d.stage}
                  </p>
                  <p className="text-muted">{d.detail}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {d.synced ? (
                    <Link
                      to={`/nhat-ky/${encodeURIComponent(d.batchCode)}`}
                      className="min-h-[40px] px-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 font-semibold inline-flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                      <span>Đã gắn QR · Xem</span>
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSyncSeasonNote(d.id)}
                      className="min-h-[40px] px-3 rounded-xl bg-brand text-white font-semibold inline-flex items-center gap-1"
                    >
                      <Send className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Gắn vào nhật ký QR</span>
                    </button>
                  )}
                  <button
                    type="button"
                    aria-label="Xóa nháp nhật ký"
                    onClick={() => setSeasonDrafts(deleteSeasonNoteDraft(d.id))}
                    className="min-h-[40px] min-w-[40px] rounded-xl border border-line bg-white text-muted hover:text-rose-700 grid place-items-center"
                  >
                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
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
    loadSeasonLog(batchCode)
      .then((log) => {
        if (active) setResult({ batchCode, log });
      })
      .catch(() => {
        if (active) setResult({ batchCode, error: 'Chưa tải được nhật ký mùa vụ. Vui lòng thử lại.' });
      });
    return () => {
      active = false;
    };
  }, [batchCode]);

  if (result?.batchCode !== batchCode) {
    return <p role="status" className="p-6 text-muted">Đang tải nhật ký mùa vụ…</p>;
  }
  if (result.error) {
    return <p role="alert" className="p-6 text-rose-800">{result.error}</p>;
  }
  const log = result.log;

  if (!log) {
    return (
      <div className="max-w-xl mx-auto bg-surface border border-line rounded-2xl p-8 text-center space-y-4">
        <QrCode className="w-10 h-10 text-brand mx-auto" aria-hidden="true" />
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

      <section className="bg-surface border border-line rounded-2xl p-5 sm:p-6 space-y-2.5">
        <p className="text-xs font-bold uppercase tracking-wider text-brand">
          Truy xuất nguồn gốc · Nhật ký mùa vụ (Dữ liệu mẫu)
        </p>
        <h1 className="text-xl sm:text-2xl font-extrabold text-ink">{log.productTitle}</h1>
        <p className="text-sm text-muted">
          Cơ sở: <strong>{log.producerName}</strong> · {log.harvestWindow}
        </p>
        {(log.harvestedAtLabel || log.verifiedByYouth) && (
          <div className="flex flex-wrap gap-2 pt-1">
            {log.harvestedAtLabel && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-50 border border-blue-200 text-xs font-bold text-ink">
                <Clock className="w-3.5 h-3.5 text-brand" aria-hidden="true" />
                <span>{log.harvestedAtLabel}</span>
              </span>
            )}
            {log.verifiedByYouth && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-900">
                <UserCheck className="w-3.5 h-3.5 text-emerald-700" aria-hidden="true" />
                <span>{log.verifiedByYouth}</span>
              </span>
            )}
          </div>
        )}
      </section>

      <section aria-label="Các mốc chăm sóc, thu hoạch và đóng gói" className="space-y-3">
        {log.milestones.map((m, idx) => {
          const Icon = stageIcons[idx] || CheckCircle2;
          return (
            <article key={`${m.stage}-${idx}`} className="bg-surface border border-line rounded-2xl p-4 sm:p-5 flex gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-brand flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5" aria-hidden="true" />
              </div>
              <div className="space-y-1 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-base font-bold text-ink">{m.stage}</h2>
                  <span className="font-mono text-xs font-semibold text-brand tabular-nums">{m.date}</span>
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
        <section className="bg-surface border-2 border-blue-200 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="tabular-nums">
            <p className="text-xs text-muted">Giá tại vườn ({log.product.unit})</p>
            <p className="text-xl font-extrabold text-ink">{formatVnd(log.product.priceVnd)}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleAddFromLog}
              className="min-h-[46px] px-4 rounded-xl border border-brand bg-blue-50 text-brand text-sm font-bold inline-flex items-center gap-2"
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
              className="min-h-[46px] px-5 rounded-xl bg-brand hover:bg-brand-hover text-white text-sm font-bold inline-flex items-center gap-2"
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
// MÀN 4: GIỎ HÀNG & ĐẶT HÀNG TÁCH THEO TỪNG NHÀ VƯỜN (GIỮ GIỎ KHI LỖI + GỬI 1 PHẦN)
// =========================================================================
export function CartCheckoutPage({ session, onOpenSellerOrder }) {
  const navigate = useNavigate();
  const [cart, setCart] = useState(() => loadCart());
  const [deliveryByProducer, setDeliveryByProducer] = useState({});
  const [groupDropPoint, setGroupDropPoint] = useState('Điểm nhận chung cụm dân cư TP. Biên Hòa (Minh họa)');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [note, setNote] = useState('');
  const [reviewStep, setReviewStep] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [checkoutResult, setCheckoutResult] = useState(null);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [activeReferral, setActiveReferral] = useState(() => getActiveReferral());
  const orderIdsRef = useRef({});
  const sendingOrder = useRef(false);

  const groups = groupCartByProducer(cart);

  function getMethod(producerId) {
    return deliveryByProducer[producerId] || 'delivery';
  }

  function setMethod(producerId, method) {
    setDeliveryByProducer((prev) => ({ ...prev, [producerId]: method }));
  }

  function syncQty(productId, nextQty) {
    const updated = updateCartQuantity(productId, nextQty);
    setCart(updated);
  }

  const needsDeliveryAddress = groups.some((g) => getMethod(g.producerId) === 'delivery');
  const usesGroupDrop = groups.some((g) => getMethod(g.producerId) === 'group_drop');

  const subtotalVnd = groups.reduce((sum, g) => sum + g.subtotalVnd, 0);
  const shippingFeeVnd = groups.reduce((sum, g) => sum + getShippingFeeForMethod(getMethod(g.producerId)), 0);
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
    if (needsDeliveryAddress && shippingAddress.trim().length < 6) {
      setErrorMsg('Vui lòng nhập địa chỉ giao hàng cụ thể cho nhà vườn đang chọn Giao tận nơi.');
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
      for (const g of groups) {
        if (!orderIdsRef.current[g.producerId]) {
          orderIdsRef.current[g.producerId] = globalThis.crypto?.randomUUID?.() || `ord-${Date.now()}-${g.producerId}`;
        }
      }
      const resolvedDelivery = {};
      for (const g of groups) {
        resolvedDelivery[g.producerId] = getMethod(g.producerId);
      }

      const result = await submitMultiGardenOrder({
        customerName,
        customerPhone,
        shippingAddress,
        note,
        deliveryByProducer: resolvedDelivery,
        groupDropPoint,
        orderIdsByProducer: orderIdsRef.current,
        useRealSupabase: session?.mode === 'supabase'
      });

      const remaining = loadCart();
      setCart(remaining);
      setActiveReferral(getActiveReferral());

      if (result.partial) {
        // Clear succeeded IDs so retrying only reuses failed garden IDs
        result.succeededOrders.forEach((o) => {
          delete orderIdsRef.current[o.producerId];
        });
        setCheckoutResult(result);
        setReviewStep(false);
        setErrorMsg(
          `Đã tạo thành công ${result.succeededOrders.length} đơn, còn ${result.failedGroups.length} nhà vườn gửi chưa thành công. Các món chưa gửi vẫn được giữ nguyên trong giỏ hàng.`
        );
      } else {
        orderIdsRef.current = {};
        setCheckoutResult(result);
        setReviewStep(false);
      }
    } catch (err) {
      // Keep cart untouched on error!
      setErrorMsg(err?.message || 'Không thể gửi đơn đặt hàng. Giỏ hàng vẫn được giữ nguyên để bạn thử lại.');
    } finally {
      sendingOrder.current = false;
      setPlacingOrder(false);
    }
  }

  function handleJumpToSeller(order) {
    if (typeof onOpenSellerOrder === 'function') {
      onOpenSellerOrder(order);
    } else {
      navigate(`/chu-co-so/don-hang?highlight=${encodeURIComponent(order.orderCode)}`);
    }
  }

  if (checkoutResult && !checkoutResult.partial) {
    const orders = checkoutResult.succeededOrders;
    return (
      <div className="max-w-2xl mx-auto bg-surface border-2 border-brand rounded-2xl p-6 sm:p-8 space-y-5 shadow-sm">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="w-10 h-10 text-brand shrink-0" aria-hidden="true" />
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-brand">
              Đặt hàng thành công · {orders.length} đơn theo từng nhà vườn
            </p>
            <h1 className="text-xl sm:text-2xl font-extrabold text-ink">
              {orders.length === 1
                ? `Mã đơn: ${orders[0].orderCode}`
                : `Đã tách thành ${orders.length} đơn riêng theo địa điểm`}
            </h1>
          </div>
        </div>

        <div className="space-y-3">
          {orders.map((ord) => (
            <div key={ord.id} className="p-4 rounded-xl bg-canvas border border-line space-y-2 text-sm tabular-nums">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-mono font-extrabold text-brand text-base">{ord.orderCode}</span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 border border-amber-300 text-amber-950">
                  Mới đặt — Chờ nhà vườn nhận
                </span>
              </div>
              <p className="font-bold text-ink">{ord.producerName}</p>
              <p className="text-xs sm:text-sm text-muted">
                <strong>Người đặt:</strong> {ord.customerName} ({ord.customerPhone})
              </p>
              <p className="text-xs sm:text-sm text-ink">
                <strong>Địa điểm / Cách nhận:</strong> {ord.deliveryLabel}
              </p>
              {ord.affiliateCode && (
                <p className="text-xs text-emerald-900 bg-emerald-50 border border-emerald-200 rounded-lg px-2.5 py-1.5">
                  Ghi nhận giới thiệu từ <strong>{ord.affiliateName}</strong> (Mã {ord.affiliateCode}) · Hoa hồng ước tính:{' '}
                  <strong>{formatVnd(ord.commissionVnd)}</strong>
                </p>
              )}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-line">
                <span>
                  Tổng dự kiến: <strong className="text-base text-brand">{formatVnd(ord.grossAmountVnd)}</strong>
                </span>
                <div className="flex flex-wrap gap-2">
                  <Link
                    to={`/tra-cuu-don?code=${encodeURIComponent(ord.orderCode)}`}
                    className="min-h-[44px] px-3.5 rounded-xl border border-brand bg-white hover:bg-blue-50 text-brand text-xs sm:text-sm font-bold inline-flex items-center gap-1.5"
                  >
                    <PackageSearch className="w-4 h-4" aria-hidden="true" />
                    <span>Tra cứu đơn</span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleJumpToSeller(ord)}
                    className="min-h-[44px] px-3.5 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs sm:text-sm font-bold inline-flex items-center gap-1.5"
                  >
                    <Store className="w-4 h-4" aria-hidden="true" />
                    <span>Mở đơn với vai Nhà vườn</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs text-muted">
          Thanh toán trực tiếp khi nhận hàng hoặc khi ghé vườn — không thu cọc và không thanh toán trực tuyến thật. Nhà vườn sẽ liên hệ xác nhận thời gian giao/nhận phù hợp.
        </p>

        <div className="flex flex-wrap gap-2">
          <Link
            to="/gian-hang/nha-vuon-ba-tu"
            className="min-h-[46px] px-4 rounded-xl border border-line bg-canvas text-sm font-semibold text-ink inline-flex items-center"
          >
            Quay lại Nhà vườn Ba Tư
          </Link>
          <Link
            to="/"
            className="min-h-[46px] px-4 rounded-xl border border-line bg-canvas text-sm font-semibold text-ink inline-flex items-center"
          >
            Tiếp tục xem Chợ OCOP
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <section className="bg-surface border border-line rounded-2xl p-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-brand">Màn 4 · Giỏ hàng &amp; Đặt hàng</p>
          <h1 className="text-xl sm:text-2xl font-extrabold text-ink">Giỏ hàng nông sản Đồng Nai</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/tra-cuu-don"
            className="min-h-[44px] px-3.5 rounded-xl border border-line bg-canvas text-sm font-semibold text-ink inline-flex items-center gap-1.5"
          >
            <PackageSearch className="w-4 h-4 text-brand" aria-hidden="true" />
            <span>Tra cứu đơn đã đặt</span>
          </Link>
          <Link
            to="/gian-hang/nha-vuon-ba-tu"
            className="min-h-[44px] px-4 rounded-xl border border-line bg-canvas text-sm font-semibold text-ink inline-flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            <span>Chọn thêm sản phẩm</span>
          </Link>
        </div>
      </section>

      {/* Partial submission notice if some garden succeeded and another failed */}
      {checkoutResult?.partial && (
        <section className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-5 space-y-3" role="status">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-800 shrink-0 mt-0.5" aria-hidden="true" />
            <div className="space-y-1 text-sm text-amber-950">
              <p className="font-bold">Đã gửi thành công một phần giỏ hàng</p>
              <p>
                Các đơn đã tạo thành công:{' '}
                {checkoutResult.succeededOrders.map((o) => (
                  <span key={o.id} className="font-mono font-bold mr-2">
                    {o.orderCode} ({o.producerName})
                  </span>
                ))}
              </p>
              <p>
                Nhà vườn chưa gửi được đã được giữ nguyên bên dưới để bạn kiểm tra và thử gửi lại mà không mất giỏ hàng.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Youth Referral Attribution Banner */}
      {activeReferral && (
        <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-2 text-sm text-emerald-950">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-emerald-700 shrink-0" aria-hidden="true" />
            <span>
              Đang áp dụng link giới thiệu của <strong>{activeReferral.affiliateName}</strong> (Mã{' '}
              <span className="font-mono font-bold">{activeReferral.code}</span>) — đơn đặt sẽ tự ghi nhận đối soát hoa hồng ước tính.
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              clearActiveReferral();
              setActiveReferral(null);
            }}
            className="min-h-[40px] px-3 rounded-xl border border-emerald-300 bg-white text-xs font-semibold text-emerald-900"
          >
            Bỏ mã giới thiệu
          </button>
        </div>
      )}

      {cart.length === 0 ? (
        <section className="bg-surface border border-line rounded-2xl p-8 text-center space-y-4">
          <ShoppingCart className="w-12 h-12 text-muted mx-auto" aria-hidden="true" />
          <h2 className="text-lg font-bold text-ink">Giỏ hàng của bạn đang trống</h2>
          <p className="text-sm text-muted max-w-md mx-auto">
            Hãy chọn chôm chôm, sầu riêng hoặc măng cụt từ Nhà vườn Ba Tư (38.000–120.000 ₫/kg) hoặc thêm sản phẩm từ 2 nhà vườn để thử tính năng tách đơn theo địa điểm.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Link
              to="/gian-hang/nha-vuon-ba-tu"
              className="min-h-[46px] px-5 rounded-xl bg-brand hover:bg-brand-hover text-white text-sm font-bold inline-flex items-center gap-2"
            >
              <span>Xem 5 sản phẩm Nhà vườn Ba Tư</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
            <Link
              to="/"
              className="min-h-[46px] px-5 rounded-xl border border-line bg-canvas text-sm font-semibold text-ink inline-flex items-center"
            >
              Xem toàn bộ Chợ OCOP
            </Link>
          </div>
        </section>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left: Grouped by Producer so Multi-Garden Cart NEVER mixes pickup locations */}
          <section className="lg:col-span-7 space-y-4">
            {groups.length > 1 && (
              <div className="bg-blue-50 border border-blue-300 rounded-2xl p-4 text-sm text-blue-950 font-medium">
                Giỏ hàng đang có sản phẩm từ <strong>{groups.length} nhà vườn khác nhau</strong>. Hệ thống tự tách rõ từng địa điểm &amp; đơn hàng riêng để bạn chọn cách nhận chính xác cho từng nhà vườn.
              </div>
            )}

            {groups.map((group, idx) => {
              const method = getMethod(group.producerId);
              const fee = getShippingFeeForMethod(method);
              return (
                <div key={group.producerId} className="bg-surface border border-line rounded-2xl overflow-hidden">
                  <div className="p-4 bg-canvas border-b border-line flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-brand">
                        Đơn nhà vườn #{idx + 1} · {group.producer.area}
                      </p>
                      <h2 className="text-base font-extrabold text-ink">{group.producer.businessName}</h2>
                    </div>
                    <span className="text-xs font-semibold text-muted tabular-nums">
                      Tạm tính: <strong className="text-ink">{formatVnd(group.subtotalVnd)}</strong>
                    </span>
                  </div>

                  {/* Items inside this garden */}
                  <div className="divide-y divide-line">
                    {group.items.map((item) => (
                      <article key={item.productId} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={item.imageUrl}
                            alt={item.title}
                            className="w-20 h-16 rounded-xl object-cover border border-line shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="font-mono text-xs text-muted">{item.sku}</p>
                            <h3 className="text-sm sm:text-base font-bold text-ink line-clamp-2">{item.title}</h3>
                            <p className="text-sm font-bold text-brand tabular-nums mt-0.5">
                              {formatVnd(item.priceVnd)} / {item.unit}
                            </p>
                            {item.preorder && (
                              <span className="inline-block mt-1 px-2 py-0.5 rounded bg-blue-50 border border-blue-200 text-[11px] font-semibold text-brand">
                                Đặt trước đợt thu hoạch (minh họa · không thu cọc)
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0 tabular-nums">
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
                          <div className="text-right min-w-[92px]">
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
                  </div>

                  {/* Per-Garden Delivery Method Selector */}
                  <div className="p-4 bg-blue-50/40 border-t border-line space-y-2.5">
                    <p className="text-xs font-bold text-ink">
                      Chọn cách nhận riêng cho {group.producer.businessName.split('—')[0].trim()}:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setMethod(group.producerId, 'delivery')}
                        className={`min-h-[52px] p-3 rounded-xl border text-left transition ${
                          method === 'delivery'
                            ? 'bg-blue-50 border-brand ring-1 ring-brand text-ink'
                            : 'bg-white border-line text-muted hover:border-brand'
                        }`}
                      >
                        <span className="flex items-center gap-1.5 text-sm font-bold text-ink">
                          <Truck className="w-4 h-4 text-brand shrink-0" aria-hidden="true" />
                          <span>Giao tận nơi</span>
                        </span>
                        <span className="block text-xs mt-0.5 tabular-nums">Phí dự kiến: 25.000 ₫</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setMethod(group.producerId, 'pickup')}
                        className={`min-h-[52px] p-3 rounded-xl border text-left transition ${
                          method === 'pickup'
                            ? 'bg-blue-50 border-brand ring-1 ring-brand text-ink'
                            : 'bg-white border-line text-muted hover:border-brand'
                        }`}
                      >
                        <span className="flex items-center gap-1.5 text-sm font-bold text-ink">
                          <MapPin className="w-4 h-4 text-brand shrink-0" aria-hidden="true" />
                          <span>Nhận tại cơ sở</span>
                        </span>
                        <span className="block text-xs mt-0.5 tabular-nums">0 ₫ · Đúng địa điểm vườn</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setMethod(group.producerId, 'group_drop')}
                        className={`min-h-[52px] p-3 rounded-xl border text-left transition ${
                          method === 'group_drop'
                            ? 'bg-blue-50 border-brand ring-1 ring-brand text-ink'
                            : 'bg-white border-line text-muted hover:border-brand'
                        }`}
                      >
                        <span className="flex items-center gap-1.5 text-sm font-bold text-ink">
                          <Users className="w-4 h-4 text-brand shrink-0" aria-hidden="true" />
                          <span>Gom chuyến (mẫu)</span>
                        </span>
                        <span className="block text-xs mt-0.5 tabular-nums">15.000 ₫ · Điểm chung</span>
                      </button>
                    </div>

                    {method === 'pickup' && (
                      <p className="text-xs bg-white border border-blue-200 rounded-xl p-2.5 text-ink">
                        <strong>Điểm hẹn nhận hàng chính xác:</strong> {group.producer.pickupPoint}
                        {group.producer.pickupHours ? ` (${group.producer.pickupHours})` : ''}.
                      </p>
                    )}
                    {method === 'group_drop' && (
                      <p className="text-xs bg-white border border-blue-200 rounded-xl p-2.5 text-muted">
                        <strong>Gom chuyến minh họa:</strong> Giảm chi phí vận chuyển bằng cách nhận tại điểm chung. Nhà vườn sẽ liên hệ thông báo khung giờ nhận (không cam kết thời gian giao cố định).
                      </p>
                    )}
                    <div className="flex justify-between text-xs font-semibold text-muted pt-1 tabular-nums">
                      <span>Phí vận chuyển cho đơn nhà vườn #{idx + 1}</span>
                      <span className="text-ink">{formatVnd(fee)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </section>

          {/* Right: Customer Info + Summary + Review & Confirm */}
          <section className="lg:col-span-5 bg-surface border border-line rounded-2xl p-5 space-y-4 h-fit">
            <h2 className="text-lg font-bold text-ink">Thông tin người nhận &amp; Tóm tắt đơn</h2>

            {errorMsg && (
              <p className="text-sm text-rose-900 bg-rose-50 border border-rose-300 rounded-xl p-3 font-medium" role="alert">
                {errorMsg}
              </p>
            )}

            {!reviewStep ? (
              <form onSubmit={handleValidateAndReview} className="space-y-3.5" noValidate>
                <div>
                  <label htmlFor="ck-name" className="ocop-label">
                    Họ tên người nhận
                  </label>
                  <input
                    id="ck-name"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="VD: Nguyễn Minh Tâm"
                    className="ocop-field"
                  />
                </div>

                <div>
                  <label htmlFor="ck-phone" className="ocop-label">
                    Số điện thoại liên hệ
                  </label>
                  <input
                    id="ck-phone"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="VD: 0901234567"
                    className="ocop-field tabular-nums"
                  />
                </div>

                {needsDeliveryAddress && (
                  <div>
                    <label htmlFor="ck-addr" className="ocop-label">
                      Địa chỉ giao tận nơi
                    </label>
                    <input
                      id="ck-addr"
                      required
                      value={shippingAddress}
                      onChange={(e) => setShippingAddress(e.target.value)}
                      placeholder="Số nhà, đường, phường/xã, TP/Huyện..."
                      className="ocop-field"
                    />
                  </div>
                )}

                {usesGroupDrop && (
                  <div>
                    <label htmlFor="ck-group-drop" className="ocop-label">
                      Điểm nhận gom chuyến minh họa
                    </label>
                    <select
                      id="ck-group-drop"
                      value={groupDropPoint}
                      onChange={(e) => setGroupDropPoint(e.target.value)}
                      className="ocop-field"
                    >
                      <option value="Điểm nhận chung cụm dân cư TP. Biên Hòa (Minh họa)">
                        Cụm dân cư TP. Biên Hòa (Minh họa)
                      </option>
                      <option value="Điểm nhận chung khu vực TP. Thủ Đức (Minh họa)">
                        Khu vực TP. Thủ Đức (Minh họa)
                      </option>
                      <option value="Điểm nhận chung trung tâm TP. Long Khánh (Minh họa)">
                        Trung tâm TP. Long Khánh (Minh họa)
                      </option>
                    </select>
                  </div>
                )}

                <div>
                  <label htmlFor="ck-note" className="ocop-label">
                    Ghi chú cho nhà vườn (tùy chọn)
                  </label>
                  <input
                    id="ck-note"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="VD: Chọn trái chín vừa để biếu gia đình..."
                    className="ocop-field"
                  />
                </div>

                {/* Clear Summary by Garden */}
                <div className="p-4 rounded-xl bg-canvas border border-line space-y-2 text-sm tabular-nums">
                  <p className="text-xs font-bold uppercase tracking-wider text-brand">
                    Tóm tắt theo từng nhà vườn ({groups.length} đơn)
                  </p>
                  {groups.map((g) => {
                    const m = getMethod(g.producerId);
                    const f = getShippingFeeForMethod(m);
                    return (
                      <div key={g.producerId} className="text-xs border-b border-line pb-2 space-y-0.5">
                        <div className="flex justify-between font-bold text-ink">
                          <span className="truncate pr-2">{g.producer.businessName.split('—')[0].trim()}</span>
                          <span>{formatVnd(g.subtotalVnd + f)}</span>
                        </div>
                        <p className="text-muted">
                          {m === 'pickup'
                            ? `Nhận tại: ${g.producer.pickupPoint} (0 ₫)`
                            : m === 'group_drop'
                              ? `Gom chuyến: ${groupDropPoint} (${formatVnd(f)})`
                              : `Giao tận nơi (${formatVnd(f)})`}
                        </p>
                      </div>
                    );
                  })}
                  <div className="flex justify-between text-muted">
                    <span>Tổng tiền hàng</span>
                    <span>{formatVnd(subtotalVnd)}</span>
                  </div>
                  <div className="flex justify-between text-muted">
                    <span>Tổng phí giao / gom chuyến</span>
                    <span>{formatVnd(shippingFeeVnd)}</span>
                  </div>
                  <div className="flex justify-between text-base font-extrabold text-ink pt-1.5 border-t border-line">
                    <span>Tổng dự kiến</span>
                    <span className="text-brand">{formatVnd(totalVnd)}</span>
                  </div>
                </div>

                <p className="text-xs text-muted">
                  Thanh toán trực tiếp khi nhận hàng hoặc tại vườn. Không thu cọc, không thanh toán trực tuyến và không cam kết khung giờ giao cố định.
                </p>

                <button
                  type="submit"
                  className="w-full min-h-[48px] px-5 rounded-xl bg-brand hover:bg-brand-hover text-white text-sm sm:text-base font-bold shadow-sm"
                >
                  Xem lại {groups.length > 1 ? `${groups.length} đơn hàng` : 'đơn hàng'}
                </button>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-canvas border border-line space-y-2.5 text-sm tabular-nums">
                  <p className="font-bold text-ink">Kiểm tra chính xác địa điểm &amp; phí trước khi gửi:</p>
                  <p>
                    Người nhận: <strong>{customerName}</strong> · {customerPhone}
                  </p>
                  <div className="space-y-2 pt-1">
                    {groups.map((g, i) => {
                      const m = getMethod(g.producerId);
                      const f = getShippingFeeForMethod(m);
                      return (
                        <div key={g.producerId} className="p-2.5 rounded-lg bg-white border border-line text-xs space-y-1">
                          <p className="font-bold text-ink">
                            Đơn #{i + 1}: {g.producer.businessName}
                          </p>
                          <p className="text-brand font-semibold">
                            {m === 'pickup'
                              ? `Nhận tại cơ sở: ${g.producer.pickupPoint} (0 ₫)`
                              : m === 'group_drop'
                                ? `Gom chuyến minh họa tại ${groupDropPoint} (${formatVnd(f)})`
                                : `Giao tận nơi tới ${shippingAddress} (${formatVnd(f)})`}
                          </p>
                          <p className="text-muted">
                            Tiền hàng {formatVnd(g.subtotalVnd)} + Phí {formatVnd(f)} ={' '}
                            <strong className="text-ink">{formatVnd(g.subtotalVnd + f)}</strong>
                          </p>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-base font-extrabold text-brand pt-1">
                    Tổng cộng dự kiến: {formatVnd(totalVnd)}
                  </p>
                  <p className="text-xs text-muted">
                    Thanh toán khi nhận hàng hoặc khi ghé vườn (không thu cọc online). Nhà vườn sẽ liên hệ xác nhận.
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      orderIdsRef.current = {};
                      setReviewStep(false);
                    }}
                    disabled={placingOrder}
                    className="min-h-[48px] px-4 rounded-xl border border-line bg-canvas text-sm font-semibold text-ink"
                  >
                    Sửa lại
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmPlaceOrder}
                    disabled={placingOrder}
                    className="flex-1 min-h-[48px] px-5 rounded-xl bg-brand hover:bg-brand-hover text-white text-sm sm:text-base font-bold"
                  >
                    {placingOrder
                      ? 'Đang gửi đơn…'
                      : `Xác nhận đặt ${groups.length > 1 ? `${groups.length} đơn` : 'đơn hàng'}`}
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
// MÀN 6: LỊCH LIVESTREAM + KHUNG XEM THỬ GẮN GIỎ + TẢI NHẮC LỊCH .ICS
// =========================================================================
export function LivestreamSchedulePage() {
  const [schedules, setSchedules] = useState(() => fetchLivestreamSchedule());
  const [catalogProducts, setCatalogProducts] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [supporterFilter, setSupporterFilter] = useState('all');
  const [formOpen, setFormOpen] = useState(false);
  const [activePreview, setActivePreview] = useState(null);
  const [addedLiveSku, setAddedLiveSku] = useState('');

  const [dateLabel, setDateLabel] = useState('Chủ Nhật · 06/12/2026');
  const [timeRange, setTimeRange] = useState('19:30 – 20:30');
  const [supporterName, setSupporterName] = useState('Đoàn viên Minh Anh (Đoàn phường Xuân An)');
  const [productSummary, setProductSummary] = useState('Chôm chôm nhãn & Sầu riêng Ri6 vườn Ba Tư');
  const [channelLabel, setChannelLabel] = useState('Khung xem thử Chợ OCOP (Minh họa)');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    fetchPublicCatalog({ pageSize: 50 }).then((res) => setCatalogProducts(res.items || []));
  }, []);

  useEffect(() => {
    if (!activePreview) return undefined;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setActivePreview(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activePreview]);

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
    setNotice('Đã thêm lịch livestream mới cho tổ thanh niên hỗ trợ (đã lưu trên thiết bị).');
  }

  function handleDownloadIcs(session) {
    downloadLivestreamIcs(session);
    setNotice(`Đã tải tệp nhắc lịch (.ics) cho phiên "${session.productSummary}".`);
  }

  function getPinnedProducts(session) {
    if (!session?.productSkus?.length) return catalogProducts.slice(0, 2);
    const matched = catalogProducts.filter((p) => session.productSkus.includes(p.sku));
    return matched.length > 0 ? matched : catalogProducts.slice(0, 2);
  }

  function handleAddPinnedToCart(product) {
    addToCart(product, 1);
    setAddedLiveSku(product.sku);
    setNotice(`Đã thêm ${product.title} từ khung xem thử livestream vào giỏ hàng!`);
    setTimeout(() => setAddedLiveSku(''), 2000);
  }

  return (
    <div className="space-y-5">
      <section className="bg-surface border border-line rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-bold uppercase tracking-wider text-brand">
              Màn 6 · Lịch livestream thanh niên hỗ trợ
            </p>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-brand border border-blue-200">
              Lịch minh họa · Có khung xem thử gắn giỏ &amp; tải .ics
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-ink">
            Lịch đồng hành livestream tại Nhà vườn Ba Tư
          </h1>
          <p className="text-sm text-muted">
            2 đoàn viên phụ trách quay dựng tại vườn 2,5 ha Long Khánh. Khách có thể mở khung xem thử để thêm sản phẩm ghim vào giỏ hoặc tải tệp nhắc lịch .ics.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setFormOpen((v) => !v)}
          className="min-h-[46px] px-4 rounded-xl bg-brand hover:bg-brand-hover text-white text-sm font-bold inline-flex items-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          <span>{formOpen ? 'Đóng biểu mẫu' : 'Tạo lịch livestream mới'}</span>
        </button>
      </section>

      {notice && (
        <p className="text-sm font-semibold bg-blue-50 border border-blue-200 text-blue-950 rounded-xl p-3.5" role="status">
          {notice}
        </p>
      )}

      {formOpen && (
        <form onSubmit={handleAddDemoSchedule} className="bg-surface border-2 border-blue-200 rounded-2xl p-5 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label htmlFor="ls-date" className="ocop-label">Ngày phát dự kiến</label>
            <input id="ls-date" required value={dateLabel} onChange={(e) => setDateLabel(e.target.value)} className="ocop-field" />
          </div>
          <div>
            <label htmlFor="ls-time" className="ocop-label">Khung giờ</label>
            <input id="ls-time" required value={timeRange} onChange={(e) => setTimeRange(e.target.value)} className="ocop-field tabular-nums" />
          </div>
          <div>
            <label htmlFor="ls-sup" className="ocop-label">Đoàn viên hỗ trợ</label>
            <select id="ls-sup" value={supporterName} onChange={(e) => setSupporterName(e.target.value)} className="ocop-field">
              <option value="Đoàn viên Minh Anh (Đoàn phường Xuân An)">Đoàn viên Minh Anh (Đoàn phường Xuân An)</option>
              <option value="Đoàn viên Hoàng Phúc (Đoàn trường CĐ Đồng Nai)">Đoàn viên Hoàng Phúc (Đoàn trường CĐ Đồng Nai)</option>
            </select>
          </div>
          <div>
            <label htmlFor="ls-ch" className="ocop-label">Kênh phát dự kiến</label>
            <input id="ls-ch" required value={channelLabel} onChange={(e) => setChannelLabel(e.target.value)} className="ocop-field" />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="ls-prod" className="ocop-label">Sản phẩm dự kiến giới thiệu</label>
            <input id="ls-prod" required value={productSummary} onChange={(e) => setProductSummary(e.target.value)} className="ocop-field" />
          </div>
          <div className="sm:col-span-2 flex justify-end gap-2">
            <button type="button" onClick={() => setFormOpen(false)} className="ocop-secondary">Hủy</button>
            <button type="submit" className="ocop-primary">Lưu lịch livestream</button>
          </div>
        </form>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <select
          aria-label="Lọc trạng thái livestream"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="min-h-[44px] px-3 rounded-xl border border-line bg-surface text-sm font-medium"
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
          className="min-h-[44px] px-3 rounded-xl border border-line bg-surface text-sm font-medium"
        >
          <option value="all">Cả 2 đoàn viên hỗ trợ</option>
          <option value="Minh Anh">Đoàn viên Minh Anh</option>
          <option value="Hoàng Phúc">Đoàn viên Hoàng Phúc</option>
        </select>
      </div>

      {/* Schedule cards */}
      {filtered.length === 0 ? (
        <div className="bg-surface border border-line rounded-2xl p-8 text-center text-sm text-muted">
          Không có phiên livestream nào khớp bộ lọc hiện tại.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((item) => {
            const badge =
              item.status === 'upcoming'
                ? { label: 'Sắp diễn ra', cls: 'bg-blue-50 text-brand border-blue-300' }
                : item.status === 'preparing'
                  ? { label: 'Đang chuẩn bị', cls: 'bg-amber-50 text-amber-950 border-amber-300' }
                  : { label: 'Đã chạy thử', cls: 'bg-slate-100 text-slate-700 border-slate-300' };
            return (
              <article key={item.id} className="bg-surface border border-line rounded-2xl p-5 space-y-3.5 flex flex-col justify-between">
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

                  <div className="text-xs sm:text-sm text-muted space-y-1">
                    <p className="flex items-center gap-1.5 text-ink font-semibold">
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

                <div className="pt-3 border-t border-line flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setActivePreview(item)}
                    className="flex-1 min-h-[44px] px-3.5 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-1.5"
                  >
                    <PlayCircle className="w-4 h-4" aria-hidden="true" />
                    <span>Khung xem thử &amp; Giỏ ghim</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownloadIcs(item)}
                    className="min-h-[44px] px-3.5 rounded-xl border border-brand bg-blue-50 hover:bg-blue-100 text-brand text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-1.5"
                  >
                    <CalendarPlus className="w-4 h-4" aria-hidden="true" />
                    <span>Thêm nhắc lịch (.ics)</span>
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Interactive Vertical Livestream Preview Modal with Pinned Products -> Add to Cart */}
      {activePreview && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="live-preview-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setActivePreview(null);
          }}
        >
          <div className="w-full max-w-3xl bg-white rounded-3xl overflow-hidden shadow-2xl border border-line grid grid-cols-1 md:grid-cols-12">
            {/* Left: Simulated Vertical Live Stage */}
            <div className="md:col-span-6 relative bg-slate-950 text-white min-h-[340px] flex flex-col justify-between p-4">
              <img
                src={orchardPhoto}
                alt="Khung xem thử trực tiếp tại Nhà vườn Ba Tư"
                className="absolute inset-0 w-full h-full object-cover opacity-55"
              />
              <div className="relative z-10 flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-600 text-white text-xs font-bold">
                  <Radio className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>XEM THỬ MÔ PHỎNG</span>
                </span>
                <span className="px-2.5 py-1 rounded-full bg-black/55 text-xs font-semibold tabular-nums">
                  {activePreview.viewerCountDemo || 96} người đang xem (mẫu)
                </span>
              </div>

              <div className="relative z-10 space-y-2 mt-auto pt-24">
                <p className="text-xs font-bold text-blue-200">{activePreview.supporterName}</p>
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {(activePreview.sampleComments || []).map((c, idx) => (
                    <div key={idx} className="rounded-xl bg-black/55 backdrop-blur px-3 py-1.5 text-xs">
                      <span className="font-bold text-blue-200">{c.author}: </span>
                      <span>{c.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Pinned Products -> Add to Cart */}
            <div className="md:col-span-6 p-5 flex flex-col justify-between gap-4">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-brand">
                      Giỏ hàng ghim trong phiên
                    </p>
                    <h2 id="live-preview-title" className="text-lg font-extrabold text-ink leading-snug">
                      {activePreview.productSummary}
                    </h2>
                    <p className="text-xs text-muted mt-0.5">
                      {activePreview.dateLabel} · {activePreview.timeRange}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActivePreview(null)}
                    aria-label="Đóng khung xem thử livestream"
                    className="h-11 w-11 shrink-0 rounded-xl border border-line bg-canvas grid place-items-center text-ink hover:border-brand"
                  >
                    <X className="w-5 h-5" aria-hidden="true" />
                  </button>
                </div>

                <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                  {getPinnedProducts(activePreview).map((prod) => (
                    <div key={prod.id} className="p-3 rounded-xl bg-canvas border border-line flex items-center gap-3">
                      <img
                        src={prod.imageUrl}
                        alt={prod.title}
                        className="w-16 h-16 rounded-xl object-cover border border-line shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-ink line-clamp-2">{prod.title}</p>
                        <p className="text-sm font-extrabold text-brand tabular-nums mt-0.5">
                          {formatVnd(prod.priceVnd)}{' '}
                          <span className="text-xs font-normal text-muted">/ {prod.unit} · Còn {prod.stock}</span>
                        </p>
                        <button
                          type="button"
                          onClick={() => handleAddPinnedToCart(prod)}
                          className="mt-2 min-h-[40px] px-3 rounded-lg bg-brand hover:bg-brand-hover text-white text-xs font-bold inline-flex items-center gap-1.5"
                        >
                          <ShoppingCart className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>{addedLiveSku === prod.sku ? 'Đã thêm vào giỏ!' : 'Thêm vào giỏ ngay'}</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-3 border-t border-line">
                <Link
                  to="/gio-hang"
                  onClick={() => setActivePreview(null)}
                  className="flex-1 min-h-[46px] px-4 rounded-xl bg-brand hover:bg-brand-hover text-white text-sm font-bold inline-flex items-center justify-center gap-2"
                >
                  <ShoppingCart className="w-4 h-4" aria-hidden="true" />
                  <span>Đi tới Giỏ hàng</span>
                </Link>
                <button
                  type="button"
                  onClick={() => handleDownloadIcs(activePreview)}
                  className="min-h-[46px] px-3.5 rounded-xl border border-line bg-canvas text-sm font-semibold text-ink inline-flex items-center gap-1.5"
                >
                  <CalendarPlus className="w-4 h-4 text-brand" aria-hidden="true" />
                  <span>Tải .ics</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
