import rambutanNhan from '../assets/orchard/rambutan-nhan.webp';
import durianRi6 from '../assets/orchard/durian-ri6.webp';
import rambutanThai from '../assets/orchard/rambutan-thai.webp';
import durianMonthong from '../assets/orchard/durian-monthong.webp';
import mangosteen from '../assets/orchard/mangosteen.webp';
import { buildProductArtworkDataUri } from '../utils/formatters';

export const SEED_TAG = 'pilot-2026-batch-1';

export const PRODUCT_CATEGORIES = [
  { id: 'all', label: 'Tất cả nhóm hàng' },
  { id: 'trai-cay-tuoi', label: 'Trái cây đặc sản Long Khánh' },
  { id: 'hat-say', label: 'Hạt & Nông sản sấy' },
  { id: 'mat-ong-tra', label: 'Mật ong & Trà thảo mộc' },
  { id: 'ca-phe-ca-cao', label: 'Cà phê & Ca cao' },
  { id: 'gia-vi-tinh-dau', label: 'Gia vị & Tinh dầu' }
];

// Dữ liệu kịch bản chính Vòng Sơ loại: Nhà vườn Ba Tư tại Long Khánh (2,5 ha chôm chôm/sầu riêng)
export const PRIMARY_FARMER_PRODUCER_ID = 'prod-ba-tu-long-khanh';

export const INITIAL_PRODUCERS = [
  {
    id: 'prod-ba-tu-long-khanh',
    slug: 'nha-vuon-ba-tu',
    businessName: 'Nhà vườn Ba Tư — Vườn cây ăn trái Long Khánh',
    ownerName: 'Chú Ba Tư (Nhân vật giả lập)',
    area: 'Ấp Bảo Vinh, TP. Long Khánh, Đồng Nai',
    farmSize: '2,5 ha chuyên canh chôm chôm nhãn, chôm chôm Thái & sầu riêng Ri6/Monthong',
    ocopStars: 4,
    certStatusLabel: 'Chứng nhận OCOP 4 sao minh họa (Dữ liệu mô phỏng Vòng Sơ loại)',
    certRefNo: 'MINH-HOA-OCOP-LK-2026',
    publicContact: 'Điểm nhận tại vườn: Cổng vườn Ba Tư, Bảo Vinh, Long Khánh (Mô phỏng)',
    story:
      'Gia đình chú Ba Tư canh tác 2,5 ha vườn cây ăn trái theo hướng hữu cơ tại đất đỏ Long Khánh hơn 15 năm. Nông sản chín rộ thường bị thương lái ép giá; nay vườn tự chụp ảnh, đọc giọng nói đăng bán và phối hợp 2 đoàn viên phường tổ chức livestream ngay dưới tán cây.',
    verified: true,
    isFeaturedGarden: true,
    seedTag: SEED_TAG
  },
  {
    id: 'prod-dinh-quan-cashew',
    slug: 'htx-nong-san-dinh-quan',
    businessName: 'HTX Nông Sản Đồi Gió Định Quán',
    ownerName: 'Nguyễn Văn Hùng (Giả lập)',
    area: 'Huyện Định Quán, Đồng Nai',
    farmSize: '12 ha điều liên kết',
    ocopStars: 4,
    certStatusLabel: 'OCOP 4 sao (Dữ liệu pilot — minh họa)',
    certRefNo: 'PILOT-CERT-DQ-01',
    publicContact: 'Liên hệ gian hàng HTX Định Quán (Mô phỏng)',
    story: 'Canh tác điều hữu cơ trên vùng đất bazan Định Quán, thu hái thủ công và rang củi giữ nguyên vị béo tự nhiên.',
    verified: true,
    seedTag: SEED_TAG
  },
  {
    id: 'prod-tan-trieu-pomelo',
    slug: 'co-so-buoi-tan-trieu',
    businessName: 'Cơ sở Chế biến Bưởi Làng Tân Triều',
    ownerName: 'Trần Thị Thu Hà (Giả lập)',
    area: 'Huyện Vĩnh Cửu, Đồng Nai',
    farmSize: '4 ha bưởi đường lá cam',
    ocopStars: 4,
    certStatusLabel: 'OCOP 4 sao (Dữ liệu pilot — minh họa)',
    certRefNo: 'PILOT-CERT-TT-02',
    publicContact: 'Liên hệ cơ sở Tân Triều (Mô phỏng)',
    story: 'Tận dụng 100% trái bưởi đường lá cam đặc sản Tân Triều để chế biến vỏ bưởi sấy dẻo và tinh dầu bưởi nguyên chất.',
    verified: true,
    seedTag: SEED_TAG
  },
  {
    id: 'prod-long-khanh-honey',
    slug: 'trai-ong-rung-long-khanh',
    businessName: 'Trại Ong Mùa Hoa Long Khánh',
    ownerName: 'Lê Minh Tuấn (Giả lập)',
    area: 'TP. Long Khánh, Đồng Nai',
    farmSize: '180 đàn ong đặt tại vườn trái cây',
    ocopStars: 4,
    certStatusLabel: 'OCOP 4 sao (Dữ liệu pilot — minh họa)',
    certRefNo: 'PILOT-CERT-LK-03',
    publicContact: 'Liên hệ trại ong Long Khánh (Mô phỏng)',
    story: 'Đặt đàn ong trực tiếp tại các vườn chôm chôm, sầu riêng Long Khánh vào mùa hoa nở rộ, kiểm soát thủy phần dưới 20%.',
    verified: true,
    seedTag: SEED_TAG
  },
  {
    id: 'prod-xuan-loc-herbs',
    slug: 'nong-trai-thao-moc-xuan-loc',
    businessName: 'Nông trại Thảo mộc Núi Chứa Chan',
    ownerName: 'Phạm Thị Mai (Giả lập)',
    area: 'Huyện Xuân Lộc, Đồng Nai',
    farmSize: '3,2 ha thảo mộc sạch',
    ocopStars: 3,
    certStatusLabel: 'OCOP 3 sao (Dữ liệu pilot — minh họa)',
    certRefNo: 'PILOT-CERT-XL-04',
    publicContact: 'Liên hệ nông trại Xuân Lộc (Mô phỏng)',
    story: 'Liên kết 18 hộ thanh niên trồng khổ qua rừng và hồ tiêu sạch dưới chân núi Chứa Chan, sấy lạnh giữ màu xanh tự nhiên.',
    verified: true,
    seedTag: SEED_TAG
  },
  {
    id: 'prod-cam-my-coffee',
    slug: 'xuong-ca-phe-cam-my',
    businessName: 'Xưởng Cà phê Thanh Niên Cẩm Mỹ',
    ownerName: 'Đỗ Hoàng Nam (Giả lập)',
    area: 'Huyện Cẩm Mỹ, Đồng Nai',
    farmSize: '6 ha cà phê & ca cao',
    ocopStars: 4,
    certStatusLabel: 'OCOP 4 sao (Dữ liệu pilot — minh họa)',
    certRefNo: 'PILOT-CERT-CM-05',
    publicContact: 'Liên hệ xưởng cà phê Cẩm Mỹ (Mô phỏng)',
    story: 'Thu mua trái chín 95% từ các vườn Robusta và Ca cao Đồng Nai, rang mộc từng mẻ nhỏ cho hương vị đậm đà hậu ngọt.',
    verified: true,
    seedTag: SEED_TAG
  },
  {
    id: 'prod-trang-bom-banana',
    slug: 'htx-chuoi-say-trang-bom',
    businessName: 'Tổ hợp tác Nông sản Sạch Trảng Bom',
    ownerName: 'Võ Thành Đạt (Giả lập)',
    area: 'Huyện Trảng Bom, Đồng Nai',
    farmSize: '5 ha chuối sạch',
    ocopStars: 3,
    certStatusLabel: 'OCOP 3 sao (Dữ liệu pilot — minh họa)',
    certRefNo: 'PILOT-CERT-TB-06',
    publicContact: 'Liên hệ tổ hợp tác Trảng Bom (Mô phỏng)',
    story: 'Giải quyết đầu ra cho vùng trồng chuối xuất khẩu Trảng Bom bằng công nghệ sấy chân không giòn tan, không đường tinh luyện.',
    verified: true,
    seedTag: SEED_TAG
  }
];

