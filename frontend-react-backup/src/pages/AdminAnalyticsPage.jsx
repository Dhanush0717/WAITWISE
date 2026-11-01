import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart3,
  Download,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  UserX,
  TrendingUp,
  ArrowRight,
} from 'lucide-react';
import { api } from '../services/api';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export default function AdminAnalyticsPage() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await api.getAnalytics();
        if (res.success) {
          setAnalytics(res.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500 text-sm font-semibold">
          <div className="w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
          <span>Generating queue analytics charts...</span>
        </div>
      </div>
    );
  }

  const { outcomes = {}, rates = {}, durationPerService = [], hourlyTraffic = [] } =
    analytics || {};

  // Chart 1: Outcome Breakdown Doughnut Data
  const doughnutData = {
    labels: ['Completed', 'Cancelled', 'Skipped', 'No Show'],
    datasets: [
      {
        data: [
          outcomes.COMPLETED || 0,
          outcomes.CANCELLED || 0,
          outcomes.SKIPPED || 0,
          outcomes.NO_SHOW || 0,
        ],
        backgroundColor: [
          '#10b981', // emerald
          '#f43f5e', // rose
          '#f59e0b', // amber
          '#64748b', // slate
        ],
        borderWidth: 2,
        borderColor: '#ffffff',
      },
    ],
  };

  // Chart 2: Hourly Traffic Line Data
  const lineData = {
    labels: hourlyTraffic.map((h) => h.hour),
    datasets: [
      {
        label: 'Tokens Issued Today',
        data: hourlyTraffic.map((h) => h.tokens),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.35,
        fill: true,
        pointBackgroundColor: '#2563eb',
      },
    ],
  };

  // Chart 3: Duration per service Bar Data
  const barData = {
    labels: durationPerService.map((d) => d.serviceCode || d.serviceName),
    datasets: [
      {
        label: 'Avg Duration (Mins)',
        data: durationPerService.map((d) => d.avgDuration),
        backgroundColor: '#8b5cf6',
        borderRadius: 8,
      },
    ],
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-bold mb-2">
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Queue Performance Intelligence</span>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Queue Analytics & Reports
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Hourly arrival distributions, resolution rates, and desk duration pacing.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/api/admin/export-csv"
              download
              className="py-2.5 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm"
            >
              <Download className="w-4 h-4" /> Export Raw CSV Report
            </a>
          </div>
        </div>

        {/* Rate KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="p-5 bg-white rounded-3xl border border-slate-200/80 shadow-sm text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Completed Visits
            </span>
            <p className="text-3xl font-black text-emerald-600 mt-1">{outcomes.COMPLETED || 0}</p>
            <span className="text-[11px] text-slate-500">Successfully served</span>
          </div>

          <div className="p-5 bg-white rounded-3xl border border-slate-200/80 shadow-sm text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              No-Show Rate
            </span>
            <p className="text-3xl font-black text-amber-600 mt-1">{rates.noShowRate || 0}%</p>
            <span className="text-[11px] text-slate-500">Unattended after called</span>
          </div>

          <div className="p-5 bg-white rounded-3xl border border-slate-200/80 shadow-sm text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Cancellation Rate
            </span>
            <p className="text-3xl font-black text-rose-600 mt-1">{rates.cancelRate || 0}%</p>
            <span className="text-[11px] text-slate-500">Left virtual queue early</span>
          </div>

          <div className="p-5 bg-white rounded-3xl border border-slate-200/80 shadow-sm text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Total Today Tokens
            </span>
            <p className="text-3xl font-black text-blue-600 mt-1">
              {Object.values(outcomes).reduce((a, b) => a + b, 0)}
            </p>
            <span className="text-[11px] text-slate-500">All channels combined</span>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Chart 1: Hourly Distribution */}
          <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-sm">
            <h3 className="font-extrabold text-sm text-slate-900 mb-1">
              Hourly Campus Arrival Traffic (8:00 AM - 6:00 PM)
            </h3>
            <p className="text-xs text-slate-500 mb-4">Volume of student queue tokens created by hour</p>
            <div className="h-64">
              <Line
                data={lineData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                }}
              />
            </div>
          </div>

          {/* Chart 2: Outcome Breakdown */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 mb-1">
                Token Outcome Distribution
              </h3>
              <p className="text-xs text-slate-500 mb-4">Status of today's generated tokens</p>
              <div className="h-52 flex items-center justify-center">
                <Doughnut
                  data={doughnutData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { position: 'bottom' } },
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Chart 3: Duration per Service */}
        {durationPerService.length > 0 && (
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-sm">
            <h3 className="font-extrabold text-sm text-slate-900 mb-1">
              Average Service Processing Time per Desk (Minutes)
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Used directly by the prediction engine to dynamically calibrate student wait time
            </p>
            <div className="h-60">
              <Bar
                data={barData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
