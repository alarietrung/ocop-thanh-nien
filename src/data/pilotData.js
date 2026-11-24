import rambutanNhan from '../assets/orchard/rambutan-nhan.webp';
import durianRi6 from '../assets/orchard/durian-ri6.webp';
import rambutanThai from '../assets/orchard/rambutan-thai.webp';
import durianMonthong from '../assets/orchard/durian-monthong.webp';
import mangosteen from '../assets/orchard/mangosteen.webp';
import pomeloPeel from '../assets/orchard/pomelo-peel.jpg';
import cashewRoasted from '../assets/orchard/cashew-roasted.jpg';
import pomeloOil from '../assets/orchard/pomelo-oil.jpg';
import bananaChips from '../assets/orchard/banana-chips.jpg';
import bitterMelonTea from '../assets/orchard/bitter-melon-tea.jpg';
import rambutanHoney from '../assets/orchard/rambutan-honey.jpg';
import robustaCoffee from '../assets/orchard/robusta-coffee.jpg';
import { buildProductArtworkDataUri } from '../utils/formatters';

export const SEED_TAG = 'pilot-2026-batch-1';

export const BRANDING_EMBLEMS = [
  {
    id: 'doan-tncs-hcm',
    name: 'Đoàn TNCS Hồ Chí Minh',
    file: 'branding/doan-tncs-hcm.png',
    alt: 'Biểu trưng Đoàn Thanh niên Cộng sản Hồ Chí Minh',
    sourceLabel: 'printgo.vn',
    sourceUrl: 'https://printgo.vn/uploads/media/849982/download-mien-phi-file-logo-doan-thanh-nien-vector-moi-nhat-2025-9_1742265297.png'
  },
  {
    id: 'hoi-lhtn-vn',
    name: 'Hội Liên hiệp Thanh niên Việt Nam',
    file: 'branding/hoi-lhtn-vn.svg',
    alt: 'Biểu trưng Hội Liên hiệp Thanh niên Việt Nam',
    sourceLabel: 'Wikimedia Commons',
    sourceUrl: 'https://upload.wikimedia.org/wikipedia/commons/7/77/Bi%E1%BB%83u_tr%C6%B0ng_H%E1%BB%99i_Li%C3%AAn_hi%E1%BB%87p_Thanh_ni%C3%AAn_Vi%E1%BB%87t_Nam.svg'
  },
  {
    id: 'hoi-sv-vn',
    name: 'Hội Sinh viên Việt Nam',
    file: 'branding/hoi-sv-vn.svg',
    alt: 'Biểu trưng Hội Sinh viên Việt Nam',
    sourceLabel: 'Wikipedia tiếng Việt (Huy hiệu Hội SVVN.svg)',
    sourceUrl: 'https://vi.wikipedia.org/wiki/T%E1%BA%ADp_tin:Huy_hi%E1%BB%87u_H%E1%BB%99i_SVVN.svg'
  }
];

export const PRODUCT_CATEGORIES = [
  { id: 'all', label: 'Tất cả nhóm hàng' },
  { id: 'trai-cay-tuoi', label: 'Trái cây đặc sản Long Khánh' },
  { id: 'hat-say', label: 'Hạt & Nông sản sấy' },
  { id: 'mat-ong-tra', label: 'Mật ong & Trà thảo mộc' },
  { id: 'ca-phe-ca-cao', label: 'Cà phê & Ca cao' },
  { id: 'gia-vi-tinh-dau', label: 'Gia vị & Tinh dầu' }
];

export const PRIMARY_FARMER_PRODUCER_ID = 'prod-ba-tu-long-khanh';

export const DEMO_YOUTH_MEMBERS = [
  {
    id: 'aff-member-1',
    code: 'DV-LK-01',
    name: 'Đoàn viên Minh Anh',
    unit: 'Đoàn phường Xuân An, TP. Long Khánh',
    specialty: 'Hỗ trợ chụp ảnh, gắn tem QR & dẫn phiên livestream tại vườn',
    assignedProducerId: 'prod-ba-tu-long-khanh'
  },
  {
    id: 'aff-member-2',
    code: 'DV-DN-02',
    name: 'Đoàn viên Hoàng Phúc',
    unit: 'Đoàn trường CĐ Đồng Nai',
    specialty: 'Kỹ thuật quay dựng, ghim giỏ hàng & hướng dẫn chủ vườn xử lý đơn',
    assignedProducerId: 'prod-ba-tu-long-khanh'
  }
];