// Nhật ký mùa vụ cho sản phẩm/lô của Nhà vườn Ba Tư & các SKU pilot
export const INITIAL_SEASON_LOGS = {
  'LK-CC-2411': {
    batchCode: 'LK-CC-2411',
    productSku: 'NVBT-01',
    productTitle: 'Chôm chôm nhãn Long Khánh hái chín vườn Ba Tư',
    producerName: 'Nhà vườn Ba Tư (2,5 ha Long Khánh)',
    harvestWindow: 'Vụ chính 11/2026',
    milestones: [
      {
        stage: 'Chăm sóc & Bón phân',
        date: '15/09/2026',
        location: 'Lô A1 (1,2 ha), Ấp Bảo Vinh, Long Khánh',
        detail: 'Bón phân hữu cơ vi sinh ủ từ vỏ trái cây, tỉa cành tạo tán thông thoáng, không dùng thuốc kích chín.',
        inspector: 'Chú Ba Tư ghi nhận (Mô phỏng)'
      },
      {
        stage: 'Thu hoạch tại vườn',
        date: '23/11/2026 · 05:30',
        location: 'Vườn Ba Tư, Long Khánh',
        detail: 'Hái thủ công lúc sáng sớm khi trái chín đỏ 85–90%, giữ nguyên chùm cuống tươi để bảo quản độ giòn.',
        inspector: 'Đội thu hái gia đình Ba Tư'
      },
      {
        stage: 'Đóng gói & Dán tem QR',
        date: '24/11/2026 · 07:00',
        location: 'Khu sơ chế tại vườn Ba Tư',
        detail: 'Phân loại trái đồng đều 1kg/rổ hoặc thùng carton thoáng khí, dán tem OCOP minh họa và mã QR truy xuất lô LK-CC-2411.',
        inspector: 'Đoàn viên Minh Anh hỗ trợ nhập liệu mẫu'
      }
    ]
  },
  'LK-SR-2411': {
    batchCode: 'LK-SR-2411',
    productSku: 'NVBT-02',
    productTitle: 'Sầu riêng Ri6 cơm vàng hạt lép Long Khánh',
    producerName: 'Nhà vườn Ba Tư (2,5 ha Long Khánh)',
    harvestWindow: 'Vụ cuối năm 11/2026',
    milestones: [
      {
        stage: 'Chăm sóc & Bao trái',
        date: '02/09/2026',
        location: 'Lô B2 (0,8 ha), Ấp Bảo Vinh, Long Khánh',
        detail: 'Tưới nhỏ giọt giữ ẩm đất đỏ bazan, bổ sung kali sinh học giúp cơm vàng dẻo, hạn chế sượng nước.',
        inspector: 'Chú Ba Tư ghi nhận (Mô phỏng)'
      },
      {
        stage: 'Thu hoạch rụng tự nhiên / cắt già',
        date: '23/11/2026 · 06:00',
        location: 'Vườn Ba Tư, Long Khánh',
        detail: 'Kiểm tra gõ trái đạt tuổi 105 ngày sau đậu trái, cắt trái già trên cây hoặc thu trái rụng đêm trong lưới hứng.',
        inspector: 'Chú Ba Tư & con trai'
      },
      {
        stage: 'Đóng gói & Giao vườn / Gửi xe',
        date: '24/11/2026 · 08:15',
        location: 'Điểm sơ chế vườn Ba Tư',
        detail: 'Bọc lưới xốp từng trái 2–3,5kg hoặc tách múi hộp lạnh theo đơn đặt từ Chợ OCOP Thanh Niên.',
        inspector: 'Đoàn viên Hoàng Phúc kiểm đơn mẫu'
      }
    ]
  },
  'LK-CT-2411': {
    batchCode: 'LK-CT-2411',
    productSku: 'NVBT-03',
    productTitle: 'Chôm chôm Thái giòn ngọt tróc hạt vườn Ba Tư',
    producerName: 'Nhà vườn Ba Tư (2,5 ha Long Khánh)',
    harvestWindow: 'Vụ chính 11/2026',
    milestones: [
      {
        stage: 'Chăm sóc sinh học',
        date: '20/09/2026',
        location: 'Lô A2, Long Khánh',
        detail: 'Sử dụng bẫy côn trùng sinh học và cắt cỏ giữ thảm thực vật giữ ẩm tự nhiên.',
        inspector: 'Chú Ba Tư'
      },
      {
        stage: 'Thu hoạch',
        date: '23/11/2026 · 06:15',
        location: 'Vườn Ba Tư, Long Khánh',
        detail: 'Chọn hái trái đỏ cam tươi, râu xanh còn mềm.',
        inspector: 'Tổ hợp tác Long Khánh'
      },
      {
        stage: 'Đóng gói',
        date: '24/11/2026 · 07:30',
        location: 'Vườn Ba Tư',
        detail: 'Đóng túi lưới / thùng thoáng 1kg–5kg theo đơn đặt trước.',
        inspector: 'Đoàn viên Minh Anh'
      }
    ]
  },
  'LK-MT-2411': {
    batchCode: 'LK-MT-2411',
    productSku: 'NVBT-04',
    productTitle: 'Sầu riêng Monthong vườn Ba Tư Long Khánh (tính theo kg)',
    producerName: 'Nhà vườn Ba Tư (2,5 ha Long Khánh)',
    harvestWindow: 'Vụ cuối năm 11/2026',
    milestones: [
      {
        stage: 'Chăm sóc & Tỉa trái',
        date: '28/08/2026',
        location: 'Lô B1, Long Khánh',
        detail: 'Tỉa bớt trái non giữ tối đa 2 trái/cành để đạt độ ngọt cơm béo.',
        inspector: 'Chú Ba Tư'
      },
      {
        stage: 'Thu hoạch',
        date: '23/11/2026 · 05:45',
        location: 'Vườn Ba Tư',
        detail: 'Thu hái đủ độ già, để chín tự nhiên trên rơm khô 2 ngày.',
        inspector: 'Chú Ba Tư'
      },
      {
        stage: 'Đóng gói',
        date: '24/11/2026 · 08:30',
        location: 'Khu sơ chế Bảo Vinh',
        detail: 'Cân điện tử minh bạch từng trái, gắn tem truy xuất mã lô LK-MT-2411.',
        inspector: 'Đoàn viên Hoàng Phúc'
      }
    ]
  },
  'LK-MC-2411': {
    batchCode: 'LK-MC-2411',
    productSku: 'NVBT-05',
    productTitle: 'Măng cụt xen canh vườn Ba Tư Long Khánh',
    producerName: 'Nhà vườn Ba Tư (2,5 ha Long Khánh)',
    harvestWindow: 'Đợt hái thử 11/2026',
    milestones: [
      {
        stage: 'Chăm sóc hữu cơ',
        date: '10/09/2026',
        location: 'Lô C1 (0,5 ha), Long Khánh',
        detail: 'Trồng xen dưới tán sầu riêng, không thuốc diệt cỏ.',
        inspector: 'Chú Ba Tư'
      },
      {
        stage: 'Thu hoạch bằng vợt vải',
        date: '23/11/2026 · 07:00',
        location: 'Vườn Ba Tư',
        detail: 'Hái bằng vợt tránh rơi dập vỏ làm chảy mủ vàng vào múi.',
        inspector: 'Gia đình Ba Tư'
      },
      {
        stage: 'Đóng gói',
        date: '24/11/2026 · 09:00',
        location: 'Vườn Ba Tư',
        detail: 'Xếp khay 1kg–2kg có lót giấy hút ẩm, sẵn sàng giao trong ngày.',
        inspector: 'Đoàn viên Minh Anh'
      }
    ]
  }
};

