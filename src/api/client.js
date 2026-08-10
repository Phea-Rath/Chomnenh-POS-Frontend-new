import axios from 'axios';
import baseUrl from '../services/baseUrl';
import { getToken, clearAllTokens } from '@/utils/tokenStore';

const API_BASE_URL = `${baseUrl}/api`;

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Request Interceptor: Attach token from in-memory store (XSS-safe, not from localStorage)
apiClient.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Clear token store on session expiry
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearAllTokens();
      // Clear non-sensitive session data
      ['userId', 'profileId', 'permissions', 'menus-sidebar', 'menus-home', 'menus-report', 'menus-setting'].forEach(
        (key) => localStorage.removeItem(key)
      );
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
