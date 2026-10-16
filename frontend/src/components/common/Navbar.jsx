import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Layers,
  Clock,
  Compass,
  MapPin,
  Tablet,
  LayoutDashboard,
  ShieldAlert,
  LogOut,
  User,
  QrCode,
  Wifi,
  WifiOff,
  ChevronDown,
  Navigation,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import NotificationDropdown from './NotificationDropdown';
import QRScannerModal from './QRScannerModal';

export default function Navbar() {
  const { user, activeTicket, logout } = useAuth();
  const { connected } = useSocket();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <>
      <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: Brand Logo & Status */}
            <div className="flex items-center gap-6">
              <Link to="/" className="flex items-center gap-2.5 group">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-extrabold text-xl tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors">
                    WAIT<span className="text-blue-600">WISE</span>
                  </span>
                  <div className="flex items-center gap-1.5 -mt-1">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        connected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-400'
                      }`}
                    ></span>
                    <span className="text-[10px] font-medium text-slate-400">
                      {connected ? 'LIVE QUEUE' : 'OFFLINE'}
                    </span>
                  </div>
                </div>
              </Link>

              {/* Navigation Links */}
              <div className="hidden md:flex items-center gap-1">
                <Link
                  to="/services"
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                    isActive('/services')
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Compass className="w-4 h-4" /> Campus Services
                </Link>

                <Link
                  to="/map"
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                    isActive('/map')
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <MapPin className="w-4 h-4" /> Campus Map
                </Link>

                <Link
                  to="/kiosk"
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                    isActive('/kiosk')
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Tablet className="w-4 h-4" /> Kiosk Terminal
                </Link>

                {/* Staff Link */}
                {user && (user.role === 'staff' || user.role === 'admin') && (
                  <Link
                    to="/staff"
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                      isActive('/staff')
                        ? 'bg-indigo-50 text-indigo-600'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <LayoutDashboard className="w-4 h-4 text-indigo-500" /> Counter Station
                  </Link>
                )}

                {/* Admin Link */}
                {user && user.role === 'admin' && (
                  <Link
                    to="/admin"
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                      isActive('/admin')
                        ? 'bg-purple-50 text-purple-600'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <ShieldAlert className="w-4 h-4 text-purple-500" /> Admin Command
                  </Link>
                )}
              </div>
            </div>

            {/* Right: Active Ticket Pill, QR Scanner, Notifications, User Menu */}
            <div className="flex items-center gap-2.5">
              {/* Active Ticket Pill (If student holds an active token) */}
              {activeTicket && (
                <Link
                  to={`/tickets/${activeTicket._id}`}
                  className="hidden sm:flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full text-xs font-bold shadow-sm hover:shadow transition hover:scale-105"
                  title="View your active token"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  <span>My Token: {activeTicket.ticketNumber}</span>
                  <span className="px-1.5 py-0.5 rounded-full bg-white/20 text-[10px]">
                    {activeTicket.status}
                  </span>
                </Link>
              )}

              {/* QR Scan Button */}
              <button
                onClick={() => setScannerOpen(true)}
                className="p-2 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-xl transition"
                title="Scan Service QR Code"
              >
                <QrCode className="w-5 h-5" />
              </button>

              {/* In-app Notification Bell */}
              <NotificationDropdown />

              {/* User Dropdown or Login */}
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 p-1.5 pl-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl transition text-xs font-semibold text-slate-800"
                  >
                    <span className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs uppercase">
                      {user.name.charAt(0)}
                    </span>
                    <span className="hidden sm:inline max-w-[120px] truncate">{user.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-bold uppercase">
                      {user.role}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                  </button>

                  {userMenuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setUserMenuOpen(false)}
                      ></div>
                      <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 text-xs animate-in fade-in zoom-in-95 duration-150">
                        <div className="px-4 py-2 border-b border-slate-100">
                          <p className="font-bold text-slate-900 truncate">{user.name}</p>
                          <p className="text-slate-500 text-[11px] truncate">{user.email}</p>
                        </div>

                        {activeTicket && (
                          <Link
                            to={`/tickets/${activeTicket._id}`}
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 font-semibold"
                          >
                            <Clock className="w-4 h-4" /> View Token ({activeTicket.ticketNumber})
                          </Link>
                        )}

                        <Link
                          to="/should-i-go"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-slate-700 hover:bg-slate-50"
                        >
                          <Navigation className="w-4 h-4 text-emerald-500" /> "Should I Go Now?"
                        </Link>

                        {user.role === 'staff' && (
                          <Link
                            to="/staff"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2 px-4 py-2 text-slate-700 hover:bg-slate-50"
                          >
                            <LayoutDashboard className="w-4 h-4 text-indigo-500" /> Counter Dashboard
                          </Link>
                        )}

                        {user.role === 'admin' && (
                          <Link
                            to="/admin"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2 px-4 py-2 text-slate-700 hover:bg-slate-50"
                          >
                            <ShieldAlert className="w-4 h-4 text-purple-500" /> Admin Command
                          </Link>
                        )}

                        <div className="border-t border-slate-100 my-1"></div>

                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2 px-4 py-2 text-rose-600 hover:bg-rose-50 font-medium text-left"
                        >
                          <LogOut className="w-4 h-4" /> Sign Out
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    to="/login"
                    className="px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:text-blue-600 transition"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Camera QR Scanner Modal */}
      <QRScannerModal isOpen={scannerOpen} onClose={() => setScannerOpen(false)} />
    </>
  );
}
