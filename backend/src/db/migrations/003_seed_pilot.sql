-- Migration 003: Idempotent Pilot Seed (10 SKUs, 6 Producers, 3 Video Templates, Sample Orders/Ledger)
-- Safe to re-run without overwriting real operational rows.

INSERT INTO ocop_app.product_categories (id, label, sort_order) VALUES
  ('hat-say', 'Hạt & Nông sản sấy', 1),
  ('mat-ong-tra', 'Mật ong & Trà thảo mộc', 2),
  ('ca-phe-ca-cao', 'Cà phê & Ca cao', 3),
  ('gia-vi-tinh-dau', 'Gia vị & Tinh dầu', 4)
ON CONFLICT (id) DO NOTHING;

INSERT INTO ocop_app.profiles (id, email, display_name) VALUES
  ('10000000-0000-4000-8000-000000000001', 'seller-tantrieu@ocop-pilot.example', 'Trần Thị Thu Hà (Tân Triều)'),
  ('10000000-0000-4000-8000-000000000002', 'seller-dinhquan@ocop-pilot.example', 'Nguyễn Văn Hùng (Định Quán)'),
  ('10000000-0000-4000-8000-000000000003', 'affiliate-vy@ocop-pilot.example', 'Nguyễn Thảo Vy (ĐH Lạc Hồng)'),
  ('10000000-0000-4000-8000-000000000004', 'affiliate-bao@ocop-pilot.example', 'Trần Quốc Bảo (Tân Mai)'),
  ('10000000-0000-4000-8000-000000000005', 'ops-tinhdoan@ocop-pilot.example', 'Điều phối Tỉnh đoàn Đồng Nai')
ON CONFLICT (id) DO NOTHING;

INSERT INTO ocop_app.role_memberships (user_id, role) VALUES
  ('10000000-0000-4000-8000-000000000001', 'seller'),
  ('10000000-0000-4000-8000-000000000002', 'seller'),
  ('10000000-0000-4000-8000-000000000003', 'affiliate'),
  ('10000000-0000-4000-8000-000000000004', 'affiliate'),
  ('10000000-0000-4000-8000-000000000005', 'ops')
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO ocop_app.ocop_producers (id, slug, business_name, owner_name, area, ocop_stars, cert_status_label, cert_ref_no, public_contact, story, verified, seed_tag) VALUES
  ('20000000-0000-4000-8000-000000000001', 'htx-nong-san-dinh-quan', 'HTX Nông Sản Đồi Gió Định Quán', 'Nguyễn Văn Hùng', 'Huyện Định Quán, Đồng Nai', 4, 'OCOP 4 sao (Dữ liệu pilot)', 'PILOT-CERT-DQ-01', '0251 385 xxxx', 'Canh tác điều hữu cơ trên vùng đất bazan Định Quán.', true, 'pilot-2026-batch-1'),
  ('20000000-0000-4000-8000-000000000002', 'co-so-buoi-tan-trieu', 'Cơ sở Chế biến Bưởi Làng Tân Triều', 'Trần Thị Thu Hà', 'Huyện Vĩnh Cửu, Đồng Nai', 4, 'OCOP 4 sao (Dữ liệu pilot)', 'PILOT-CERT-TT-02', '0251 396 xxxx', 'Chế biến vỏ bưởi sấy dẻo và tinh dầu bưởi làng Tân Triều.', true, 'pilot-2026-batch-1'),
  ('20000000-0000-4000-8000-000000000003', 'trai-ong-rung-long-khanh', 'Trại Ong Mùa Hoa Long Khánh', 'Lê Minh Tuấn', 'TP. Long Khánh, Đồng Nai', 4, 'OCOP 4 sao (Dữ liệu pilot)', 'PILOT-CERT-LK-03', '0251 378 xxxx', 'Mật ong hoa chôm chôm nguyên chất Long Khánh.', true, 'pilot-2026-batch-1'),
  ('20000000-0000-4000-8000-000000000004', 'nong-trai-thao-moc-xuan-loc', 'Nông trại Thảo mộc Núi Chứa Chan', 'Phạm Thị Mai', 'Huyện Xuân Lộc, Đồng Nai', 3, 'OCOP 3 sao (Dữ liệu pilot)', 'PILOT-CERT-XL-04', '0251 374 xxxx', 'Trồng khổ qua rừng và hồ tiêu sạch chân núi Chứa Chan.', true, 'pilot-2026-batch-1'),
  ('20000000-0000-4000-8000-000000000005', 'xuong-ca-phe-cam-my', 'Xưởng Cà phê Thanh Niên Cẩm Mỹ', 'Đỗ Hoàng Nam', 'Huyện Cẩm Mỹ, Đồng Nai', 4, 'OCOP 4 sao (Dữ liệu pilot)', 'PILOT-CERT-CM-05', '0251 379 xxxx', 'Rang mộc Robusta chín cây và lên men ca cao.', true, 'pilot-2026-batch-1'),
  ('20000000-0000-4000-8000-000000000006', 'htx-chuoi-say-trang-bom', 'Tổ hợp tác Nông sản Sạch Trảng Bom', 'Võ Thành Đạt', 'Huyện Trảng Bom, Đồng Nai', 3, 'OCOP 3 sao (Dữ liệu pilot)', 'PILOT-CERT-TB-06', '0251 386 xxxx', 'Chuối sấy chân không giòn tan không đường.', true, 'pilot-2026-batch-1')