export const INITIAL_PRODUCERS = [
  {
    id: 'prod-ba-tu-long-khanh',
    slug: 'nha-vuon-ba-tu',
    businessName: 'Nhà vườn Ba Tư — Vườn cây ăn trái Long Khánh',
    ownerName: 'Chú Ba Tư (Nhân vật giả lập)',
    area: 'Ấp Bảo Vinh, TP. Long Khánh, Đồng Nai',
    farmSize: '2,5 ha chuyên canh chôm chôm nhãn, chôm chôm Thái & sầu riêng Ri6/Monthong',
    ocopStars: 4,
    certStatusLabel: 'OCOP 4 sao minh họa (Dữ liệu giả lập Đề 03)',
    certRefNo: 'MINH-HOA-OCOP-LK-2026',
    pickupPoint: 'Cổng Nhà vườn Ba Tư, Ấp Bảo Vinh, TP. Long Khánh, Đồng Nai',
    pickupHours: '07:30 – 17:30 hằng ngày',
    pickupEligible: true,
    publicContact: 'Điểm nhận tại vườn: Cổng vườn Ba Tư, Bảo Vinh, Long Khánh (Mô phỏng)',
    story:
      'Gia đình chú Ba Tư canh tác 2,5 ha vườn cây ăn trái theo hướng hữu cơ tại đất đỏ Long Khánh hơn 15 năm. Nông sản chín rộ thường bị thương lái ép giá; nay vườn tự chụp ảnh, đọc giọng nói đăng bán và phối hợp 2 đoàn viên phường tổ chức livestream ngay dưới tán cây.',
    verified: true,
    isFeaturedGarden: true,
    coords: { lat: 10.9356, lng: 107.2432, mapX: 64, mapY: 54 },
    distanceNote: 'Khu vực TP. Long Khánh · Thuận tiện ghé vườn cuối tuần',
    visitPackages: [
      {
        id: 'pkg-batu-01',
        name: 'Hái chôm chôm & thưởng thức sầu riêng dưới tán vườn (2 giờ)',
        priceNote: 'Tham khảo minh họa: 90.000 ₫/khách (trả trực tiếp tại vườn, không thu cọc)',
        slots: ['Sáng 08:00 – 10:00', 'Chiều 14:30 – 16:30'],
        highlights: ['Tự tay hái chôm chôm nhãn chín cây', 'Xem chú Ba Tư gõ chọn sầu riêng già', 'Quét QR tìm hiểu nhật ký chăm sóc hữu cơ']
      },
      {
        id: 'pkg-batu-02',
        name: 'Trải nghiệm làm nông dân số & livestream cùng đoàn viên (1,5 giờ)',
        priceNote: 'Tham khảo minh họa: 60.000 ₫/khách (miễn phí cho đoàn học sinh/sinh viên)',
        slots: ['Sáng 09:00 – 10:30', 'Chiều 15:00 – 16:30'],
        highlights: ['Tìm hiểu quy trình đóng rổ & dán mã QR từng lô', 'Giao lưu cùng 2 đoàn viên hỗ trợ tại vườn']
      }
    ],
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
    certStatusLabel: 'OCOP 4 sao minh họa (Dữ liệu giả lập)',
    certRefNo: 'MINH-HOA-DQ-01',
    pickupPoint: 'Trụ sở HTX Nông sản Đồi Gió, xã Phú Ngọc, huyện Định Quán, Đồng Nai',
    pickupHours: '08:00 – 17:00 (Thứ 2 – Thứ 7)',
    pickupEligible: true,
    publicContact: 'Điểm nhận tại cơ sở: Xã Phú Ngọc, Định Quán (Mô phỏng)',
    story: 'Canh tác điều hữu cơ trên vùng đất bazan Định Quán, thu hái thủ công và rang củi giữ nguyên vị béo tự nhiên.',
    verified: true,
    coords: { lat: 11.1985, lng: 107.3521, mapX: 68, mapY: 28 },
    distanceNote: 'Dọc tuyến Quốc lộ 20 hướng Đà Lạt',
    visitPackages: [
      {
        id: 'pkg-dq-01',
        name: 'Tham quan xưởng rang củi hạt điều & thử hạt nóng tại lò (1,5 giờ)',
        priceNote: 'Tham khảo minh họa: 50.000 ₫/khách (thanh toán tại xưởng, không thu cọc)',
        slots: ['Sáng 08:30 – 10:00', 'Chiều 14:00 – 15:30'],
        highlights: ['Xem quy trình tách vỏ & rang củi thủ công', 'Dùng thử hạt điều rang muối vỏ lụa mới ra mẻ']
      }
    ],
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
    certStatusLabel: 'OCOP 4 sao minh họa (Dữ liệu giả lập)',
    certRefNo: 'MINH-HOA-TT-02',
    pickupPoint: 'Xưởng Bưởi Làng Tân Triều, xã Tân Bình, huyện Vĩnh Cửu, Đồng Nai',
    pickupHours: '08:00 – 17:30 hằng ngày',
    pickupEligible: true,
    publicContact: 'Điểm nhận tại xưởng: Làng bưởi Tân Triều, Vĩnh Cửu (Mô phỏng)',
    story: 'Tận dụng 100% trái bưởi đường lá cam đặc sản Tân Triều để chế biến vỏ bưởi sấy dẻo và tinh dầu bưởi nguyên chất.',
    verified: true,
    coords: { lat: 10.9852, lng: 106.8245, mapX: 25, mapY: 44 },
    distanceNote: 'Ven sông Đồng Nai · Gần trung tâm TP. Biên Hòa',
    visitPackages: [
      {
        id: 'pkg-tt-01',
        name: 'Dạo vườn bưởi Tân Triều & xem chưng cất tinh dầu bưởi (2 giờ)',
        priceNote: 'Tham khảo minh họa: 80.000 ₫/khách (trả tại cơ sở, không thu cọc)',
        slots: ['Sáng 08:00 – 10:00', 'Chiều 15:00 – 17:00'],
        highlights: ['Tham quan vườn bưởi đường lá cam ven sông', 'Thử vỏ bưởi sấy dẻo và trải nghiệm nấu tinh dầu']
      }
    ],
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
    certStatusLabel: 'OCOP 4 sao minh họa (Dữ liệu giả lập)',
    certRefNo: 'MINH-HOA-LK-03',
    pickupPoint: 'Trại ong Mùa Hoa, phường Xuân Lập, TP. Long Khánh, Đồng Nai',
    pickupHours: '08:00 – 16:30 hằng ngày',
    pickupEligible: true,
    publicContact: 'Điểm nhận tại trại ong: Xuân Lập, Long Khánh (Mô phỏng)',
    story: 'Đặt đàn ong trực tiếp tại các vườn chôm chôm, sầu riêng Long Khánh vào mùa hoa nở rộ, kiểm soát thủy phần dưới 20%.',
    verified: true,
    coords: { lat: 10.9125, lng: 107.2041, mapX: 50, mapY: 66 },
    distanceNote: 'Gần vườn Ba Tư, thuận tiện ghép tuyến tham quan Long Khánh',
    visitPackages: [
      {
        id: 'pkg-ong-01',
        name: 'Tìm hiểu nghề nuôi ong lấy mật hoa chôm chôm (1,5 giờ)',
        priceNote: 'Tham khảo minh họa: 70.000 ₫/khách (trả tại trại ong, không thu cọc)',
        slots: ['Sáng 08:30 – 10:00', 'Sáng 10:15 – 11:45'],
        highlights: ['Quan sát thùng ong an toàn có lưới bảo hộ', 'Nếm mật ong hoa chôm chôm tươi tại trại']
      }
    ],
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
    certStatusLabel: 'OCOP 3 sao minh họa (Dữ liệu giả lập)',
    certRefNo: 'MINH-HOA-XL-04',
    pickupPoint: 'Nông trại Thảo mộc, xã Xuân Thọ, huyện Xuân Lộc, Đồng Nai',
    pickupHours: '07:30 – 17:00 hằng ngày',
    pickupEligible: true,
    publicContact: 'Điểm nhận tại nông trại: Xã Xuân Thọ, Xuân Lộc (Mô phỏng)',
    story: 'Liên kết 18 hộ thanh niên trồng khổ qua rừng và hồ tiêu sạch dưới chân núi Chứa Chan, sấy lạnh giữ màu xanh tự nhiên.',
    verified: true,
    coords: { lat: 10.9412, lng: 107.3788, mapX: 82, mapY: 57 },
    distanceNote: 'Dưới chân danh thắng Núi Chứa Chan',
    visitPackages: [
      {
        id: 'pkg-xl-01',
        name: 'Hái khổ qua rừng & thưởng trà thảo mộc chân núi (1,5 giờ)',
        priceNote: 'Tham khảo minh họa: 55.000 ₫/khách (trả tại nông trại, không thu cọc)',
        slots: ['Sáng 07:30 – 09:00', 'Chiều 15:00 – 16:30'],
        highlights: ['Tham quan giàn khổ qua rừng canh tác sạch', 'Thưởng trà khổ qua rừng ủ lạnh cùng thanh niên khởi nghiệp']
      }
    ],
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
    certStatusLabel: 'OCOP 4 sao minh họa (Dữ liệu giả lập)',
    certRefNo: 'MINH-HOA-CM-05',
    pickupPoint: 'Xưởng rang Cà phê Thanh Niên, xã Xuân Đường, huyện Cẩm Mỹ, Đồng Nai',
    pickupHours: '08:00 – 17:00 hằng ngày',
    pickupEligible: true,
    publicContact: 'Điểm nhận tại xưởng: Xuân Đường, Cẩm Mỹ (Mô phỏng)',
    story: 'Thu mua trái chín 95% từ các vườn Robusta và Ca cao Đồng Nai, rang mộc từng mẻ nhỏ cho hương vị đậm đà hậu ngọt.',
    verified: true,
    coords: { lat: 10.7931, lng: 107.2356, mapX: 59, mapY: 75 },
    distanceNote: 'Vùng đất đỏ bazan phía Nam Long Khánh',
    visitPackages: [
      {
        id: 'pkg-cm-01',
        name: 'Trải nghiệm rang mộc & pha phin Robusta Cẩm Mỹ (1,5 giờ)',
        priceNote: 'Tham khảo minh họa: 65.000 ₫/khách (trả tại xưởng, không thu cọc)',
        slots: ['Sáng 09:00 – 10:30', 'Chiều 14:30 – 16:00'],
        highlights: ['Tìm hiểu quy trình sơ chế hạt chín đỏ', 'Tự tay pha phin cà phê Robusta rang mộc']
      }
    ],
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
    certStatusLabel: 'OCOP 3 sao minh họa (Dữ liệu giả lập)',
    certRefNo: 'MINH-HOA-TB-06',
    pickupPoint: 'Xưởng Tổ hợp tác Nông sản Sạch, xã Bàu Hàm, huyện Trảng Bom, Đồng Nai',
    pickupHours: '08:00 – 17:00 (Thứ 2 – Thứ 7)',
    pickupEligible: true,
    publicContact: 'Điểm nhận tại xưởng: Xã Bàu Hàm, Trảng Bom (Mô phỏng)',
    story: 'Giải quyết đầu ra cho vùng trồng chuối xuất khẩu Trảng Bom bằng công nghệ sấy chân không giòn tan, không đường tinh luyện.',
    verified: true,
    coords: { lat: 10.9533, lng: 107.0086, mapX: 39, mapY: 52 },
    distanceNote: 'Gần tuyến Quốc lộ 1A đi Biên Hòa – Long Khánh',
    visitPackages: [
      {
        id: 'pkg-tb-01',
        name: 'Tham quan vùng trồng chuối & quy trình sấy chân không (1,5 giờ)',
        priceNote: 'Tham khảo minh họa: 45.000 ₫/khách (trả tại xưởng, không thu cọc)',
        slots: ['Sáng 08:30 – 10:00', 'Chiều 14:00 – 15:30'],
        highlights: ['Tham quan mô hình liên kết thanh niên nông thôn', 'Thử chuối sấy giòn không đường mới đóng gói']
      }
    ],
    seedTag: SEED_TAG
  }
];

