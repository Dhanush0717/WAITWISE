import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Compass,
  Clock,
  Users,
  MapPin,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  QrCode,
  Sparkles,
  Tablet,
  Printer,
  ChevronRight,
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import QRDisplayModal from '../components/common/QRDisplayModal';

export default function ServiceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, activeTicket, refreshActiveTicket } = useAuth();
  const { socket, joinService, leaveService } = useSocket();

  const [serviceData, setServiceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [joinLoading, setJoinLoading] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [guestIdentifier, setGuestIdentifier] = useState('');
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrPayload, setQrPayload] = useState(null);

  const fetchServiceDetails = async () => {
    try {
      const res = await api.getService(id);
      if (res.success) {
        setServiceData(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to load service details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServiceDetails();
    joinService(id);

    return () => {
      leaveService(id);
    };
  }, [id, joinService, leaveService]);

  // Real-time socket listeners for live updates without page refresh
  useEffect(() => {
    if (!socket) return;

    const handleUpdate = () => {
      fetchServiceDetails();
    };

    socket.on('queueUpdated', handleUpdate);
    socket.on('tokenCreated', handleUpdate);
    socket.on('tokenCalled', handleUpdate);
    socket.on('serviceStarted', handleUpdate);
    socket.on('tokenCompleted', handleUpdate);
    socket.on('tokenCancelled', handleUpdate);
    socket.on('counterStatusChanged', handleUpdate);

    return () => {
      socket.off('queueUpdated', handleUpdate);
      socket.off('tokenCreated', handleUpdate);
      socket.off('tokenCalled', handleUpdate);
      socket.off('serviceStarted', handleUpdate);
      socket.off('tokenCompleted', handleUpdate);
      socket.off('tokenCancelled', handleUpdate);
      socket.off('counterStatusChanged', handleUpdate);
    };
  }, [socket]);

  const handleJoinQueue = async (e) => {
    e.preventDefault();
    setError('');
    setJoinLoading(true);

    try {
      const payload = {
        serviceId: id,
        customerName: guestName || (user ? user.name : 'Guest Visitor'),
        customerIdentifier: guestIdentifier || (user ? user.identifier : ''),
      };

      const res = await api.joinQueue(payload);
      if (res.success) {
        await refreshActiveTicket();
        // If guest, pass guestAccessToken in URL
        if (res.data.guestAccessToken) {
          navigate(
            `/tickets/${res.data.ticket._id}?guestToken=${res.data.guestAccessToken}`
          );
        } else {
          navigate(`/tickets/${res.data.ticket._id}`);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to join queue');
    } finally {
      setJoinLoading(false);
    }
  };

  const handleOpenQRModal = async () => {
    try {
      const res = await api.getServiceQR(id);
      if (res.success) {
        setQrPayload(res.data);
        setQrModalOpen(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500 text-sm font-semibold">
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span>Loading live counter state...</span>
        </div>
      </div>
    );
  }

  if (!serviceData) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center border border-slate-200">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-slate-800">Service Not Available</h2>
          <p className="text-xs text-slate-500 mt-1">{error || 'Could not find requested service desk.'}</p>
          <Link
            to="/services"
            className="mt-6 inline-block py-2.5 px-5 bg-blue-600 text-white rounded-xl text-xs font-bold"
          >
            Return to All Desks
          </Link>
        </div>
      </div>
    );
  }

  const { service, counters, queue } = serviceData;
  const isAlreadyInQueue =
    activeTicket && String(activeTicket.serviceId?._id || activeTicket.serviceId) === String(service._id);

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-slate-400 font-medium mb-6">
          <Link to="/services" className="hover:text-blue-600">Services</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-700">{service.name}</span>
        </div>

        {/* Top Info Header */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 bg-blue-600 text-white rounded-lg text-xs font-extrabold tracking-wider">
                {service.code}
              </span>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                {service.category}
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                ● {service.status.toUpperCase()}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {service.name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
              {service.description}
            </p>

            <div className="flex flex-wrap items-center gap-4 mt-4 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-blue-600" />
                <span>{service.location?.building}, {service.location?.room}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-blue-600" />
                <span>Hours: {service.operatingHours?.open} - {service.operatingHours?.close}</span>
              </span>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch md:items-center gap-2.5 shrink-0">
            <button
              onClick={handleOpenQRModal}
              className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-2"
            >
              <QrCode className="w-4 h-4 text-slate-600" /> Entrance Poster QR
            </button>
            <Link
              to={`/kiosk?serviceId=${service._id}`}
              className="py-2.5 px-4 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-2"
            >
              <Tablet className="w-4 h-4 text-indigo-600" /> Open Kiosk Terminal
            </Link>
          </div>
        </div>

        {/* 2-Column Grid: Left: Live Counters & Queue List; Right: Join Form */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column (Counters & Live Tickets) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Live Counters Station Cards */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-600" /> Service Counters
                </h3>
                <span className="text-xs text-slate-400 font-medium">
                  {counters.filter((c) => c.status === 'open' || c.status === 'busy').length} of {counters.length} Active
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {counters.map((c) => (
                  <div
                    key={c._id}
                    className={`p-4 rounded-2xl border transition-all ${
                      c.status === 'busy'
                        ? 'bg-blue-50/50 border-blue-200'
                        : c.status === 'open'
                        ? 'bg-emerald-50/40 border-emerald-200'
                        : 'bg-slate-50 border-slate-200 opacity-70'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-sm text-slate-800">{c.name}</span>
                      <span
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
                          c.status === 'busy'
                            ? 'bg-blue-600 text-white'
                            : c.status === 'open'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {c.status.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="text-xs text-slate-500">
                      {c.currentTicket ? (
                        <div className="flex items-center gap-1.5 mt-2">
                          <span className="text-[11px] text-slate-500">Serving Token:</span>
                          <span className="font-extrabold text-blue-700 bg-white px-2 py-0.5 rounded-md border border-blue-200">
                            {c.currentTicket.ticketNumber}
                          </span>
                        </div>
                      ) : (
                        <p className="mt-2 text-slate-400 italic">No customer at counter</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Live Queue Conditions & Prediction Assumptions */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600" /> Queue Status & Dynamic Prediction
                </h3>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold">
                  {queue.waitingCount} Waiting
                </span>
              </div>

              {/* KPI Strip */}
              <div className="grid grid-cols-3 gap-3 p-4 bg-slate-50 rounded-2xl text-center mb-4">
                <div>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase">Estimated Wait</span>
                  <p className="text-xl font-extrabold text-blue-600">
                    {queue.prediction?.estimatedWaitMinutes ? `~${queue.prediction.estimatedWaitMinutes} mins` : '< 5 mins'}
                  </p>
                  <span className="text-[10px] text-slate-400">
                    Range: {queue.prediction?.minWaitMinutes || 0} - {queue.prediction?.maxWaitMinutes || 5}m
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase">Ahead in Line</span>
                  <p className="text-xl font-extrabold text-slate-800">{queue.waitingCount}</p>
                  <span className="text-[10px] text-slate-400">Registered tickets</span>
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase">Avg Desk Pacing</span>
                  <p className="text-xl font-extrabold text-slate-800">
                    {queue.prediction?.avgServiceTimeMinutes || 5}m
                  </p>
                  <span className="text-[10px] text-slate-400">per student</span>
                </div>
              </div>

              {/* Prediction Assumptions Transparency Note */}
              <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 text-[11px] text-blue-800 space-y-1">
                <p className="font-bold flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" /> Transparent Queue Estimator:
                </p>
                <p>{queue.prediction?.assumptions?.basis}</p>
                <p className="text-slate-500 italic">{queue.prediction?.assumptions?.disclaimer}</p>
              </div>
            </div>
          </div>

          {/* Right Column: Join Queue Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-md sticky top-24">
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-2">
                  <QrCode className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-extrabold text-slate-900">Take a Virtual Token</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Join without standing physically in line
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-2 text-rose-700 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {isAlreadyInQueue ? (
                <div className="p-5 bg-blue-50 rounded-2xl border border-blue-200 text-center space-y-3">
                  <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs text-blue-700 font-bold uppercase tracking-wider">Active Token</span>
                    <p className="text-3xl font-black text-blue-900 mt-1">{activeTicket.ticketNumber}</p>
                  </div>
                  <Link
                    to={`/tickets/${activeTicket._id}`}
                    className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition block shadow-sm"
                  >
                    Track My Live Turn
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleJoinQueue} className="space-y-4">
                  {user ? (
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 text-xs">
                      <p className="text-slate-500 text-[11px]">Joining as Authenticated Student:</p>
                      <p className="font-bold text-slate-800 mt-0.5">{user.name}</p>
                      <p className="text-slate-500 text-[11px]">{user.identifier || user.email}</p>
                    </div>
                  ) : (
                    <>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Your Name (Optional for guest)
                        </label>
                        <input
                          type="text"
                          value={guestName}
                          onChange={(e) => setGuestName(e.target.value)}
                          placeholder="e.g. Maya or leave blank for Visitor #"
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Roll No or Student ID (Optional)
                        </label>
                        <input
                          type="text"
                          value={guestIdentifier}
                          onChange={(e) => setGuestIdentifier(e.target.value)}
                          placeholder="e.g. 2024-CS-042"
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                        />
                      </div>
                    </>
                  )}

                  <button
                    type="submit"
                    disabled={joinLoading || service.status !== 'active'}
                    className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold shadow-md shadow-blue-500/20 transition flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {joinLoading ? 'Issuing Token...' : 'Get Queue Token'} <ArrowRight className="w-4 h-4" />
                  </button>

                  <p className="text-[11px] text-slate-400 text-center leading-relaxed">
                    By taking a token, you will receive real-time alerts. No payment or phone verification required.
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* QR Code Printable Modal */}
      {qrPayload && (
        <QRDisplayModal
          isOpen={qrModalOpen}
          onClose={() => setQrModalOpen(false)}
          title={`${service.name} Entrance QR`}
          subtitle="Print or display at desk entrance for mobile self-join"
          qrValue={qrPayload.joinUrl}
        />
      )}
    </div>
  );
}
