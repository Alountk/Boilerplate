export type ImageUploadSource = "presigned" | "legacy";

export interface ImageUploadResult {
  fileName: string;
  source: ImageUploadSource;
  expiresAtUtc: string | null;
  accessUrl?: string | null;
}

export interface IImageService {
  uploadImage(file: File): Promise<string>;
  uploadImageDetailed(file: File): Promise<ImageUploadResult>;
}
