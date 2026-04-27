import { API_BASE_URL, IMAGE_BASE_URL } from "../constants/config";

const HTTP_URL_REGEX = /^https?:\/\//i;

export function isExternalImageUrl(value: string): boolean {
  return HTTP_URL_REGEX.test(value);
}

export function resolveVideogameImageSrc(value?: string | null): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  if (isExternalImageUrl(trimmed)) return trimmed;
  if (trimmed.startsWith("/")) return trimmed;

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
}): string[] {
  const firstUploaded = input.images && input.images.length > 0 ? input.images[0] : null;
  const ordered = [firstUploaded, input.urlImg]
    .map((value) => resolveVideogameImageSrc(value ?? ""))
    .filter((value): value is string => Boolean(value));

  return [...new Set(ordered)];
}
