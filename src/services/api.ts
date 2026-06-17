import axios from 'axios';

// Create AXIOS instance configured with fallback route configurations
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Configure automatic Authorization headers for API queries using stored JWT credentials
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token && config.headers) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Auth services
export const authService = {
  async register(payload: any) {
    const res = await api.post('/auth/register', payload);
    return res.data;
  },

  async login(payload: any) {
    const res = await api.post('/auth/login', payload);
    return res.data;
  },

  async forgotPassword(email: string) {
    const res = await api.post('/auth/forgot-password', { email });
    return res.data;
  },

  async getMe() {
    const res = await api.get('/auth/me');
    return res.data;
  },

  async getGoogleAuthUrl() {
    const res = await api.get('/auth/google/url');
    return res.data;
  }
};

// Scan services
export const scanService = {
  async getScanHistory() {
    const res = await api.get('/scans');
    return res.data;
  },

  async analyzeWasteImage(base64Image: string) {
    const res = await api.post('/scans/analyze', { image: base64Image });
    return res.data;
  },

  async deleteScanRecord(id: number) {
    const res = await api.delete(`/scans/${id}`);
    return res.data;
  }
};

// Chat services
export const chatService = {
  async getChatHistory() {
    const res = await api.get('/chat');
    return res.data;
  },

  async askAssistant(question: string) {
    const res = await api.post('/chat/ask', { question });
    return res.data;
  },

  async clearChatMessage(id: number) {
    const res = await api.delete(`/chat/${id}`);
    return res.data;
  }
};

// Admin services
export const adminService = {
  async getUsers() {
    const res = await api.get('/admin/users');
    return res.data;
  },

  async getScans() {
    const res = await api.get('/admin/scans');
    return res.data;
  },

  async getAnalytics() {
    const res = await api.get(`/admin/analytics?t=${Date.now()}`, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    return res.data;
  },

  async deleteUser(id: number) {
    const res = await api.delete(`/admin/users/${id}`);
    return res.data;
  },

  async deleteScan(id: number) {
    const res = await api.delete(`/admin/scans/${id}`);
    return res.data;
  }
};

export default api;
