// Client helper for Bonus A: Agricultural photo -> Vietnamese description via Vercel /api/ai-describe.
// Never contains or reads GEMINI_API_KEY in browser code.

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_UPLOAD_BYTES = 3.5 * 1024 * 1024;

export function buildTemplateDescriptionSuggestion({
  productHint = '',
  areaHint = 'Long Khánh, Đồng Nai',
  producerHint = 'Nhà vườn Ba Tư'
} = {}) {
  const cleanTitle = String(productHint || '').trim();
  const normalized = cleanTitle.toLowerCase();

  let fruitProfile = {
    title: cleanTitle || 'Trái cây tươi hái tại vườn Long Khánh (1 kg)',
    spec: 'Trái tươi chọn lọc tại vườn, vỏ sáng đều màu, đóng rổ/thùng thoáng khí.',
    description: `${cleanTitle || 'Nông sản tươi'} được thu hoạch trực tiếp tại ${producerHint} (${areaHint}), chọn trái chín tự nhiên theo đợt. Khách có thể quét mã QR để xem rõ nhật ký chăm sóc, thu hoạch và chọn giao tận nơi hoặc ghé nhận trực tiếp tại vườn.`,
    highlights: [
      'Thu hoạch trực tiếp từ nhà vườn Đồng Nai',
      'Có mã QR xem nhật ký chăm sóc, thu hoạch và đóng gói',
      'Hỗ trợ ghé nhận tại vườn hoặc đặt giao (nhà vườn liên hệ xác nhận)'
    ]
  };

  if (normalized.includes('sầu riêng') || normalized.includes('sau rieng') || normalized.includes('ri6') || normalized.includes('monthong')) {
    fruitProfile = {
      title: cleanTitle || 'Sầu riêng cắt già vườn Ba Tư Long Khánh (1 kg)',
      spec: 'Cơm vàng béo mịn, cắt già tự nhiên trên cây, cân thực tế tại vườn.',
      description: `${cleanTitle || 'Sầu riêng vườn Ba Tư'} trồng trên đất đỏ ${areaHint}, cắt trái đủ tuổi tự nhiên nên mùi thơm dịu, cơm vàng dẻo không sượng. Kèm mã QR theo dõi nhật ký tỉa trái, thu hoạch và đóng gói minh bạch.`,
      highlights: [
        'Cắt trái đủ tuổi trên cây, không ép chín hóa chất',
        'Cân rõ trọng lượng tại vườn, hỗ trợ nguyên trái hoặc tách múi',
        'Minh bạch nhật ký lô qua mã QR truy xuất'
      ]
    };
  } else if (normalized.includes('chôm chôm') || normalized.includes('chom chom')) {
    fruitProfile = {
      title: cleanTitle || 'Chôm chôm chín đỏ hái sáng vườn Ba Tư (1 kg)',
      spec: 'Trái tròn đều, râu còn xanh tươi, thịt giòn ngọt thanh tróc hạt.',
      description: `${cleanTitle || 'Chôm chôm Long Khánh'} được hái thủ công vào sáng sớm tại ${producerHint} (${areaHint}) khi trái đạt độ chín đỏ tự nhiên. Thịt trái dày giòn, ngọt thanh ráo nước, đóng gói thoáng khí kèm tem QR truy xuất nhật ký mùa vụ.`,
      highlights: [
        'Hái sáng sớm giữ nguyên chùm cuống xanh tươi',
        'Giòn ngọt thanh, dễ tróc hạt',
        'Kèm mã QR xem nhật ký chăm sóc và ngày thu hoạch'
      ]
    };
  } else if (normalized.includes('măng cụt') || normalized.includes('mang cut')) {
    fruitProfile = {
      title: cleanTitle || 'Măng cụt xen canh vườn Ba Tư Long Khánh (1 kg)',
      spec: 'Trái vừa đều 7–9 trái/kg, hái vợt vải hạn chế dập mủ, múi trắng mọng.',
      description: `${cleanTitle || 'Măng cụt vườn Ba Tư'} trồng xen canh dưới tán vườn ${areaHint}, thu hái cẩn thận bằng vợt vải để giữ vỏ nguyên vẹn. Múi trắng mịn, vị chua ngọt hài hòa, có nhật ký mùa vụ QR kiểm tra dễ dàng.`,
      highlights: [
        'Hái vợt vải tránh rơi dập vỏ',
        'Vị chua ngọt cân bằng, múi trắng mọng nước',
        'Truy xuất rõ lô thu hoạch bằng mã QR'
      ]
    };
  }

  return {
    source: 'template_fallback',
    model: 'local-template',
    suggestion: {
      titleSuggestion: fruitProfile.title,
      shortSpec: fruitProfile.spec,
      description: fruitProfile.description,
      highlights: fruitProfile.highlights
    }
  };
}

