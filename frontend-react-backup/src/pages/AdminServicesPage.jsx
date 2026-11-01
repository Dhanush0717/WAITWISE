import React, { useState, useEffect } from 'react';
import {
  Compass,
  Plus,
  QrCode,
  Users,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  PauseCircle,
  PlayCircle,
  XCircle,
  Sparkles,
} from 'lucide-react';
import { api } from '../services/api';
import QRDisplayModal from '../components/common/QRDisplayModal';

export default function AdminServicesPage() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [selectedQR, setSelectedQR] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    category: 'administration',
    location: {
      building: 'Main Academic Block',
      room: 'Room 101',
    },
    operatingHours: {
      open: '09:00',
      close: '17:00',
    },
    estimatedServiceTimeMinutes: 5,
    maxQueueCapacity: 80,
    overflowThreshold: 12,
  });

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

  const handleToggleStatus = async (serviceId, currentStatus) => {
    const nextStatus = currentStatus === 'active' ? 'paused' : 'active';
    try {
      await api.setServiceStatus(serviceId, nextStatus);
      await fetchServices();
    } catch (err) {
      alert(err.message || 'Failed to update service status');
    }
  };

  const handleCreateService = async (e) => {
    e.preventDefault();
    try {
      await api.createService(formData);
      setCreateModalOpen(false);
      setFormData({
        name: '',
        code: '',
        description: '',
        category: 'administration',
        location: { building: 'Main Academic Block', room: 'Room 101' },
        operatingHours: { open: '09:00', close: '17:00' },
        estimatedServiceTimeMinutes: 5,
        maxQueueCapacity: 80,
        overflowThreshold: 12,
      });
      await fetchServices();
    } catch (err) {
      alert(err.message || 'Failed to create service');
    }
  };

  const handleShowQR = async (serviceId) => {
    try {
      const res = await api.getServiceQR(serviceId);
      if (res.success) {
        setSelectedQR(res.data);
        setQrModalOpen(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-bold mb-2">
              <Compass className="w-3.5 h-3.5" />
              <span>Campus Service Infrastructure</span>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Manage Campus Desks & Counters
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Add new facilities, configure capacity limits, and generate entrance QR posters.
            </p>
          </div>

          <button
            onClick={() => setCreateModalOpen(true)}
            className="py-2.5 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" /> Add New Campus Desk
          </button>
        </div>

        {/* Services Table */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-4 px-6">Service / Code</th>
                  <th className="py-4 px-6">Category</th>
                  <th className="py-4 px-6">Location</th>
                  <th className="py-4 px-6">Capacity / Threshold</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {services.map((svc) => (
                  <tr key={svc._id} className="hover:bg-slate-50/80 transition">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2.5">
                        <span className="px-2.5 py-1 bg-blue-600 text-white rounded-lg font-black text-xs">
                          {svc.code}
                        </span>
                        <div>
                          <p className="font-bold text-slate-900">{svc.name}</p>
                          <p className="text-[11px] text-slate-400 truncate max-w-[200px]">
                            {svc.description}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-6 uppercase font-semibold text-slate-500 text-[11px]">
                      {svc.category}
                    </td>

                    <td className="py-4 px-6 text-slate-600">
                      <p className="font-medium">{svc.location?.building}</p>
                      <p className="text-[11px] text-slate-400">{svc.location?.room}</p>
                    </td>

                    <td className="py-4 px-6">
                      <span className="text-slate-800 font-semibold">{svc.maxQueueCapacity} max</span>
                      <span className="block text-[11px] text-rose-600">
                        Alert at {svc.overflowThreshold}
                      </span>
                    </td>

                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          svc.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {svc.status}
                      </span>
                    </td>

                    <td className="py-4 px-6 text-right space-x-2">
                      <button
                        onClick={() => handleShowQR(svc._id)}
                        className="py-1 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition"
                        title="View printable QR code"
                      >
                        <QrCode className="w-3.5 h-3.5 inline mr-1" /> QR
                      </button>

                      <button
                        onClick={() => handleToggleStatus(svc._id, svc.status)}
                        className={`py-1 px-2.5 rounded-lg text-xs font-semibold transition ${
                          svc.status === 'active'
                            ? 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        }`}
                      >
                        {svc.status === 'active' ? 'Pause' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create Service Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <h3 className="font-extrabold text-xl text-slate-900 mb-1">Add Campus Service Desk</h3>
            <p className="text-xs text-slate-500 mb-6">
              Automatically creates Counter 1 and links into virtual queue engine.
            </p>

            <form onSubmit={handleCreateService} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Service Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Scholarship Section"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Prefix Code (3-4 chars)</label>
                  <input
                    type="text"
                    required
                    maxLength={5}
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="e.g. SCH"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl uppercase font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="What services are offered here?"
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="administration">Administration</option>
                    <option value="academic">Academic / Exam</option>
                    <option value="dining">Dining / Canteen</option>
                    <option value="library">Library</option>
                    <option value="health">Medical</option>
                    <option value="finance">Finance / Fees</option>
                    <option value="facility">Labs</option>
                    <option value="other">Events / Other</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Avg Duration (Mins)</label>
                  <input
                    type="number"
                    min={1}
                    value={formData.estimatedServiceTimeMinutes}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        estimatedServiceTimeMinutes: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Building</label>
                  <input
                    type="text"
                    value={formData.location.building}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        location: { ...formData.location, building: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Room / Floor</label>
                  <input
                    type="text"
                    value={formData.location.room}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        location: { ...formData.location, room: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Max Queue Capacity</label>
                  <input
                    type="number"
                    min={5}
                    value={formData.maxQueueCapacity}
                    onChange={(e) =>
                      setFormData({ ...formData, maxQueueCapacity: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Overflow Alert Threshold</label>
                  <input
                    type="number"
                    min={3}
                    value={formData.overflowThreshold}
                    onChange={(e) =>
                      setFormData({ ...formData, overflowThreshold: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="flex-1 py-2.5 px-4 bg-slate-100 text-slate-700 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold"
                >
                  Create Service Desk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Modal */}
      {selectedQR && (
        <QRDisplayModal
          isOpen={qrModalOpen}
          onClose={() => setQrModalOpen(false)}
          title={`${selectedQR.serviceName} Entrance Poster`}
          subtitle="Scan with smartphone camera to take a virtual queue token"
          qrValue={selectedQR.joinUrl}
        />
      )}
    </div>
  );
}
