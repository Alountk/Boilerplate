export interface IImageService {
  uploadImage(file: File): Promise<string>;
}