export async function dataUrlFromImageUrl(imageSrc) {
  if (!imageSrc) return '';
  if (imageSrc.startsWith('data:image/')) return imageSrc;
  const response = await fetch(imageSrc);
  const blob = await response.blob();
  if (!ALLOWED_MIME_TYPES.includes(blob.type)) {
    throw new Error('Ảnh cần định dạng JPG, PNG hoặc WebP.');
  }
  if (blob.size > MAX_UPLOAD_BYTES) {
    throw new Error('Ảnh vượt quá 3,5 MB.');
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Không đọc được dữ liệu ảnh.'));
    reader.readAsDataURL(blob);
  });
}

export async function requestAiProductDescription({
  imageDataUrl,
  productHint = '',
  areaHint = 'Long Khánh, Đồng Nai',
  producerHint = 'Nhà vườn Ba Tư',
  accessToken = ''
}) {
  if (!imageDataUrl) {
    throw new Error('Vui lòng chọn hoặc chụp ảnh nông sản trước khi gọi AI gợi ý mô tả.');
  }

  const isOffline = typeof navigator !== 'undefined' && navigator.onLine === false;
  const isFileProtocol = typeof window !== 'undefined' && window.location.protocol === 'file:';

  if (isOffline || isFileProtocol) {
    return {
      ok: false,
      code: isFileProtocol ? 'OFFLINE_PROTOTYPE' : 'OFFLINE',
      fallbackAvailable: true,
      message: isFileProtocol
        ? 'Bản prototype mở trực tiếp từ tệp cục bộ chưa kết nối máy chủ AI. Bấm "Dùng Gợi ý mẫu" hoặc chỉnh sửa trực tiếp.'
        : 'Thiết bị đang ngoại tuyến nên chưa gọi được AI Gemini Flash. Bấm "Dùng Gợi ý mẫu" hoặc nhập mô tả thủ công.'
    };
  }

  let preparedDataUrl = imageDataUrl;
  if (!preparedDataUrl.startsWith('data:image/')) {
    preparedDataUrl = await dataUrlFromImageUrl(preparedDataUrl);
  }

  const basePath = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');
  const endpoint = `${basePath}/api/ai-describe`;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-OCOP-Client': 'ocop-web',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
      },
      body: JSON.stringify({
        imageDataUrl: preparedDataUrl,
        productHint,
        areaHint,
        producerHint
      }),
      signal: AbortSignal.timeout(18000)
    });

    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.ok) {
      return {
        ok: false,
        status: response.status,
        code: data?.code || `HTTP_${response.status}`,
        model: data?.model || 'gemini-3.6-flash',
        fallbackAvailable: true,
        message:
          data?.message ||
          (response.status === 429
            ? 'Đã đạt giới hạn lượt gọi AI miễn phí. Vui lòng thử lại sau hoặc dùng Gợi ý mẫu.'
            : 'Chưa kết nối được máy chủ AI Gemini Flash. Bạn có thể bấm "Dùng Gợi ý mẫu" hoặc nhập tay.')
      };
    }

    return data;
  } catch (err) {
    const isTimeout = err?.name === 'TimeoutError' || err?.name === 'AbortError';
    return {
      ok: false,
      code: isTimeout ? 'CLIENT_TIMEOUT' : 'NETWORK_ERROR',
      fallbackAvailable: true,
      message: isTimeout
        ? 'Kết nối phân tích ảnh quá thời gian chờ. Bạn có thể thử lại hoặc dùng Gợi ý mẫu.'
        : 'Không gọi được endpoint AI trên máy chủ hiện tại. Bạn có thể dùng Gợi ý mẫu hoặc nhập tay.'
    };
  }
}
