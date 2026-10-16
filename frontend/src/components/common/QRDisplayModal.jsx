import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Printer, Download, Sparkles } from 'lucide-react';

export default function QRDisplayModal({
  isOpen,
  onClose,
  title = 'Service QR Code',
  subtitle = 'Scan with smartphone to join virtual queue',
  qrValue,
  ticketData = null,
}) {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 relative print:p-0 print:border-none print:shadow-none">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition print:hidden"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl mb-3">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">{title}</h3>
          <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
        </div>

        {/* QR Code Container */}
        <div className="p-6 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center mx-auto mb-5">
          <div className="p-3 bg-white rounded-xl shadow-sm border border-slate-100">
            <QRCodeSVG
              value={qrValue || 'https://waitwise.campus'}
              size={180}
              level="H"
              includeMargin={true}
            />
          </div>

          {ticketData && (
            <div className="mt-4 text-center">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Your Token</span>
              <p className="text-3xl font-extrabold text-blue-600 tracking-tight">{ticketData.ticketNumber}</p>
              <p className="text-xs text-slate-600 mt-1">{ticketData.serviceName || 'Campus Service'}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 print:hidden">
          <button
            onClick={handlePrint}
            className="flex-1 py-2.5 px-4 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition flex items-center justify-center gap-2 shadow-sm"
          >
            <Printer className="w-4 h-4" /> Print Token Slip
          </button>
          <button
            onClick={onClose}
            className="py-2.5 px-4 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-200 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