// 5 sản phẩm kịch bản chính Nhà vườn Ba Tư (35.000 - 120.000đ/kg) + 10 SKU OCOP Đồng Nai pilot
const RAW_PILOT_PRODUCTS = [
  {
    id: 'nvbt-01',
    sku: 'NVBT-01',
    batchCode: 'LK-CC-2411',
    slug: 'chom-chom-nhan-long-khanh-vuon-ba-tu',
    producerId: 'prod-ba-tu-long-khanh',
    categoryId: 'trai-cay-tuoi',
    title: 'Chôm chôm nhãn Long Khánh hái chín vườn Ba Tư (1 kg)',
    unit: '1 kg',
    spec: 'Trái tròn đều, vỏ đỏ giòn, cùi dày tróc hạt, hái sáng sớm tại Long Khánh.',
    area: 'Long Khánh, Đồng Nai',
    priceVnd: 45000,
    priceUpdatedAt: '2026-11-24T07:00:00Z',
    stock: 180,
    commissionRateBps: 1000,
    commissionCondition: 'Sản phẩm chủ lực Nhà vườn Ba Tư (dữ liệu mẫu Vòng Sơ loại).',
    status: 'published',
    certStatus: 'verified_pilot',
    ocopStars: 4,
    mediaKitReady: true,
    accentHex: '#B91C1C',
    secondaryHex: '#15803D',
    description:
      'Chôm chôm nhãn trồng trên đất đỏ bazan Long Khánh tại vườn Ba Tư 2,5 ha, vị ngọt thanh giòn sần sật, giao tươi trong ngày hoặc khách ghé nhận trực tiếp tại vườn.',
    story: 'Thu hái mỗi sáng từ 5h30 theo đơn đặt trước để đảm bảo cuống tươi xanh.',
    soldCountDemo: 620,
    listings: [
      {
        id: 'lst-nvbt-01',
        platform: 'tiktok',
        shopId: 'shop_batu_lk',
        externalItemId: 'TT-NVBT-01',
        url: 'https://shop.tiktok.com/view/product/pilot-nvbt-01',
        status: 'active',
        isDemoTarget: true
      }
    ]
  },
  {
    id: 'nvbt-02',
    sku: 'NVBT-02',
    batchCode: 'LK-SR-2411',
    slug: 'sau-rieng-ri6-vuon-ba-tu-long-khanh',
    producerId: 'prod-ba-tu-long-khanh',
    categoryId: 'trai-cay-tuoi',
    title: 'Sầu riêng Ri6 cơm vàng hạt lép vườn Ba Tư (1 kg)',
    unit: '1 kg',
    spec: 'Cơm vàng đậm, béo ngọt không sượng, tính giá theo kg thực cân tại vườn.',
    area: 'Long Khánh, Đồng Nai',
    priceVnd: 115000,
    priceUpdatedAt: '2026-11-24T07:15:00Z',
    stock: 95,
    commissionRateBps: 1000,
    commissionCondition: 'Đơn tối thiểu 1 kg (hỗ trợ tách múi hoặc nguyên trái tại vườn).',
    status: 'published',
    certStatus: 'verified_pilot',
    ocopStars: 4,
    mediaKitReady: true,
    accentHex: '#B45309',
    secondaryHex: '#15803D',
    description:
      'Sầu riêng Ri6 Long Khánh đạt đủ tuổi thu hoạch tự nhiên trên cây, mùi thơm dịu tự nhiên, hoàn toàn không nhúng thuốc ép chín.',
    story: 'Khách đặt từ 2 kg trở lên có thể xem cân trực tiếp qua livestream của đoàn viên.',
    soldCountDemo: 590,
    listings: [
      {
        id: 'lst-nvbt-02',
        platform: 'shopee',
        shopId: 'shop_batu_lk_sp',
        externalItemId: 'SP-NVBT-02',
        url: 'https://shopee.vn/sau-rieng-ri6-long-khanh-pilot-i.1000.2002',
        status: 'active',
        isDemoTarget: true
      }
    ]
  },
  {
    id: 'nvbt-03',
    sku: 'NVBT-03',
    batchCode: 'LK-CT-2411',
    slug: 'chom-chom-thai-vuon-ba-tu-long-khanh',
    producerId: 'prod-ba-tu-long-khanh',
    categoryId: 'trai-cay-tuoi',
    title: 'Chôm chôm Thái giòn ngọt vườn Ba Tư (1 kg)',
    unit: '1 kg',
    spec: 'Trái to, râu xanh mềm, thịt dày giòn ráo nước, đóng rổ thoáng.',
    area: 'Long Khánh, Đồng Nai',
    priceVnd: 38000,
    priceUpdatedAt: '2026-11-24T07:20:00Z',
    stock: 250,
    commissionRateBps: 1000,
    commissionCondition: 'Giá ưu đãi tại vườn Long Khánh (mô phỏng Vòng Sơ loại).',
    status: 'published',
    certStatus: 'verified_pilot',
    ocopStars: 3,
    mediaKitReady: true,
    accentHex: '#15803D',
    secondaryHex: '#B91C1C',
    description:
      'Chôm chôm Thái Long Khánh chín cây tự nhiên, tróc hạt sạch không dính lụa, thích hợp mua gia đình hoặc biếu tặng.',
    story: 'Thuộc lô A2 vườn Ba Tư — được đoàn viên hỗ trợ quay clip ngắn 15s.',
    soldCountDemo: 510,
    listings: [
      {
        id: 'lst-nvbt-03',
        platform: 'tiktok',
        shopId: 'shop_batu_lk',
        externalItemId: 'TT-NVBT-03',
        url: 'https://shop.tiktok.com/view/product/pilot-nvbt-03',
        status: 'active',
        isDemoTarget: true
      }
    ]
  },
  {
    id: 'nvbt-04',
    sku: 'NVBT-04',
    batchCode: 'LK-MT-2411',
    slug: 'sau-rieng-monthong-vuon-ba-tu-long-khanh',
    producerId: 'prod-ba-tu-long-khanh',
    categoryId: 'trai-cay-tuoi',
    title: 'Sầu riêng Monthong cơm dày vườn Ba Tư (1 kg)',
    unit: '1 kg',
    spec: 'Múi to mịn, vị ngọt thanh, ít xơ, đóng hộp bảo quản mát khi giao xa.',
    area: 'Long Khánh, Đồng Nai',
    priceVnd: 120000,
    priceUpdatedAt: '2026-11-24T07:30:00Z',
    stock: 70,
    commissionRateBps: 1100,
    commissionCondition: 'Sản phẩm cao cấp nhất trong nhóm 5 đặc sản vườn Ba Tư.',
    status: 'published',
    certStatus: 'verified_pilot',
    ocopStars: 4,
    mediaKitReady: true,
    accentHex: '#CA8A04',
    secondaryHex: '#15803D',
    description:
      'Sầu riêng Monthong vườn Ba Tư cắt già tự nhiên trên cây, cơm dày dẻo béo nhẹ phù hợp cả người thích vị dịu.',
    story: 'Mỗi lô có nhật ký tỉa trái và ngày thu hoạch rõ ràng qua mã QR.',
    soldCountDemo: 480,
    listings: [
      {
        id: 'lst-nvbt-04',
        platform: 'lazada',
        shopId: 'shop_batu_lk_lz',
        externalItemId: 'LZ-NVBT-04',
        url: 'https://www.lazada.vn/products/sau-rieng-monthong-pilot-i2004.html',
        status: 'active',
        isDemoTarget: true
      }
    ]
  },
  {
    id: 'nvbt-05',
    sku: 'NVBT-05',
    batchCode: 'LK-MC-2411',
    slug: 'mang-cut-xen-canh-vuon-ba-tu-long-khanh',
    producerId: 'prod-ba-tu-long-khanh',
    categoryId: 'trai-cay-tuoi',
    title: 'Măng cụt xen canh vườn Ba Tư Long Khánh (1 kg)',
    unit: '1 kg',
    spec: 'Trái vừa 7–9 trái/kg, hái vợt không dập mủ, vị chua ngọt cân bằng.',
    area: 'Long Khánh, Đồng Nai',
    priceVnd: 65000,
    priceUpdatedAt: '2026-11-24T07:40:00Z',
    stock: 110,
    commissionRateBps: 1000,
    commissionCondition: 'Hái theo đợt cuối tuần tại Long Khánh.',
    status: 'published',
    certStatus: 'verified_pilot',
    ocopStars: 3,
    mediaKitReady: true,
    accentHex: '#7C2D12',
    secondaryHex: '#15803D',
    description:
      'Măng cụt trồng xen canh dưới tán sầu riêng giúp đất tơi xốp, vỏ tím sẫm mỏng và múi trắng mọng nước.',
    story: 'Đoàn viên hỗ trợ làm hộp quà 2kg bán thử cuối tuần.',
    soldCountDemo: 430,
    listings: [
      {
        id: 'lst-nvbt-05',
        platform: 'shopee',
        shopId: 'shop_batu_lk_sp',
        externalItemId: 'SP-NVBT-05',
        url: 'https://shopee.vn/mang-cut-long-khanh-pilot-i.1000.2005',
        status: 'active',
        isDemoTarget: true
      }
    ]
  },
  // 10 SKU OCOP Đồng Nai mở rộng (giữ nguyên để bảo đảm các ca kiểm thử hệ thống & bản tổng thể)
  {
    id: 'sku-01',
    sku: 'OCOP-DN-001',
    batchCode: 'DQ-HD-2411',
    slug: 'hat-dieu-rang-muoi-vo-lua-dinh-quan-500g',
    producerId: 'prod-dinh-quan-cashew',
    categoryId: 'hat-say',
    title: 'Hạt điều rang muối vỏ lụa Định Quán 500g',
    unit: 'Hộp 500g',
    spec: 'Hạt loại A size W240, rang củi muối biển, đóng hộp hút chân không.',
    area: 'Định Quán, Đồng Nai',
    priceVnd: 165000,
    priceUpdatedAt: '2026-11-23T08:00:00Z',
    stock: 240,
    commissionRateBps: 1200,
    commissionCondition: 'Áp dụng cho đơn hoàn thành sau thời gian đổi trả 7 ngày của sàn.',
    status: 'published',
    certStatus: 'verified_pilot',
    ocopStars: 4,
    mediaKitReady: true,
    accentHex: '#15803D',
    secondaryHex: '#B45309',
    description:
      'Hạt điều nguyên hạt vỏ lụa thu hoạch vụ mới tại Định Quán, rang bằng củi điều truyền thống giúp hạt giòn rụm, thơm bùi mà không gắt dầu.',
    story: 'Mỗi hộp 500g tương đương 1,8kg điều tươi từ 14 hộ nông dân liên kết xã Phú Ngọc.',
    soldCountDemo: 412,
    listings: [
      {
        id: 'lst-01-tt',
        platform: 'tiktok',
        shopId: 'shop_dq_cashew_tt',
        externalItemId: 'TT-900101',
        url: 'https://shop.tiktok.com/view/product/pilot-ocop-dn-001',
        status: 'active',
        isDemoTarget: true
      },
      {
        id: 'lst-01-sp',
        platform: 'shopee',
        shopId: 'shop_dq_cashew_sp',
        externalItemId: 'SP-880101',
        url: 'https://shopee.vn/hat-dieu-rang-muoi-dinh-quan-pilot-i.1001.9001',
        status: 'active',
        isDemoTarget: true
      }
    ]
  },
  {
    id: 'sku-02',
    sku: 'OCOP-DN-002',
    batchCode: 'TT-VB-2411',
    slug: 'vo-buoi-say-deo-tan-trieu-250g',
    producerId: 'prod-tan-trieu-pomelo',
    categoryId: 'hat-say',
    title: 'Vỏ bưởi sấy dẻo ít đường Tân Triều 250g',
    unit: 'Túi zip 250g',
    spec: 'Vỏ bưởi đường lá cam non, sấy dẻo giữ tinh dầu dịu nhẹ.',
    area: 'Vĩnh Cửu, Đồng Nai',
    priceVnd: 95000,
    priceUpdatedAt: '2026-11-23T09:15:00Z',
    stock: 310,
    commissionRateBps: 1500,
    commissionCondition: 'Áp dụng toàn bộ đơn hợp lệ từ kênh Affiliate Đoàn viên.',
    status: 'published',
    certStatus: 'verified_pilot',
    ocopStars: 4,
    mediaKitReady: true,
    accentHex: '#15803D',
    secondaryHex: '#CA8A04',
    description:
      'Món ăn vặt lành mạnh từ làng bưởi Tân Triều nổi tiếng: vị the dịu đầu lưỡi, dẻo mềm không khô cứng, phù hợp giới văn phòng và quà biếu.',
    story: 'Quy trình xử lý tinh dầu giúp giảm vị đắng mà vẫn giữ hương thơm tự nhiên của bưởi Tân Triều.',
    soldCountDemo: 538,
    listings: [
      {
        id: 'lst-02-tt',
        platform: 'tiktok',
        shopId: 'shop_tantrieu_tt',
        externalItemId: 'TT-900102',
        url: 'https://shop.tiktok.com/view/product/pilot-ocop-dn-002',
        status: 'active',
        isDemoTarget: true
      },
      {
        id: 'lst-02-sp',
        platform: 'shopee',
        shopId: 'shop_tantrieu_sp',
        externalItemId: 'SP-880102',
        url: 'https://shopee.vn/vo-buoi-say-deo-tan-trieu-pilot-i.1002.9002',
        status: 'active',
        isDemoTarget: true
      },
      {
        id: 'lst-02-lz',
        platform: 'lazada',
        shopId: 'shop_tantrieu_lz',
        externalItemId: 'LZ-770102',
        url: 'https://www.lazada.vn/products/vo-buoi-say-deo-tan-trieu-pilot-i9002.html',
        status: 'active',
        isDemoTarget: true
      }
    ]
  },
  {
    id: 'sku-03',
    sku: 'OCOP-DN-003',
    batchCode: 'LK-MO-2411',
    slug: 'mat-ong-hoa-chom-chom-long-khanh-500ml',
    producerId: 'prod-long-khanh-honey',
    categoryId: 'mat-ong-tra',
    title: 'Mật ong hoa chôm chôm Long Khánh 500ml',
    unit: 'Chai thủy tinh 500ml',
    spec: 'Mật ong nguyên chất 100%, đóng chai thủy tinh nắp thiếc có tem niêm phong.',
    area: 'TP. Long Khánh, Đồng Nai',
    priceVnd: 210000,
    priceUpdatedAt: '2026-11-22T14:30:00Z',
    stock: 165,
    commissionRateBps: 1200,
    commissionCondition: 'Hoa hồng tính trên giá sau mã giảm giá của shop.',
    status: 'published',
    certStatus: 'verified_pilot',
    ocopStars: 4,
    mediaKitReady: true,
    accentHex: '#B45309',
    secondaryHex: '#15803D',
    description:
      'Mật ong thu hoạch mùa hoa chôm chôm Long Khánh có màu hổ phách sánh mịn, mùi thơm trái cây đặc trưng, không pha đường.',
    story: 'Mỗi lô mật đều có ngày quay mật rõ ràng và kiểm định độ ẩm dưới 20%.',
    soldCountDemo: 289,
    listings: [
      {
        id: 'lst-03-sp',
        platform: 'shopee',
        shopId: 'shop_longkhanh_sp',
        externalItemId: 'SP-880103',
        url: 'https://shopee.vn/mat-ong-hoa-chom-chom-long-khanh-pilot-i.1003.9003',
        status: 'active',
        isDemoTarget: true
      },
      {
        id: 'lst-03-lz',
        platform: 'lazada',
        shopId: 'shop_longkhanh_lz',
        externalItemId: 'LZ-770103',
        url: 'https://www.lazada.vn/products/mat-ong-long-khanh-pilot-i9003.html',
        status: 'active',
        isDemoTarget: true
      }
    ]
  },
  {
    id: 'sku-04',
    sku: 'OCOP-DN-004',
    batchCode: 'XL-TK-2411',
    slug: 'tra-kho-qua-rung-xuan-loc-30-tui-loc',
    producerId: 'prod-xuan-loc-herbs',
    categoryId: 'mat-ong-tra',
    title: 'Trà khổ qua rừng Núi Chứa Chan 30 túi lọc',
    unit: 'Hộp 30 túi lọc (60g)',
    spec: 'Khổ qua rừng thái lát sấy lạnh phối cỏ ngọt dịu nhẹ, túi lọc giấy không tẩy.',
    area: 'Xuân Lộc, Đồng Nai',
    priceVnd: 120000,
    priceUpdatedAt: '2026-11-23T07:45:00Z',
    stock: 400,
    commissionRateBps: 1400,
    commissionCondition: 'Khuyến khích kèm video pha trà 15s từ Video Studio.',
    status: 'published',
    certStatus: 'pending_review',
    ocopStars: 3,
    mediaKitReady: true,
    accentHex: '#15803D',
    secondaryHex: '#0F766E',
    description:
      'Trà túi lọc tiện lợi giúp thanh nhiệt, vị đắng thanh hậu ngọt dịu nhờ lá cỏ ngọt tự nhiên, phù hợp uống ấm hoặc ủ lạnh.',
    story: 'Sản phẩm của nhóm thanh niên khởi nghiệp xã Xuân Thọ nhằm nâng giá trị cây dược liệu bản địa.',
    soldCountDemo: 325,
    listings: [
      {
        id: 'lst-04-tt',
        platform: 'tiktok',
        shopId: 'shop_xuanloc_tt',
        externalItemId: 'TT-900104',
        url: 'https://shop.tiktok.com/view/product/pilot-ocop-dn-004',
        status: 'active',
        isDemoTarget: true
      },
      {
        id: 'lst-04-sp',
        platform: 'shopee',
        shopId: 'shop_xuanloc_sp',
        externalItemId: 'SP-880104',
        url: 'https://shopee.vn/tra-kho-qua-rung-xuan-loc-pilot-i.1004.9004',
        status: 'active',
        isDemoTarget: true
      }
    ]
  },
  {
    id: 'sku-05',
    sku: 'OCOP-DN-005',
    batchCode: 'CM-CP-2411',
    slug: 'ca-phe-robusta-rang-moc-cam-my-500g',
    producerId: 'prod-cam-my-coffee',
    categoryId: 'ca-phe-ca-cao',
    title: 'Cà phê Robusta rang mộc Cẩm Mỹ 500g',
    unit: 'Túi van 1 chiều 500g',
    spec: '100% Robusta hái chín sàng R18, rang vừa pha phin hoặc pha máy.',
    area: 'Cẩm Mỹ, Đồng Nai',
    priceVnd: 185000,
    priceUpdatedAt: '2026-11-21T16:20:00Z',
    stock: 190,
    commissionRateBps: 1000,
    commissionCondition: 'Áp dụng cho cả phiên bản hạt nguyên và bột pha phin.',
    status: 'published',
    certStatus: 'verified_pilot',
    ocopStars: 4,
    mediaKitReady: true,
    accentHex: '#78350F',
    secondaryHex: '#15803D',
    description:
      'Cà phê rang mộc không tẩm bơ đậu nành, giữ hương sô-cô-la đen và caramel đặc trưng của vùng đất đỏ Cẩm Mỹ.',
    story: 'Hỗ trợ người trồng cà phê chuyển từ bán xô sang đóng gói thương hiệu địa phương.',
    soldCountDemo: 274,
    listings: [
      {
        id: 'lst-05-sp',
        platform: 'shopee',
        shopId: 'shop_cammy_sp',
        externalItemId: 'SP-880105',
        url: 'https://shopee.vn/ca-phe-robusta-cam-my-pilot-i.1005.9005',
        status: 'active',
        isDemoTarget: true
      },
      {
        id: 'lst-05-tt',
        platform: 'tiktok',
        shopId: 'shop_cammy_tt',
        externalItemId: 'TT-900105',
        url: 'https://shop.tiktok.com/view/product/pilot-ocop-dn-005',
        status: 'active',
        isDemoTarget: true
      }
    ]
  },
  {
    id: 'sku-08',
    sku: 'OCOP-DN-008',
    batchCode: 'TB-CS-2411',
    slug: 'chuoi-say-gion-khong-duong-trang-bom-300g',
    producerId: 'prod-trang-bom-banana',
    categoryId: 'hat-say',
    title: 'Chuối sấy giòn không đường Trảng Bom 300g',
    unit: 'Combo 2 túi (300g)',
    spec: 'Chuối sứ chín cây thái lát mỏng sấy chân không, không phẩm màu.',
    area: 'Trảng Bom, Đồng Nai',
    priceVnd: 68000,
    priceUpdatedAt: '2026-11-23T06:30:00Z',
    stock: 520,
    commissionRateBps: 1200,
    commissionCondition: 'Sản phẩm phễu giá dễ chốt đơn trên livestream sinh viên.',
    status: 'published',
    certStatus: 'pending_review',
    ocopStars: 3,
    mediaKitReady: true,
    accentHex: '#CA8A04',
    secondaryHex: '#15803D',
    description:
      'Snack chuối giòn xốp giữ vị ngọt thanh tự nhiên từ chuối già hương & chuối sứ Trảng Bom, ít hút dầu nhờ công nghệ sấy chân không.',
    story: 'Tạo đầu ra ổn định cho bà con nông dân vùng chuối Bàu Hàm – Sông Thao.',
    soldCountDemo: 405,
    listings: [
      {
        id: 'lst-08-tt',
        platform: 'tiktok',
        shopId: 'shop_trangbom_tt',
        externalItemId: 'TT-900108',
        url: 'https://shop.tiktok.com/view/product/pilot-ocop-dn-008',
        status: 'active',
        isDemoTarget: true
      }
    ]
  },
  {
    id: 'sku-10',
    sku: 'OCOP-DN-010',
    batchCode: 'TT-TD-2411',
    slug: 'tinh-dau-buoi-nguyen-chat-tan-trieu-100ml',
    producerId: 'prod-tan-trieu-pomelo',
    categoryId: 'gia-vi-tinh-dau',
    title: 'Tinh dầu bưởi nguyên chất Tân Triều 100ml',
    unit: 'Chai xịt phun sương 100ml',
    spec: 'Chưng cất lôi cuốn hơi nước từ vỏ bưởi đường tươi, không cồn công nghiệp.',
    area: 'Vĩnh Cửu, Đồng Nai',
    priceVnd: 195000,
    priceUpdatedAt: '2026-11-23T08:40:00Z',
    stock: 150,
    commissionRateBps: 1600,
    commissionCondition: 'Tỷ lệ hoa hồng ưu đãi dành cho sinh viên review chăm sóc tóc.',
    status: 'published',
    certStatus: 'verified_pilot',
    ocopStars: 4,
    mediaKitReady: true,
    accentHex: '#15803D',
    secondaryHex: '#047857',
    description:
      'Tinh dầu vỏ bưởi nguyên chất Tân Triều dạng xịt tiện dụng hỗ trợ dưỡng tóc và khử mùi tự nhiên với hương bưởi tươi thanh mát.',
    story: 'Giúp tận dụng phụ phẩm vỏ bưởi tươi trong mùa thu hoạch, tăng thêm 30% thu nhập cho nhà vườn.',
    soldCountDemo: 465,
    listings: [
      {
        id: 'lst-10-tt',
        platform: 'tiktok',
        shopId: 'shop_tantrieu_tt',
        externalItemId: 'TT-900110',
        url: 'https://shop.tiktok.com/view/product/pilot-ocop-dn-010',
        status: 'active',
        isDemoTarget: true
      }
    ]
  }
];

