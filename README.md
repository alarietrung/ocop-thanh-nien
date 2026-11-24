# Đề 3 — Chợ OCOP Thanh Niên / OCOP Đồng Nai Lên Sàn

Ứng dụng hỗ trợ chủ cơ sở OCOP Đồng Nai đưa nông sản lên sàn TMĐT (TikTok Shop / Shopee / Lazada), tự quay video sản phẩm bằng Video Studio Template (15s / 30s / 45s), kết nối mạng lưới Đoàn viên Affiliate minh bạch hoa hồng và bàn điều phối Tỉnh đoàn.

## 1. Bảng Yêu cầu → Màn hình / API → Kiểm thử

| Yêu cầu theo đề & đặc tả | Màn hình / Route Frontend | Endpoint API (`/api/v1`) & DB | Kiểm thử tương ứng |
|---|---|---|---|
| Công khai không cần đăng nhập: tìm/lọc, phân trang, lưu query trên URL | `/` ([CatalogPage.jsx](src/components/CatalogPage.jsx)) | `GET /products` (`ocop_app.products`) | Tìm kiếm không dấu, lọc sàn, phân trang, empty/reset (`ocopStore.test.js`, `app.test.js`) |
| Chi tiết sản phẩm, giá cập nhật, gian hàng, liên kết rời ứng dụng | `/san-pham/:slug`, `/gian-hang/:slug` ([ProductDetailPage.jsx](src/components/ProductDetailPage.jsx)) | `GET /products/:slug`, `GET /producers/:slug` | Hiển thị chứng nhận pilot, link HTTPS allowlist |
| Kế hoạch 90 ngày (10 SKU pilot), Pitch Deck 10 slide, đăng ký pilot | `/ke-hoach-pilot`, `public/pitch-deck.html` ([PilotOverviewPage.jsx](src/components/PilotOverviewPage.jsx)) | `POST /pilot-applications` (Turnstile Siteverify) | Tách KPI mục tiêu vs số liệu đo; xác minh Turnstile |
| App Chủ cơ sở (3 màn): Sản phẩm 3 chạm, Video Studio 15/30/45s, Đơn hàng & CSV | `/chu-co-so/san-pham`, `/chu-co-so/video-studio`, `/chu-co-so/don-hang` ([SellerPages.jsx](src/components/SellerPages.jsx)) | `GET/POST/PATCH /seller/products`, `POST /seller/products/:id/submit`, `GET /seller/orders`, `POST /seller/media/upload-init`, `GET /media/templates` | Cô lập cơ sở A/B, camera feature detection + dọn track, preview lỗi & chống trùng CSV |
| App Đoàn viên Affiliate (3 màn): Khám phá, Link & Media Kit, Hoa hồng | `/affiliate/kham-pha`, `/affiliate/link-kit`, `/affiliate/hoa-hong`, `/r/:code` ([AffiliatePages.jsx](src/components/AffiliatePages.jsx), [AffiliateRedirectPage.jsx](src/components/AffiliateRedirectPage.jsx)) | `GET/POST /affiliate/links`, `PATCH /affiliate/links/:id/deactivate`, `GET /redirects/:code`, `POST /redirects/:code/visit`, `GET /affiliate/commission` | Chống đếm click bot preview, khóa link chéo A/B bị 403, hiển thị sổ cái |
| Điều phối Ops: Duyệt sản phẩm, KPI, Import CSV, Đối soát & Bút toán đảo | `/dieu-phoi` ([OpsDashboardPage.jsx](src/components/OpsDashboardPage.jsx)) | `GET /ops/metrics`, `POST /ops/products/:id/review`, `POST /ops/imports/preview`, `POST /ops/imports/:id/commit`, `POST /ops/reconciliations` | Duyệt nháp -> công bố, hoàn đơn sinh bút toán đảo cân bằng |
| Kết nối sàn TMĐT theo cấp độ | Gắn link + Import CSV + Adapter status | `GET /ops/marketplace-status`, `POST /webhooks/marketplace/:platform` | Webhook đóng mặc định `501 PARTNER_INTEGRATION_NOT_ENABLED` khi thiếu OAuth đối tác |

---

## 2. Cấu trúc thư mục Đề 3 & Phân quyền

- **Frontend (`de-3-ocop-len-san/`):** React 18 + Vite 5 + Tailwind CSS 3 + React Router v7 + PWA (`public/manifest.webmanifest`, `public/sw.js`, PNG 192/512 + Apple Touch Icon).
- **Backend (`de-3-ocop-len-san/backend/`):** Fastify 5 theo kiến trúc `routes -> controller -> service -> repository` (`eslint.config.js` kiểm tra biên giới module).
- **Database (`backend/src/db/migrations/`):**
  - `001_schema.sql`: Schema riêng `ocop_app`, `commission_ledger` có trigger append-only.
  - `002_rls_and_roles.sql`: Thu hồi quyền mặc định của `anon`/`authenticated`, tạo role `ocop_runtime` và policy RLS default-deny theo `set_config('ocop.actor_id', ..., true)`.
  - `003_seed_pilot.sql`: Seed idempotent 10 SKU OCOP Đồng Nai pilot, 6 cơ sở, 3 mẫu video, đơn/hoa hồng mẫu.

