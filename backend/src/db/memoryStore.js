import { randomUUID } from 'node:crypto';
import { normalizeVi } from '../common/domainUtils.js';

export function createMemoryStore() {
  const categories = [
    { id: 'hat-say', label: 'Hạt & Nông sản sấy', sortOrder: 1 },
    { id: 'mat-ong-tra', label: 'Mật ong & Trà thảo mộc', sortOrder: 2 },
    { id: 'ca-phe-ca-cao', label: 'Cà phê & Ca cao', sortOrder: 3 },
    { id: 'gia-vi-tinh-dau', label: 'Gia vị & Tinh dầu', sortOrder: 4 }
  ];

  const profiles = [
    { id: '10000000-0000-4000-8000-000000000001', email: 'seller-tantrieu@ocop-pilot.example', displayName: 'Trần Thị Thu Hà (Tân Triều)', roles: ['seller'], producerIds: ['20000000-0000-4000-8000-000000000002'] },
    { id: '10000000-0000-4000-8000-000000000002', email: 'seller-dinhquan@ocop-pilot.example', displayName: 'Nguyễn Văn Hùng (Định Quán)', roles: ['seller'], producerIds: ['20000000-0000-4000-8000-000000000001'] },
    { id: '10000000-0000-4000-8000-000000000003', email: 'affiliate-vy@ocop-pilot.example', displayName: 'Nguyễn Thảo Vy (ĐH Lạc Hồng)', roles: ['affiliate'], producerIds: [] },
    { id: '10000000-0000-4000-8000-000000000004', email: 'affiliate-bao@ocop-pilot.example', displayName: 'Trần Quốc Bảo (Tân Mai)', roles: ['affiliate'], producerIds: [] },
    { id: '10000000-0000-4000-8000-000000000005', email: 'ops-tinhdoan@ocop-pilot.example', displayName: 'Điều phối Tỉnh đoàn Đồng Nai', roles: ['ops'], producerIds: [] }
  ];

  const producers = [
    {
      id: '20000000-0000-4000-8000-000000000001',
      slug: 'htx-nong-san-dinh-quan',
      businessName: 'HTX Nông Sản Đồi Gió Định Quán',
      ownerName: 'Nguyễn Văn Hùng',
      area: 'Huyện Định Quán, Đồng Nai',
      ocopStars: 4,
      certStatusLabel: 'OCOP 4 sao (Dữ liệu pilot)',
      publicContact: '0251 385 xxxx',
      story: 'Canh tác điều hữu cơ trên vùng đất bazan Định Quán.',
      verified: true
    },
    {
      id: '20000000-0000-4000-8000-000000000002',
      slug: 'co-so-buoi-tan-trieu',
      businessName: 'Cơ sở Chế biến Bưởi Làng Tân Triều',
      ownerName: 'Trần Thị Thu Hà',
      area: 'Huyện Vĩnh Cửu, Đồng Nai',
      ocopStars: 4,
      certStatusLabel: 'OCOP 4 sao (Dữ liệu pilot)',
      publicContact: '0251 396 xxxx',
      story: 'Chế biến vỏ bưởi sấy dẻo và tinh dầu bưởi làng Tân Triều.',
      verified: true
    }
  ];

  const products = [
    {
      id: '30000000-0000-4000-8000-000000000001',
      producerId: '20000000-0000-4000-8000-000000000001',
      categoryId: 'hat-say',
      sku: 'OCOP-DN-001',
      slug: 'hat-dieu-rang-muoi-vo-lua-dinh-quan-500g',
      title: 'Hạt điều rang muối vỏ lụa Định Quán 500g',
      searchNormalized: normalizeVi('Hạt điều rang muối vỏ lụa Định Quán 500g OCOP-DN-001'),
      unit: 'Hộp 500g',
      spec: 'Size W240 rang củi muối biển',
      area: 'Định Quán, Đồng Nai',
      priceVnd: 165000,
      priceUpdatedAt: '2026-11-23T08:00:00Z',
      stock: 240,
      commissionRateBps: 1200,
      commissionCondition: 'Áp dụng cho đơn hoàn thành trên sàn liên kết.',
      status: 'published',
      reviewNote: '',
      description: 'Hạt điều rang muối vỏ lụa Định Quán giòn bùi.',
      story: '14 hộ liên kết xã Phú Ngọc.',
      mediaKitReady: true,
      ocopStars: 4,
      listings: [
        {
          id: 'lst-01',
          platform: 'shopee',
          shopId: 'shop_dq_cashew_sp',
          externalItemId: 'SP-880101',
          url: 'https://shopee.vn/hat-dieu-rang-muoi-dinh-quan-pilot-i.1001.9001',
          isDemoTarget: true,
          status: 'active'
        }
      ]
    },
    {
      id: '30000000-0000-4000-8000-000000000002',
      producerId: '20000000-0000-4000-8000-000000000002',
      categoryId: 'hat-say',
      sku: 'OCOP-DN-002',
      slug: 'vo-buoi-say-deo-tan-trieu-250g',
      title: 'Vỏ bưởi sấy dẻo ít đường Tân Triều 250g',
      searchNormalized: normalizeVi('Vỏ bưởi sấy dẻo ít đường Tân Triều 250g OCOP-DN-002'),
      unit: 'Túi zip 250g',
      spec: 'Vỏ bưởi đường lá cam sấy dẻo',
      area: 'Vĩnh Cửu, Đồng Nai',
      priceVnd: 95000,
      priceUpdatedAt: '2026-11-23T09:15:00Z',
      stock: 310,
      commissionRateBps: 1500,
      commissionCondition: 'Áp dụng cho mọi đơn hợp lệ.',
      status: 'published',
      reviewNote: '',
      description: 'Vỏ bưởi sấy dẻo ít đường Tân Triều thơm dịu.',
      story: 'Làng bưởi Tân Triều Vĩnh Cửu.',
      mediaKitReady: true,
      ocopStars: 4,
      listings: [
        {
          id: 'lst-02',
          platform: 'tiktok',
          shopId: 'shop_tantrieu_tt',
          externalItemId: 'TT-900102',
          url: 'https://shop.tiktok.com/view/product/pilot-ocop-dn-002',
          isDemoTarget: true,
          status: 'active'
        }
      ]
    }
  ];

  const affiliateLinks = [
    {
      id: '40000000-0000-4000-8000-000000000001',
      code: 'DN8K4M2P9Q',
      affiliateId: '10000000-0000-4000-8000-000000000003',
      affiliateName: 'Nguyễn Thảo Vy (ĐH Lạc Hồng)',
      productId: '30000000-0000-4000-8000-000000000002',
      platform: 'tiktok',
      targetUrl: 'https://shop.tiktok.com/view/product/pilot-ocop-dn-002',
      isDemoTarget: true,
      active: true,
      clicksCount: 34,
      createdAt: '2026-11-22T09:00:00Z'
    }
  ];

  const affiliateClicks = [];
  const importBatches = [];
  const orders = [
    {
      id: '50000000-0000-4000-8000-000000000001',
      platform: 'tiktok',
      shopId: 'shop_tantrieu_tt',
      externalOrderId: 'TT-DEMO-20261122-001',
      producerId: '20000000-0000-4000-8000-000000000002',
      productId: '30000000-0000-4000-8000-000000000002',
      sku: 'OCOP-DN-002',
      productTitle: 'Vỏ bưởi sấy dẻo ít đường Tân Triều 250g',
      quantity: 3,
      affiliateLinkId: '40000000-0000-4000-8000-000000000001',
      affiliateId: '10000000-0000-4000-8000-000000000003',
      affiliateName: 'Nguyễn Thảo Vy (ĐH Lạc Hồng)',
      attributionStatus: 'attributed',
      grossAmountVnd: 285000,
      netAmountVnd: 285000,
      commissionRateBps: 1500,
      commissionVnd: 42750,
      status: 'completed',
      source: 'demo_fixture',
      orderedAt: '2026-11-22T11:15:00Z'
    }
  ];

  const commissionLedger = [
    {
      id: randomUUID(),
      txGroupId: '70000000-0000-4000-8000-000000000001',
      orderId: '50000000-0000-4000-8000-000000000001',
      affiliateId: '10000000-0000-4000-8000-000000000003',
      accountType: 'platform_escrow',
      direction: 'debit',
      amountVnd: 42750,
      state: 'available',
      note: 'Seed đối soát mẫu',
      createdAt: '2026-11-22T11:15:00Z'
    },
    {
      id: randomUUID(),
      txGroupId: '70000000-0000-4000-8000-000000000001',
      orderId: '50000000-0000-4000-8000-000000000001',
      affiliateId: '10000000-0000-4000-8000-000000000003',
      accountType: 'affiliate_payable',
      direction: 'credit',
      amountVnd: 42750,
      state: 'available',
      note: 'Seed đối soát mẫu',
      createdAt: '2026-11-22T11:15:00Z'
    }
  ];

  const marketplaceEvents = [];
  const mediaAssets = [];
  const pilotApplications = [];
  const auditLogs = [];
  const videoTemplates = [
    { id: 'tpl-15s', durationSec: 15, title: 'Mẫu 15 giây — Bắt trend nhanh', goal: 'Gây chú ý 3 giây đầu.' },
    { id: 'tpl-30s', durationSec: 30, title: 'Mẫu 30 giây — Chủ cơ sở giới thiệu', goal: 'Kể câu chuyện vườn nhà.' },
    { id: 'tpl-45s', durationSec: 45, title: 'Mẫu 45 giây — Review chi tiết Affiliate', goal: 'Giải đáp thắc mắc khách hàng.' }
  ];

  return {
    categories,
    profiles,
    producers,
    products,
    affiliateLinks,
    affiliateClicks,
    importBatches,
    orders,
    commissionLedger,
    marketplaceEvents,
    mediaAssets,
    pilotApplications,
    auditLogs,
    videoTemplates
  };
}