const productPhotos = {
  "LK-CC-2411": rambutanNhan,
  "LK-SR-2411": durianRi6,
  "LK-CT-2411": rambutanThai,
  "LK-MT-2411": durianMonthong,
  "LK-MC-2411": mangosteen,
};

export const INITIAL_PRODUCTS = RAW_PILOT_PRODUCTS.map((p) => ({
  ...p,
  seedTag: SEED_TAG,
  imageUrl: productPhotos[p.batchCode] || buildProductArtworkDataUri({
    title: p.title,
    area: p.area,
    accentHex: p.accentHex,
    secondaryHex: p.secondaryHex,
    tag: `OCOP ${p.ocopStars}★ · ${p.sku}`
  })
}));

export const INITIAL_LIVESTREAM_SCHEDULE = [
  {
    id: 'live-01',
    dateLabel: 'Thứ Bảy · 28/11/2026',
    timeRange: '19:30 – 21:00',
    supporterName: 'Đoàn viên Minh Anh (Đoàn phường Xuân An)',
    supporterRole: 'Dẫn phiên & trả lời bình luận khách',
    producerId: 'prod-ba-tu-long-khanh',
    producerName: 'Nhà vườn Ba Tư (Long Khánh)',
    productSkus: ['NVBT-01', 'NVBT-02'],
    productSummary: 'Chôm chôm nhãn (45k/kg) & Sầu riêng Ri6 (115k/kg)',
    channelLabel: 'TikTok Shop & Trang cộng đồng địa phương (Mô phỏng)',
    status: 'upcoming',
    note: 'Quay trực tiếp tại lô A1 vườn Ba Tư, cân trái mẫu ngay trên bàn sơ chế.'
  },
  {
    id: 'live-02',
    dateLabel: 'Chủ Nhật · 29/11/2026',
    timeRange: '09:00 – 10:30',
    supporterName: 'Đoàn viên Hoàng Phúc (Đoàn trường CĐ Đồng Nai)',
    supporterRole: 'Kỹ thuật góc quay & ghim giỏ sản phẩm',
    producerId: 'prod-ba-tu-long-khanh',
    producerName: 'Nhà vườn Ba Tư (Long Khánh)',
    productSkus: ['NVBT-03', 'NVBT-04', 'NVBT-05'],
    productSummary: 'Chôm chôm Thái (38k/kg), Sầu riêng Monthong (120k/kg) & Măng cụt (65k/kg)',
    channelLabel: 'Shopee Live (Mô phỏng)',
    status: 'upcoming',
    note: 'Tặng kèm hướng dẫn quét QR kiểm tra nhật ký mùa vụ cho người xem.'
  },
  {
    id: 'live-03',
    dateLabel: 'Thứ Tư · 02/12/2026',
    timeRange: '20:00 – 21:15',
    supporterName: 'Đoàn viên Minh Anh & Hoàng Phúc',
    supporterRole: 'Phiên ghép 2 vườn Long Khánh – Tân Triều',
    producerId: 'prod-ba-tu-long-khanh',
    producerName: 'Nhà vườn Ba Tư + Cơ sở Tân Triều',
    productSkus: ['NVBT-01', 'OCOP-DN-002'],
    productSummary: 'Combo trái cây tươi Long Khánh & Vỏ bưởi sấy Tân Triều',
    channelLabel: 'TikTok Shop (Mô phỏng)',
    status: 'preparing',
    note: 'Đang kiểm kê số lượng thùng đóng hàng và kịch bản 30 giây mở đầu.'
  },
  {
    id: 'live-04',
    dateLabel: 'Thứ Sáu · 20/11/2026',
    timeRange: '19:00 – 20:00',
    supporterName: 'Đoàn viên Minh Anh (Đoàn phường Xuân An)',
    supporterRole: 'Chạy thử nghiệm kịch bản 15 phút',
    producerId: 'prod-ba-tu-long-khanh',
    producerName: 'Nhà vườn Ba Tư (Long Khánh)',
    productSkus: ['NVBT-01'],
    productSummary: 'Chôm chôm nhãn Long Khánh hái sáng',
    channelLabel: 'Phiên thử nội bộ (Demo)',
    status: 'completed_demo',
    note: 'Đã hoàn thành quay thử, rút kinh nghiệm ánh sáng đèn pin khi trời tối.'
  }
];