export const INITIAL_SEASON_LOGS = {
  'LK-CC-2411': {
    batchCode: 'LK-CC-2411',
    productSku: 'NVBT-01',
    productTitle: 'Chôm chôm nhãn Long Khánh hái chín vườn Ba Tư',
    producerName: 'Nhà vườn Ba Tư (2,5 ha Long Khánh)',
    harvestWindow: 'Vụ chính 11/2026',
    harvestedAtIso: '2026-11-24T05:30:00+07:00',
    harvestedAtLabel: 'Thu hoạch lúc 05:30 ngày 24/11/2026',
    verifiedByYouth: 'Đoàn viên Minh Anh xác nhận thực địa tại vườn (mẫu)',
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
        date: '24/11/2026 · 05:30',
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
    harvestedAtIso: '2026-11-24T06:00:00+07:00',
    harvestedAtLabel: 'Cắt già lúc 06:00 ngày 24/11/2026',
    verifiedByYouth: 'Đoàn viên Hoàng Phúc xác nhận cân & mã lô (mẫu)',
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
        date: '24/11/2026 · 06:00',
        location: 'Vườn Ba Tư, Long Khánh',
        detail: 'Kiểm tra gõ trái đạt tuổi 105 ngày sau đậu trái, cắt trái già trên cây hoặc thu trái rụng đêm trong lưới hứng.',
        inspector: 'Chú Ba Tư & con trai'
      },
      {
        stage: 'Đóng gói & Dán tem QR',
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
    harvestedAtIso: '2026-11-24T06:15:00+07:00',
    harvestedAtLabel: 'Thu hoạch lúc 06:15 ngày 24/11/2026',
    verifiedByYouth: 'Đoàn viên Minh Anh xác nhận tại lô A2 (mẫu)',
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
        date: '24/11/2026 · 06:15',
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
    harvestedAtIso: '2026-11-24T05:45:00+07:00',
    harvestedAtLabel: 'Cắt già lúc 05:45 ngày 24/11/2026',
    verifiedByYouth: 'Đoàn viên Hoàng Phúc xác nhận đóng gói (mẫu)',
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
        date: '24/11/2026 · 05:45',
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
    harvestedAtIso: '2026-11-24T07:00:00+07:00',
    harvestedAtLabel: 'Hái vợt lúc 07:00 ngày 24/11/2026',
    verifiedByYouth: 'Đoàn viên Minh Anh xác nhận khay mẫu',
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
        date: '24/11/2026 · 07:00',
        location: 'Vườn Ba Tư',
        detail: 'Hái bằng vợt tránh rơi dập vỏ làm chảy mủ vàng vào múi.',
        inspector: 'Gia đình Ba Tư'
      },
      {
        stage: 'Đóng gói',
        date: '24/11/2026 · 09:00',
        location: 'Vườn Ba Tư',
        detail: 'Xếp khay 1kg–2kg có lót giấy hút ẩm, sẵn sàng giao hoặc nhận tại vườn.',
        inspector: 'Đoàn viên Minh Anh'
      }
    ]
  },
  'TT-VB-2411': {
    batchCode: 'TT-VB-2411',
    productSku: 'OCOP-DN-002',
    productTitle: 'Vỏ bưởi sấy dẻo ít đường Tân Triều 250g',
    producerName: 'Cơ sở Chế biến Bưởi Làng Tân Triều',
    harvestWindow: 'Mẻ sấy 11/2026',
    harvestedAtIso: '2026-11-23T08:30:00+07:00',
    harvestedAtLabel: 'Sấy & đóng gói ngày 23/11/2026',
    verifiedByYouth: 'Đoàn xã Tân Bình kiểm tra tem mẫu',
    milestones: [
      {
        stage: 'Chăm sóc & Tuyển chọn bưởi',
        date: '10/10/2026',
        location: 'Làng bưởi Tân Triều, Vĩnh Cửu',
        detail: 'Chọn bưởi đường lá cam non đủ tinh dầu tự nhiên từ vườn liên kết.',
        inspector: 'Trần Thị Thu Hà (Giả lập)'
      },
      {
        stage: 'Sơ chế & Sấy dẻo ít đường',
        date: '22/11/2026 · 14:00',
        location: 'Xưởng Tân Triều, Vĩnh Cửu',
        detail: 'Rửa nước muối loãng giảm vị the gắt, sấy nhiệt độ thấp giữ độ dẻo thơm.',
        inspector: 'Tổ sơ chế Tân Triều'
      },
      {
        stage: 'Đóng gói túi zip & Gắn mã QR',
        date: '23/11/2026 · 08:30',
        location: 'Xưởng Bưởi Làng Tân Triều',
        detail: 'Đóng túi zip 250g có gói hút ẩm thực phẩm và tem truy xuất lô TT-VB-2411.',
        inspector: 'Đoàn viên địa phương hỗ trợ (mẫu)'
      }
    ]
  },
  'DQ-HD-2411': {
    batchCode: 'DQ-HD-2411',
    productSku: 'OCOP-DN-001',
    productTitle: 'Hạt điều rang muối vỏ lụa Định Quán 500g',
    producerName: 'HTX Nông Sản Đồi Gió Định Quán',
    harvestWindow: 'Mẻ rang 11/2026',
    harvestedAtIso: '2026-11-23T07:30:00+07:00',
    harvestedAtLabel: 'Rang củi & đóng hộp ngày 23/11/2026',
    verifiedByYouth: 'Đoàn xã Phú Ngọc xác nhận mẻ mẫu',
    milestones: [
      {
        stage: 'Thu mua nguyên liệu vườn',
        date: '05/10/2026',
        location: 'Xã Phú Ngọc, Định Quán',
        detail: 'Tuyển hạt điều tươi loại A size W240 từ 14 hộ nông dân liên kết.',
        inspector: 'Nguyễn Văn Hùng (Giả lập)'
      },
      {
        stage: 'Rang củi muối biển',
        date: '22/11/2026 · 15:00',
        location: 'Xưởng HTX Đồi Gió, Định Quán',
        detail: 'Rang thủ công bằng củi điều giúp hạt giòn bùi, giữ nguyên lớp vỏ lụa.',
        inspector: 'Tổ rang điều HTX'
      },
      {
        stage: 'Hút chân không & Dán mã QR',
        date: '23/11/2026 · 07:30',
        location: 'HTX Đồi Gió, Định Quán',
        detail: 'Đóng hộp 500g hút chân không, gắn tem mã lô DQ-HD-2411.',
        inspector: 'Đoàn viên hỗ trợ HTX (mẫu)'
      }
    ]
  }
};

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
    commissionCondition: 'Sản phẩm chủ lực Nhà vườn Ba Tư (dữ liệu mẫu).',
    status: 'published',
    certStatus: 'verified_pilot',
    ocopStars: 4,
    mediaKitReady: true,
    accentHex: '#B91C1C',
    secondaryHex: '#15803D',
    harvestedAtLabel: 'Hái sáng 24/11/2026 · 05:30',
    preorderWindow: 'Đợt hái mới dự kiến 27/11/2026 (đặt trước minh họa, không thu cọc)',
    description:
      'Chôm chôm nhãn trồng trên đất đỏ bazan Long Khánh tại vườn Ba Tư 2,5 ha, vị ngọt thanh giòn sần sật, hỗ trợ đặt mua trực tiếp hoặc ghé nhận tại vườn.',
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
    harvestedAtLabel: 'Cắt già 24/11/2026 · 06:00',
    preorderWindow: 'Đợt cắt già tiếp theo 28/11/2026 (đặt trước minh họa, không thu cọc)',
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
    commissionCondition: 'Giá ưu đãi tại vườn Long Khánh (mô phỏng).',
    status: 'published',
    certStatus: 'verified_pilot',
    ocopStars: 3,
    mediaKitReady: true,
    accentHex: '#15803D',
    secondaryHex: '#B91C1C',
    harvestedAtLabel: 'Hái sáng 24/11/2026 · 06:15',
    preorderWindow: 'Đợt hái mới cuối tuần (đặt trước minh họa, không thu cọc)',
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
    harvestedAtLabel: 'Cắt già 24/11/2026 · 05:45',
    preorderWindow: 'Đợt cắt già tiếp theo 29/11/2026 (đặt trước minh họa, không thu cọc)',
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
    harvestedAtLabel: 'Hái vợt 24/11/2026 · 07:00',
    preorderWindow: 'Đợt hái cuối tuần (đặt trước minh họa, không thu cọc)',
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
    commissionCondition: 'Áp dụng cho đơn hoàn thành từ kênh giới thiệu thanh niên.',
    status: 'published',
    certStatus: 'verified_pilot',
    ocopStars: 4,
    mediaKitReady: true,
    accentHex: '#15803D',
    secondaryHex: '#B45309',
    harvestedAtLabel: 'Rang củi 23/11/2026 · 07:30',
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
    commissionCondition: 'Áp dụng toàn bộ đơn hợp lệ từ kênh giới thiệu Đoàn viên.',
    status: 'published',
    certStatus: 'verified_pilot',
    ocopStars: 4,
    mediaKitReady: true,
    accentHex: '#15803D',
    secondaryHex: '#CA8A04',
    harvestedAtLabel: 'Đóng gói 23/11/2026 · 08:30',
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
    commissionCondition: 'Hoa hồng ước tính trên giá trị sản phẩm đã hoàn thành.',
    status: 'published',
    certStatus: 'verified_pilot',
    ocopStars: 4,
    mediaKitReady: true,
    accentHex: '#B45309',
    secondaryHex: '#15803D',
    harvestedAtLabel: 'Quay mật 22/11/2026',
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
    commissionCondition: 'Khuyến khích kèm video pha trà 15s từ Xưởng quay video.',
    status: 'published',
    certStatus: 'pending_review',
    ocopStars: 3,
    mediaKitReady: true,
    accentHex: '#15803D',
    secondaryHex: '#0F766E',
    harvestedAtLabel: 'Sấy lạnh 23/11/2026',
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
    harvestedAtLabel: 'Rang mộc 21/11/2026',
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
    commissionCondition: 'Sản phẩm dễ giới thiệu trên livestream sinh viên.',
    status: 'published',
    certStatus: 'pending_review',
    ocopStars: 3,
    mediaKitReady: true,
    accentHex: '#CA8A04',
    secondaryHex: '#15803D',
    harvestedAtLabel: 'Sấy giòn 23/11/2026',
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
    commissionCondition: 'Tỷ lệ hoa hồng ước tính ưu đãi cho sinh viên chia sẻ.',
    status: 'published',
    certStatus: 'verified_pilot',
    ocopStars: 4,
    mediaKitReady: true,
    accentHex: '#15803D',
    secondaryHex: '#047857',
    harvestedAtLabel: 'Chưng cất 23/11/2026',
    description:
      'Tinh dầu vỏ bưởi nguyên chất Tân Triều dạng xịt tiện dụng hỗ trợ dưỡng tóc và khử mùi tự nhiên với hương bưởi tươi thanh mát.',
    story: 'Giúp tận dụng phụ phẩm vỏ bưởi tươi trong mùa thu hoạch, tăng thêm thu nhập cho nhà vườn.',
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
  'LK-CC-2411': rambutanNhan,
  'LK-SR-2411': durianRi6,
  'LK-CT-2411': rambutanThai,
  'LK-MT-2411': durianMonthong,
  'LK-MC-2411': mangosteen,
  'TT-VB-2411': pomeloPeel,
  'DQ-HD-2411': cashewRoasted,
  'TT-TD-2411': pomeloOil,
  'TB-CS-2411': bananaChips,
  'XL-TK-2411': bitterMelonTea,
  'LK-MO-2411': rambutanHoney,
  'CM-CP-2411': robustaCoffee
};

