import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, QrCode, X } from 'lucide-react';

export default function TraceDialog({ batchCode, qrSrc, publicUrl, traceRoute, onClose }) {
  const dialog = useRef(null);
  useEffect(() => {
    const current = dialog.current;
    if (current && !current.open) {
      current.showModal();
    }
    return () => {
      if (current?.open) current.close();
    };
  }, []);

  return (
    <dialog
      ref={dialog}
      className="ocop-dialog"
      aria-labelledby="trace-popup-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="overflow-hidden rounded-[inherit] bg-white">
        <header className="ocop-dialog-hero flex justify-between gap-4 p-5 sm:p-6">
          <div>
            <QrCode size={24} aria-hidden="true" />
            <h2 id="trace-popup-title" className="mt-2.5 text-xl font-extrabold">
              Mã QR Truy xuất nguồn gốc
            </h2>
            <p className="mt-1 text-sm text-blue-100">Nhật ký mùa vụ · Lô {batchCode}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng mã QR"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white/15 hover:bg-white/25"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </header>
        <div className="space-y-4 p-5 sm:p-6">
          {qrSrc && (
            <div className="mx-auto w-fit rounded-2xl border border-line bg-white p-3 shadow-sm">
              <img
                src={qrSrc}
                width="260"
                height="260"
                data-qr-url={publicUrl}
                className="w-60 max-w-full block"
                alt={`Mã QR truy xuất lô ${batchCode}`}
              />
            </div>
          )}
          <p className="text-center text-xs font-mono text-muted break-all bg-canvas border border-line rounded-xl p-2.5">
            {publicUrl}
          </p>
          <p className="text-center text-sm text-muted">
            Dùng camera điện thoại quét mã QR (có viền trắng tiêu chuẩn 4 ô) để mở trang nhật ký mùa vụ công khai hoặc bấm nút dưới xem ngay.
          </p>
          <Link to={traceRoute} className="ocop-primary w-full" onClick={onClose}>
            <span>Mở nhật ký mùa vụ ngay</span>
            <ArrowRight size={17} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </dialog>
  );
}
