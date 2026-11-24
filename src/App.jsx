import React, { useEffect, useState } from 'react';
import { Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom';
import { ArrowLeft, Compass } from 'lucide-react';
import AppShell from './components/AppShell';
import AccountRecoveryPage from './components/AccountRecoveryPage';
import CatalogPage from './components/CatalogPage';
import { ProducerDetailPage, ProductDetailPage } from './components/ProductDetailPage';
import {
  CartCheckoutPage,
  LivestreamSchedulePage,
  QuickPublishVoicePage,
  SeasonLogPage
} from './components/GardenVoicePages';
import AffiliateRedirectPage from './components/AffiliateRedirectPage';
import PilotOverviewPage from './components/PilotOverviewPage';
import { SellerOrdersPage, SellerProductsPage, VideoStudioPage } from './components/SellerPages';
import {
  AffiliateCommissionPage,
  AffiliateDiscoverPage,
  AffiliateLinksPage
} from './components/AffiliatePages';
import OpsDashboardPage from './components/OpsDashboardPage';
import OrderTrackingPage from './components/OrderTrackingPage';
import FarmMapTourPage from './components/FarmMapTourPage';
import VolunteerHoursPage from './components/VolunteerHoursPage';
import { DEMO_PERSONAS, loadActiveSession, setDemoPersona, signOutSession } from './services/authService';

function NotFoundPage() {
  return (
    <section className="max-w-lg mx-auto bg-surface border border-line rounded-2xl p-8 text-center space-y-4">
      <Compass className="w-10 h-10 text-brand mx-auto" aria-hidden="true" />
      <h1 className="text-xl font-bold text-ink">Không tìm thấy trang yêu cầu (404)</h1>
      <p className="text-sm text-muted">
        Đường dẫn bạn mở không tồn tại trong Chợ OCOP Thanh Niên. Hãy quay về cửa hàng nông sản Đồng Nai.
      </p>
      <Link
        to="/"
        className="min-h-[44px] px-5 rounded-xl bg-brand hover:bg-brand-hover text-white text-sm font-semibold inline-flex items-center gap-2"
      >
        <ArrowLeft className="w-4 h-4" aria-hidden="true" />
        <span>Quay về Cửa hàng</span>
      </Link>
    </section>
  );
}

export default function App() {
  const navigate = useNavigate();
  const [session, setSession] = useState(() => loadActiveSession());
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  // Chuyển vai trải nghiệm cục bộ: CHỈ hoạt động khi chưa đăng nhập tài khoản Supabase thật
  // và KHÔNG BAO GIỜ cấp quyền hay token máy chủ thật.
  function handleSelectPersona(personaId) {
    if (session?.mode === 'supabase') return null;
    const next = setDemoPersona(personaId);
    setSession(next);
    return next;
  }

  function handleOpenSellerOrder(order) {
    if (session?.mode !== 'supabase') {
      const matchSeller = DEMO_PERSONAS.find(
        (p) => p.role === 'seller' && p.producerId === order?.producerId
      );
      const next = setDemoPersona(matchSeller?.id || 'seller-batu');
      setSession(next);
    }
    const qs = new URLSearchParams();
    if (order?.orderCode) qs.set('highlight', order.orderCode);
    if (order?.producerId) qs.set('garden', order.producerId);
    navigate(`/chu-co-so/don-hang?${qs.toString()}`);
  }

  async function handleSignOut() {
    const next = await signOutSession();
    setSession(next);
  }

  return (
    <AppShell
      session={session}
      onAuthSessionChange={setSession}
      onSelectPersona={handleSelectPersona}
      onSignOut={handleSignOut}
      isOnline={isOnline}
    >
      <Routes>
        {/* Cửa hàng mặc định */}
        <Route path="/" element={<CatalogPage />} />
        <Route path="/tai-khoan/dat-lai-mat-khau" element={<AccountRecoveryPage />} />
        <Route path="/tai-khoan/xac-nhan" element={<AccountRecoveryPage />} />

        {/* Màn 1: Hồ sơ nhà vườn */}
        <Route path="/gian-hang" element={<Navigate to="/gian-hang/nha-vuon-ba-tu" replace />} />
        <Route path="/gian-hang/:slug" element={<ProducerDetailPage />} />

        {/* Màn 2: Đăng sản phẩm nhanh bằng ảnh, giọng nói & AI Gemini Flash (Điểm cộng A) */}
        <Route
          path="/chu-co-so/dang-nhanh"
          element={<QuickPublishVoicePage session={session} isOnline={isOnline} />}
        />

        {/* Màn 3: Chi tiết sản phẩm + QR truy xuất & Nhật ký mùa vụ */}
        <Route
          path="/san-pham/:slug"
          element={
            <ProductDetailPage
              session={session}
              onQuickSwitchAffiliate={() => handleSelectPersona('affiliate-vy')}
            />
          }
        />
        <Route path="/nhat-ky/:batchCode" element={<SeasonLogPage />} />

        {/* Màn 4: Giỏ hàng đa nhà vườn & đặt hàng */}
        <Route
          path="/gio-hang"
          element={
            <CartCheckoutPage
              session={session}
              onOpenSellerOrder={handleOpenSellerOrder}
            />
          }
        />

        {/* Tra cứu đơn hàng của khách */}
        <Route
          path="/tra-cuu-don"
          element={
            <OrderTrackingPage
              session={session}
              onOpenSellerOrder={handleOpenSellerOrder}
            />
          }
        />

        {/* Màn 5: Quản lý đơn nhà vườn */}
        <Route
          path="/chu-co-so/don-hang"
          element={
            <SellerOrdersPage
              session={session}
              onQuickSwitchSeller={(personaId = 'seller-batu') => handleSelectPersona(personaId)}
            />
          }
        />

        {/* Màn 6: Lịch livestream thanh niên hỗ trợ */}
        <Route path="/lich-livestream" element={<LivestreamSchedulePage />} />

        {/* Điểm cộng B: Bản đồ tương tác & Trải nghiệm nhà vườn */}
        <Route path="/ban-do-vuon" element={<FarmMapTourPage isOnline={isOnline} />} />

        {/* Điểm cộng C: Nhật ký giờ tình nguyện Đoàn viên & Chủ vườn duyệt */}
        <Route
          path="/tinh-nguyen"
          element={
            <VolunteerHoursPage
              session={session}
              onQuickSwitchSeller={() => handleSelectPersona('seller-batu')}
            />
          }
        />

        {/* Các màn quản trị / hỗ trợ khác */}
        <Route
          path="/chu-co-so/san-pham"
          element={
            <SellerProductsPage
              session={session}
              onQuickSwitchSeller={() => handleSelectPersona('seller-batu')}
            />
          }
        />
        <Route path="/chu-co-so/video-studio" element={<VideoStudioPage />} />

        <Route
          path="/affiliate/kham-pha"
          element={
            <AffiliateDiscoverPage
              session={session}
              onQuickSwitchAffiliate={() => handleSelectPersona('affiliate-vy')}
            />
          }
        />
        <Route
          path="/affiliate/link-kit"
          element={
            <AffiliateLinksPage
              session={session}
              onQuickSwitchAffiliate={() => handleSelectPersona('affiliate-vy')}
            />
          }
        />
        <Route
          path="/affiliate/hoa-hong"
          element={
            <AffiliateCommissionPage
              session={session}
              onQuickSwitchAffiliate={() => handleSelectPersona('affiliate-vy')}
            />
          }
        />
        <Route path="/r/:code" element={<AffiliateRedirectPage />} />

        <Route
          path="/dieu-phoi"
          element={
            <OpsDashboardPage
              session={session}
              onQuickSwitchOps={() => handleSelectPersona('ops-coordinator')}
            />
          }
        />
        <Route path="/ke-hoach-pilot" element={<PilotOverviewPage />} />

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AppShell>
  );
}
