import React, { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { X, Camera, AlertCircle, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function QRScannerModal({ isOpen, onClose }) {
  const [manualCode, setManualCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!isOpen) return;

    // Small delay to ensure modal DOM is painted
    const timeout = setTimeout(() => {
      try {
        const scanner = new Html5QrcodeScanner(
          'qr-reader-container',
          { fps: 10, qrbox: { width: 250, height: 250 } },
          /* verbose= */ false
        );

        scanner.render(
          (decodedText) => {
            scanner.clear();
            handleScanSuccess(decodedText);
          },
          (errorMessage) => {
            // scan error (ignore normal framing frames)
          }
        );

        return () => {
          scanner.clear().catch((err) => console.error('Scanner clear error', err));
        };
      } catch (err) {
        console.warn('QR Scanner init error:', err);
      }
    }, 200);

    return () => clearTimeout(timeout);
  }, [isOpen]);

  const handleScanSuccess = (text) => {
    // Check if scanned text is a full URL or contains /services/:id/join
    try {
      if (text.includes('/services/')) {
        const path = text.substring(text.indexOf('/services/'));
        onClose();
        navigate(path);
      } else {
        // Assume it could be a service ID or code
        onClose();
        navigate(`/services/${text}`);
      }
    } catch (e) {
      setErrorMsg('Invalid QR code format. Please try again.');
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleScanSuccess(manualCode.trim());
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">Scan Service QR Code</h3>
            <p className="text-xs text-slate-500">Point your camera at the desk poster</p>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 mb-4 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-2 text-rose-700 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Camera Scanner Viewport */}
        <div className="overflow-hidden rounded-xl bg-slate-50 border border-slate-200 min-h-[260px] flex items-center justify-center">
          <div id="qr-reader-container" className="w-full"></div>
        </div>

        {/* Fallback Manual Join */}
        <div className="mt-5 pt-4 border-t border-slate-100">
          <p className="text-xs font-semibold text-slate-600 mb-2">Or enter Service ID / URL manually:</p>
          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. /services/66... or paste join link"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition flex items-center gap-1"
            >
              Go <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