export const SAMPLE_UPLOAD_PHOTOS = [
  { id: 'sample-rambutan', label: 'Ảnh mẫu: Chôm chôm nhãn', src: rambutanNhan, defaultTitle: 'Chôm chôm nhãn hái sáng vườn Ba Tư (1 kg)' },
  { id: 'sample-durian', label: 'Ảnh mẫu: Sầu riêng Ri6', src: durianRi6, defaultTitle: 'Sầu riêng Ri6 cắt già vườn Ba Tư (1 kg)' },
  { id: 'sample-mangosteen', label: 'Ảnh mẫu: Măng cụt Long Khánh', src: mangosteen, defaultTitle: 'Măng cụt xen canh vườn Ba Tư (1 kg)' }
];

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
    startIso: '2026-11-28T19:30:00+07:00',
    endIso: '2026-11-28T21:00:00+07:00',
    location: 'Lô A1, Nhà vườn Ba Tư, Ấp Bảo Vinh, TP. Long Khánh',
    supporterName: 'Đoàn viên Minh Anh (Đoàn phường Xuân An)',
    supporterRole: 'Dẫn phiên & trả lời câu hỏi khách mua',
    producerId: 'prod-ba-tu-long-khanh',
    producerName: 'Nhà vườn Ba Tư (Long Khánh)',
    productSkus: ['NVBT-01', 'NVBT-02'],
    productSummary: 'Chôm chôm nhãn (45k/kg) & Sầu riêng Ri6 (115k/kg)',
    channelLabel: 'Khung xem thử Chợ OCOP & Kênh cộng đồng (Minh họa)',
    status: 'upcoming',
    viewerCountDemo: 148,
    note: 'Quay trực tiếp tại lô A1 vườn Ba Tư, cân trái mẫu ngay trên bàn sơ chế và quét thử tem QR.',
    sampleComments: [
      { author: 'Chị Lan (Biên Hòa)', text: 'Sầu riêng Ri6 này cắt sáng nay hả chú Ba Tư?' },
      { author: 'Đoàn viên Minh Anh', text: 'Dạ đúng ạ, có tem QR lô LK-SR-2411 xem giờ cắt luôn chị nhé!' },
      { author: 'Anh Huy (TP.HCM)', text: 'Cho mình đặt thử 2kg chôm chôm nhãn và 1 trái Ri6 nhé.' }
    ]
  },
  {
    id: 'live-02',
    dateLabel: 'Chủ Nhật · 29/11/2026',
    timeRange: '09:00 – 10:30',
    startIso: '2026-11-29T09:00:00+07:00',
    endIso: '2026-11-29T10:30:00+07:00',
    location: 'Bàn sơ chế Nhà vườn Ba Tư, TP. Long Khánh',
    supporterName: 'Đoàn viên Hoàng Phúc (Đoàn trường CĐ Đồng Nai)',
    supporterRole: 'Kỹ thuật góc quay & ghim giỏ sản phẩm',
    producerId: 'prod-ba-tu-long-khanh',
    producerName: 'Nhà vườn Ba Tư (Long Khánh)',
    productSkus: ['NVBT-03', 'NVBT-04', 'NVBT-05'],
    productSummary: 'Chôm chôm Thái (38k/kg), Sầu riêng Monthong (120k/kg) & Măng cụt (65k/kg)',
    channelLabel: 'Khung xem thử Chợ OCOP (Minh họa)',
    status: 'upcoming',
    viewerCountDemo: 96,
    note: 'Tặng kèm hướng dẫn quét QR kiểm tra nhật ký mùa vụ và chọn suất tham quan vườn cuối tuần.',
    sampleComments: [
      { author: 'Bạn Thảo', text: 'Cuối tuần ghé vườn hái chôm chôm rồi nhận đơn tại vườn được không ạ?' },
      { author: 'Đoàn viên Hoàng Phúc', text: 'Được ạ! Bạn chọn "Nhận tại vườn" trong giỏ hàng là miễn phí vận chuyển nhé.' }
    ]
  },
  {
    id: 'live-03',
    dateLabel: 'Thứ Tư · 02/12/2026',
    timeRange: '20:00 – 21:15',
    startIso: '2026-12-02T20:00:00+07:00',
    endIso: '2026-12-02T21:15:00+07:00',
    location: 'Điểm cầu ghép Long Khánh – Làng bưởi Tân Triều',
    supporterName: 'Đoàn viên Minh Anh & Hoàng Phúc',
    supporterRole: 'Phiên ghép 2 vườn Long Khánh – Tân Triều',
    producerId: 'prod-ba-tu-long-khanh',
    producerName: 'Nhà vườn Ba Tư + Cơ sở Bưởi Tân Triều',
    productSkus: ['NVBT-01', 'OCOP-DN-002'],
    productSummary: 'Trái cây tươi Long Khánh & Vỏ bưởi sấy dẻo Tân Triều',
    channelLabel: 'Phiên ghép 2 cơ sở Đồng Nai (Minh họa)',
    status: 'preparing',
    viewerCountDemo: 64,
    note: 'Đang kiểm kê số lượng rổ đóng hàng và chạy thử tách giỏ đa nhà vườn.',
    sampleComments: [
      { author: 'Chị Mai', text: 'Mua chung chôm chôm Ba Tư với vỏ bưởi Tân Triều có tách đơn rõ không?' },
      { author: 'Đoàn viên Minh Anh', text: 'Hệ thống tự tách rõ 2 nhà vườn và đúng điểm nhận của từng cơ sở ạ!' }
    ]
  },
  {
    id: 'live-04',
    dateLabel: 'Thứ Sáu · 20/11/2026',
    timeRange: '19:00 – 20:00',
    startIso: '2026-11-20T19:00:00+07:00',
    endIso: '2026-11-20T20:00:00+07:00',
    location: 'Vườn Ba Tư, Long Khánh',
    supporterName: 'Đoàn viên Minh Anh (Đoàn phường Xuân An)',
    supporterRole: 'Chạy thử nghiệm kịch bản 15 phút',
    producerId: 'prod-ba-tu-long-khanh',
    producerName: 'Nhà vườn Ba Tư (Long Khánh)',
    productSkus: ['NVBT-01'],
    productSummary: 'Chôm chôm nhãn Long Khánh hái sáng',
    channelLabel: 'Phiên chạy thử nội bộ (Minh họa)',
    status: 'completed_demo',
    viewerCountDemo: 52,
    note: 'Đã hoàn thành chạy thử, rút kinh nghiệm ánh sáng đèn pin khi trời tối.',
    sampleComments: [
      { author: 'Chú Ba Tư', text: 'Cảm ơn hai cháu thanh niên đã hướng dẫn cách đọc giá rõ trên điện thoại.' }
    ]
  }
];

