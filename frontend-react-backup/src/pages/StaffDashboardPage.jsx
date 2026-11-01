import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Clock,
  PhoneCall,
  Play,
  CheckCircle2,
  SkipForward,
  UserX,
  PlusCircle,
  AlertCircle,
  Coffee,
  Power,
  Sparkles,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

export default function StaffDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { socket, joinService } = useSocket();

  const [stationData, setStationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [skipModalOpen, setSkipModalOpen] = useState(false);
  const [skipReason, setSkipReason] = useState('Missing documents');
  const [assistModalOpen, setAssistModalOpen] = useState(false);
  const [assistedName, setAssistedName] = useState('');
  const [assistedId, setAssistedId] = useState('');

  const fetchStation = async () => {
    try {
      const res = await api.getMyStation();
      if (res.success) {
        setStationData(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to load counter station');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user || (user.role !== 'staff' && user.role !== 'admin')) {
      navigate('/login?role=staff');
      return;
    }
    fetchStation();
  }, [user, navigate]);

  // Subscribe to service room once service ID is known
  useEffect(() => {
    if (stationData?.service?._id) {
      joinService(stationData.service._id);
    }
  }, [stationData, joinService]);

  // Real-time socket updates
  useEffect(() => {
    if (!socket) return;

    const handleUpdate = () => {
      fetchStation();
    };

    socket.on('queueUpdated', handleUpdate);
    socket.on('tokenCreated', handleUpdate);
    socket.on('tokenCancelled', handleUpdate);
    socket.on('counterStatusChanged', handleUpdate);

    return () => {
      socket.off('queueUpdated', handleUpdate);
      socket.off('tokenCreated', handleUpdate);
      socket.off('tokenCancelled', handleUpdate);
      socket.off('counterStatusChanged', handleUpdate);
    };
  }, [socket]);

  // Staff Operations
  const handleToggleCounterStatus = async (status) => {
    if (!stationData?.counter) return;
    try {
      await api.toggleCounterStatus(stationData.counter._id, status);
      await fetchStation();
    } catch (err) {
      alert(err.message || 'Failed to update counter status');
    }
  };

  const handleCallNext = async () => {
    if (!stationData?.counter) return;
    setActionLoading(true);
    setError('');
    try {
      await api.callNext(stationData.counter._id);
      await fetchStation();
    } catch (err) {
      setError(err.message || 'Failed to call next token');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartService = async (ticketId) => {
    setActionLoading(true);
    try {
      await api.startService(ticketId);
      await fetchStation();
    } catch (err) {
      alert(err.message || 'Failed to start service');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteService = async (ticketId) => {
    if (!stationData?.counter) return;
    setActionLoading(true);
    try {
      await api.completeService(ticketId, stationData.counter._id);
      await fetchStation();
    } catch (err) {
      alert(err.message || 'Failed to complete service');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmSkip = async () => {
    const currentTicket = stationData?.counter?.currentTicket;
    if (!currentTicket) return;
    setActionLoading(true);
    try {
      await api.skipTicket(currentTicket._id, skipReason, stationData.counter._id);
      setSkipModalOpen(false);
      await fetchStation();
    } catch (err) {
      alert(err.message || 'Failed to skip ticket');
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkNoShow = async () => {
    const currentTicket = stationData?.counter?.currentTicket;
    if (!currentTicket) return;
    if (!window.confirm('Mark this customer as NO-SHOW?')) return;
    setActionLoading(true);
    try {
      await api.markNoShow(currentTicket._id, stationData.counter._id);
      await fetchStation();
    } catch (err) {
      alert(err.message || 'Failed to mark no-show');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssistedIssue = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await api.staffIssueToken({
        serviceId: stationData.service._id,
        customerName: assistedName,
        customerIdentifier: assistedId,
      });
      setAssistModalOpen(false);
      setAssistedName('');
      setAssistedId('');
      await fetchStation();
    } catch (err) {
      alert(err.message || 'Failed to issue assisted ticket');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500 text-sm font-semibold">
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span>Loading counter station...</span>
        </div>
      </div>
    );
  }

  const { counter, service, waitingQueue = [], calledQueue = [], stats = {} } = stationData || {};
  const currentTicket = counter?.currentTicket;

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Control Strip */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-lg bg-indigo-100 text-indigo-700 text-xs font-black uppercase">
                Staff Station
              </span>
              <span className="text-xs font-semibold text-slate-500">
                Operator: <strong>{user?.name}</strong>
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {counter ? counter.name : 'Counter Not Assigned'}
            </h1>
            <p className="text-xs text-slate-500">
              Department: <strong>{service?.name || 'General Campus'}</strong> ({service?.code})
            </p>
          </div>

          {/* Counter Status Toggles & Assisted Button */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setAssistModalOpen(true)}
              className="py-2 px-3.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
            >
              <PlusCircle className="w-4 h-4" /> Issue Walk-In Token
            </button>

            {counter && (
              <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
                <button
                  onClick={() => handleToggleCounterStatus('open')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition ${
                    counter.status === 'open' || counter.status === 'busy'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  ● Active Desk
                </button>
                <button
                  onClick={() => handleToggleCounterStatus('on_break')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1 ${
                    counter.status === 'on_break'
                      ? 'bg-amber-500 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Coffee className="w-3.5 h-3.5" /> Break
                </button>
                <button
                  onClick={() => handleToggleCounterStatus('closed')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1 ${
                    counter.status === 'closed'
                      ? 'bg-slate-700 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Power className="w-3.5 h-3.5" /> Close
                </button>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl flex items-center gap-2 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Big Action Box & Active Servicing Card */}
          <div className="lg:col-span-2 space-y-6">
            {/* Call Next Banner */}
            <div className="bg-gradient-to-r from-blue-700 via-indigo-600 to-blue-800 text-white rounded-3xl p-8 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-blue-200">
                  Next Customer in FIFO Queue
                </span>
                <h2 className="text-3xl font-black mt-1">
                  {waitingQueue.length > 0 ? waitingQueue[0].ticketNumber : 'Queue is Clear'}
                </h2>
                <p className="text-xs text-blue-100 mt-1">
                  {waitingQueue.length} customer(s) waiting in queue for this desk
                </p>
              </div>

              <button
                onClick={handleCallNext}
                disabled={actionLoading || waitingQueue.length === 0 || counter?.status === 'closed'}
                className="py-4 px-8 bg-white hover:bg-blue-50 text-blue-800 rounded-2xl text-sm font-black shadow-lg shadow-black/10 transition transform active:scale-95 disabled:opacity-50 flex items-center gap-2 shrink-0"
              >
                <PhoneCall className="w-5 h-5 text-blue-600 animate-pulse" />
                {actionLoading ? 'Calling...' : 'CALL NEXT TOKEN'}
              </button>
            </div>

            {/* Currently Serving Box */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-600" /> Currently Serving at Counter
                </h3>
                {currentTicket && (
                  <span className="px-3 py-1 rounded-full text-xs font-extrabold uppercase bg-blue-100 text-blue-800">
                    {currentTicket.status}
                  </span>
                )}
              </div>

              {currentTicket ? (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-blue-50/50 rounded-2xl border border-blue-100">
                    <div>
                      <span className="text-xs font-bold uppercase text-slate-400">Current Token</span>
                      <p className="text-4xl font-black text-blue-900 mt-0.5">
                        {currentTicket.ticketNumber}
                      </p>
                      <p className="text-xs text-slate-600 mt-1">
                        Customer: <strong>{currentTicket.customerName}</strong>
                        {currentTicket.customerIdentifier && ` • ${currentTicket.customerIdentifier}`}
                      </p>
                      <span className="text-[11px] text-slate-400">
                        Join Method: {currentTicket.joinMethod}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Called At</span>
                      <p className="text-xs font-bold text-slate-700">
                        {currentTicket.calledAt
                          ? new Date(currentTicket.calledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : 'Just now'}
                      </p>
                    </div>
                  </div>

                  {/* Operation Buttons */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {currentTicket.status === 'CALLED' && (
                      <button
                        onClick={() => handleStartService(currentTicket._id)}
                        disabled={actionLoading}
                        className="py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        <Play className="w-4 h-4" /> Start Service
                      </button>
                    )}

                    <button
                      onClick={() => handleCompleteService(currentTicket._id)}
                      disabled={actionLoading}
                      className="py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm col-span-2 sm:col-span-1"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Complete
                    </button>

                    <button
                      onClick={() => setSkipModalOpen(true)}
                      disabled={actionLoading}
                      className="py-3 px-4 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                    >
                      <SkipForward className="w-4 h-4" /> Skip Token
                    </button>

                    <button
                      onClick={handleMarkNoShow}
                      disabled={actionLoading}
                      className="py-3 px-4 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                    >
                      <UserX className="w-4 h-4" /> No-Show
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-slate-400">
                  <Users className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p className="text-sm font-semibold text-slate-600">Counter is Currently Idle</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Click "CALL NEXT TOKEN" above when you are ready to serve the next customer.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Live Waiting Line & Today's Stats */}
          <div className="space-y-6">
            {/* KPI Strip */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm">
              <h3 className="font-extrabold text-xs text-slate-400 uppercase tracking-wider mb-3">
                Today's Desk Tally
              </h3>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2.5 bg-blue-50 rounded-xl">
                  <span className="text-[10px] text-blue-700 font-bold uppercase">Waiting</span>
                  <p className="text-lg font-black text-blue-900">{stats.waiting || 0}</p>
                </div>
                <div className="p-2.5 bg-emerald-50 rounded-xl">
                  <span className="text-[10px] text-emerald-700 font-bold uppercase">Served</span>
                  <p className="text-lg font-black text-emerald-900">{stats.completed || 0}</p>
                </div>
                <div className="p-2.5 bg-amber-50 rounded-xl">
                  <span className="text-[10px] text-amber-700 font-bold uppercase">Skipped</span>
                  <p className="text-lg font-black text-amber-900">
                    {(stats.skipped || 0) + (stats.noShow || 0)}
                  </p>
                </div>
              </div>
            </div>

            {/* Waiting Queue List */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-blue-600" /> Live Waiting Line ({waitingQueue.length})
                </h3>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {waitingQueue.length === 0 ? (
                  <p className="text-xs text-slate-400 italic text-center py-6">
                    No customers waiting in line.
                  </p>
                ) : (
                  waitingQueue.map((t, idx) => (
                    <div
                      key={t._id}
                      className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-100 flex items-center justify-between transition"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 font-bold text-[10px] flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <div>
                          <p className="font-black text-xs text-slate-800">{t.ticketNumber}</p>
                          <p className="text-[11px] text-slate-500 truncate max-w-[120px]">
                            {t.customerName}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {new Date(t.joinedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Skip Reason Modal */}
      {skipModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100">
            <h3 className="font-bold text-base text-slate-900 mb-1">Skip Token</h3>
            <p className="text-xs text-slate-500 mb-4">Select or type the mandatory reason for skipping:</p>

            <select
              value={skipReason}
              onChange={(e) => setSkipReason(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs mb-4 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="Missing documents">Missing required documents</option>
              <option value="Stepped out / Not present">Stepped out / Temporarily not present</option>
              <option value="Transferred to another section">Transferred to another section</option>
              <option value="Fee receipt pending">Fee receipt pending</option>
            </select>

            <div className="flex gap-2">
              <button
                onClick={() => setSkipModalOpen(false)}
                className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSkip}
                className="flex-1 py-2 px-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold"
              >
                Confirm Skip
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Staff Assisted Issuance Modal */}
      {assistModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100">
            <h3 className="font-bold text-base text-slate-900 mb-1">Issue Walk-In Token</h3>
            <p className="text-xs text-slate-500 mb-4">
              Assisting a visitor without a smartphone for {service?.name}
            </p>

            <form onSubmit={handleAssistedIssue} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Customer Name</label>
                <input
                  type="text"
                  value={assistedName}
                  onChange={(e) => setAssistedName(e.target.value)}
                  placeholder="Optional: Visitor Name"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Student Roll / ID</label>
                <input
                  type="text"
                  value={assistedId}
                  onChange={(e) => setAssistedId(e.target.value)}
                  placeholder="Optional: 2024-..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAssistModalOpen(false)}
                  className="py-2.5 px-3 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold"
                >
                  Generate & Add to Queue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
