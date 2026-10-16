import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Compass,
  Search,
  Clock,
  Users,
  MapPin,
  ArrowRight,
  Tablet,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Filter,
} from 'lucide-react';
import { api } from '../services/api';
import { useSocket } from '../context/SocketContext';

export default function ServicesPage() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const { socket } = useSocket();

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

  useEffect(() => {
    fetchServices();
  }, []);

  // Listen to live socket events to update service queue counts dynamically
  useEffect(() => {
    if (!socket) return;

    const handleQueueUpdated = () => {
      fetchServices();
    };

    socket.on('queueUpdated', handleQueueUpdated);
    socket.on('tokenCreated', handleQueueUpdated);
    socket.on('tokenCompleted', handleQueueUpdated);
    socket.on('counterStatusChanged', handleQueueUpdated);
    socket.on('queueStatusChanged', handleQueueUpdated);

    return () => {
      socket.off('queueUpdated', handleQueueUpdated);
      socket.off('tokenCreated', handleQueueUpdated);
      socket.off('tokenCompleted', handleQueueUpdated);
      socket.off('counterStatusChanged', handleQueueUpdated);
      socket.off('queueStatusChanged', handleQueueUpdated);
    };
  }, [socket]);

  const categories = [
    { id: 'all', label: 'All Services' },
    { id: 'administration', label: 'Administration' },
    { id: 'academic', label: 'Examinations' },
    { id: 'dining', label: 'Canteen' },
    { id: 'library', label: 'Library' },
    { id: 'health', label: 'Medical' },
    { id: 'finance', label: 'Accounts & Fees' },
    { id: 'facility', label: 'Labs' },
  ];

  const filteredServices = services.filter((svc) => {
    const matchesCategory = categoryFilter === 'all' || svc.category === categoryFilter;
    const matchesSearch =
      svc.name.toLowerCase().includes(search.toLowerCase()) ||
      svc.code.toLowerCase().includes(search.toLowerCase()) ||
      svc.description.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold mb-2">
              <Compass className="w-3.5 h-3.5" />
              <span>Campus Virtual Desks</span>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Campus Services & Live Queues
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Select a service to check counter availability, view live queue conditions, and take a token.
            </p>
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search desk, code, or facility..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-sm transition"
            />
          </div>
        </div>

        {/* Category Pills Filter */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 scrollbar-none">
          <Filter className="w-4 h-4 text-slate-400 shrink-0 ml-1 mr-1" />
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setCategoryFilter(c.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                categoryFilter === c.id
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Services Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-64 bg-slate-200/60 rounded-3xl animate-pulse"></div>
            ))}
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
            <Compass className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-800">No Services Found</h3>
            <p className="text-xs text-slate-500 mt-1">Try adjusting your search or category filter</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map((svc) => {
              const stats = svc.stats || {};
              const loadLevel = stats.loadLevel || 'low';

              return (
                <div
                  key={svc._id}
                  className="bg-white rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-md hover:border-blue-300 transition-all flex flex-col justify-between overflow-hidden group"
                >
                  <div className="p-6">
                    {/* Top Row: Code Badge, Category, Status */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 bg-blue-600 text-white rounded-lg text-xs font-extrabold tracking-wider">
                          {svc.code}
                        </span>
                        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                          {svc.category}
                        </span>
                      </div>

                      {/* Status & Crowd Level Pill */}
                      <div className="flex items-center gap-1.5">
                        {loadLevel === 'low' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Low Queue
                          </span>
                        )}
                        {loadLevel === 'moderate' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                            Moderate
                          </span>
                        )}
                        {loadLevel === 'high' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 animate-pulse">
                            <Flame className="w-3 h-3 text-rose-500" />
                            Busy
                          </span>
                        )}
                      </div>
                    </div>

                    <h3 className="font-extrabold text-lg text-slate-900 group-hover:text-blue-600 transition-colors">
                      {svc.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {svc.description}
                    </p>

                    {/* Location & Hours */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <span className="flex items-center gap-1 truncate max-w-[180px]">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{svc.location?.building}</span>
                      </span>
                      <span className="flex items-center gap-1 font-medium text-slate-600">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {svc.operatingHours?.open} - {svc.operatingHours?.close}
                      </span>
                    </div>

                    {/* Live Stats Bar */}
                    <div className="mt-4 p-3 bg-slate-50 rounded-2xl grid grid-cols-3 gap-2 text-center">
                      <div>
                        <span className="text-[10px] font-semibold text-slate-400 uppercase">Waiting</span>
                        <p className="text-lg font-extrabold text-blue-600">{stats.waitingCount || 0}</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-semibold text-slate-400 uppercase">Counters</span>
                        <p className="text-lg font-extrabold text-slate-800">{stats.activeCounters || 0}</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-semibold text-slate-400 uppercase">Est. Wait</span>
                        <p className="text-lg font-extrabold text-slate-800">
                          {stats.estimatedWaitMinutes ? `${stats.estimatedWaitMinutes}m` : '~2m'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="px-6 py-3.5 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between gap-2">
                    <Link
                      to={`/services/${svc._id}`}
                      className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 shadow-sm"
                    >
                      Join Queue <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                    <Link
                      to={`/kiosk?serviceId=${svc._id}`}
                      className="p-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition"
                      title="Generate Kiosk Token"
                    >
                      <Tablet className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
