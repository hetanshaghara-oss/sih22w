import axios from 'axios';
import { MOCK_DASHBOARD, MOCK_INSTRUMENTS } from './mockData';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to inject JWT Bearer Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('nawi_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor to handle unauthenticated responses and provide mock fallback
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const token = localStorage.getItem('nawi_token');
    const isMock = !!token?.startsWith('mock-token-');

    // If using mock session or backend is offline, provide fallback data for dashboard & instruments
    if (error.code === 'ERR_NETWORK' || !error.response || error.response?.status === 404 || isMock) {
      const url = error.config?.url || '';
      if (url.includes('/dashboard')) {
        return Promise.resolve({
          data: MOCK_DASHBOARD,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: error.config,
        });
      }
      if (url.includes('/instruments')) {
        return Promise.resolve({
          data: MOCK_INSTRUMENTS,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: error.config,
        });
      }
    }

    if (error.response && error.response.status === 401) {
      // Do not kick out mock sessions
      if (isMock) {
        return Promise.reject(error);
      }
      // Clear token if invalid or expired
      localStorage.removeItem('nawi_token');
      localStorage.removeItem('nawi_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login?expired=1';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
