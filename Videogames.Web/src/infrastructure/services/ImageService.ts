import {
  IImageService,
  ImageUploadResult,
} from "../../domain/ports/IImageService";
import { axiosInstance } from "../api/axiosInstance";

interface CreatePresignedUploadRequest {
  contentType: string;
  sizeBytes: number;
}

interface PresignedUploadResponse {
  fileName: string;
  uploadUrl: string;
  expiresAtUtc: string;
}

interface PresignedImageMetadataResponse {
  fileName: string;
  accessUrl: string;
  expiresAtUtc: string;
}

interface CachedPresignedUploadEntry {
  fileName: string;
  accessUrl: string;
  expiresAtUtc: string;
  cachedAtUtc: string;
}

const PRESIGNED_UPLOAD_CACHE_KEY = "vmarket.presigned-upload-cache.v1";

export class ImageService implements IImageService {
  private readPresignedCache(): Record<string, CachedPresignedUploadEntry> {
    if (typeof window === "undefined") return {};

    const raw = sessionStorage.getItem(PRESIGNED_UPLOAD_CACHE_KEY);
    if (!raw) return {};

    try {
      const parsed = JSON.parse(raw) as Record<string, CachedPresignedUploadEntry>;
      return parsed ?? {};
    } catch {
      return {};
    }
  }

  private isExpired(expiresAtUtc: string): boolean {
    return new Date(expiresAtUtc).getTime() <= Date.now();
  }

  private persistPresignedCache(
    cache: Record<string, CachedPresignedUploadEntry>
  ): void {
    if (typeof window === "undefined") return;
    sessionStorage.setItem(PRESIGNED_UPLOAD_CACHE_KEY, JSON.stringify(cache));
  }

  private cleanupExpiredPresignedCache(): void {
    const cache = this.readPresignedCache();
    const nextEntries = Object.values(cache).filter(
      (entry) => !this.isExpired(entry.expiresAtUtc)
    );

    const nextCache = nextEntries.reduce<Record<string, CachedPresignedUploadEntry>>(
      (acc, entry) => {
        acc[entry.fileName] = entry;
        return acc;
      },
      {}
    );

    this.persistPresignedCache(nextCache);
  }

  private cachePresignedUpload(result: ImageUploadResult): void {
    if (!result.expiresAtUtc || !result.accessUrl) return;

    this.cleanupExpiredPresignedCache();
    const cache = this.readPresignedCache();
    cache[result.fileName] = {
      fileName: result.fileName,
      accessUrl: result.accessUrl,
      expiresAtUtc: result.expiresAtUtc,
      cachedAtUtc: new Date().toISOString(),
    };
    this.persistPresignedCache(cache);
  }

  private async getImageMetadata(
    fileName: string
  ): Promise<PresignedImageMetadataResponse> {
    const response = await axiosInstance.get<PresignedImageMetadataResponse>(
      `/Images/${encodeURIComponent(fileName)}/metadata`
    );

    return response.data;
  }

  async refreshImageAccessUrl(fileName: string): Promise<string | null> {
    const normalized = fileName.trim();
    if (!normalized) return null;

    try {
      const metadata = await this.getImageMetadata(normalized);
      this.cachePresignedUpload({
        fileName: metadata.fileName,
        source: "presigned",
        expiresAtUtc: metadata.expiresAtUtc,
        accessUrl: metadata.accessUrl,
      });
      return metadata.accessUrl;
    } catch {
      return null;
    }
  }

  private async uploadUsingPresignedUrl(file: File): Promise<ImageUploadResult> {
    const request: CreatePresignedUploadRequest = {
      contentType: file.type,
      sizeBytes: file.size,
    };

    const presignedResponse = await axiosInstance.post<PresignedUploadResponse>(
      "/Images/presigned-upload",
      request
    );

    const putResponse = await fetch(presignedResponse.data.uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": file.type,
      },
      body: file,
    });

    if (!putResponse.ok) {
      throw new Error(`Presigned upload failed with status ${putResponse.status}.`);
    }

    const metadata = await this.getImageMetadata(presignedResponse.data.fileName);

    const result: ImageUploadResult = {
      fileName: presignedResponse.data.fileName,
      source: "presigned",
      expiresAtUtc: metadata.expiresAtUtc,
      accessUrl: metadata.accessUrl,
    };

    this.cachePresignedUpload(result);
    return result;
  }

  private async uploadUsingLegacyMultipart(file: File): Promise<ImageUploadResult> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await axiosInstance.post<{ fileName: string }>(
      "/Images/upload",
      formData
    );

    const result: ImageUploadResult = {
      fileName: response.data.fileName,
      source: "legacy",
      expiresAtUtc: null,
      accessUrl: null,
    };

    try {
      const metadata = await this.getImageMetadata(result.fileName);
      const enriched: ImageUploadResult = {
        ...result,
        expiresAtUtc: metadata.expiresAtUtc,
        accessUrl: metadata.accessUrl,
      };

      this.cachePresignedUpload(enriched);
      return enriched;
    } catch {
      return result;
    }
  }

  async uploadImage(file: File): Promise<string> {
    const result = await this.uploadImageDetailed(file);
    return result.fileName;
  }

  async uploadImageDetailed(file: File): Promise<ImageUploadResult> {
    try {
      return await this.uploadUsingPresignedUrl(file);
    } catch {
      return await this.uploadUsingLegacyMultipart(file);
    }
  }
}
