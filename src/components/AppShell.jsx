import React, { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { ClipboardList, Radio, ShoppingBag, ShoppingCart, Sprout, Store, UserRound, WifiOff } from 'lucide-react';
import { hasRemoteApi, loadCart } from '../services/ocopStore';
import AccountDialog from './AccountDialog';

const publicNavigation=[
  {to:'/',name:'Cửa hàng',Icon:ShoppingBag},
  {to:'/gian-hang/nha-vuon-ba-tu',name:'Nhà vườn',Icon:Store},
  {to:'/lich-livestream',name:'Lịch livestream',Icon:Radio}
];
const roleNavigation={
  seller:{to:'/chu-co-so/don-hang',name:'Quản lý đơn',Icon:ClipboardList},
  affiliate:{to:'/affiliate/kham-pha',name:'Khu vực đoàn viên',Icon:Radio},
  ops:{to:'/dieu-phoi',name:'Điều phối',Icon:ClipboardList}
};

export default function AppShell({session,onAuthSessionChange,onSignOut,isOnline,children}) {
  const [open,setOpen]=useState(false);
  const [initialMode,setInitialMode]=useState('login');
  const [cartCount,setCartCount]=useState(()=>loadCart().reduce((sum,item)=>sum+item.quantity,0));
  const location=useLocation();
  const navigate=useNavigate();
  const activeRole=session?.mode==='supabase'?session.user?.role:session?.persona?.role;
  const workArea=roleNavigation[activeRole];
  const links=workArea?[...publicNavigation,workArea]:publicNavigation;
  const remote=hasRemoteApi();

  useEffect(()=>{
    const refresh=()=>setCartCount(loadCart().reduce((sum,item)=>sum+item.quantity,0));
    window.addEventListener('ocop-cart-updated',refresh);
    window.addEventListener('storage',refresh);
    return ()=>{
      window.removeEventListener('ocop-cart-updated',refresh);
      window.removeEventListener('storage',refresh);
    };
  },[]);

  useEffect(()=>{
    const current=new URLSearchParams(location.search);
    const action=current.get('account');
    if(action!=='login'&&action!=='recovery')return;
    setInitialMode(action);
    setOpen(true);
    current.delete('account');
    navigate({pathname:location.pathname,search:current.toString()},{replace:true});
  },[location.search,location.pathname,navigate]);

  return (
    <div className="min-h-screen flex flex-col bg-canvas text-ink">
      {!remote && <div className="bg-brand-hover px-3 py-1.5 text-center text-xs font-medium text-blue-50">Chợ OCOP Thanh Niên · Dữ liệu trải nghiệm tại Nhà vườn Ba Tư</div>}
      {!isOnline && <div className="flex justify-center gap-2 bg-amber-50 px-3 py-2 text-xs text-amber-900" role="status"><WifiOff size={15}/> Đang ngoại tuyến. Giỏ hàng được giữ trên thiết bị.</div>}
      <header className="sticky top-0 z-30 border-b border-line bg-white/95 shadow-sm backdrop-blur">
        <div className="mx-auto flex min-h-[70px] max-w-7xl items-center justify-between gap-2 px-3 sm:px-6">
          <Link to="/" className="flex min-w-0 items-center gap-2.5" aria-label="Chợ OCOP Thanh Niên, về cửa hàng">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-brand text-white shadow-sm"><Sprout size={22} aria-hidden /></span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-extrabold sm:text-base">Chợ OCOP Thanh Niên</span>
              <span className="hidden truncate text-xs text-muted sm:block">Nông sản Đồng Nai</span>
            </span>
          </Link>
          <nav aria-label="Điều hướng ứng dụng" className="hidden lg:flex gap-1">
            {links.map(item=><NavLink key={item.to} to={item.to} end={item.to==='/'} className={({isActive})=>'rounded-xl px-3 py-2.5 text-sm font-semibold '+(isActive?'bg-blue-50 text-brand':'text-muted hover:text-brand')}>{item.name}</NavLink>)}
          </nav>
          <div className="flex shrink-0 items-center gap-2">
            <Link className="ocop-secondary px-2 sm:px-3" to="/gio-hang" aria-label={'Giỏ hàng, '+cartCount+' sản phẩm'}>
              <ShoppingCart size={18} aria-hidden /><span className="hidden sm:inline">Giỏ hàng</span><span className="rounded-full bg-blue-100 px-1.5 text-xs text-blue-900">{cartCount}</span>
            </Link>
            <button className="ocop-primary px-2.5 sm:px-4" onClick={()=>{setInitialMode('login');setOpen(true);}} aria-label={session?.mode==='supabase'?'Tài khoản':'Đăng nhập'}>
              <UserRound size={18} aria-hidden /><span className="hidden sm:inline">{session?.mode==='supabase'?'Tài khoản':'Đăng nhập'}</span>
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl flex-1 px-3 pb-24 pt-5 sm:px-6 lg:pb-12">{children}</main>
      <footer className="hidden border-t border-line bg-white px-6 py-5 text-sm text-muted lg:block">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <p>Chợ OCOP Thanh Niên · Đồng Nai</p>
          <Link className="font-semibold text-brand" to="/gian-hang/nha-vuon-ba-tu">Tìm hiểu Nhà vườn Ba Tư</Link>
        </div>
      </footer>
      <nav aria-label="Menu nhanh trên điện thoại" className="fixed inset-x-0 bottom-0 z-30 flex justify-around gap-1 border-t border-line bg-white px-2 py-1 pb-[env(safe-area-inset-bottom)] lg:hidden">
        {links.map(({to,name,Icon})=><NavLink key={to} to={to} end={to==='/'} className={({isActive})=>'flex min-h-[52px] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl px-1 text-center text-[11px] font-semibold '+(isActive?'bg-blue-50 text-brand':'text-muted')}><Icon size={19} aria-hidden /><span className="truncate max-w-full">{name}</span></NavLink>)}
      </nav>
      {open&&<AccountDialog session={session} onChange={onAuthSessionChange} onSignOut={onSignOut} onClose={()=>setOpen(false)} initialMode={initialMode} />}
    </div>
  );
}