export const INITIAL_VOLUNTEER_LOGS = [
  {
    id: 'vol-01',
    memberId: 'aff-member-1',
    memberCode: 'DV-LK-01',
    memberName: 'Đoàn viên Minh Anh',
    memberUnit: 'Đoàn phường Xuân An, TP. Long Khánh',
    producerId: 'prod-ba-tu-long-khanh',
    producerName: 'Nhà vườn Ba Tư (Long Khánh)',
    activityDate: '2026-11-22',
    taskTitle: 'Hỗ trợ chụp ảnh 5 sản phẩm & dán mã QR nhật ký lô',
    hours: 3.5,
    note: 'Chụp ảnh sáng tại vườn và hướng dẫn chú Ba Tư bấm mic đăng bài.',
    status: 'approved',
    reviewNote: 'Đã xác nhận có mặt hỗ trợ tại vườn.',
    reviewedAt: '2026-11-22T17:00:00+07:00',
    createdAt: '2026-11-22T15:30:00+07:00'
  },
  {
    id: 'vol-02',
    memberId: 'aff-member-2',
    memberCode: 'DV-DN-02',
    memberName: 'Đoàn viên Hoàng Phúc',
    memberUnit: 'Đoàn trường CĐ Đồng Nai',
    producerId: 'prod-ba-tu-long-khanh',
    producerName: 'Nhà vườn Ba Tư (Long Khánh)',
    activityDate: '2026-11-23',
    taskTitle: 'Dựng khung góc quay livestream & hướng dẫn nhận đơn trên điện thoại',
    hours: 3.0,
    note: 'Cài đặt ứng dụng PWA lên màn hình chính điện thoại cho chú Ba Tư.',
    status: 'approved',
    reviewNote: 'Chú đã tự mở xem đơn được, cảm ơn cháu Phúc.',
    reviewedAt: '2026-11-23T18:10:00+07:00',
    createdAt: '2026-11-23T16:45:00+07:00'
  },
  {
    id: 'vol-03',
    memberId: 'aff-member-1',
    memberCode: 'DV-LK-01',
    memberName: 'Đoàn viên Minh Anh',
    memberUnit: 'Đoàn phường Xuân An, TP. Long Khánh',
    producerId: 'prod-ba-tu-long-khanh',
    producerName: 'Nhà vườn Ba Tư (Long Khánh)',
    activityDate: '2026-11-24',
    taskTitle: 'Kiểm đếm lô chôm chôm sáng sớm & cập nhật mốc đóng gói QR',
    hours: 2.0,
    note: 'Cập nhật nhật ký lô LK-CC-2411 và chuẩn bị kịch bản phiên live thứ Bảy.',
    status: 'pending',
    reviewNote: '',
    reviewedAt: null,
    createdAt: '2026-11-24T09:15:00+07:00'
  },
  {
    id: 'vol-04',
    memberId: 'aff-member-2',
    memberCode: 'DV-DN-02',
    memberName: 'Đoàn viên Hoàng Phúc',
    memberUnit: 'Đoàn trường CĐ Đồng Nai',
    producerId: 'prod-ba-tu-long-khanh',
    producerName: 'Nhà vườn Ba Tư (Long Khánh)',
    activityDate: '2026-11-24',
    taskTitle: 'Cân thử sầu riêng Ri6 & ghi nhận đơn đặt mẫu đầu tiên',
    hours: 1.5,
    note: 'Hỗ trợ kiểm tra thông tin điểm nhận tại vườn cho khách đặt thử.',
    status: 'pending',
    reviewNote: '',
    reviewedAt: null,
    createdAt: '2026-11-24T10:00:00+07:00'
  }
];

