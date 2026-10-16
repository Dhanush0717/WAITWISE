import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
  Navigation,
  Clock,
  MapPin,
  Compass,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Footprints,
  Sparkles,
  Sliders,
  LocateFixed,
  Info,
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useGeolocation } from '../hooks/useGeolocation';

export default function ShouldIGoNowPage() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const ticketIdParam = searchParams.get('ticketId');
  const guestToken = searchParams.get('guestToken') || null;

  const { activeTicket, user } = useAuth();
  const { socket, joinTicket } = useSocket();
  const {
    coordinates,
    loading: geoLoading,
    error: geoError,
    requestLocation,
    estimateWalkTimeMinutes,
  } = useGeolocation();

  const [ticketData, setTicketData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [travelMinutes, setTravelMinutes] = useState(5); // Default 5 mins walk
  const [safetyBufferMinutes, setSafetyBufferMinutes] = useState(3); // Default 3 mins buffer
  const [walkMode, setWalkMode] = useState('manual'); // 'manual' or 'gps'

  // Resolve target ticket ID
  const effectiveTicketId = ticketIdParam || (activeTicket ? activeTicket._id : null);

  const fetchTicketDetails = async () => {
    if (!effectiveTicketId) {
      setLoading(false);
      return;
    }
    try {
      const res = await api.getTicket(effectiveTicketId, guestToken);
      if (res.success) {
        setTicketData(res.data);
      }
    } catch (err) {
      console.warn('Error fetching ticket for advisor:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTicketDetails();
    if (effectiveTicketId) {
      joinTicket(effectiveTicketId);
    }
  }, [effectiveTicketId, guestToken, joinTicket]);

  // Socket updates
  useEffect(() => {
    if (!socket) return;

    const handleUpdate = () => {
      fetchTicketDetails();
    };

    socket.on('tokenCalled', handleUpdate);
    socket.on('serviceStarted', handleUpdate);
    socket.on('tokenCompleted', handleUpdate);
    socket.on('queueUpdated', handleUpdate);

    return () => {
      socket.off('tokenCalled', handleUpdate);
      socket.off('serviceStarted');
      socket.off('tokenCompleted');
      socket.off('queueUpdated');
    };
  }, [socket]);

  // If user enabled GPS, calculate real walk time to service coordinates
  useEffect(() => {
    if (coordinates && ticketData?.ticket?.serviceId?.location?.coordinates) {
      const { lat, lng } = ticketData.ticket.serviceId.location.coordinates;
      const walkEst = estimateWalkTimeMinutes(lat, lng);
      if (walkEst) {
        setTravelMinutes(walkEst.walkTimeMinutes);
        setWalkMode('gps');
      }
    }
  }, [coordinates, ticketData, estimateWalkTimeMinutes]);

  const handleEnableGPS = () => {
    requestLocation();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500 text-sm font-semibold">
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span>Calculating intelligent return schedule...</span>
        </div>
      </div>
    );
  }

  if (!ticketData || !ticketData.ticket) {
    return (
      <div className="min-h-screen bg-slate-50 py-16 px-4">
        <div className="max-w-md mx-auto bg-white rounded-3xl p-8 border border-slate-200 text-center shadow-sm">
          <Navigation className="w-12 h-12 text-blue-600 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-slate-900">No Active Ticket Selected</h2>
          <p className="text-xs text-slate-500 mt-2">
            "Should I Go Now?" calculates the exact moment you need to return to the desk based on your active queue position and travel time.
          </p>
          <Link
            to="/services"
            className="mt-6 inline-flex items-center gap-2 py-2.5 px-5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
          >
            Join a Campus Queue <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  const { ticket, peopleAhead, prediction } = ticketData;
  const estimatedWaitMinutes = prediction?.estimatedWaitMinutes || 0;
  const totalTravelNeeded = travelMinutes + safetyBufferMinutes;

  // Decision Logic
  let decisionStatus = 'WAIT'; // 'WAIT' | 'MOVE' | 'NOW'
  let decisionTitle = '';
  let decisionMessage = '';
  let decisionTheme = 'blue';

  if (ticket.status === 'CALLED' || ticket.status === 'SERVING') {
    decisionStatus = 'NOW';
    decisionTitle = 'PROCEED TO COUNTER IMMEDIATELY';
    decisionMessage = `Your token is called! Please proceed directly to ${
      ticket.assignedCounter?.name || 'the service counter'
    }.`;
    decisionTheme = 'emerald';
  } else if (estimatedWaitMinutes <= totalTravelNeeded || peopleAhead <= 2) {
    decisionStatus = 'MOVE';
    decisionTitle = 'START HEADING BACK NOW';
    decisionMessage = `Approximately ${peopleAhead} student(s) ahead. With your ${travelMinutes} min walk + ${safetyBufferMinutes} min buffer, leave now to arrive right on time!`;
    decisionTheme = 'amber';
  } else {
    decisionStatus = 'WAIT';
    decisionTitle = 'WAIT COMFORTABLY';
    decisionMessage = `Estimated wait is ~${estimatedWaitMinutes} minutes. You have plenty of time to study in the library or have coffee at the canteen.`;
    decisionTheme = 'blue';
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Intelligent Campus Return Advisor</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            "Should I Go Now?"
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-xl mx-auto">
            Combines live queue pacing, your campus walking distance, and a safety margin so you never wait physically in a hallway.
          </p>
        </div>

        {/* Big Decision Card */}
        <div
          className={`rounded-3xl p-8 shadow-xl border text-center transition-all mb-8 ${
            decisionTheme === 'emerald'
              ? 'bg-gradient-to-b from-emerald-600 to-teal-700 text-white border-emerald-500 shadow-emerald-500/20'
              : decisionTheme === 'amber'
              ? 'bg-gradient-to-b from-amber-500 to-amber-600 text-white border-amber-400 shadow-amber-500/20'
              : 'bg-gradient-to-b from-blue-600 to-indigo-700 text-white border-blue-500 shadow-blue-500/20'
          }`}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold uppercase tracking-wider mb-4">
            {decisionTheme === 'emerald' && '🟢 Action Required'}
            {decisionTheme === 'amber' && '🟡 Heading Advice'}
            {decisionTheme === 'blue' && '🔵 Relaxed Mode'}
          </div>

          <h2 className="text-3xl sm:text-4xl font-black tracking-tight">{decisionTitle}</h2>
          <p className="mt-3 text-sm sm:text-base font-medium max-w-lg mx-auto opacity-95 leading-relaxed">
            {decisionMessage}
          </p>

          {/* Quick Metrics Bar */}
          <div className="mt-8 pt-6 border-t border-white/20 grid grid-cols-3 gap-2 max-w-md mx-auto text-center">
            <div>
              <span className="text-[10px] uppercase font-bold text-white/80">Your Token</span>
              <p className="text-2xl font-black">{ticket.ticketNumber}</p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-white/80">People Ahead</span>
              <p className="text-2xl font-black">{peopleAhead}</p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-white/80">Est. Remaining</span>
              <p className="text-2xl font-black">~{estimatedWaitMinutes}m</p>
            </div>
          </div>
        </div>

        {/* Controls & Configuration Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-blue-600" /> Travel & Buffer Parameters
            </h3>
            <span className="text-xs text-slate-500 font-medium">
              Target: {ticket.serviceId?.name}
            </span>
          </div>

          {/* 1. Walk Duration Input */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Footprints className="w-4 h-4 text-blue-600" />
                Estimated Walking Time from your current location
              </label>
              <span className="text-xs font-extrabold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full">
                {travelMinutes} minutes walk
              </span>
            </div>

            {/* Quick Walk Preset Buttons */}
            <div className="grid grid-cols-4 gap-2 mb-3">
              {[2, 5, 10, 15].map((mins) => (
                <button
                  key={mins}
                  onClick={() => {
                    setTravelMinutes(mins);
                    setWalkMode('manual');
                  }}
                  className={`py-2 rounded-xl text-xs font-bold transition border ${
                    travelMinutes === mins && walkMode === 'manual'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {mins} min ({mins <= 3 ? 'Nearby' : mins <= 5 ? 'Library' : 'Hostel'})
                </button>
              ))}
            </div>

            {/* Optional Geolocation Feature */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <LocateFixed className="w-4 h-4 text-indigo-600 shrink-0" />
                <span className="text-slate-600">
                  {coordinates
                    ? `Live Campus GPS: ~${travelMinutes} min walk to ${ticket.serviceId?.location?.building}`
                    : 'Optional: Use browser GPS to calculate exact walkway distance.'}
                </span>
              </div>
              <button
                onClick={handleEnableGPS}
                disabled={geoLoading}
                className="py-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold shrink-0 transition"
              >
                {geoLoading ? 'Locating...' : 'Use My Live Location'}
              </button>
            </div>
            {geoError && <p className="text-[11px] text-rose-600 mt-1">{geoError}</p>}
          </div>

          {/* 2. Safety Buffer Slider */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Safety Buffer Time (Arrive before your name is called)
              </label>
              <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                {safetyBufferMinutes} min buffer
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={10}
              value={safetyBufferMinutes}
              onChange={(e) => setSafetyBufferMinutes(Number(e.target.value))}
              className="w-full accent-blue-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>1 min (Tight)</span>
              <span>3 min (Recommended)</span>
              <span>10 min (Relaxed)</span>
            </div>
          </div>

          {/* Transparent Formula Breakdown */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-1.5">
            <p className="font-bold text-slate-800 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-blue-600" /> How WAITWISE Calculates Your Return Time:
            </p>
            <p className="font-mono text-[11px] bg-white p-2 rounded-lg border border-slate-200 text-slate-800">
              Return Trigger = (Walk Time: {travelMinutes}m) + (Safety Buffer: {safetyBufferMinutes}m) ={' '}
              <strong>{totalTravelNeeded} minutes needed</strong>
            </p>
            <p className="text-[11px] text-slate-500">
              Current queue waiting time is <strong>~{estimatedWaitMinutes} minutes</strong>.{' '}
              {estimatedWaitMinutes > totalTravelNeeded
                ? `You still have about ~${estimatedWaitMinutes - totalTravelNeeded} minutes of free time.`
                : 'Your travel requirement matches or exceeds remaining queue time. Start moving now!'}
            </p>
          </div>
        </div>

        {/* Back link */}
        <div className="text-center mt-6">
          <Link
            to={`/tickets/${ticket._id}${guestToken ? `?guestToken=${guestToken}` : ''}`}
            className="text-xs font-bold text-blue-600 hover:text-blue-800"
          >
            ← Return to Live Ticket Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
