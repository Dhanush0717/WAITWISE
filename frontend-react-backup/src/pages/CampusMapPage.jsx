import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import {
  MapPin,
  Clock,
  Users,
  Compass,
  ArrowRight,
  Sparkles,
  Info,
} from 'lucide-react';
import { api } from '../services/api';

// Create custom glowing Leaflet HTML marker icons based on load level
const createCustomIcon = (code, loadLevel) => {
  const bgClass =
    loadLevel === 'high'
      ? 'bg-rose-600 ring-rose-400'
      : loadLevel === 'moderate'
      ? 'bg-amber-500 ring-amber-300'
      : 'bg-blue-600 ring-blue-300';

  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div class="relative flex items-center justify-center">
        <div class="w-8 h-8 rounded-full ${bgClass} text-white font-extrabold text-[11px] flex items-center justify-center shadow-lg ring-4 ring-opacity-50 transform hover:scale-110 transition-transform">
          ${code}
        </div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -18],
  });
};

export default function CampusMapPage() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Default campus center
  const campusCenter = [28.5453, 77.1928];

  useEffect(() => {
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
    fetchServices();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold mb-2">
              <MapPin className="w-3.5 h-3.5" />
              <span>Interactive Campus Geography</span>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Campus Service & Queue Heat Map
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Locate campus buildings, inspect live queue pressure pins, and join directly.
            </p>
          </div>

          {/* Map Legend */}
          <div className="flex items-center gap-3 bg-white p-2.5 rounded-2xl border border-slate-200 text-xs font-semibold">
            <span className="flex items-center gap-1.5 text-slate-700">
              <span className="w-3 h-3 rounded-full bg-blue-600"></span> Low Load
            </span>
            <span className="flex items-center gap-1.5 text-slate-700">
              <span className="w-3 h-3 rounded-full bg-amber-500"></span> Moderate
            </span>
            <span className="flex items-center gap-1.5 text-slate-700">
              <span className="w-3 h-3 rounded-full bg-rose-600"></span> High Queue
            </span>
          </div>
        </div>

        {/* Map Viewport Container */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-md overflow-hidden h-[620px] relative">
          <MapContainer
            center={campusCenter}
            zoom={16}
            scrollWheelZoom={true}
            className="w-full h-full"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {services.map((svc) => {
              const coords = svc.location?.coordinates || { lat: 28.545, lng: 77.192 };
              const stats = svc.stats || {};
              const loadLevel = stats.loadLevel || 'low';
              const icon = createCustomIcon(svc.code, loadLevel);

              return (
                <Marker
                  key={svc._id}
                  position={[coords.lat, coords.lng]}
                  icon={icon}
                >
                  <Popup className="custom-leaflet-popup">
                    <div className="p-1 max-w-xs font-['Plus_Jakarta_Sans',sans-serif]">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="px-2 py-0.5 bg-blue-600 text-white rounded font-bold text-[10px]">
                          {svc.code}
                        </span>
                        <span className="font-extrabold text-xs text-slate-900 truncate">
                          {svc.name}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-500 mb-2">
                        {svc.location?.building}, {svc.location?.room}
                      </p>

                      <div className="grid grid-cols-2 gap-1.5 p-2 bg-slate-50 rounded-lg text-center mb-3">
                        <div>
                          <span className="text-[9px] text-slate-400 uppercase font-semibold">Waiting</span>
                          <p className="text-sm font-black text-blue-600">{stats.waitingCount || 0}</p>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 uppercase font-semibold">Est. Wait</span>
                          <p className="text-sm font-black text-slate-800">
                            {stats.estimatedWaitMinutes ? `${stats.estimatedWaitMinutes}m` : '~2m'}
                          </p>
                        </div>
                      </div>

                      <Link
                        to={`/services/${svc._id}`}
                        className="w-full py-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1"
                      >
                        Join Queue <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>

        {/* Disclaimer Note */}
        <div className="mt-4 p-3 bg-slate-100 rounded-xl text-[11px] text-slate-500 text-center">
          Campus pins reflect active student virtual ticket volume. Map markers link directly to live queue position trackers.
        </div>
      </div>
    </div>
  );
}