export const INITIAL_VISIT_REQUESTS = [
  {
    id: 'vis-01',
    producerId: 'prod-ba-tu-long-khanh',
    producerName: 'Nhà vườn Ba Tư — Vườn cây ăn trái Long Khánh',
    packageName: 'Hái chôm chôm & thưởng thức sầu riêng dưới tán vườn (2 giờ)',
    visitorName: 'Gia đình anh Minh Quân (Mẫu)',
    visitorPhone: '0909 112 233',
    visitDate: '2026-11-29',
    timeSlot: 'Sáng 08:00 – 10:00',
    guestsCount: 4,
    note: 'Có 2 bé nhỏ, muốn xem hái chôm chôm và nhận thêm 2kg Ri6 tại vườn.',
    status: 'requested',
    createdAt: '2026-11-24T08:00:00+07:00'
  }
];

export const INITIAL_SUPPORT_REQUESTS = [
  {
    id: 'sup-01',
    producerId: 'prod-ba-tu-long-khanh',
    producerName: 'Nhà vườn Ba Tư (Long Khánh)',
    topic: 'Hỗ trợ chụp ảnh lô măng cụt & dán tem QR mới',
    assignedYouth: 'Đoàn viên Minh Anh (Phường Xuân An)',
    note: 'Chú chuẩn bị hái thêm rổ măng cụt sáng mai, nhờ cháu ghé chụp giúp.',
    status: 'open',
    createdAt: '2026-11-24T07:50:00+07:00'
  }
];