export const VIDEO_TEMPLATES = [
  {
    id: 'tpl-15s',
    durationSec: 15,
    title: 'Mẫu 15 giây — Bắt trend nhanh TikTok / Reels',
    goal: 'Gây chú ý 3 giây đầu, nêu điểm mạnh nhất và mời bấm giỏ hàng.',
    scenes: [
      {
        id: 's1',
        startSec: 0,
        endSec: 4,
        title: 'Cảnh 1: Mở hộp cận cảnh',
        framingTip: 'Đặt sản phẩm chính giữa khung 9:16, ánh sáng tự nhiên bên cửa sổ, tay xoay nhẹ cho thấy tem QR.',
        teleprompter: 'Bà con ơi, đây là {{productTitle}} chuẩn vùng {{area}} mới hái sáng nay!'
      },
      {
        id: 's2',
        startSec: 4,
        endSec: 10,
        title: 'Cảnh 2: Thử trực tiếp chất lượng',
        framingTip: 'Đưa lại gần ống kính 25cm, bóc/tách múi thật chậm để thấy độ tươi ngon.',
        teleprompter: '{{spec}} Ngọt tự nhiên tại vườn, quét QR là thấy rõ nhật ký mùa vụ.'
      },
      {
        id: 's3',
        startSec: 10,
        endSec: 15,
        title: 'Cảnh 3: Giá & Chốt đơn',
        framingTip: 'Giơ sản phẩm ngang tầm vai, chỉ tay xuống góc dưới màn hình.',
        teleprompter: 'Chỉ {{priceText}} cho {{unit}}. Đặt ngay để nhận tại vườn hoặc giao tận nơi nhé!'
      }
    ]
  },
  {
    id: 'tpl-30s',
    durationSec: 30,
    title: 'Mẫu 30 giây — Chủ cơ sở tự giới thiệu sản phẩm',
    goal: 'Tạo niềm tin bằng câu chuyện vườn nhà + quy cách đóng gói rõ ràng.',
    scenes: [
      {
        id: 'm1',
        startSec: 0,
        endSec: 6,
        title: 'Cảnh 1: Chào từ vườn / xưởng',
        framingTip: 'Đứng trước vườn cây hoặc bàn sơ chế, đặt máy ngang tầm mắt.',
        teleprompter: 'Chào cả nhà, mình từ {{businessName}} tại {{area}}.'
      },
      {
        id: 'm2',
        startSec: 6,
        endSec: 16,
        title: 'Cảnh 2: Điểm khác biệt nguyên liệu',
        framingTip: 'Quay cận sản phẩm vừa hái kèm cây trồng phía sau.',
        teleprompter: 'Sản phẩm {{productTitle}} được chăm sóc hữu cơ: {{story}}'
      },
      {
        id: 'm3',
        startSec: 16,
        endSec: 24,
        title: 'Cảnh 3: Quy cách & Truy xuất QR',
        framingTip: 'Đưa tem QR minh họa vào gần ống kính 2 giây.',
        teleprompter: 'Đóng gói chuẩn {{unit}}, kèm mã QR xem nhật ký chăm sóc và thu hoạch từng lô.'
      },
      {
        id: 'm4',
        startSec: 24,
        endSec: 30,
        title: 'Cảnh 4: Kêu gọi hành động',
        framingTip: 'Cười tự nhiên, giữ sản phẩm ổn định 3 giây cuối.',
        teleprompter: 'Giá tham khảo {{priceText}}. Cả nhà bấm thêm vào giỏ hàng để ủng hộ nhà vườn nhé!'
      }
    ]
  },
  {
    id: 'tpl-45s',
    durationSec: 45,
    title: 'Mẫu 45 giây — Review chi tiết cho Đoàn viên hỗ trợ',
    goal: 'Giải đáp 3 thắc mắc phổ biến của khách trước khi ra quyết định mua.',
    scenes: [
      {
        id: 'l1',
        startSec: 0,
        endSec: 8,
        title: 'Cảnh 1: Hook câu hỏi thật',
        framingTip: 'Cầm sản phẩm trực diện, nói dứt khoát và rõ âm lượng.',
        teleprompter: 'Trái cây {{area}} đặt online có tươi như hái tại vườn? Hôm nay mình ghé vườn kiểm chứng {{productTitle}}!'
      },
      {
        id: 'l2',
        startSec: 8,
        endSec: 20,
        title: 'Cảnh 2: Mở hộp & Kiểm tra độ chín',
        framingTip: 'Quay bàn sơ chế sạch, tách vỏ kiểm tra phần cơm bên trong.',
        teleprompter: 'Hái sáng sớm giao trong ngày, {{spec}}'
      },
      {
        id: 'l3',
        startSec: 20,
        endSec: 34,
        title: 'Cảnh 3: Nhật ký mùa vụ & Cách nhận hàng',
        framingTip: 'Quét thử mã QR hiển thị trên điện thoại.',
        teleprompter: 'Có đủ 3 mốc chăm sóc, thu hoạch, đóng gói rõ ràng. Khách ở gần có thể ghé nhận trực tiếp tại vườn.'
      },
      {
        id: 'l4',
        startSec: 34,
        endSec: 45,
        title: 'Cảnh 4: Giá & Chốt đơn',
        framingTip: 'Hiển thị rõ sản phẩm kèm thẻ giá.',
        teleprompter: 'Giá chỉ {{priceText}} / {{unit}}. Đặt ngay trong ứng dụng Chợ OCOP Thanh Niên nhé!'
      }
    ]
  }
];

