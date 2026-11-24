// Vercel Node.js Function: POST /api/ai-describe
// Server-only Gemini Flash endpoint for Bonus A (agricultural image -> Vietnamese description).
// Never exposes GEMINI_API_KEY to browser code; enforces origin/client check, IP rate limit,
// MIME whitelist, size cap, timeout, and clean 429 / missing-key handling.

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_IMAGE_BYTES = 3.5 * 1024 * 1024; // 3.5 MB decoded image cap (under Vercel 4.5 MB body limit)
const MAX_REQUEST_CHARS = 5_200_000;
const DEFAULT_MODEL = 'gemini-3.6-flash';
const REQUEST_TIMEOUT_MS = 15_000;
const RATE_WINDOW_MS = 60_000;

const rateBuckets = new Map();

function getClientIp(request) {
  const xff = request.headers.get('x-forwarded-for') || '';
  const first = xff.split(',')[0]?.trim();
  return first || request.headers.get('x-real-ip') || 'unknown';
}

function checkRateLimit(ip, maxPerWindow) {
  const now = Date.now();
  // Prune stale buckets periodically
  if (rateBuckets.size > 500) {
    for (const [k, v] of rateBuckets.entries()) {
      if (now - v.windowStart > RATE_WINDOW_MS) rateBuckets.delete(k);
    }
  }
  const bucket = rateBuckets.get(ip);
  if (!bucket || now - bucket.windowStart > RATE_WINDOW_MS) {
    rateBuckets.set(ip, { count: 1, windowStart: now });
    return { allowed: true, retryAfterSec: 0 };
  }
  if (bucket.count >= maxPerWindow) {
    const retryAfterSec = Math.max(1, Math.ceil((RATE_WINDOW_MS - (now - bucket.windowStart)) / 1000));
    return { allowed: false, retryAfterSec };
  }
  bucket.count += 1;
  return { allowed: true, retryAfterSec: 0 };
}

function isAllowedOrigin(request, env) {
  const origin = request.headers.get('origin');
  if (!origin) {
    // Allow non-CORS same-origin or server-side test calls that provide X-OCOP-Client or Bearer token
    return Boolean(
      request.headers.get('x-ocop-client') === 'ocop-web' ||
      request.headers.get('authorization')?.startsWith('Bearer ')
    );
  }
  try {
    const parsedOrigin = new URL(origin);
    const reqUrl = new URL(request.url);
    if (parsedOrigin.origin === reqUrl.origin) return true;
    const hostHeader = request.headers.get('host');
    if (hostHeader && parsedOrigin.host === hostHeader) return true;
    if (/^(localhost|127\.0\.0\.1)(:\d+)?$/i.test(parsedOrigin.host)) return true;
    const configured = String(env.AI_ALLOWED_ORIGINS || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    return configured.includes(parsedOrigin.origin);
  } catch {
    return false;
  }
}

function jsonResponse(payload, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      ...extraHeaders
    }
  });
}

function parseImagePayload(body) {
  let mimeType = String(body?.mimeType || '').trim().toLowerCase();
  let base64Data = String(body?.imageBase64 || '').trim();

  if (typeof body?.imageDataUrl === 'string' && body.imageDataUrl.startsWith('data:')) {
    const match = body.imageDataUrl.match(/^data:([a-zA-Z0-9/+.-]+);base64,([A-Za-z0-9+/=\s]+)$/);
    if (!match) {
      return { error: 'Định dạng dữ liệu ảnh không hợp lệ.', status: 400 };
    }
    mimeType = match[1].toLowerCase();
    base64Data = match[2].replace(/\s+/g, '');
  } else if (base64Data) {
    base64Data = base64Data.replace(/\s+/g, '');
  }

  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    return {
      error: 'Chỉ chấp nhận ảnh định dạng JPG, PNG hoặc WebP.',
      status: 400
    };
  }
  if (!base64Data || !/^[A-Za-z0-9+/]+=*$/.test(base64Data)) {
    return { error: 'Thiếu dữ liệu ảnh hợp lệ để phân tích.', status: 400 };
  }

  const padding = base64Data.endsWith('==') ? 2 : base64Data.endsWith('=') ? 1 : 0;
  const decodedBytes = Math.floor((base64Data.length * 3) / 4) - padding;
  if (decodedBytes < 64) {
    return { error: 'Tệp ảnh quá nhỏ hoặc bị hỏng.', status: 400 };
  }
  if (decodedBytes > MAX_IMAGE_BYTES) {
    return { error: 'Ảnh vượt quá giới hạn 3,5 MB. Vui lòng chọn ảnh nhẹ hơn.', status: 413 };
  }

  return { mimeType, base64Data, decodedBytes };
}

