const API_URL = '/api';

const getToken = () => localStorage.getItem('waitwise_token');

const request = async (endpoint, options = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(`${API_URL}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `Request failed with status ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error(`API Error on ${endpoint}:`, error.message);
    throw error;
  }
};

export const api = {
  // Auth
  login: (credentials) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),
  register: (userData) =>
    request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),
  getMe: () => request('/auth/me'),

  // Services
  getServices: () => request('/services'),
  getService: (id) => request(`/services/${id}`),
  createService: (data) =>
    request('/services', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateService: (id, data) =>
    request(`/services/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  setServiceStatus: (id, status) =>
    request(`/services/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  getServiceQR: (id) => request(`/services/${id}/qr`),

  // Counters
  getCounters: (serviceId) =>
    request(`/counters${serviceId ? `?serviceId=${serviceId}` : ''}`),
  createCounter: (data) =>
    request('/counters', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateCounter: (id, data) =>
    request(`/counters/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  toggleCounterStatus: (id, status) =>
    request(`/counters/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  // Queues & Tickets
  joinQueue: (data) =>
    request('/queues/join', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  kioskJoin: (data) =>
    request('/queues/kiosk-join', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  staffIssueToken: (data) =>
    request('/queues/staff-issue', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getTicket: (id, guestToken) =>
    request(`/queues/tickets/${id}${guestToken ? `?guestToken=${guestToken}` : ''}`),
  cancelTicket: (id, data = {}) =>
    request(`/queues/tickets/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getLiveQueue: (serviceId) => request(`/queues/services/${serviceId}/live`),
  getMyHistory: () => request('/queues/my-history'),

  // Staff operations
  getMyStation: () => request('/staff/my-station'),
  callNext: (counterId) =>
    request('/staff/call-next', {
      method: 'POST',
      body: JSON.stringify({ counterId }),
    }),
  startService: (ticketId) =>
    request('/staff/start-service', {
      method: 'POST',
      body: JSON.stringify({ ticketId }),
    }),
  completeService: (ticketId, counterId) =>
    request('/staff/complete-service', {
      method: 'POST',
      body: JSON.stringify({ ticketId, counterId }),
    }),
  skipTicket: (ticketId, reason, counterId) =>
    request('/staff/skip', {
      method: 'POST',
      body: JSON.stringify({ ticketId, reason, counterId }),
    }),
  markNoShow: (ticketId, counterId) =>
    request('/staff/no-show', {
      method: 'POST',
      body: JSON.stringify({ ticketId, counterId }),
    }),

  // Admin operations
  getAdminDashboard: () => request('/admin/dashboard'),
  getAnalytics: () => request('/admin/analytics'),
  simulateCounter: (serviceId, additionalCounters) =>
    request('/admin/simulate-counter', {
      method: 'POST',
      body: JSON.stringify({ serviceId, additionalCounters }),
    }),
  getAuditLogs: () => request('/admin/audit-logs'),
  getUsers: () => request('/admin/users'),
  createUser: (userData) =>
    request('/admin/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),
  exportCSVUrl: '/api/admin/export-csv',

  // Notifications
  getNotifications: (guestToken) =>
    request(`/notifications${guestToken ? `?guestToken=${guestToken}` : ''}`),
  markNotificationRead: (id) =>
    request(`/notifications/${id}/read`, {
      method: 'PATCH',
    }),
  markAllNotificationsRead: () =>
    request('/notifications/read-all', {
      method: 'PATCH',
    }),
};
