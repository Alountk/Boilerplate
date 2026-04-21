import { IImageService } from "../../domain/ports/IImageService";
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

export class ImageService implements IImageService {
  private async uploadUsingPresignedUrl(file: File): Promise<string> {
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

    return presignedResponse.data.fileName;
  }

  private async uploadUsingLegacyMultipart(file: File): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await axiosInstance.post<{ fileName: string }>(
      "/Images/upload",
      formData
    );

    return response.data.fileName;
  }

  async uploadImage(file: File): Promise<string> {
    try {
      return await this.uploadUsingPresignedUrl(file);
    } catch {
      return await this.uploadUsingLegacyMultipart(file);
    }
  }
}
