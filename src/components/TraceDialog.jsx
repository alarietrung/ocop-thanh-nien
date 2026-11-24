import React,{useEffect,useRef} from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight,QrCode,X } from 'lucide-react';

export default function TraceDialog({batchCode,qrSrc,traceRoute,publicLink,onClose}) {
  const dialog=useRef(null);
  useEffect(()=>{
    const current=dialog.current;
    current.showModal();
    return ()=>{if(current.open)current.close();};
  },[]);
  return (
    <dialog ref={dialog} className="ocop-dialog" aria-labelledby="trace-popup-title" onCancel={(event)=>{event.preventDefault();onClose();}} onClick={(event)=>{if(event.target===event.currentTarget)onClose();}}>
      <div className="overflow-hidden rounded-[inherit] bg-white">
        <header className="ocop-dialog-hero flex justify-between gap-4 p-6">
          <div><QrCode size={24} aria-hidden /><h2 id="trace-popup-title" className="mt-3 text-xl font-extrabold">Truy xuất nguồn gốc</h2><p className="mt-1 text-sm text-blue-100">Nhật ký mùa vụ · Lô {batchCode}</p></div>
          <button type="button" onClick={onClose} aria-label="Đóng mã QR" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/15"><X size={20} aria-hidden /></button>
        </header>
        <div className="space-y-4 p-6">
          {qrSrc && <img src={qrSrc} width="280" height="280" className="mx-auto w-64 max-w-full rounded-xl border border-line" alt={'Mã QR lô '+batchCode} />}
          <p className="text-center text-sm text-muted">{publicLink?'Dùng camera điện thoại quét mã để xem nhật ký mùa vụ.':'Đây là bản mở trên máy. Dùng nút bên dưới để xem nhật ký ngay.'}</p>
          <Link to={traceRoute} className="ocop-primary w-full" onClick={onClose}>Mở nhật ký mùa vụ <ArrowRight size={17} aria-hidden /></Link>
        </div>
      </div>
    </dialog>
  );
}
