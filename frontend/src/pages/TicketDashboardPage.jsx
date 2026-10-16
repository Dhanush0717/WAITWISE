import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  QrCode,
  Printer,
  Navigation,
  MapPin,
  ArrowRight,
  XCircle,
  Sparkles,
  Volume2,
  Users,
} from 'lucide-react';
import { api } from '../services/api';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import QRDisplayModal from '../components/common/QRDisplayModal';

export default function TicketDashboardPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { socket, joinTicket, joinService } = useSocket();
  const { refreshActiveTicket } = useAuth();

  const searchParams = new URLSearchParams(location.search);
  const guestToken = searchParams.get('guestToken') || null;

  const [ticketData, setTicketData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);

  const fetchTicket = async () => {
    try {
      const res = await api.getTicket(id, guestToken);
      if (res.success) {
        setTicketData(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to retrieve ticket information');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTicket();
    joinTicket(id);
  }, [id, guestToken, joinTicket]);

  // Subscribe to service room once service ID is known
  useEffect(() => {
    if (ticketData?.ticket?.serviceId?._id) {
      joinService(ticketData.ticket.serviceId._id);
    }
  }, [ticketData, joinService]);

  // Real-time socket listeners for live updates
  useEffect(() => {
    if (!socket) return;

    const handleUpdate = () => {
      fetchTicket();
      refreshActiveTicket();
    };

    socket.on('tokenCalled', (data) => {
      handleUpdate();
    });
    socket.on('serviceStarted', handleUpdate);
    socket.on('tokenCompleted', handleUpdate);
    socket.on('tokenSkipped', handleUpdate);
    socket.on('tokenCancelled', handleUpdate);
    socket.on('queueUpdated', handleUpdate);

    return () => {
      socket.off('tokenCalled');
      socket.off('serviceStarted');
      socket.off('tokenCompleted');
      socket.off('tokenSkipped');
      socket.off('tokenCancelled');
      socket.off('queueUpdated');
    };
  }, [socket, refreshActiveTicket]);

  const handleCancelTicket = async () => {
    if (!window.confirm('Are you sure you want to cancel your queue token?')) return;
    setCancelLoading(true);
    try {
      await api.cancelTicket(id, { guestToken, reason: 'Cancelled by customer' });
      await fetchTicket();
      await refreshActiveTicket();
    } catch (err) {
      alert(err.message || 'Failed to cancel ticket');
    } finally {
      setCancelLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500 text-sm font-semibold">
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span>Synchronizing live ticket...</span>
        </div>
      </div>
    );
  }

  if (!ticketData || !ticketData.ticket) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center border border-slate-200">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-slate-800">Ticket Not Found</h2>
          <p className="text-xs text-slate-500 mt-1">{error || 'This queue ticket does not exist or expired.'}</p>
          <Link
            to="/services"
            className="mt-6 inline-block py-2.5 px-5 bg-blue-600 text-white rounded-xl text-xs font-bold"
          >
            Browse Services
          </Link>
        </div>
      </div>
    );
  }

  const { ticket, peopleAhead, queuePosition, prediction, currentlyServing } = ticketData;
  const isCalled = ticket.status === 'CALLED';
  const isServing = ticket.status === 'SERVING';
  const isCompleted = ticket.status === 'COMPLETED';
  const isCancelled = ticket.status === 'CANCELLED';
  const isSkipped = ['SKIPPED', 'NO_SHOW'].includes(ticket.status);

  // States for timeline stepper
  const steps = [
    { key: 'WAITING', label: 'In Queue' },
    { key: 'CALLED', label: 'Called' },
    { key: 'SERVING', label: 'Serving' },
    { key: 'COMPLETED', label: 'Done' },
  ];

  const getStepStatus = (stepKey) => {
    const order = ['WAITING', 'CALLED', 'SERVING', 'COMPLETED'];
    const currentIdx = order.indexOf(ticket.status);
    const stepIdx = order.indexOf(stepKey);
    if (isCancelled || isSkipped) return 'cancelled';
    if (stepIdx < currentIdx) return 'completed';
    if (stepIdx === currentIdx) return 'active';
    return 'upcoming';
  };

  const currentHost = typeof window !== 'undefined' ? window.location.origin : '';
  const trackingUrl = guestToken
    ? `${currentHost}/tickets/${ticket._id}?guestToken=${guestToken}`
    : `${currentHost}/tickets/${ticket._id}`;

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Called Turn Alert Loud Banner */}
        {isCalled && (
          <div className="mb-6 p-6 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-3xl shadow-xl shadow-emerald-500/20 animate-bounce">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 rounded-2xl">
                <Volume2 className="w-8 h-8 text-white" />
              </div>
              <div>
                <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-100">
                  Your Turn is Ready!
                </span>
                <h2 className="text-2xl sm:text-3xl font-black mt-0.5">
                  Proceed to {ticket.assignedCounter?.name || 'Assigned Counter'}
                </h2>
                <p className="text-xs text-emerald-100 mt-1">
                  Staff member is ready to assist you. Please approach the desk now.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Main Ticket Card */}
        <div className="bg-white rounded-3xl shadow-lg border border-slate-200/80 overflow-hidden mb-6">
          {/* Top Header */}
          <div className="px-6 sm:px-8 py-6 bg-slate-900 text-white flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">
                WAITWISE Virtual Ticket
              </span>
              <h1 className="text-lg sm:text-xl font-extrabold mt-0.5">
                {ticket.serviceId?.name}
              </h1>
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-blue-400" />
                {ticket.serviceId?.location?.building}, {ticket.serviceId?.location?.room}
              </p>
            </div>

            <span
              className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                isCalled
                  ? 'bg-emerald-500 text-white animate-pulse'
                  : isServing
                  ? 'bg-blue-500 text-white'
                  : isCompleted
                  ? 'bg-slate-700 text-emerald-400'
                  : isCancelled || isSkipped
                  ? 'bg-rose-500/20 text-rose-300'
                  : 'bg-blue-600 text-white'
              }`}
            >
              {ticket.status}
            </span>
          </div>

          {/* Stepper Progress Bar */}
          <div className="px-6 sm:px-8 py-5 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center justify-between relative">
              <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-200 -translate-y-1/2 z-0"></div>
              {steps.map((st) => {
                const sStatus = getStepStatus(st.key);
                return (
                  <div key={st.key} className="relative z-10 flex flex-col items-center">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        sStatus === 'completed'
                          ? 'bg-emerald-600 text-white'
                          : sStatus === 'active'
                          ? 'bg-blue-600 text-white ring-4 ring-blue-100 scale-110'
                          : sStatus === 'cancelled'
                          ? 'bg-rose-200 text-rose-700'
                          : 'bg-slate-200 text-slate-500'
                      }`}
                    >
                      {sStatus === 'completed' ? '✓' : ''}
                    </div>
                    <span className="text-[10px] font-semibold text-slate-600 mt-1">
                      {st.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Big Token Display & Core Metrics */}
          <div className="p-6 sm:p-10 text-center">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Your Queue Token
            </span>
            <div className="my-2">
              <span className="text-5xl sm:text-6xl font-black text-slate-900 tracking-tight">
                {ticket.ticketNumber}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Customer: <span className="font-semibold text-slate-700">{ticket.customerName}</span>
              {ticket.customerIdentifier && ` (${ticket.customerIdentifier})`}
            </p>

            {/* In-Queue Live Metrics */}
            {ticket.status === 'WAITING' && (
              <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-lg mx-auto">
                <div className="p-4 bg-blue-50/70 border border-blue-100 rounded-2xl">
                  <span className="text-[10px] font-bold uppercase text-blue-600">Your Position</span>
                  <p className="text-3xl font-black text-blue-900 mt-0.5">#{queuePosition}</p>
                  <span className="text-[10px] text-slate-500 font-medium">in live queue</span>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                  <span className="text-[10px] font-bold uppercase text-slate-500">Ahead of You</span>
                  <p className="text-3xl font-black text-slate-800 mt-0.5">{peopleAhead}</p>
                  <span className="text-[10px] text-slate-500 font-medium">students</span>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl col-span-2 sm:col-span-1">
                  <span className="text-[10px] font-bold uppercase text-slate-500">Est. Remaining</span>
                  <p className="text-3xl font-black text-slate-800 mt-0.5">
                    {prediction?.estimatedWaitMinutes ? `~${prediction.estimatedWaitMinutes}m` : '< 3m'}
                  </p>
                  <span className="text-[10px] text-slate-500 font-medium">
                    ({prediction?.minWaitMinutes || 0} - {prediction?.maxWaitMinutes || 5} mins)
                  </span>
                </div>
              </div>
            )}

            {/* Serving State Callout */}
            {ticket.status === 'SERVING' && (
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-2xl text-blue-900 max-w-md mx-auto">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-700">Currently Serving</span>
                <p className="text-xl font-extrabold mt-1">
                  At {ticket.assignedCounter?.name || 'Counter'}
                </p>
                <p className="text-xs text-blue-700 mt-1">Staff is currently processing your request.</p>
              </div>
            )}

            {/* Completed State Callout */}
            {ticket.status === 'COMPLETED' && (
              <div className="mt-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-900 max-w-md mx-auto">
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto mb-2">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <p className="text-lg font-bold">Service Completed</p>
                <p className="text-xs text-emerald-700 mt-1">
                  Total duration: {ticket.actualDurationMinutes || 1} minutes. Thank you!
                </p>
              </div>
            )}

            {/* Currently Serving in the desk ticker */}
            {currentlyServing && ticket.status === 'WAITING' && (
              <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                <span>Now Serving at Counter:</span>
                <span className="font-extrabold text-blue-600">{currentlyServing.ticketNumber}</span>
                <span className="text-slate-400">({currentlyServing.counterName})</span>
              </div>
            )}
          </div>

          {/* Action Buttons Bar */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setQrModalOpen(true)}
                className="py-2 px-3.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 shadow-sm"
              >
                <Printer className="w-3.5 h-3.5" /> Printable Slip
              </button>

              <Link
                to={`/should-i-go?ticketId=${ticket._id}${guestToken ? `&guestToken=${guestToken}` : ''}`}
                className="py-2 px-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
              >
                <Navigation className="w-3.5 h-3.5 text-blue-200" /> "Should I Go Now?"
              </Link>
            </div>

            {!isCompleted && !isCancelled && !isSkipped && (
              <button
                onClick={handleCancelTicket}
                disabled={cancelLoading}
                className="py-2 px-3 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-semibold transition flex items-center gap-1"
              >
                <XCircle className="w-3.5 h-3.5" /> Cancel Ticket
              </button>
            )}
          </div>
        </div>

        {/* Helpful Tips Card */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 text-xs text-slate-500 space-y-1">
          <p className="font-bold text-slate-700">Campus Queue Tips:</p>
          <p>• You can leave this page or campus desk; we automatically notify you when called.</p>
          <p>• Keep this ticket URL bookmarked or save the printable QR code to view on any phone.</p>
        </div>
      </div>

      {/* Slip Modal */}
      <QRDisplayModal
        isOpen={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        title="WAITWISE Queue Ticket Slip"
        subtitle="Keep this slip or scan the QR code to track your turn on mobile"
        qrValue={trackingUrl}
        ticketData={{
          ticketNumber: ticket.ticketNumber,
          serviceName: ticket.serviceId?.name,
        }}
      />
    </div>
  );
}