export const INITIAL_AFFILIATE_LINKS = [
  {
    id: 'aff-link-01',
    code: 'DN8K4M2P9Q',
    affiliateId: 'aff-member-1',
    affiliateName: 'Đoàn viên Minh Anh (Xuân An, Long Khánh)',
    productId: 'sku-02',
    platform: 'tiktok',
    targetUrl: 'https://shop.tiktok.com/view/product/pilot-ocop-dn-002',
    isDemoTarget: true,
    active: true,
    clicksCount: 34,
    createdAt: '2026-11-22T09:00:00Z',
    seedTag: SEED_TAG
  },
  {
    id: 'aff-link-02',
    code: 'DN7R3W5T2X',
    affiliateId: 'aff-member-1',
    affiliateName: 'Đoàn viên Minh Anh (Xuân An, Long Khánh)',
    productId: 'sku-01',
    platform: 'shopee',
    targetUrl: 'https://shopee.vn/hat-dieu-rang-muoi-dinh-quan-pilot-i.1001.9001',
    isDemoTarget: true,
    active: true,
    clicksCount: 21,
    createdAt: '2026-11-23T03:30:00Z',
    seedTag: SEED_TAG
  }
];

export const INITIAL_ORDERS = [
  {
    id: 'ord-ba-tu-01',
    orderCode: 'DON-LK-2411-01',
    platform: 'direct_ocop',
    shopId: 'vuon_ba_tu',
    externalOrderId: 'DON-LK-2411-01',
    producerId: 'prod-ba-tu-long-khanh',
    productId: 'nvbt-01',
    sku: 'NVBT-01',
    productTitle: 'Chôm chôm nhãn Long Khánh hái chín vườn Ba Tư (1 kg)',
    quantity: 3,
    items: [
      { productId: 'nvbt-01', sku: 'NVBT-01', title: 'Chôm chôm nhãn Long Khánh hái chín vườn Ba Tư (1 kg)', quantity: 3, unitPriceVnd: 45000 },
      { productId: 'nvbt-02', sku: 'NVBT-02', title: 'Sầu riêng Ri6 cơm vàng hạt lép vườn Ba Tư (1 kg)', quantity: 2, unitPriceVnd: 115000 }
    ],
    deliveryMethod: 'delivery',
    deliveryLabel: 'Giao tận nơi (TP. Biên Hòa — mô phỏng)',
    customerName: 'Khách hàng mẫu 01',
    customerPhone: '090x xxx 101 (Mẫu)',
    shippingAddress: 'Phường Tân Mai, TP. Biên Hòa (Địa chỉ mẫu)',
    shippingFeeVnd: 25000,
    grossAmountVnd: 390000,
    netAmountVnd: 365000,
    commissionRateBps: 1000,
    commissionVnd: 36500,
    affiliateLinkId: null,
    affiliateId: null,
    affiliateName: 'Đặt từ Chợ OCOP (Phiên live Minh Anh)',
    attributionStatus: 'unassigned',
    status: 'confirmed',
    source: 'demo_fixture',
    orderedAt: '2026-11-24T08:15:00Z',
    seedTag: SEED_TAG
  },
  {
    id: 'ord-ba-tu-02',
    orderCode: 'DON-LK-2411-02',
    platform: 'direct_ocop',
    shopId: 'vuon_ba_tu',
    externalOrderId: 'DON-LK-2411-02',
    producerId: 'prod-ba-tu-long-khanh',
    productId: 'nvbt-04',
    sku: 'NVBT-04',
    productTitle: 'Sầu riêng Monthong cơm dày vườn Ba Tư (1 kg)',
    quantity: 2,
    items: [
      { productId: 'nvbt-04', sku: 'NVBT-04', title: 'Sầu riêng Monthong cơm dày vườn Ba Tư (1 kg)', quantity: 2, unitPriceVnd: 120000 }
    ],
    deliveryMethod: 'pickup',
    deliveryLabel: 'Nhận trực tiếp tại Nhà vườn Ba Tư (Long Khánh)',
    customerName: 'Khách hàng mẫu 02',
    customerPhone: '091x xxx 202 (Mẫu)',
    shippingAddress: 'Nhận tại cổng vườn Ba Tư, Bảo Vinh, Long Khánh',
    shippingFeeVnd: 0,
    grossAmountVnd: 240000,
    netAmountVnd: 240000,
    commissionRateBps: 1100,
    commissionVnd: 0,
    affiliateLinkId: null,
    affiliateId: null,
    affiliateName: 'Khách ghé vườn Ba Tư',
    attributionStatus: 'unassigned',
    status: 'placed',
    source: 'demo_fixture',
    orderedAt: '2026-11-24T09:05:00Z',
    seedTag: SEED_TAG
  },
  {
    id: 'ord-demo-01',
    orderCode: 'TT-DEMO-20261122-001',
    platform: 'tiktok',
    shopId: 'shop_tantrieu_tt',
    externalOrderId: 'TT-DEMO-20261122-001',
    producerId: 'prod-tan-trieu-pomelo',
    productId: 'sku-02',
    sku: 'OCOP-DN-002',
    productTitle: 'Vỏ bưởi sấy dẻo ít đường Tân Triều 250g',
    quantity: 3,
    deliveryMethod: 'delivery',
    deliveryLabel: 'Giao tận nơi qua TikTok Shop (Mẫu)',
    grossAmountVnd: 285000,
    netAmountVnd: 285000,
    commissionRateBps: 1500,
    commissionVnd: 42750,
    affiliateLinkId: 'aff-link-01',
    affiliateId: 'aff-member-1',
    affiliateName: 'Đoàn viên Minh Anh (Xuân An, Long Khánh)',
    attributionStatus: 'attributed',
    status: 'completed',
    source: 'demo_fixture',
    orderedAt: '2026-11-22T11:15:00Z',
    seedTag: SEED_TAG
  }
];

