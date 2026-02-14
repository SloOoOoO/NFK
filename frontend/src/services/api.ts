import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';

// API base URL - can be overridden by environment variable
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';

// Extended request config to track retry attempts
interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    // Get token from localStorage (adjust based on your auth implementation)
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequestConfig;

    // Handle 401 Unauthorized - try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry && originalRequest) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken,
          });

          const { accessToken, refreshToken: newRefreshToken } = response.data;
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', newRefreshToken);

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return apiClient(originalRequest);
        }
      } catch {
        // Refresh failed - redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/auth/login';
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data: Record<string, unknown>) =>
    apiClient.post('/auth/register', data),
  
  login: (email: string, password: string) =>
    apiClient.post('/auth/login', { email, password }),
  
  logout: (refreshToken: string) =>
    apiClient.post('/auth/logout', { refreshToken }),
  
  refreshToken: (refreshToken: string) =>
    apiClient.post('/auth/refresh', { refreshToken }),
  
  getCurrentUser: () =>
    apiClient.get('/auth/me'),
};

// Clients API
export const clientsAPI = {
  getAll: () => apiClient.get('/clients'),
  getById: (id: number) => apiClient.get(`/clients/${id}`),
  create: (data: Record<string, unknown>) => apiClient.post('/clients', data),
  update: (id: number, data: Record<string, unknown>) => apiClient.put(`/clients/${id}`, data),
  delete: (id: number) => apiClient.delete(`/clients/${id}`),
};

// Cases API
export const casesAPI = {
  getAll: () => apiClient.get('/cases'),
  getById: (id: number) => apiClient.get(`/cases/${id}`),
  create: (data: Record<string, unknown>) => apiClient.post('/cases', data),
  update: (id: number, data: Record<string, unknown>) => apiClient.put(`/cases/${id}`, data),
  updateStatus: (id: number, status: string) => apiClient.put(`/cases/${id}/status`, { status }),
  delete: (id: number) => apiClient.delete(`/cases/${id}`),
};

// Documents API
export const documentsAPI = {
  getAll: () => apiClient.get('/documents'),
  getStats: () => apiClient.get('/documents/stats'),
  upload: (file: File, clientId?: number, caseId?: number) => {
    const formData = new FormData();
    formData.append('file', file);
    if (clientId) formData.append('clientId', clientId.toString());
    if (caseId) formData.append('caseId', caseId.toString());
    return apiClient.post('/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  download: (id: number) => apiClient.get(`/documents/${id}/download`, { responseType: 'blob' }),
};

// DATEV API
export const datevAPI = {
  export: (data: Record<string, unknown>) => apiClient.post('/datev/export', data),
  getJobs: () => apiClient.get('/datev/jobs'),
  retryJob: (id: number) => apiClient.post(`/datev/jobs/${id}/retry`),
};

// Messages API
export const messagesAPI = {
  getAll: () => apiClient.get('/messages'),
  getById: (id: number) => apiClient.get(`/messages/${id}`),
  markAsRead: (id: number) => apiClient.put(`/messages/${id}/read`),
  send: (data: { recipientUserId: number; subject: string; content: string; caseId?: number }) => 
    apiClient.post('/messages/send', data),
  reply: (id: number, content: string) => apiClient.post(`/messages/${id}/reply`, { content }),
  delete: (id: number) => apiClient.delete(`/messages/${id}`),
};

// Events/Calendar API
export const eventsAPI = {
  getAll: () => apiClient.get('/events'),
  getById: (id: number) => apiClient.get(`/events/${id}`),
  create: (data: Record<string, unknown>) => apiClient.post('/events', data),
  update: (id: number, data: Record<string, unknown>) => apiClient.put(`/events/${id}`, data),
  delete: (id: number) => apiClient.delete(`/events/${id}`),
  complete: (id: number) => apiClient.put(`/events/${id}/complete`),
};

// Admin API
export const adminAPI = {
  getAllUsers: () => apiClient.get('/admin/users'),
  getStatistics: () => apiClient.get('/admin/statistics'),
  updateUserRole: (userId: number, role: string) => 
    apiClient.put(`/admin/users/${userId}/role`, { role }),
  updateUserProfile: (userId: number, data: Record<string, unknown>) =>
    apiClient.put(`/admin/users/${userId}/profile`, data),
  getHeaderText: () => apiClient.get('/admin/header-text'),
  updateHeaderText: (data: { welcomeTitle: string; welcomeSubtitle: string }) =>
    apiClient.put('/admin/header-text', data),
};

// Users API
export const usersAPI = {
  getAll: (role?: string) => apiClient.get('/users', { params: { role } }),
  search: (query: string) => apiClient.get('/users/search', { params: { query } }),
  updateProfile: (data: Record<string, unknown>) => apiClient.put('/users/profile', data),
  deleteProfile: (confirmationText: string) => apiClient.delete('/users/profile', { data: { confirmationText } }),
};

// Health check
export const healthAPI = {
  check: () => axios.get(`${API_BASE_URL.replace('/api/v1', '')}/health`),
};

export default apiClient;
