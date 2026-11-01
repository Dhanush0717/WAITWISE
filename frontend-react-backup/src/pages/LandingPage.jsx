import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Clock,
  QrCode,
  Tablet,
  Users,
  Compass,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Navigation,
  MapPin,
  TrendingDown,
  Sparkles,
  Zap,
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function LandingPage() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, activeTicket } = useAuth();

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await api.getServices();
        if (res.success) {
          setServices(res.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, []);

  const totalWaiting = services.reduce((acc, s) => acc + (s.stats?.waitingCount || 0), 0);
  const totalServing = services.reduce((acc, s) => acc + (s.stats?.servingCount || 0), 0);
  const activeCount = services.filter((s) => s.status === 'active').length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Active Ticket Banner if user holds a token */}
      {activeTicket && (
        <div className="bg-gradient-to-r from-blue-700 via-indigo-600 to-blue-800 text-white px-4 py-3 shadow-inner">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
              <p className="text-xs sm:text-sm font-semibold">
                You currently hold active token{' '}
                <span className="font-extrabold underline">{activeTicket.ticketNumber}</span> for{' '}
                {activeTicket.serviceId?.name || 'Campus Desk'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                to={`/tickets/${activeTicket._id}`}
                className="px-3 py-1 bg-white text-blue-800 rounded-lg text-xs font-bold hover:bg-blue-50 transition"
              >
                Track Live Ticket
              </Link>
              <Link
                to="/should-i-go"
                className="px-3 py-1 bg-blue-500/30 text-white rounded-lg text-xs font-semibold hover:bg-blue-500/50 transition flex items-center gap-1"
              >
                <Navigation className="w-3.5 h-3.5" /> Should I Go Now?
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(45rem_50rem_at_top,theme(colors.blue.100),theme(colors.slate.50))] opacity-80" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            {/* Project Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-xs font-bold mb-6 animate-soft-pulse">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Real-Time Intelligent Campus Queue Platform</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.1]">
              Skip the campus line.{' '}
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 bg-clip-text text-transparent">
                Wait anywhere, wisely.
              </span>
            </h1>

            <p className="mt-6 text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
              Virtual queuing for administration, examinations, canteen, library, fee counters, and labs.
              Get a live token, see real waiting times, and return only when your counter turn approaches.
            </p>

            {/* CTA Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/services"
                className="w-full sm:w-auto px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center gap-2 group"
              >
                <Compass className="w-4 h-4" /> Browse Campus Desks
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                to="/map"
                className="w-full sm:w-auto px-6 py-3.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl font-bold text-sm shadow-sm transition-all flex items-center justify-center gap-2"
              >
                <MapPin className="w-4 h-4 text-blue-600" /> View Campus Map
              </Link>

              <Link
                to="/kiosk"
                className="w-full sm:w-auto px-6 py-3.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2"
              >
                <Tablet className="w-4 h-4" /> Kiosk Mode
              </Link>
            </div>

            {/* Quick Demo Access Bar */}
            <div className="mt-10 p-3.5 bg-white/80 backdrop-blur-md rounded-2xl border border-slate-200/80 inline-flex flex-wrap items-center justify-center gap-2 text-xs">
              <span className="text-slate-500 font-medium">Quick Demo Profiles:</span>
              <Link
                to="/login?role=student"
                className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg font-semibold hover:bg-blue-100 transition"
              >
                🎓 Student View
              </Link>
              <Link
                to="/login?role=staff"
                className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg font-semibold hover:bg-indigo-100 transition"
              >
                👔 Staff Operator
              </Link>
              <Link
                to="/login?role=admin"
                className="px-2.5 py-1 bg-purple-50 text-purple-700 rounded-lg font-semibold hover:bg-purple-100 transition"
              >
                👑 Administrator
              </Link>
            </div>
          </div>

          {/* Live Campus Crowd Ticker Cards */}
          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm text-center">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Active Desks
              </span>
              <p className="text-3xl font-extrabold text-slate-900 mt-1">{activeCount} / 8</p>
              <span className="text-[11px] text-emerald-600 font-semibold">● Operational Now</span>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm text-center">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Waiting Students
              </span>
              <p className="text-3xl font-extrabold text-blue-600 mt-1">{totalWaiting}</p>
              <span className="text-[11px] text-slate-500 font-medium">Across all campus queues</span>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm text-center">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Serving at Counters
              </span>
              <p className="text-3xl font-extrabold text-indigo-600 mt-1">{totalServing}</p>
              <span className="text-[11px] text-slate-500 font-medium">Right now</span>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm text-center">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Physical Line Saved
              </span>
              <p className="text-3xl font-extrabold text-emerald-600 mt-1">~85%</p>
              <span className="text-[11px] text-emerald-600 font-semibold flex items-center justify-center gap-1">
                <TrendingDown className="w-3 h-3" /> Crowd reduction
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 3-Way Hybrid Queue Architecture Section */}
      <section className="py-16 bg-white border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-extrabold uppercase tracking-widest text-blue-600">
              Core Architectural Principle
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
              "Every waiting person must be represented by a valid token, smartphone or not."
            </h2>
            <p className="text-sm text-slate-600 mt-3">
              WAITWISE resolves the digital divide by feeding three distinct entry channels into the exact same atomic backend FIFO queue.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-blue-300 transition-all">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-4">
                <QrCode className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-slate-900 mb-2">1. Self-Service Mobile QR</h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                Students scan the poster QR code or open a direct link. Instant virtual ticket with live countdown, turn notifications, and no app install needed.
              </p>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" /> Smartphone Users
              </span>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-blue-300 transition-all">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-4">
                <Tablet className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-slate-900 mb-2">2. Entrance Touch Kiosk</h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                Placed on tablets at office and canteen entrances. A 2-touch flow issues a printable or on-screen slip with a ticket number and tracking QR.
              </p>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500" /> Walk-in Touch Terminal
              </span>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-blue-300 transition-all">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-slate-900 mb-2">3. Staff-Assisted Concierge</h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                Counter operators issue manual tokens for visitors without phones or needing accessibility help. Requires zero personal contact info.
              </p>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> 100% Inclusive Support
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Signature Feature Spotlight: "Should I Go Now?" */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 rounded-3xl p-8 sm:p-12 text-white shadow-xl flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold mb-4">
                <Navigation className="w-3.5 h-3.5 text-blue-400" />
                <span>Signature Intelligent Feature</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                "Should I Go Now?" Advisor
              </h2>
              <p className="mt-4 text-sm text-slate-300 leading-relaxed">
                Never rush back unnecessarily. Our real-time advisory engine computes your remaining queue wait, your campus walk time, and a safety margin to give you clear advice:
              </p>
              <div className="mt-6 space-y-2.5 text-xs text-slate-200">
                <div className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-full bg-blue-400"></span>
                  <span><strong>Wait Comfortably:</strong> Plenty of time to study in library or eat at canteen.</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-full bg-amber-400"></span>
                  <span><strong>Start Heading Back:</strong> Pacing matches your walk time. Start moving.</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-full bg-emerald-400"></span>
                  <span><strong>Proceed to Counter:</strong> Your turn is ready at Counter 1!</span>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/10 max-w-sm w-full text-center">
              <span className="text-[11px] uppercase tracking-wider text-blue-300 font-bold">
                Live Advisory Demo
              </span>
              <div className="my-4 p-4 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-200">
                <p className="text-2xl font-black">TIME TO MOVE</p>
                <p className="text-xs text-amber-100 mt-1">~3 people ahead • 7 mins remaining</p>
              </div>
              <p className="text-[11px] text-slate-300 mb-4">
                Works with live GPS coordinates or a simple walking duration selector.
              </p>
              <Link
                to="/should-i-go"
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
              >
                Try "Should I Go Now?" <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
