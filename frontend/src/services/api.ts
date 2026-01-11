import axios from 'axios';

// API base URL - can be overridden by environment variable
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';

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
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized - try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
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
      } catch (refreshError) {
        // Refresh failed - redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/auth/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data: any) =>
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
  create: (data: any) => apiClient.post('/clients', data),
  update: (id: number, data: any) => apiClient.put(`/clients/${id}`, data),
  delete: (id: number) => apiClient.delete(`/clients/${id}`),
};

// Cases API
export const casesAPI = {
  getAll: () => apiClient.get('/cases'),
  getById: (id: number) => apiClient.get(`/cases/${id}`),
  create: (data: any) => apiClient.post('/cases', data),
  updateStatus: (id: number, status: any) => apiClient.put(`/cases/${id}/status`, status),
};

// Documents API
export const documentsAPI = {
  getAll: () => apiClient.get('/documents'),
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
  export: (data: any) => apiClient.post('/datev/export', data),
  getJobs: () => apiClient.get('/datev/jobs'),
  retryJob: (id: number) => apiClient.post(`/datev/jobs/${id}/retry`),
};

// Messages API
export const messagesAPI = {
  getAll: () => apiClient.get('/messages'),
  markAsRead: (id: number) => apiClient.put(`/messages/${id}/read`),
};

// Events/Calendar API
export const eventsAPI = {
  getAll: () => apiClient.get('/events'),
};

// Admin API
export const adminAPI = {
  getAllUsers: () => apiClient.get('/admin/users'),
  updateUserRole: (userId: number, role: string) => 
    apiClient.put(`/admin/users/${userId}/role`, { role }),
  updateUserProfile: (userId: number, data: any) =>
    apiClient.put(`/admin/users/${userId}/profile`, data),
  getHeaderText: () => apiClient.get('/admin/header-text'),
  updateHeaderText: (data: { welcomeTitle: string; welcomeSubtitle: string }) =>
    apiClient.put('/admin/header-text', data),
};

// Health check
export const healthAPI = {
  check: () => axios.get(`${API_BASE_URL.replace('/api/v1', '')}/health`),
};

export default apiClient;
