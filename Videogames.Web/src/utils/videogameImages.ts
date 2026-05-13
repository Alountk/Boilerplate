import { API_BASE_URL, IMAGE_BASE_URL } from "../constants/config";

const HTTP_URL_REGEX = /^https?:\/\//i;
const PRESIGNED_UPLOAD_CACHE_KEY = "vmarket.presigned-upload-cache.v1";

interface CachedPresignedUploadEntry {
  fileName: string;
  accessUrl: string;
  expiresAtUtc: string;
  cachedAtUtc: string;
}

export type VideogameImageValueType = "filename" | "presigned";

export function isExternalImageUrl(value: string): boolean {
  return HTTP_URL_REGEX.test(value);
}

export function extractStoredImageFileName(
  value?: string | null,
  type: VideogameImageValueType = "filename",
): string | null {
  if (!value || type !== "filename") return null;

  const trimmed = value.trim();
  if (!trimmed) return null;
  if (isExternalImageUrl(trimmed)) return null;
  if (trimmed.startsWith("/")) return null;

  return trimmed;
}

function readPresignedAccessCache(): Record<
  string,
  CachedPresignedUploadEntry
> {
  if (typeof window === "undefined") return {};

  const raw = sessionStorage.getItem(PRESIGNED_UPLOAD_CACHE_KEY);
  if (!raw) return {};

  try {
    const parsed = JSON.parse(raw) as Record<
      string,
      CachedPresignedUploadEntry
    >;
    return parsed ?? {};
  } catch {
    return {};
  }
}

function getCachedAccessUrl(fileName: string): string | null {
  const cache = readPresignedAccessCache();
  const cached = cache[fileName];
  if (!cached) return null;

  const expiresAtMillis = new Date(cached.expiresAtUtc).getTime();
  if (!Number.isFinite(expiresAtMillis) || expiresAtMillis <= Date.now()) {
    return null;
  }

  return cached.accessUrl || null;
}

export function resolveVideogameImageSrc(
  value?: string | null,
  type: VideogameImageValueType = "filename",
): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  if (type === "presigned") {
    return trimmed;
  }

  if (isExternalImageUrl(trimmed)) return trimmed;
  if (trimmed.startsWith("/")) return trimmed;

  const cachedAccessUrl = getCachedAccessUrl(trimmed);
  if (cachedAccessUrl) return cachedAccessUrl;

  if (IMAGE_BASE_URL) {
    const normalizedBaseUrl = IMAGE_BASE_URL.endsWith("/")
      ? IMAGE_BASE_URL.slice(0, -1)
      : IMAGE_BASE_URL;
    return `${normalizedBaseUrl}/${trimmed}`;
  }

  return `${API_BASE_URL}/Images/${trimmed}`;
}

export function getVideogameImageCandidates(input: {
  images?: string[];
  urlImg?: string;
  urlImgType?: VideogameImageValueType;
}): string[] {
  const firstUploaded =
    input.images && input.images.length > 0 ? input.images[0] : null;
  const ordered = [
    resolveVideogameImageSrc(firstUploaded ?? "", "filename"),
    resolveVideogameImageSrc(
      input.urlImg ?? "",
      input.urlImgType ?? "filename",
    ),
  ].filter((value): value is string => Boolean(value));

  return [...new Set(ordered)];
}