ON CONFLICT (id) DO NOTHING;

INSERT INTO ocop_app.producer_memberships (producer_id, user_id, member_role) VALUES
  ('20000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', 'owner'),
  ('20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000002', 'owner')
ON CONFLICT (producer_id, user_id) DO NOTHING;

INSERT INTO ocop_app.products (id, producer_id, category_id, sku, slug, title, search_normalized, unit, spec, area, price_vnd, stock, commission_rate_bps, status, media_kit_ready, seed_tag) VALUES
  ('30000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', 'hat-say', 'OCOP-DN-001', 'hat-dieu-rang-muoi-vo-lua-dinh-quan-500g', 'Hạt điều rang muối vỏ lụa Định Quán 500g', 'hat dieu rang muoi vo lua dinh quan 500g ocop-dn-001', 'Hộp 500g', 'Size W240 rang củi muối biển', 'Định Quán, Đồng Nai', 165000, 240, 1200, 'published', true, 'pilot-2026-batch-1'),
  ('30000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000002', 'hat-say', 'OCOP-DN-002', 'vo-buoi-say-deo-tan-trieu-250g', 'Vỏ bưởi sấy dẻo ít đường Tân Triều 250g', 'vo buoi say deo it duong tan trieu 250g ocop-dn-002', 'Túi zip 250g', 'Vỏ bưởi đường lá cam sấy dẻo', 'Vĩnh Cửu, Đồng Nai', 95000, 310, 1500, 'published', true, 'pilot-2026-batch-1'),
  ('30000000-0000-4000-8000-000000000003', '20000000-0000-4000-8000-000000000003', 'mat-ong-tra', 'OCOP-DN-003', 'mat-ong-hoa-chom-chom-long-khanh-500ml', 'Mật ong hoa chôm chôm Long Khánh 500ml', 'mat ong hoa chom chom long khanh 500ml ocop-dn-003', 'Chai thủy tinh 500ml', 'Mật ong nguyên chất 100%', 'TP. Long Khánh, Đồng Nai', 210000, 165, 1200, 'published', true, 'pilot-2026-batch-1'),
  ('30000000-0000-4000-8000-000000000004', '20000000-0000-4000-8000-000000000004', 'mat-ong-tra', 'OCOP-DN-004', 'tra-kho-qua-rung-xuan-loc-30-tui-loc', 'Trà khổ qua rừng Núi Chứa Chan 30 túi lọc', 'tra kho qua rung nui chua chan 30 tui loc ocop-dn-004', 'Hộp 30 túi lọc', 'Sấy lạnh giữ màu xanh tự nhiên', 'Xuân Lộc, Đồng Nai', 120000, 400, 1400, 'published', true, 'pilot-2026-batch-1'),
  ('30000000-0000-4000-8000-000000000005', '20000000-0000-4000-8000-000000000005', 'ca-phe-ca-cao', 'OCOP-DN-005', 'ca-phe-robusta-rang-moc-cam-my-500g', 'Cà phê Robusta rang mộc Cẩm Mỹ 500g', 'ca phe robusta rang moc cam my 500g ocop-dn-005', 'Túi 500g', '100% Robusta hái chín sàng R18', 'Cẩm Mỹ, Đồng Nai', 185000, 190, 1000, 'published', true, 'pilot-2026-batch-1'),
  ('30000000-0000-4000-8000-000000000006', '20000000-0000-4000-8000-000000000005', 'ca-phe-ca-cao', 'OCOP-DN-006', 'bot-ca-cao-nguyen-chat-len-men-dinh-quan-300g', 'Bột ca cao nguyên chất lên men Đồng Nai 300g', 'bot ca cao nguyen chat len men dong nai 300g ocop-dn-006', 'Lon thiếc 300g', 'Lên men 6 ngày không đường', 'Định Quán – Cẩm Mỹ, Đồng Nai', 155000, 220, 1300, 'published', true, 'pilot-2026-batch-1'),
  ('30000000-0000-4000-8000-000000000007', '20000000-0000-4000-8000-000000000002', 'mat-ong-tra', 'OCOP-DN-007', 'nam-linh-chi-do-thai-lat-vinh-cuu-200g', 'Nấm linh chi đỏ thái lát Vĩnh Cửu 200g', 'nam linh chi do thai lat vinh cuu 200g ocop-dn-007', 'Hộp quà 200g', 'Tai nấm còn nguyên bào tử', 'Vĩnh Cửu, Đồng Nai', 320000, 95, 1500, 'published', false, 'pilot-2026-batch-1'),
  ('30000000-0000-4000-8000-000000000008', '20000000-0000-4000-8000-000000000006', 'hat-say', 'OCOP-DN-008', 'chuoi-say-gion-khong-duong-trang-bom-300g', 'Chuối sấy giòn không đường Trảng Bom 300g', 'chuoi say gion khong duong trang bom 300g ocop-dn-008', 'Combo 2 túi 300g', 'Sấy chân không không phẩm màu', 'Trảng Bom, Đồng Nai', 68000, 520, 1200, 'published', true, 'pilot-2026-batch-1'),
  ('30000000-0000-4000-8000-000000000009', '20000000-0000-4000-8000-000000000004', 'gia-vi-tinh-dau', 'OCOP-DN-009', 'tieu-den-xuan-loc-rang-thom-200g', 'Tiêu đen Xuân Lộc hạt chắc rang thơm 200g', 'tieu den xuan loc hat chac rang thom 200g ocop-dn-009', 'Hũ thủy tinh 200g', 'Kèm cối xay tiện dụng', 'Xuân Lộc, Đồng Nai', 115000, 270, 1100, 'published', true, 'pilot-2026-batch-1'),
  ('30000000-0000-4000-8000-000000000010', '20000000-0000-4000-8000-000000000002', 'gia-vi-tinh-dau', 'OCOP-DN-010', 'tinh-dau-buoi-nguyen-chat-tan-trieu-100ml', 'Tinh dầu bưởi nguyên chất Tân Triều 100ml', 'tinh dau buoi nguyen chat tan trieu 100ml ocop-dn-010', 'Chai xịt 100ml', 'Chưng cất lôi cuốn hơi nước', 'Vĩnh Cửu, Đồng Nai', 195000, 150, 1600, 'published', true, 'pilot-2026-batch-1')
