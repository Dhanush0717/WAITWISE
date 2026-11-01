import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
  Sliders,
  Sparkles,
  ArrowRight,
  TrendingDown,
  Clock,
  Users,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function AdminSimulationPage() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const preselectedServiceId = searchParams.get('serviceId');

  const { user } = useAuth();
  const [services, setServices] = useState([]);
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [additionalCounters, setAdditionalCounters] = useState(1);
  const [simulationResult, setSimulationResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [simLoading, setSimLoading] = useState(false);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await api.getServices();
        if (res.success) {
          setServices(res.data);
          const initial = preselectedServiceId || (res.data[0] ? res.data[0]._id : '');
          setSelectedServiceId(initial);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, [preselectedServiceId]);

  const runSimulation = async () => {
    if (!selectedServiceId) return;
    setSimLoading(true);
    try {
      const res = await api.simulateCounter(selectedServiceId, additionalCounters);
      if (res.success) {
        setSimulationResult(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSimLoading(false);
    }
  };

  useEffect(() => {
    if (selectedServiceId) {
      runSimulation();
    }
  }, [selectedServiceId, additionalCounters]);

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-bold mb-2">
            <Sliders className="w-3.5 h-3.5 text-purple-600" />
            <span>Interactive Evaluator Feature</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Counter Overflow Simulator
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Simulate the impact of opening extra service desks during peak campus rush hours to alleviate waiting pressure.
          </p>
        </div>

        {/* Configuration Controls Bar */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            {/* Service Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Select Campus Service to Simulate:
              </label>
              <select
                value={selectedServiceId}
                onChange={(e) => setSelectedServiceId(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-purple-500 focus:outline-none"
              >
                {services.map((svc) => (
                  <option key={svc._id} value={svc._id}>
                    {svc.name} ({svc.code}) — {svc.stats?.waitingCount || 0} Waiting
                  </option>
                ))}
              </select>
            </div>

            {/* Additional Counters Slider */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Additional Counters to Open:
                </label>
                <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 text-xs font-extrabold">
                  +{additionalCounters} Desk(s)
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={4}
                value={additionalCounters}
                onChange={(e) => setAdditionalCounters(Number(e.target.value))}
                className="w-full accent-purple-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>+1 Counter</span>
                <span>+2 Counters</span>
                <span>+3 Counters</span>
                <span>+4 Counters</span>
              </div>
            </div>
          </div>
        </div>

        {/* Side-by-Side Simulation Comparison */}
        {simulationResult && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Card 1: Current Live State */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                  <span className="text-xs font-extrabold uppercase text-slate-400 tracking-wider">
                    Current Reality
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
                    {simulationResult.current.activeCounters} Active Counter(s)
                  </span>
                </div>

                <div className="space-y-4">
                  <div>
                    <span className="text-xs text-slate-500 font-medium">Estimated Waiting Time</span>
                    <p className="text-4xl font-black text-slate-800 mt-1">
                      ~{simulationResult.current.estimatedWaitMinutes} mins
                    </p>
                    <span className="text-[11px] text-slate-400">
                      Uncertainty Range: {simulationResult.current.minWaitMinutes} - {simulationResult.current.maxWaitMinutes}m
                    </span>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl text-xs text-slate-600 space-y-1">
                    <p>
                      Waiting Customers: <strong>{simulationResult.waitingCustomers} students</strong>
                    </p>
                    <p>
                      Active Desks: <strong>{simulationResult.current.activeCounters}</strong>
                    </p>
                  </div>
                </div>
              </div>

              {/* Card 2: Simulated Projected Outcome */}
              <div className="bg-gradient-to-br from-purple-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
                  <span className="text-xs font-extrabold uppercase text-purple-300 tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" /> Simulated Projection
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-purple-500/30 text-purple-200 text-xs font-bold border border-purple-400/30">
                    {simulationResult.simulated.totalCounters} Total Counters
                  </span>
                </div>

                <div className="space-y-4">
                  <div>
                    <span className="text-xs text-purple-200 font-medium">Projected New Waiting Time</span>
                    <p className="text-4xl font-black text-emerald-400 mt-1">
                      ~{simulationResult.simulated.estimatedWaitMinutes} mins
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 text-xs font-bold">
                        <TrendingDown className="w-3.5 h-3.5" /> {simulationResult.simulated.percentageReduction}% Reduction
                      </span>
                      <span className="text-xs text-purple-200">
                        (~{simulationResult.simulated.timeSavedMinutes} mins saved per student)
                      </span>
                    </div>
                  </div>

                  <div className="p-4 bg-white/10 rounded-2xl text-xs text-purple-100 space-y-1 backdrop-blur-sm">
                    <p>
                      Extra Staffing: <strong>+{simulationResult.simulated.additionalCounters} counter(s)</strong>
                    </p>
                    <p>
                      Crowd Pacing: <strong>Pushed queue processing speed {simulationResult.simulated.totalCounters}x</strong>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Academic Evaluation Disclaimer Note */}
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 text-xs space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <Info className="w-4 h-4 text-amber-700" /> Simulation Ground Rules & Assumptions:
              </p>
              <p className="text-slate-700">{simulationResult.disclaimer}</p>
            </div>
          </div>
        )}

        <div className="mt-8 text-center">
          <Link to="/admin" className="text-xs font-bold text-purple-600 hover:text-purple-800">
            ← Back to Admin Command Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
