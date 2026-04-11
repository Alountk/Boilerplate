import { IImageService } from "../../domain/ports/IImageService";
import { axiosInstance } from "../api/axiosInstance";

export class ImageService implements IImageService {
  async uploadImage(file: File): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await axiosInstance.post<{ fileName: string }>(
      "/Images/upload",
      formData
    );

    return response.data.fileName;
  }
}
