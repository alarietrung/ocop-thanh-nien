import React,{useEffect,useState} from 'react';
import { Link, useLocation } from 'react-router-dom';
import { KeyRound, MailCheck } from 'lucide-react';
import { resetAccountPassword, takeRecoveryToken } from '../services/accountApi';

export default function AccountRecoveryPage() {
  const {pathname}=useLocation();
  const confirmation=pathname.endsWith('/xac-nhan');
  const [token,setToken]=useState('');
  const [password,setPassword]=useState('');
  const [repeat,setRepeat]=useState('');
  const [error,setError]=useState('');
  const [busy,setBusy]=useState(false);
  const [done,setDone]=useState(false);
  useEffect(()=>{
    if(!confirmation) {
      const incoming=takeRecoveryToken();
      if(incoming) setToken(incoming);
    } else if(window.location.protocol !== 'file:' && window.location.hash) window.history.replaceState(window.history.state,'',window.location.pathname);
  },[confirmation]);
  async function submit(event) {
    event.preventDefault();
    if(password!==repeat){setError('Hai mật khẩu chưa khớp.');return;}
    setError('');
    setBusy(true);
    try {
      await resetAccountPassword(password,token);
      setToken('');
      setPassword('');
      setRepeat('');
      setDone(true);
    } catch(failure) {
      setError(failure.message||'Không thể đổi mật khẩu. Hãy yêu cầu liên kết mới.');
    } finally {setBusy(false);}
  }
  return (
    <section className="mx-auto max-w-lg rounded-3xl border border-line bg-white p-6 shadow-sm sm:p-8">
      <div className="mb-5 inline-flex rounded-2xl bg-blue-100 p-3 text-brand">{confirmation||done?<MailCheck size={24}/>:<KeyRound size={24}/>}</div>
      <h1 className="text-2xl font-extrabold">{confirmation?'Xác nhận email':done?'Mật khẩu đã được cập nhật':'Đặt lại mật khẩu'}</h1>
      {confirmation||done||!token?(
        <div className="mt-3 space-y-4">
          <p className="text-sm text-muted">{confirmation?'Nếu email đã được xác nhận, anh có thể đăng nhập.':done?'Anh có thể đăng nhập bằng mật khẩu mới.':'Liên kết không hợp lệ hoặc đã hết hạn. Hãy yêu cầu một liên kết khôi phục mới.'}</p>
          <Link className="ocop-primary" to={token||confirmation||done?'/?account=login':'/?account=recovery'}>{token||confirmation||done?'Về đăng nhập':'Yêu cầu liên kết mới'}</Link>
        </div>
      ):(
        <form className="mt-5 space-y-4" onSubmit={submit}>
          {error&&<p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
          <label className="block"><span className="ocop-label">Mật khẩu mới (ít nhất 8 ký tự)</span><input className="ocop-field" type="password" autoComplete="new-password" minLength={8} required value={password} onChange={(event)=>setPassword(event.target.value)}/></label>
          <label className="block"><span className="ocop-label">Nhập lại mật khẩu</span><input className="ocop-field" type="password" autoComplete="new-password" minLength={8} required value={repeat} onChange={(event)=>setRepeat(event.target.value)}/></label>
          <button disabled={busy} className="ocop-primary w-full">{busy?'Đang cập nhật…':'Cập nhật mật khẩu'}</button>
        </form>
      )}
    </section>
  );
}
