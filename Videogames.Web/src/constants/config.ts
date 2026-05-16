export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";
export const IMAGE_BASE_URL = process.env.NEXT_PUBLIC_IMAGE_BASE_URL || "";

export const HUB_URL = API_BASE_URL.endsWith("/api")
  ? API_BASE_URL.replace("/api", "/hubs/chat")
  : `${API_BASE_URL}/hubs/chat`;

export const CONFIG = {
  API_BASE_URL,
  IMAGE_BASE_URL,
  HUB_URL,
  IS_DEVELOPMENT: process.env.NODE_ENV === "development",
};
