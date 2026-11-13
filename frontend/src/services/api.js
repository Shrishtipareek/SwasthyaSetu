import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 20000,
});

// Interceptor to inject JWT token in Authorization header
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response interceptor to handle expired sessions
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      // Redirect to login if on protected route
      const publicPaths = ['/', '/login', '/register', '/public-dashboard', '/search-hospitals', '/blood-donors', '/campaigns', '/symptom-checker'];
      if (!publicPaths.includes(window.location.pathname)) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (credentials) => API.post('/auth/login', credentials),
  registerUser: (userData) => API.post('/auth/register', userData),
  registerHospital: (hospitalData) => API.post('/auth/register-hospital', hospitalData),
  getMe: () => API.get('/auth/profile'),
  updateProfile: (profileData) => API.put('/auth/profile', profileData),
};

export const hospitalAPI = {
  getAll: (params, config = {}) => API.get('/hospitals', { params, ...config }),
  getConnected: (config = {}) => API.get('/hospitals/connected', config),
  getNearbyReal: (params, config = {}) => API.get('/hospitals/nearby-real', { params, ...config }),
  getStats: (config = {}) => API.get('/hospitals/stats', config),
  getById: (id, config = {}) => API.get(`/hospitals/${id}`, config),
  updateResources: (resources) => API.put('/hospitals/resources', resources),
  getDashboardStats: (config = {}) => API.get('/hospitals/dashboard/stats', config),
};

export const doctorAPI = {
  getDoctors: (params, config = {}) => API.get('/doctors', { params, ...config }),
  addDoctor: (docData) => API.post('/doctors', docData),
  removeDoctor: (id) => API.delete(`/doctors/${id}`),
};

export const appointmentAPI = {
  book: (apptData) => API.post('/appointments', apptData),
  getAppointments: (params, config = {}) => API.get('/appointments', { params, ...config }),
  cancel: (id) => API.put(`/appointments/${id}/cancel`),
};

export const resourceRequestAPI = {
  create: (reqData) => API.post('/resource-requests', reqData),
  getAll: () => API.get('/resource-requests'),
  respond: (id, responseData) => API.put(`/resource-requests/${id}/respond`, responseData),
  updateStatus: (id, statusData) => API.put(`/resource-requests/${id}/status`, statusData),
};

export const ambulanceAPI = {
  register: (ambData) => API.post('/ambulances', ambData),
  getAmbulances: (params) => API.get('/ambulances', { params }),
  update: (id, statusData) => API.put(`/ambulances/${id}`, statusData),
};

export const emergencyAPI = {
  initiate: (emergencyData) => API.post('/emergency', emergencyData),
  getHospitalEmergencies: () => API.get('/emergency/hospital'),
  updateStatus: (id, statusData) => API.put(`/emergency/${id}`, statusData),
};

export const aiAPI = {
  chat: (messageData) => API.post('/ai/chat', messageData),
  getHistory: () => API.get('/ai/history'),
};

export const campaignAPI = {
  create: (campaignData) => API.post('/campaigns', campaignData),
  getCampaigns: () => API.get('/campaigns'),
  register: (id) => API.post(`/campaigns/${id}/register`),
};

export const notificationAPI = {
  getNotifications: () => API.get('/notifications'),
  markAsRead: (id) => API.put(`/notifications/${id}/read`),
};

export const adminAPI = {
  getHospitals: () => API.get('/admin/hospitals'),
  verifyHospital: (id, statusData) => API.put(`/admin/hospitals/${id}/verify`, statusData),
  getStats: () => API.get('/admin/stats'),
};

export const bloodDonorAPI = {
  register: (donorData) => API.post('/blood-donors', donorData),
  getDonors: (params, config = {}) => API.get('/blood-donors', { params, ...config }),
  getMyProfile: () => API.get('/blood-donors/me'),
  updateMyProfile: (data) => API.put('/blood-donors/me', data),
  remove: () => API.delete('/blood-donors/me'),
};

export const medicalDocumentAPI = {
  upload: (docData) => API.post('/documents', docData),
  getDocuments: (params, config = {}) => API.get('/documents', { params, ...config }),
  delete: (id) => API.delete(`/documents/${id}`),
};

export default API;