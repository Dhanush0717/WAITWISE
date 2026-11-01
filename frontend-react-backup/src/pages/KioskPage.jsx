import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import {
  Tablet,
  Printer,
  CheckCircle2,
  Clock,
  Users,
  RotateCcw,
  Sparkles,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';
import { api } from '../services/api';

export default function KioskPage() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const initialServiceId = searchParams.get('serviceId');

  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [customerName, setCustomerName] = useState('');
  const [customerIdentifier, setCustomerIdentifier] = useState('');
  const [issuedTicket, setIssuedTicket] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(15);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await api.getServices();
        if (res.success) {
          setServices(res.data);
          if (initialServiceId) {
            const found = res.data.find((s) => s._id === initialServiceId);
            if (found) setSelectedService(found);
          }
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchServices();
  }, [initialServiceId]);

  // Auto-reset countdown when ticket is issued so kiosk resets for next student
  useEffect(() => {
    let timer;
    if (issuedTicket && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((c) => c - 1);
      }, 1000);
    } else if (issuedTicket && countdown === 0) {
      handleReset();
    }
    return () => clearInterval(timer);
  }, [issuedTicket, countdown]);

  const handleIssueToken = async (quick = false) => {
    if (!selectedService) return;
    setError('');
    setLoading(true);

    try {
      const res = await api.kioskJoin({
        serviceId: selectedService._id,
        customerName: quick ? '' : customerName,
        customerIdentifier: quick ? '' : customerIdentifier,
      });

      if (res.success) {
        setIssuedTicket(res.data);
        setCountdown(15);
      }
    } catch (err) {
      setError(err.message || 'Failed to issue kiosk token');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setIssuedTicket(null);
    setCustomerName('');
    setCustomerIdentifier('');
    setSelectedService(null);
    setError('');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col justify-between p-4 sm:p-8">
      {/* Kiosk Header */}
      <header className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
            <Tablet className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">
              WAITWISE <span className="text-blue-400">TOUCH KIOSK</span>
            </h1>
            <p className="text-xs text-slate-400">Touch screen to take an official campus queue ticket</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleReset}
            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Start Over
          </button>
          <Link
            to="/services"
            className="text-xs text-slate-400 hover:text-white underline"
          >
            Exit Kiosk
          </Link>
        </div>
      </header>

      {/* Main Kiosk Touch View */}
      <main className="my-auto py-8 max-w-4xl mx-auto w-full">
        {error && (
          <div className="mb-6 p-4 bg-rose-900/60 border border-rose-700 text-rose-200 rounded-2xl flex items-center gap-3 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {issuedTicket ? (
          /* Step 3: Success Slip Display */
          <div className="bg-white text-slate-900 rounded-3xl p-8 sm:p-12 text-center max-w-md mx-auto shadow-2xl animate-in zoom-in-95 duration-200 print:shadow-none print:p-0">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <span className="text-xs font-extrabold uppercase tracking-widest text-slate-400">
              Your Printed Ticket Slip
            </span>
            <p className="text-6xl font-black text-blue-600 tracking-tight my-2">
              {issuedTicket.ticket?.ticketNumber}
            </p>
            <h3 className="text-lg font-bold text-slate-800">
              {selectedService?.name || 'Campus Desk'}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Position in line: <strong>#{issuedTicket.position}</strong> ({issuedTicket.peopleAhead} ahead)
            </p>

            {/* QR Code so student can scan with their phone before walking away! */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl my-6 flex flex-col items-center">
              <QRCodeSVG
                value={issuedTicket.trackingUrl || 'https://waitwise.campus'}
                size={140}
                level="M"
              />
              <p className="text-[11px] font-semibold text-slate-500 mt-2">
                📸 Scan with smartphone camera to track your live turn!
              </p>
            </div>

            <div className="flex gap-2 print:hidden">
              <button
                onClick={handlePrint}
                className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4" /> Print Ticket Slip
              </button>
              <button
                onClick={handleReset}
                className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
              >
                Next Student ({countdown}s)
              </button>
            </div>
          </div>
        ) : !selectedService ? (
          /* Step 1: Select Service Desk */
          <div>
            <div className="text-center mb-8">
              <span className="text-xs font-bold uppercase tracking-widest text-blue-400">Step 1 of 2</span>
              <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">
                Select Your Campus Department
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Touch a service box below to check in
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {services.map((svc) => (
                <button
                  key={svc._id}
                  onClick={() => setSelectedService(svc)}
                  className="p-5 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 hover:border-blue-500 rounded-2xl text-left transition-all group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2.5 py-0.5 bg-blue-500/20 text-blue-300 font-extrabold text-xs rounded-lg">
                        {svc.code}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium uppercase">
                        {svc.category}
                      </span>
                    </div>
                    <h3 className="font-extrabold text-base text-white group-hover:text-blue-400 transition-colors">
                      {svc.name}
                    </h3>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-700/60 flex items-center justify-between text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      {svc.stats?.waitingCount || 0} Waiting
                    </span>
                    <span className="flex items-center gap-1 font-bold text-blue-400 group-hover:translate-x-1 transition-transform">
                      Touch to Select →
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Step 2: Confirm or Provide Details */
          <div className="max-w-md mx-auto bg-slate-800 rounded-3xl p-8 border border-slate-700 shadow-2xl">
            <div className="text-center mb-6">
              <span className="text-xs font-bold uppercase tracking-widest text-blue-400">Step 2 of 2</span>
              <h2 className="text-xl font-bold text-white mt-1">{selectedService.name}</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Ready to issue token for {selectedService.code}
              </p>
            </div>

            {/* Quick 1-Touch Button */}
            <button
              onClick={() => handleIssueToken(true)}
              disabled={loading}
              className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl text-sm font-black shadow-lg shadow-blue-600/30 transition flex items-center justify-center gap-2 mb-4"
            >
              <Sparkles className="w-5 h-5 text-blue-200" />
              {loading ? 'Issuing Token...' : '⚡ Quick Visitor Token (1-Touch)'}
            </button>

            <div className="relative my-4 text-center">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-700"></div></div>
              <span className="relative px-3 bg-slate-800 text-[11px] text-slate-400 font-semibold uppercase">
                Or enter student info
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Your Name</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Optional: e.g. Liam Smith"
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Roll Number / ID</label>
                <input
                  type="text"
                  value={customerIdentifier}
                  onChange={(e) => setCustomerIdentifier(e.target.value)}
                  placeholder="Optional: e.g. 2024-CS-023"
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setSelectedService(null)}
                  className="py-2.5 px-4 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl text-xs font-semibold transition"
                >
                  Back
                </button>
                <button
                  onClick={() => handleIssueToken(false)}
                  disabled={loading}
                  className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                >
                  Confirm & Print Token <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Kiosk Footer */}
      <footer className="text-center text-xs text-slate-500 border-t border-slate-800 pt-4">
        WAITWISE Campus Touch Kiosk System • Automatic timeout protection • Paperless QR enabled
      </footer>
    </div>
  );
}
