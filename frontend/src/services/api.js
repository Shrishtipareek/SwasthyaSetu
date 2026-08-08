import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api',
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

export const authAPI = {
  login: (credentials) => API.post('/auth/login', credentials),
  registerUser: (userData) => API.post('/auth/register', userData),
  registerHospital: (hospitalData) => API.post('/auth/register-hospital', hospitalData),
  getMe: () => API.get('/auth/profile'),
  updateProfile: (profileData) => API.put('/auth/profile', profileData),
};

export const hospitalAPI = {
  getAll: (params) => API.get('/hospitals', { params }),
  getStats: () => API.get('/hospitals/stats'),
  getById: (id) => API.get(`/hospitals/${id}`),
  updateResources: (resources) => API.put('/hospitals/resources', resources),
  getDashboardStats: () => API.get('/hospitals/dashboard/stats'),
};

export const doctorAPI = {
  getDoctors: (params) => API.get('/doctors', { params }),
  addDoctor: (docData) => API.post('/doctors', docData),
  removeDoctor: (id) => API.delete(`/doctors/${id}`),
};

export const appointmentAPI = {
  book: (apptData) => API.post('/appointments', apptData),
  getAppointments: () => API.get('/appointments'),
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
  getDonors: (params) => API.get('/blood-donors', { params }),
  remove: () => API.delete('/blood-donors/me'),
};

export const medicalDocumentAPI = {
  upload: (docData) => API.post('/documents', docData),
  getDocuments: (params) => API.get('/documents', { params }),
  delete: (id) => API.delete(`/documents/${id}`),
};

export default API;