import axios from 'axios';
import { API_BASE_URL } from '../../constants/config';
import { TokenService } from '../services/TokenService';

const REQUEST_TIMEOUT_MS = 30000;
const PRESIGNED_HOST_HINTS = ['amazonaws.com', 'cloudfront.net', 'minio'];
const PRESIGNED_QUERY_HINTS = [
  'X-Amz-Algorithm',
  'X-Amz-Credential',
  'X-Amz-Date',
  'X-Amz-Expires',
  'X-Amz-Signature',
  'X-Amz-SignedHeaders',
];

function isPresignedUrl(url?: string): boolean {
  if (!url) return false;

  const hasHintInRawUrl = PRESIGNED_QUERY_HINTS.some((hint) =>
    url.includes(`${hint}=`)
  );
  if (hasHintInRawUrl) return true;

  try {
    const parsed = new URL(url);
    const hostLooksLikeObjectStorage = PRESIGNED_HOST_HINTS.some((hint) =>
      parsed.host.includes(hint)
    );
    if (!hostLooksLikeObjectStorage) return false;

    return PRESIGNED_QUERY_HINTS.some((hint) => parsed.searchParams.has(hint));
  } catch {
    // Relative URLs are not presigned object storage URLs.
    return false;
  }
}

export const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: REQUEST_TIMEOUT_MS,
});

// Request Interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    const shouldAttachAuth = !isPresignedUrl(config.url);

    if (typeof window !== 'undefined') {
      const token = TokenService.getToken();
      if (shouldAttachAuth && token && config.headers) {
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
