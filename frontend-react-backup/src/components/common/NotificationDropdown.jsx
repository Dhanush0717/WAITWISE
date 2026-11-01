import React, { useState, useEffect } from 'react';
import { Bell, Check, BellRing, ExternalLink } from 'lucide-react';
import { api } from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import { Link } from 'react-router-dom';

export default function NotificationDropdown({ guestToken = null }) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const {
    socket,
    browserNotificationAllowed,
    requestBrowserNotifications,
    showBrowserNotification,
  } = useSocket();

  const fetchNotifications = async () => {
    try {
      const res = await api.getNotifications(guestToken);
      if (res.success) {
        setNotifications(res.data);
        setUnreadCount(res.unreadCount);
      }
    } catch (err) {
      console.warn('Failed to load notifications');
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [guestToken]);

  // Listen for live socket events
  useEffect(() => {
    if (!socket) return;

    const handleNotification = (data) => {
      fetchNotifications();
      showBrowserNotification(data.title || 'WAITWISE Alert', data.message);
    };

    socket.on('notificationCreated', handleNotification);
    socket.on('tokenCalled', (data) => {
      fetchNotifications();
      showBrowserNotification('Token Called!', `Token ${data.ticketNumber} called to ${data.counterName}`);
    });

    return () => {
      socket.off('notificationCreated', handleNotification);
      socket.off('tokenCalled');
    };
  }, [socket, showBrowserNotification]);

  const handleMarkAsRead = async (id, e) => {
    e.stopPropagation();
    try {
      await api.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-full transition-colors focus:outline-none"
        title="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-rose-500 rounded-full animate-bounce">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          ></div>
          <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BellRing className="w-4 h-4 text-blue-600" />
                <h3 className="font-semibold text-slate-800 text-sm">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 font-medium rounded-full">
                    {unreadCount} new
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                >
                  Mark all read
                </button>
              )}
            </div>

            {/* Browser notification permission banner */}
            {!browserNotificationAllowed && (
              <div className="p-3 bg-blue-50 border-b border-blue-100 flex items-center justify-between text-xs">
                <span className="text-blue-800 font-medium">Enable browser alerts for your turn?</span>
                <button
                  onClick={requestBrowserNotifications}
                  className="px-2.5 py-1 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
                >
                  Enable
                </button>
              </div>
            )}

            {/* List */}
            <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  <Bell className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No notifications right now</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n._id}
                    className={`p-3.5 hover:bg-slate-50 transition flex items-start justify-between gap-3 ${
                      !n.isRead ? 'bg-blue-50/40' : ''
                    }`}
                  >
                    <div className="flex-1">
                      <p className={`text-xs font-semibold ${!n.isRead ? 'text-blue-900' : 'text-slate-800'}`}>
                        {n.title}
                      </p>
                      <p className="text-xs text-slate-600 mt-0.5">{n.message}</p>
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {!n.isRead && (
                      <button
                        onClick={(e) => handleMarkAsRead(n._id, e)}
                        className="text-slate-400 hover:text-blue-600 p-1"
                        title="Mark as read"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-2 bg-slate-50 border-t border-slate-100 text-center">
              <span className="text-[11px] text-slate-500">WAITWISE Real-time Campus Alerts</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
