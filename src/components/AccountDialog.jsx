import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, Eye, EyeOff, LockKeyhole, LogOut, Mail, Sprout, X } from 'lucide-react';
import { getSupabaseConfig } from '../services/authService';
import { registerAccount, requestAccountRecovery, signInAccount } from '../services/accountApi';

const forms = {
  login: {title:'Chào mừng trở lại', detail:'Đăng nhập để sử dụng tài khoản Chợ OCOP Thanh Niên.', cta:'Đăng nhập'},
  register: {title:'Tạo tài khoản', detail:'Sử dụng email của anh để xác nhận tài khoản.', cta:'Đăng ký'},
  recovery: {title:'Khôi phục tài khoản', detail:'Nhập email đã đăng ký. Chợ OCOP sẽ gửi liên kết đặt lại mật khẩu.', cta:'Gửi liên kết khôi phục'}
};

export default function AccountDialog({ session, onChange, onSignOut, onClose, initialMode='login' }) {
  const dialog=useRef(null);
  const [mode,setMode]=useState(initialMode);
  const [email,setEmail]=useState('');
  const [password,setPassword]=useState('');
  const [show,setShow]=useState(false);
  const [status,setStatus]=useState('');
  const [error,setError]=useState('');
  const [busy,setBusy]=useState(false);
  const isOnlineAuth=getSupabaseConfig().configured;
  const loggedIn=session?.mode==='supabase';

  useEffect(()=>{
    const element=dialog.current;
    element.showModal();
    return ()=>{if(element.open)element.close();};
  },[]);

  function switchMode(next) {
    setMode(next);
    setStatus('');
    setError('');
    setPassword('');
    setShow(false);
  }

  async function submit(event) {
    event.preventDefault();
    if(!isOnlineAuth||busy)return;
    setError('');
    setStatus('');
    setBusy(true);
    try {
      const details={email:email.trim(),password};
      if(mode==='login'){
        onChange(await signInAccount(details));
        onClose();
      } else if(mode==='recovery'){
        await requestAccountRecovery(details.email);
        setStatus('Nếu email này đã đăng ký, anh sẽ nhận được liên kết đặt lại mật khẩu. Kiểm tra cả mục thư rác.');
      } else {
        await registerAccount(details);
        setStatus('Kiểm tra hộp thư để xác nhận tài khoản, sau đó quay lại đăng nhập.');
      }
    } catch(failure) {
      setError(failure.message==='Failed to fetch'?'Không kết nối được dịch vụ tài khoản. Vui lòng thử lại.':failure.message);
    } finally {
      setBusy(false);
    }
  }

  const info=forms[mode];
  return (
    <dialog ref={dialog} className="ocop-dialog" aria-labelledby="account-title"
      onCancel={(event)=>{event.preventDefault();onClose();}}
      onClick={(event)=>{if(event.target===event.currentTarget)onClose();}}>
      <div className="overflow-hidden rounded-[inherit] bg-white">
        <div className="ocop-dialog-hero flex justify-between gap-4 p-6">
          <div>
            <span className="inline-flex rounded-2xl bg-white/15 p-2.5"><Sprout size={22} aria-hidden /></span>
            <h2 id="account-title" className="mt-3 text-2xl font-extrabold">{loggedIn?'Tài khoản của anh':info.title}</h2>
            <p className="mt-1 text-sm text-blue-100">{loggedIn?'Chợ OCOP Thanh Niên':info.detail}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Đóng hộp thoại tài khoản" className="h-10 w-10 shrink-0 rounded-xl bg-white/15 grid place-items-center hover:bg-white/25"><X size={20} aria-hidden /></button>
        </div>
        {loggedIn ? (
          <div className="space-y-4 p-6">
            <div className="flex items-center gap-3 rounded-2xl bg-blue-50 p-4"><Mail className="text-brand" size={19}/><p className="break-all text-sm font-semibold">{session.user?.email}</p></div>
            <button type="button" className="ocop-secondary w-full" onClick={async()=>{await onSignOut();onClose();}}><LogOut size={17}/> Đăng xuất</button>
          </div>
        ) : (
          <div className="space-y-4 p-6">
            {!isOnlineAuth && <p className="rounded-xl border border-blue-100 bg-blue-50 p-3 text-sm text-blue-900">Bản xem thử chưa kết nối dịch vụ tài khoản. Anh vẫn có thể xem hàng và đặt đơn mẫu.</p>}
            {status && <p role="status" className="flex gap-2 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900"><CheckCircle2 className="shrink-0" size={18}/>{status}</p>}
            {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
            <form className="space-y-4" onSubmit={submit}>
              <div>
                <label htmlFor="account-email" className="ocop-label">Email</label>
                <input id="account-email" className="ocop-field" type="email" autoComplete="email" placeholder="ten@example.com" required value={email} onChange={(event)=>setEmail(event.target.value)} />
              </div>
              {mode!=='recovery' && <div>
                <div className="flex justify-between gap-2">
                  <label htmlFor="account-password" className="ocop-label">Mật khẩu</label>
                  {mode==='login' && <button type="button" className="text-sm font-semibold text-brand" onClick={()=>switchMode('recovery')}>Quên mật khẩu?</button>}
                </div>
                <div className="relative">
                  <input id="account-password" className="ocop-field pr-14" type={show?'text':'password'} autoComplete={mode==='login'?'current-password':'new-password'} minLength={mode==='register'?8:undefined} required value={password} onChange={(event)=>setPassword(event.target.value)} />
                  <button type="button" className="absolute right-1 top-1 w-10 h-10 grid place-items-center text-muted hover:text-brand" aria-label={show?'Ẩn mật khẩu':'Hiện mật khẩu'} onClick={()=>setShow(!show)}>{show?<EyeOff size={18}/>:<Eye size={18}/>}</button>
                </div>
              </div>}
              <button disabled={busy||!isOnlineAuth} type="submit" className="ocop-primary w-full">
                {mode==='recovery'?<Mail size={16}/>:<LockKeyhole size={16}/>} {busy?'Đang xử lý…':info.cta} <ArrowRight size={16} aria-hidden />
              </button>
            </form>
            <button type="button" className="flex mx-auto min-h-[44px] items-center gap-1 px-3 text-sm font-semibold text-brand" onClick={()=>switchMode(mode==='login'?'register':'login')}>
              {mode!=='login' && <ArrowLeft size={15}/>} {mode==='login'?'Chưa có tài khoản? Đăng ký':'Quay về đăng nhập'}
            </button>
          </div>
        )}
      </div>
    </dialog>
  );
}