export const VIDEO_TEMPLATES = [
  {
    id: 'tpl-15s',
    durationSec: 15,
    title: 'Mẫu 15 giây — Quay nhanh tại vườn',
    goal: 'Gây chú ý 3 giây đầu, nêu điểm mạnh nhất và mời khách xem mã QR / thêm giỏ hàng.',
    scenes: [
      {
        id: 's1',
        startSec: 0,
        endSec: 4,
        title: 'Cảnh 1: Mở rổ trái cận cảnh',
        framingTip: 'Đặt sản phẩm chính giữa khung dọc 9:16, ánh sáng tự nhiên dưới tán cây, xoay nhẹ thấy tem QR.',
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
        title: 'Cảnh 3: Giá & Đặt mua',
        framingTip: 'Giơ sản phẩm ngang tầm vai, chỉ tay xuống giỏ hàng trên màn hình.',
        teleprompter: 'Chỉ {{priceText}} cho {{unit}}. Đặt ngay để nhận tại vườn hoặc giao tận nơi nhé!'
      }
    ]
  },
  {
    id: 'tpl-30s',
    durationSec: 30,
    title: 'Mẫu 30 giây — Chủ vườn tự giới thiệu',
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
        teleprompter: 'Sản phẩm {{productTitle}} được chăm sóc kỹ lưỡng: {{story}}'
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
        title: 'Cảnh 1: Mở đầu từ thực tế vườn',
        framingTip: 'Cầm sản phẩm trực diện, nói dứt khoát và rõ âm lượng.',
        teleprompter: 'Trái cây {{area}} đặt trực tiếp từ vườn có tươi không? Hôm nay mình ghé vườn kiểm chứng {{productTitle}}!'
      },
      {
        id: 'l2',
        startSec: 8,
        endSec: 20,
        title: 'Cảnh 2: Mở hộp & Kiểm tra độ chín',
        framingTip: 'Quay bàn sơ chế sạch, tách vỏ kiểm tra phần cơm bên trong.',
        teleprompter: 'Thu hái đúng độ chín tại vườn, {{spec}}'
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
        title: 'Cảnh 4: Giá & Đặt mua',
        framingTip: 'Hiển thị rõ sản phẩm kèm thẻ giá.',
        teleprompter: 'Giá chỉ {{priceText}} / {{unit}}. Đặt ngay trong ứng dụng Chợ OCOP Thanh Niên nhé!'
      }
    ]
  }
];