function extractJsonObject(text) {
  const trimmed = String(text || '').trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1].trim() : trimmed;
  try {
    return JSON.parse(candidate);
  } catch {
    const start = candidate.indexOf('{');
    const end = candidate.lastIndexOf('}');
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(candidate.slice(start, end + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}

export async function handleAiDescribeRequest(request, { env = process.env, fetchImpl = fetch } = {}) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204 });
  }
  if (request.method !== 'POST') {
    return jsonResponse({ ok: false, code: 'METHOD_NOT_ALLOWED', message: 'Chỉ hỗ trợ phương thức POST.' }, 405);
  }

  if (!isAllowedOrigin(request, env)) {
    return jsonResponse(
      { ok: false, code: 'FORBIDDEN_ORIGIN', message: 'Yêu cầu không hợp lệ từ nguồn ngoài hệ thống.' },
      403
    );
  }

  const clientHeader = request.headers.get('x-ocop-client');
  const authHeader = request.headers.get('authorization');
  if (clientHeader !== 'ocop-web' && !authHeader?.startsWith('Bearer ')) {
    return jsonResponse(
      { ok: false, code: 'UNAUTHORIZED_CLIENT', message: 'Thiếu thông tin xác thực ứng dụng Chợ OCOP.' },
      401
    );
  }

  const maxPerMin = Math.max(1, Math.min(60, Number(env.AI_RATE_LIMIT_MAX) || 10));
  const ip = getClientIp(request);
  const rate = checkRateLimit(ip, maxPerMin);
  if (!rate.allowed) {
    return jsonResponse(
      {
        ok: false,
        code: 'RATE_LIMITED',
        fallbackAvailable: true,
        message: `Bạn đã gửi quá ${maxPerMin} lượt phân tích trong 1 phút. Vui lòng chờ ${rate.retryAfterSec} giây hoặc dùng Gợi ý mẫu.`
      },
      429,
      { 'Retry-After': String(rate.retryAfterSec) }
    );
  }

  const contentType = (request.headers.get('content-type') || '').toLowerCase();
  if (!contentType.includes('application/json')) {
    return jsonResponse(
      { ok: false, code: 'INVALID_CONTENT_TYPE', message: 'Yêu cầu cần định dạng application/json.' },
      400
    );
  }

  let rawBody = '';
  try {
    rawBody = await request.text();
  } catch {
    return jsonResponse({ ok: false, code: 'READ_ERROR', message: 'Không đọc được nội dung yêu cầu.' }, 400);
  }
  if (rawBody.length > MAX_REQUEST_CHARS) {
    return jsonResponse(
      { ok: false, code: 'PAYLOAD_TOO_LARGE', message: 'Dữ liệu gửi lên vượt giới hạn cho phép (3,5 MB).' },
      413
    );
  }

  let body;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return jsonResponse({ ok: false, code: 'INVALID_JSON', message: 'Dữ liệu JSON không hợp lệ.' }, 400);
  }

  const imageCheck = parseImagePayload(body);
  if (imageCheck.error) {
    return jsonResponse(
      { ok: false, code: 'INVALID_IMAGE', message: imageCheck.error },
      imageCheck.status
    );
  }

  const modelRaw = String(env.GEMINI_MODEL || DEFAULT_MODEL).trim();
  const model = /^[a-zA-Z0-9._-]+$/.test(modelRaw) ? modelRaw : DEFAULT_MODEL;
  const apiKey = String(env.GEMINI_API_KEY || '').trim();

  if (!apiKey) {
    return jsonResponse(
      {
        ok: false,
        code: 'AI_NOT_CONFIGURED',
        fallbackAvailable: true,
        model,
        message:
          'Máy chủ chưa cấu hình GEMINI_API_KEY (Free Tier). Bạn có thể bấm "Dùng Gợi ý mẫu" hoặc chỉnh sửa trực tiếp.'
      },
      503
    );
  }

  const productHint = String(body?.productHint || '').trim().slice(0, 120);
  const areaHint = String(body?.areaHint || 'Long Khánh, Đồng Nai').trim().slice(0, 80);
  const producerHint = String(body?.producerHint || 'Nhà vườn Ba Tư').trim().slice(0, 100);

  const promptText = [
    'Bạn là trợ lý viết mô tả bán nông sản bằng tiếng Việt dễ hiểu, chân thật cho nông dân Đồng Nai trên Chợ OCOP Thanh Niên.',
    'Hãy quan sát ảnh nông sản đính kèm và trả về DUY NHẤT một đối tượng JSON hợp lệ (không thêm chữ thừa ngoài JSON) với cấu trúc:',
    '{"titleSuggestion":"Tên ngắn gọn dễ hiểu có đơn vị (1 kg)","shortSpec":"1 câu ngắn về hình thức, độ chín hoặc quy cách","description":"2-3 câu mô tả chân thật, ấm áp, nhấn mạnh đặc điểm nhìn thấy trong ảnh và cách thưởng thức/bảo quản","highlights":["Ý nổi bật 1","Ý nổi bật 2","Ý nổi bật 3"]}',
    `Thông tin tham khảo từ chủ vườn: Tên gợi ý="${productHint || 'Chưa nhập'}", Nhà vườn="${producerHint}", Vùng="${areaHint}".`,
    'Quy tắc bắt buộc: Không bịa chứng nhận OCOP/VietGAP nếu ảnh không có; không cam kết thời gian giao hàng cụ thể; không yêu cầu đặt cọc hay thanh toán online; dùng tiếng Việt tự nhiên, gần gũi với khách mua.'
  ].join('\n');

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;

  try {
    const upstream = await fetchImpl(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              { text: promptText },
              {
                inline_data: {
                  mime_type: imageCheck.mimeType,
                  data: imageCheck.base64Data
                }
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 450,
          responseMimeType: 'application/json'
        }
      }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
    });

    if (upstream.status === 429) {
      return jsonResponse(
        {
          ok: false,
          code: 'UPSTREAM_RATE_LIMITED',
          fallbackAvailable: true,
          model,
          message:
            'Gemini Flash Free Tier đang tạm quá tải hoặc hết lượt phút (429). Vui lòng thử lại sau ít phút hoặc dùng Gợi ý mẫu.'
        },
        429,
        { 'Retry-After': '30' }
      );
    }

    if (!upstream.ok) {
      console.error('[ai-describe] Upstream Gemini error status:', upstream.status);
      return jsonResponse(
        {
          ok: false,
          code: 'UPSTREAM_ERROR',
          fallbackAvailable: true,
          model,
          message: 'Không thể tạo gợi ý từ dịch vụ AI lúc này. Bạn có thể dùng Gợi ý mẫu hoặc tự nhập mô tả.'
        },
        502
      );
    }

    const data = await upstream.json().catch(() => null);
    const rawText = data?.candidates?.[0]?.content?.parts
      ?.map((p) => p?.text || '')
      .join('\n')
      .trim();

    if (!rawText) {
      return jsonResponse(
        {
          ok: false,
          code: 'EMPTY_RESPONSE',
          fallbackAvailable: true,
          model,
          message: 'AI chưa trả về nội dung mô tả cho ảnh này. Vui lòng thử ảnh rõ hơn hoặc dùng Gợi ý mẫu.'
        },
        502
      );
    }

    const parsed = extractJsonObject(rawText);
    const description = String(parsed?.description || rawText).trim().slice(0, 900);
    const titleSuggestion = String(parsed?.titleSuggestion || productHint || '').trim().slice(0, 120);
    const shortSpec = String(parsed?.shortSpec || '').trim().slice(0, 220);
    const highlights = Array.isArray(parsed?.highlights)
      ? parsed.highlights.map((h) => String(h || '').trim()).filter(Boolean).slice(0, 4)
      : [];

    return jsonResponse({
      ok: true,
      source: 'gemini_flash',
      model,
      suggestion: {
        titleSuggestion,
        shortSpec,
        description,
        highlights
      }
    });
  } catch (err) {
    const isTimeout = err?.name === 'TimeoutError' || err?.name === 'AbortError';
    console.error('[ai-describe] Fetch failure:', err?.name || 'unknown');
    return jsonResponse(
      {
        ok: false,
        code: isTimeout ? 'UPSTREAM_TIMEOUT' : 'NETWORK_ERROR',
        fallbackAvailable: true,
        model,
        message: isTimeout
          ? 'Yêu cầu phân tích ảnh quá thời gian chờ (15 giây). Bạn có thể thử lại hoặc dùng Gợi ý mẫu.'
          : 'Không thể kết nối dịch vụ AI lúc này. Bạn có thể dùng Gợi ý mẫu hoặc nhập tay.'
      },
      isTimeout ? 504 : 502
    );
  }
}

export function _resetAiRateLimiterForTests() {
  rateBuckets.clear();
}

export async function OPTIONS(request) {
  return handleAiDescribeRequest(request);
}

export async function POST(request) {
  return handleAiDescribeRequest(request);
}
