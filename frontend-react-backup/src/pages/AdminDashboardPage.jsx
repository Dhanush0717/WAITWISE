import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  Users,
  Clock,
  Compass,
  Sliders,
  BarChart3,
  Download,
  AlertTriangle,
  Flame,
  CheckCircle2,
  MapPin,
  ArrowRight,
  TrendingDown,
  Layers,
  Sparkles,
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { socket } = useSocket();

  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState([]);

  const fetchDashboard = async () => {
    try {
      const res = await api.getAdminDashboard();
      if (res.success) {
        setMetrics(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/login?role=admin');
      return;
    }
    fetchDashboard();
  }, [user, navigate]);

  // Real-time socket updates & overflow alerts
  useEffect(() => {
    if (!socket) return;

    const handleUpdate = () => {
      fetchDashboard();
    };

    const handleOverload = (data) => {
      setAlerts((prev) => [data, ...prev.slice(0, 4)]);
      fetchDashboard();
    };

    socket.on('queueUpdated', handleUpdate);
    socket.on('overload_alert', handleOverload);
    socket.on('counterStatusChanged', handleUpdate);

    return () => {
      socket.off('queueUpdated', handleUpdate);
      socket.off('overload_alert', handleOverload);
      socket.off('counterStatusChanged', handleUpdate);
    };
  }, [socket]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500 text-sm font-semibold">
          <div className="w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
          <span>Loading campus command metrics...</span>
        </div>
      </div>
    );
  }

  const { kpi = {}, services = [] } = metrics || {};

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Command Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-lg bg-purple-100 text-purple-700 text-xs font-black uppercase">
                Admin Command Center
              </span>
              <span className="text-xs text-slate-500 font-semibold">
                Live Campus Queue Monitor
              </span>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Campus Crowd Overview
            </h1>
          </div>

          {/* Quick Action Navigation Links */}
          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              to="/admin/simulation"
              className="py-2.5 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
            >
              <Sliders className="w-4 h-4 text-purple-200" /> Counter Simulator
            </Link>
            <Link
              to="/admin/analytics"
              className="py-2.5 px-4 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
            >
              <BarChart3 className="w-4 h-4 text-blue-600" /> Analytics & Reports
            </Link>
            <Link
              to="/admin/services"
              className="py-2.5 px-4 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
            >
              <Compass className="w-4 h-4 text-purple-600" /> Manage Desks
            </Link>
            <a
              href="/api/admin/export-csv"
              download
              className="py-2.5 px-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition flex items-center gap-1"
              title="Export tickets CSV"
            >
              <Download className="w-3.5 h-3.5" /> CSV
            </a>
          </div>
        </div>

        {/* Live Overload Alerts Banner if triggered */}
        {alerts.length > 0 && (
          <div className="mb-6 space-y-2">
            {alerts.map((al, idx) => (
              <div
                key={idx}
                className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-rose-800 text-xs animate-in slide-in-from-top-2"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-rose-200/60 rounded-xl text-rose-700 shrink-0">
                    <Flame className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-extrabold uppercase">Queue Overload Alert:</span>{' '}
                    <strong>{al.serviceName}</strong> has {al.waitingCount} waiting customers (threshold: {al.threshold}).
                    <p className="text-rose-600 mt-0.5">{al.recommendation}</p>
                  </div>
                </div>
                <Link
                  to={`/admin/simulation?serviceId=${al.serviceId}`}
                  className="px-3 py-1.5 bg-rose-600 text-white font-bold rounded-lg hover:bg-rose-700 transition shrink-0 text-center"
                >
                  Simulate Extra Counter →
                </Link>
              </div>
            ))}
          </div>
        )}

        {/* Top KPI Cards Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="p-5 bg-white rounded-3xl border border-slate-200/80 shadow-sm text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Active Desks
            </span>
            <p className="text-3xl font-black text-slate-900 mt-1">
              {kpi.activeServices} <span className="text-xs text-slate-400 font-normal">/ {kpi.totalServices}</span>
            </p>
            <span className="text-[11px] text-emerald-600 font-semibold">● Online Now</span>
          </div>

          <div className="p-5 bg-white rounded-3xl border border-slate-200/80 shadow-sm text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Waiting Students
            </span>
            <p className="text-3xl font-black text-blue-600 mt-1">{kpi.totalWaiting}</p>
            <span className="text-[11px] text-slate-500 font-medium">In campus queues</span>
          </div>

          <div className="p-5 bg-white rounded-3xl border border-slate-200/80 shadow-sm text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Currently Serving
            </span>
            <p className="text-3xl font-black text-indigo-600 mt-1">{kpi.totalServing}</p>
            <span className="text-[11px] text-slate-500 font-medium">At active counters</span>
          </div>

          <div className="p-5 bg-white rounded-3xl border border-slate-200/80 shadow-sm text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Open Counters
            </span>
            <p className="text-3xl font-black text-purple-600 mt-1">
              {kpi.openCounters} <span className="text-xs text-slate-400 font-normal">/ {kpi.totalCounters}</span>
            </p>
            <span className="text-[11px] text-slate-500 font-medium">Staffed stations</span>
          </div>

          <div className="p-5 bg-white rounded-3xl border border-slate-200/80 shadow-sm text-center col-span-2 md:col-span-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Longest Est. Wait
            </span>
            <p className="text-3xl font-black text-amber-600 mt-1">{kpi.longestWaitMinutes}m</p>
            <span className="text-[11px] text-slate-500 truncate block max-w-[120px] mx-auto">
              {kpi.longestWaitService}
            </span>
          </div>
        </div>

        {/* Live Service Desks Real-Time Crowd Grid */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">
                Department Queue Pressure & Load Levels
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Real-time queue volume categorized by configurable threshold limits
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Low (&lt;50%)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Moderate (50-99%)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> High (≥100%)
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {services.map((svc) => (
              <div
                key={svc.id}
                className="p-5 rounded-2xl border border-slate-200 bg-slate-50/60 flex flex-col justify-between hover:bg-slate-50 hover:border-purple-300 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-0.5 bg-blue-600 text-white font-extrabold text-[11px] rounded-md">
                      {svc.code}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        svc.loadLevel === 'high'
                          ? 'bg-rose-100 text-rose-800'
                          : svc.loadLevel === 'moderate'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {svc.loadLevel} Load
                    </span>
                  </div>

                  <h3 className="font-extrabold text-sm text-slate-900 truncate">{svc.name}</h3>

                  <div className="mt-4 grid grid-cols-2 gap-2 text-center bg-white p-3 rounded-xl border border-slate-200/80">
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold uppercase">Waiting</span>
                      <p className="text-xl font-black text-blue-600">{svc.waiting}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold uppercase">Est. Wait</span>
                      <p className="text-xl font-black text-slate-800">{svc.estimatedWaitMinutes}m</p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs">
                  <span className="text-slate-500 text-[11px]">
                    {svc.activeCounters} counter(s) open
                  </span>
                  <Link
                    to={`/admin/simulation?serviceId=${svc.id}`}
                    className="text-purple-600 font-bold hover:text-purple-800 flex items-center gap-0.5"
                  >
                    Simulate →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
