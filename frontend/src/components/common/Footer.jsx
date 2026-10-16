import React from 'react';
import { Clock, ShieldCheck, Heart, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand info */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                <Clock className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-lg text-slate-900 tracking-tight">
                WAIT<span className="text-blue-600">WISE</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Real-Time Intelligent Campus Queue & Crowd Management System. Minimizing physical queues across student services, canteen, library, and labs.
            </p>
          </div>

          {/* Hybrid Access Channels */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
              Hybrid Queue Channels
            </h4>
            <ul className="space-y-2 text-xs text-slate-600">
              <li>1. Self-Service Mobile QR Scan</li>
              <li>2. Entrance Touch Kiosk Terminal</li>
              <li>3. Staff-Assisted Walk-in Token</li>
              <li>• Unified atomic FIFO backend</li>
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
              Campus Facilities
            </h4>
            <ul className="space-y-2 text-xs text-slate-600">
              <li><Link to="/services" className="hover:text-blue-600">All Service Desks</Link></li>
              <li><Link to="/map" className="hover:text-blue-600">Interactive Campus Map</Link></li>
              <li><Link to="/should-i-go" className="hover:text-blue-600">"Should I Go Now?" Advisor</Link></li>
              <li><Link to="/kiosk" className="hover:text-blue-600">Self-Service Kiosk Mode</Link></li>
            </ul>
          </div>

          {/* Security & System Info */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 mb-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Campus Tech Project</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed mb-3">
              Built with Node.js, Express, MongoDB, Socket.IO, React 18, Tailwind CSS, and Chart.js.
            </p>
            <div className="text-[10px] text-slate-400">
              Token sequences refreshed daily. No physical crowd sensors claimed.
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2">
          <p>© {new Date().getFullYear()} WAITWISE. Web Technologies College Project.</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-slate-500">
              Designed with care for modern campus life
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