export const INITIAL_LEDGER = [
  {
    id: 'ldg-01-d',
    txGroupId: 'tx-ord-01',
    orderId: 'ord-demo-01',
    affiliateId: 'aff-member-1',
    accountType: 'platform_escrow',
    direction: 'debit',
    amountVnd: 42750,
    state: 'available',
    note: 'Ghi nhận hoa hồng đơn TT-DEMO-20261122-001 (khả dụng mẫu)',
    createdAt: '2026-11-22T11:15:00Z',
    seedTag: SEED_TAG
  },
  {
    id: 'ldg-01-c',
    txGroupId: 'tx-ord-01',
    orderId: 'ord-demo-01',
    affiliateId: 'aff-member-1',
    accountType: 'affiliate_payable',
    direction: 'credit',
    amountVnd: 42750,
    state: 'available',
    note: 'Ghi nhận hoa hồng đơn TT-DEMO-20261122-001 (khả dụng mẫu)',
    createdAt: '2026-11-22T11:15:00Z',
    seedTag: SEED_TAG
  }
];

export const INITIAL_AUDIT_LOGS = [
  {
    id: 'aud-01',
    actorLabel: 'Hệ thống Demo Sơ loại',
    action: 'SEED_BA_TU_GARDEN',
    targetLabel: 'Nhà vườn Ba Tư (2,5 ha Long Khánh · 5 SKU)',
    detail: 'Khởi tạo dữ liệu giả lập cho kịch bản Vòng Sơ loại Đề 03.',
    createdAt: '2026-11-24T07:00:00Z'
  }
];

