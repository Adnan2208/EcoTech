import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Waste Detection API methods
export const wasteDetectionApi = {
  // Analyze uploaded image
  analyzeImage: (formData) => api.post('/waste-detection/analyze', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),

  // Analyze images for a specific report
  analyzeReport: (reportId) => api.post(`/waste-detection/report/${reportId}`),

  // Get detection results for a report
  getDetectionResults: (reportId) => api.get(`/waste-detection/report/${reportId}`),

  // Get overall detection statistics
  getDetectionStats: () => api.get('/waste-detection/stats'),
};

export default api;