export const INITIAL_AFFILIATE_LINKS = [
  {
    id: 'aff-link-batu-01',
    code: 'DN9B2T4V6K',
    affiliateId: 'aff-member-1',
    affiliateName: 'Đoàn viên Minh Anh (Xuân An, Long Khánh)',
    productId: 'nvbt-02',
    platform: 'direct_ocop',
    targetUrl: 'https://shopee.vn/sau-rieng-ri6-long-khanh-pilot-i.1000.2002',
    isDemoTarget: true,
    active: true,
    clicksCount: 18,
    createdAt: '2026-11-24T06:30:00Z',
    seedTag: SEED_TAG
  },
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
    producerName: 'Nhà vườn Ba Tư — Vườn cây ăn trái Long Khánh',
    productId: 'nvbt-01',
    sku: 'NVBT-01',
    productTitle: 'Chôm chôm nhãn Long Khánh hái chín vườn Ba Tư (1 kg) (+1 món khác)',
    quantity: 5,
    items: [
      { productId: 'nvbt-01', sku: 'NVBT-01', title: 'Chôm chôm nhãn Long Khánh hái chín vườn Ba Tư (1 kg)', quantity: 3, unitPriceVnd: 45000 },
      { productId: 'nvbt-02', sku: 'NVBT-02', title: 'Sầu riêng Ri6 cơm vàng hạt lép vườn Ba Tư (1 kg)', quantity: 2, unitPriceVnd: 115000 }
    ],
    deliveryMethod: 'delivery',
    deliveryLabel: 'Giao tận nơi: Phường Tân Mai, TP. Biên Hòa (mẫu)',
    customerName: 'Khách hàng mẫu 01',
    customerPhone: '0901 234 101',
    shippingAddress: 'Phường Tân Mai, TP. Biên Hòa (Địa chỉ mẫu)',
    shippingFeeVnd: 25000,
    grossAmountVnd: 390000,
    netAmountVnd: 365000,
    commissionRateBps: 1000,
    commissionVnd: 36500,
    affiliateCode: 'DN9B2T4V6K',
    affiliateLinkId: 'aff-link-batu-01',
    affiliateId: 'aff-member-1',
    affiliateName: 'Đoàn viên Minh Anh (Xuân An, Long Khánh)',
    attributionStatus: 'attributed',
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
    producerName: 'Nhà vườn Ba Tư — Vườn cây ăn trái Long Khánh',
    productId: 'nvbt-04',
    sku: 'NVBT-04',
    productTitle: 'Sầu riêng Monthong cơm dày vườn Ba Tư (1 kg)',
    quantity: 2,
    items: [
      { productId: 'nvbt-04', sku: 'NVBT-04', title: 'Sầu riêng Monthong cơm dày vườn Ba Tư (1 kg)', quantity: 2, unitPriceVnd: 120000 }
    ],
    deliveryMethod: 'pickup',
    deliveryLabel: 'Nhận tại vườn: Cổng Nhà vườn Ba Tư, Ấp Bảo Vinh, TP. Long Khánh, Đồng Nai',
    customerName: 'Khách hàng mẫu 02',
    customerPhone: '0912 345 202',
    shippingAddress: 'Cổng Nhà vườn Ba Tư, Ấp Bảo Vinh, TP. Long Khánh, Đồng Nai',
    shippingFeeVnd: 0,
    grossAmountVnd: 240000,
    netAmountVnd: 240000,
    commissionRateBps: 1100,
    commissionVnd: 0,
    affiliateCode: '',
    affiliateLinkId: null,
    affiliateId: null,
    affiliateName: 'Khách ghé vườn Ba Tư trực tiếp',
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
    producerName: 'Cơ sở Chế biến Bưởi Làng Tân Triều',
    productId: 'sku-02',
    sku: 'OCOP-DN-002',
    productTitle: 'Vỏ bưởi sấy dẻo ít đường Tân Triều 250g',
    quantity: 3,
    deliveryMethod: 'delivery',
    deliveryLabel: 'Giao tận nơi từ Cơ sở Bưởi Tân Triều (Mẫu)',
    grossAmountVnd: 285000,
    netAmountVnd: 285000,
    commissionRateBps: 1500,
    commissionVnd: 42750,
    affiliateCode: 'DN8K4M2P9Q',
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
    id: 'ldg-batu-01-d',
    txGroupId: 'tx-ord-batu-01',
    orderId: 'ord-ba-tu-01',
    affiliateId: 'aff-member-1',
    affiliateCode: 'DN9B2T4V6K',
    accountType: 'platform_escrow',
    direction: 'debit',
    amountVnd: 36500,
    state: 'pending',
    note: 'Hoa hồng ước tính đơn DON-LK-2411-01 qua mã DN9B2T4V6K (chờ hoàn thành)',
    createdAt: '2026-11-24T08:15:00Z',
    seedTag: SEED_TAG
  },
  {
    id: 'ldg-batu-01-c',
    txGroupId: 'tx-ord-batu-01',
    orderId: 'ord-ba-tu-01',
    affiliateId: 'aff-member-1',
    affiliateCode: 'DN9B2T4V6K',
    accountType: 'affiliate_payable',
    direction: 'credit',
    amountVnd: 36500,
    state: 'pending',
    note: 'Hoa hồng ước tính đơn DON-LK-2411-01 qua mã DN9B2T4V6K (chờ hoàn thành)',
    createdAt: '2026-11-24T08:15:00Z',
    seedTag: SEED_TAG
  },
  {
    id: 'ldg-01-d',
    txGroupId: 'tx-ord-01',
    orderId: 'ord-demo-01',
    affiliateId: 'aff-member-1',
    affiliateCode: 'DN8K4M2P9Q',
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
    affiliateCode: 'DN8K4M2P9Q',
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
    actorLabel: 'Hệ thống Trải nghiệm Đề 03',
    action: 'SEED_BA_TU_GARDEN',
    targetLabel: 'Nhà vườn Ba Tư (2,5 ha Long Khánh · 5 sản phẩm)',
    detail: 'Khởi tạo dữ liệu giả lập đầy đủ cho 6 màn hình và 3 tính năng điểm cộng.',
    createdAt: '2026-11-24T07:00:00Z'
  }
];

export const PILOT_ROADMAP_90_DAYS = [
  {
    phase: 'Giai đoạn 1 (Ngày 1–30)',
    title: 'Chuẩn hóa hồ sơ & Ra mắt 10 sản phẩm thí điểm',
    actions: [
      'Khảo sát Nhà vườn Ba Tư (Long Khánh) và các cơ sở OCOP 3–4 sao tiêu biểu.',
      'Chủ vườn tự đăng sản phẩm bằng ảnh + giọng nói + AI gợi ý mô tả, gắn tem QR nhật ký mùa vụ.',
      'Đoàn viên hỗ trợ quay video ngắn 15/30/45s và mở phiên livestream mẫu tại vườn.'
    ],
    targetKpis: [
      '10/10 sản phẩm thí điểm có đủ ảnh, mô tả và nhật ký mùa vụ QR',
      'Tối thiểu 30 video ngắn từ chủ cơ sở (Mục tiêu KPI)',
      '100% đơn đặt thử đồng bộ về màn Quản lý đơn nhà vườn'
    ],
    measuredStatus: 'Đã sẵn sàng giao diện 6 màn hình + 3 điểm cộng cùng dữ liệu mẫu Nhà vườn Ba Tư.'
  },
  {
    phase: 'Giai đoạn 2 (Ngày 31–60)',
    title: 'Kích hoạt mạng lưới Đoàn viên hỗ trợ & Du lịch vườn',
    actions: [
      'Tập huấn 50–100 đoàn viên/sinh viên tại Long Khánh & các trường ĐH/CĐ Đồng Nai.',
      'Phân công lịch livestream định kỳ cuối tuần và ghi nhận giờ tình nguyện có chủ vườn duyệt.',
      'Kết nối các tuyến tham quan hái trái tại vườn qua bản đồ tương tác.'
    ],
    targetKpis: [
      '>= 80 đoàn viên tham gia hỗ trợ & chia sẻ (Mục tiêu KPI)',
      '>= 300 đơn hàng thử nghiệm (Mục tiêu KPI)',
      'Tỷ lệ hoàn hủy mục tiêu < 5%'
    ],
    measuredStatus: 'Chưa triển khai thực địa; đang ở mức sản phẩm trải nghiệm Đề 03.'
  },
  {
    phase: 'Giai đoạn 3 (Ngày 61–90)',
    title: 'Đối soát minh bạch & Nhân rộng 150+ sản phẩm',
    actions: [
      'Tổng kết đánh giá từ 10 cơ sở đầu tiên để mở rộng toàn tỉnh Đồng Nai.',
      'Kết nối chính thức quy trình xác thực chủ vườn và đối soát cùng Tỉnh đoàn / Sở Công Thương.'
    ],
    targetKpis: [
      '100% đơn hoàn thành đối soát minh bạch (Mục tiêu KPI)',
      'Sẵn sàng nhân rộng lên 150+ sản phẩm OCOP Đồng Nai'
    ],
    measuredStatus: 'Không thu cọc hoặc thanh toán trực tuyến thật trong giai đoạn thí điểm.'
  }
];

export const SAMPLE_CSV_IMPORT_TEMPLATE = `platform,shop_id,external_order_id,sku,quantity,gross_amount_vnd,net_amount_vnd,affiliate_code,status
tiktok,shop_tantrieu_tt,TT-DEMO-20261124-101,OCOP-DN-002,2,190000,190000,DN8K4M2P9Q,confirmed`;