export const PILOT_ROADMAP_90_DAYS = [
  {
    phase: 'Giai đoạn 1 (Ngày 1–30)',
    title: 'Chuẩn hóa hồ sơ & Lên sàn 10 SKU Pilot',
    actions: [
      'Khảo sát Nhà vườn Ba Tư (Long Khánh) và các cơ sở OCOP 3–4 sao tiêu biểu.',
      'Chủ vườn tự đăng sản phẩm bằng ảnh + giọng nói, gắn tem QR nhật ký mùa vụ.',
      'Đoàn viên hỗ trợ quay video ngắn 15/30/45s và mở phiên livestream mẫu tại vườn.'
    ],
    targetKpis: [
      '10/10 SKU pilot có đủ ảnh, mô tả và nhật ký mùa vụ QR',
      'Tối thiểu 30 video ngắn từ chủ cơ sở (Mục tiêu KPI)',
      '100% đơn đặt thử đồng bộ về màn Quản lý đơn nhà vườn'
    ],
    measuredStatus: 'Đã sẵn sàng giao diện 6 màn cùng bộ dữ liệu mẫu Nhà vườn Ba Tư.'
  },
  {
    phase: 'Giai đoạn 2 (Ngày 31–60)',
    title: 'Kích hoạt mạng lưới Đoàn viên hỗ trợ & Livestream',
    actions: [
      'Tập huấn 50–100 đoàn viên/sinh viên tại Long Khánh & các trường ĐH/CĐ Đồng Nai.',
      'Phân công lịch livestream định kỳ cuối tuần tại vườn nguyên liệu.',
      'Theo dõi tỷ lệ hoàn hủy và thời gian giao hàng tươi từ vườn.'
    ],
    targetKpis: [
      '>= 80 đoàn viên tham gia hỗ trợ & chia sẻ (Mục tiêu KPI)',
      '>= 300 đơn hàng thử nghiệm (Mục tiêu KPI)',
      'Tỷ lệ hoàn hủy mục tiêu < 5%'
    ],
    measuredStatus: 'Chưa triển khai thực địa; đang ở mức prototype Vòng Sơ loại.'
  },
  {
    phase: 'Giai đoạn 3 (Ngày 61–90)',
    title: 'Đối soát minh bạch & Nhân rộng 150+ sản phẩm',
    actions: [
      'Tổng kết đánh giá từ 10 cơ sở đầu tiên để mở rộng toàn tỉnh Đồng Nai.',
      'Xin cấp quyền kết nối API đối tác TikTok Shop / Shopee / Lazada chính thức.'
    ],
    targetKpis: [
      '100% đơn hoàn thành đối soát minh bạch (Mục tiêu KPI)',
      'Sẵn sàng nhân rộng lên 150+ sản phẩm OCOP Đồng Nai'
    ],
    measuredStatus: 'Chưa bật thanh toán trực tuyến hoặc phát sóng trực tiếp thật.'
  }
];

export const SAMPLE_CSV_IMPORT_TEMPLATE = `platform,shop_id,external_order_id,sku,quantity,gross_amount_vnd,net_amount_vnd,affiliate_code,status
tiktok,shop_tantrieu_tt,TT-DEMO-20261124-101,OCOP-DN-002,2,190000,190000,DN8K4M2P9Q,confirmed`;