ON CONFLICT (id) DO NOTHING;

INSERT INTO ocop_app.product_listings (product_id, platform, shop_id, external_item_id, listing_url, is_demo_target) VALUES
  ('30000000-0000-4000-8000-000000000001', 'shopee', 'shop_dq_cashew_sp', 'SP-880101', 'https://shopee.vn/hat-dieu-rang-muoi-dinh-quan-pilot-i.1001.9001', true),
  ('30000000-0000-4000-8000-000000000002', 'tiktok', 'shop_tantrieu_tt', 'TT-900102', 'https://shop.tiktok.com/view/product/pilot-ocop-dn-002', true),
  ('30000000-0000-4000-8000-000000000003', 'shopee', 'shop_longkhanh_sp', 'SP-880103', 'https://shopee.vn/mat-ong-hoa-chom-chom-long-khanh-pilot-i.1003.9003', true),
  ('30000000-0000-4000-8000-000000000010', 'tiktok', 'shop_tantrieu_tt', 'TT-900110', 'https://shop.tiktok.com/view/product/pilot-ocop-dn-010', true)
ON CONFLICT (platform, shop_id, external_item_id) DO NOTHING;

INSERT INTO ocop_app.video_templates (id, duration_sec, title, goal, scenes_json) VALUES
  ('tpl-15s', 15, 'Mẫu 15 giây — Bắt trend nhanh', 'Gây chú ý 3 giây đầu và mời bấm giỏ hàng.', '[{"id":"s1","startSec":0,"endSec":4},{"id":"s2","startSec":4,"endSec":10},{"id":"s3","startSec":10,"endSec":15}]'::jsonb),
  ('tpl-30s', 30, 'Mẫu 30 giây — Chủ cơ sở tự giới thiệu', 'Kể câu chuyện vườn nhà và quy cách đóng gói.', '[{"id":"m1","startSec":0,"endSec":6},{"id":"m2","startSec":6,"endSec":16},{"id":"m3","startSec":16,"endSec":24},{"id":"m4","startSec":24,"endSec":30}]'::jsonb),
  ('tpl-45s', 45, 'Mẫu 45 giây — Review chi tiết Affiliate', 'Giải đáp 3 thắc mắc phổ biến trước khi mua.', '[{"id":"l1","startSec":0,"endSec":8},{"id":"l2","startSec":8,"endSec":20},{"id":"l3","startSec":20,"endSec":34},{"id":"l4","startSec":34,"endSec":45}]'::jsonb)