### Bảng phân quyền

| Vai trò | Dữ liệu được phép đọc | Thao tác được phép ghi | Giới hạn bảo mật |
|---|---|---|---|
| `public` (Khách) | Sản phẩm `published`, gian hàng công bố, lookup `/r/:code` | `POST /redirects/:code/visit`, `POST /pilot-applications` (Turnstile) | Không thấy sản phẩm nháp, đơn hàng, sổ hoa hồng, audit log |
| `seller` (Chủ cơ sở) | Sản phẩm, đơn hàng thuộc `producer_id` của mình | Tạo/sửa/gửi duyệt sản phẩm thuộc `producer_id` của mình, init upload media | Bị từ chối 403 nếu thao tác sản phẩm cơ sở khác |
| `affiliate` (Đoàn viên) | Danh mục công bố, link & sổ hoa hồng của chính `user.id` | Tạo/vô hiệu hóa link cá nhân `/r/:code` | Không đọc/khóa được link hoặc hoa hồng của đoàn viên khác |
| `ops` (Điều phối) | Toàn bộ hàng đợi duyệt, đơn mẫu, sổ cái, audit log, thống kê | Duyệt sản phẩm, import CSV toàn cục, đối soát/hoàn đơn (bút toán đảo) | Mọi thay đổi đều ghi `audit_logs` |

---

## 3. Lệnh chạy trên Windows (PowerShell)

### Chạy & Kiểm tra Frontend
```powershell
Set-Location -LiteralPath 'D:\Hackthon 2026\hackathon-main\de-3-ocop-len-san'
npm ci
npm run lint
npm test
npm run build
npm run dev       # http://localhost:5175
```

### Chạy & Kiểm tra Backend Fastify 5
```powershell
Set-Location -LiteralPath 'D:\Hackthon 2026\hackathon-main\de-3-ocop-len-san\backend'
npm install       # Đồng bộ package `pg` vào backend/package-lock.json ở lần đầu
npm run lint
npm test
npm run dev       # http://localhost:4003/api/v1/health
```

---

## 4. Triển khai Production (Supabase → Vercel Backend → Cloudflare Pages → Vercel Frontend)

### Bước A: Supabase PostgreSQL & Auth
1. Tạo 1 Supabase Free project riêng cho pilot.
2. Chạy lần lượt 3 file SQL trong `backend/src/db/migrations/`: `001_schema.sql`, `002_rls_and_roles.sql`, `003_seed_pilot.sql`.
3. Không expose schema `ocop_app` trong Supabase Data API. Dùng credential role `ocop_runtime` với chuỗi **Transaction Pooler** cho `DATABASE_URL` khi deploy serverless.
4. Trong Supabase Auth → URL Configuration: đặt Site URL vào link Cloudflare Pages chính thức và thêm allowlist callback cho cả Cloudflare Pages, Vercel frontend và `http://localhost:5175`.

### Bước B: Backend Fastify trên Vercel (Project Backend riêng)
- Root Directory: `de-3-ocop-len-san/backend`
- Entry serverless đã cấu hình tại `backend/api/index.js` + `backend/vercel.json` (nhận toàn bộ `/api/v1/*`).
- Biến môi trường cần đặt: `NODE_ENV=production`, `APP_ENV=production`, `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_JWKS_URL`, `CORS_ORIGINS` (liệt kê chính xác origin Cloudflare Pages + Vercel Frontend), `TURNSTILE_SECRET_KEY`, `TURNSTILE_ALLOWED_HOSTNAMES`, `PUBLIC_WEB_URL`.
- Sau deploy, kiểm tra `GET https://<api-domain>/api/v1/health` và `GET https://<api-domain>/api/v1/ready`.

### Bước C: Frontend chính trên Cloudflare Pages (Trước)
1. Đặt các biến `VITE_API_BASE_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_TURNSTILE_SITE_KEY` vào `.env.production` (khi Direct Upload) hoặc dashboard Cloudflare Pages (khi nối Git).
2. Cập nhật `connect-src` trong `public/_headers` với domain API & Supabase cụ thể của project.
3. Triển khai từ `de-3-ocop-len-san/`:
```powershell
Set-Location -LiteralPath 'D:\Hackthon 2026\hackathon-main\de-3-ocop-len-san'
npm ci
npm run build
npx wrangler whoami
npx wrangler pages deploy dist --project-name <PAGES_PROJECT_DA_XAC_NHAN>
```

### Bước D: Frontend thứ hai trên Vercel (Sau Cloudflare)
- Tạo **project Vercel Frontend riêng** với Root Directory `de-3-ocop-len-san` (khác với project Backend).
- Đặt cùng biến môi trường `VITE_*` như Cloudflare Pages, giữ nguyên `vercel.json` (đã cập nhật `connect-src`, `Permissions-Policy` camera/mic và SPA rewrite trừ `/assets/*`, `/sw.js`, `/pitch-deck.html`).
- Chạy `npx vercel deploy --prod` tại `de-3-ocop-len-san/` (sau khi link đúng project frontend).
