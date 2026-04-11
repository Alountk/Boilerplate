import axios from 'axios';
import { API_BASE_URL } from '../../constants/config';

export const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
});

// Request Interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    
    // Only set Content-Type to JSON if it's not already set and not FormData
    if (config.headers && !config.headers['Content-Type'] && !(config.data instanceof FormData)) {
      config.headers['Content-Type'] = 'application/json';
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor for Global Error Handling
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Global 401 Unauthorized handling
      if (error.response.status === 401) {
        if (typeof window !== 'undefined') {
          console.warn('Unauthorized access, redirecting to login...');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          // Only redirect if not already on login page to avoid loops
          if (!window.location.pathname.includes('/login')) {
            window.location.href = '/login';
          }
        }
      }
    }
    return Promise.reject(error);
  }
);
