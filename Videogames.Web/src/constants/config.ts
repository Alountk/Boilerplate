export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5017/api";

export const HUB_URL = API_BASE_URL.endsWith('/api') 
  ? API_BASE_URL.replace('/api', '/hubs/chat')
  : `${API_BASE_URL}/hubs/chat`;

export const CONFIG = {
  API_BASE_URL,
  HUB_URL,
  IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
};