ON CONFLICT (id) DO NOTHING;

INSERT INTO ocop_app.affiliate_links (id, code, affiliate_user_id, product_id, platform, target_url, is_demo_target, active, clicks_count, seed_tag) VALUES
  ('40000000-0000-4000-8000-000000000001', 'DN8K4M2P9Q', '10000000-0000-4000-8000-000000000003', '30000000-0000-4000-8000-000000000002', 'tiktok', 'https://shop.tiktok.com/view/product/pilot-ocop-dn-002', true, true, 34, 'pilot-2026-batch-1'),
  ('40000000-0000-4000-8000-000000000002', 'DN7R3W5T2X', '10000000-0000-4000-8000-000000000003', '30000000-0000-4000-8000-000000000001', 'shopee', 'https://shopee.vn/hat-dieu-rang-muoi-dinh-quan-pilot-i.1001.9001', true, true, 21, 'pilot-2026-batch-1')
ON CONFLICT (id) DO NOTHING;

INSERT INTO ocop_app.orders (id, platform, shop_id, external_order_id, producer_id, affiliate_link_id, affiliate_user_id, attribution_status, gross_amount_vnd, net_amount_vnd, commission_rate_bps, commission_vnd, status, source, seed_tag) VALUES
  ('50000000-0000-4000-8000-000000000001', 'tiktok', 'shop_tantrieu_tt', 'TT-DEMO-20261122-001', '20000000-0000-4000-8000-000000000002', '40000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000003', 'attributed', 285000, 285000, 1500, 42750, 'completed', 'demo_fixture', 'pilot-2026-batch-1')
ON CONFLICT (platform, shop_id, external_order_id) DO NOTHING;

INSERT INTO ocop_app.commission_ledger (id, tx_group_id, order_id, affiliate_user_id, account_type, direction, amount_vnd, state, note, seed_tag) VALUES
  ('60000000-0000-4000-8000-000000000001', '70000000-0000-4000-8000-000000000001', '50000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000003', 'platform_escrow', 'debit', 42750, 'available', 'Seed đối soát mẫu', 'pilot-2026-batch-1'),
  ('60000000-0000-4000-8000-000000000002', '70000000-0000-4000-8000-000000000001', '50000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000003', 'affiliate_payable', 'credit', 42750, 'available', 'Seed đối soát mẫu', 'pilot-2026-batch-1')
ON CONFLICT (id) DO NOTHING;
