/**
 * Hook para gestionar el estado y la lógica de carga de imágenes en el formulario de Create.
 * Extrae: validación de archivo, upload a servicio, drag-and-drop, side images.
 */

import { useState } from "react";
import { ImageService } from "../infrastructure/services/ImageService";
import { ImageUploadResult } from "../domain/ports/IImageService";
import { resolveVideogameImageSrc } from "../utils/videogameImages";

export { resolveVideogameImageSrc };

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
]);

export type SideKey =
  | "frontalUrl"
  | "backUrl"
  | "rightSideUrl"
  | "leftSideUrl"
  | "topSideUrl"
  | "bottomSideUrl";

export interface UseImageUploadReturn {
  images: string[];
  uploading: boolean;
  uploadingStates: Record<string, boolean>;
  draggedIndex: number | null;
  validateImageFile: (file: File) => string | null;
  handleMultipleFilesChange: (
    e: React.ChangeEvent<HTMLInputElement>,
    onFirstImageResolved: (fileName: string) => void,
    onOcrCandidate?: (file: File) => void
  ) => Promise<void>;
  removeImage: (index: number, onUrlImgUpdate: (next: string) => void) => void;
  handleDragStart: (index: number) => void;
  handleDragOver: (e: React.DragEvent) => void;
  handleDrop: (
    dropIndex: number,
    onUrlImgUpdate: (next: string) => void
  ) => void;
  handleSideImageUpload: (
    side: SideKey,
    file: File,
    onResolved: (side: SideKey, fileName: string) => void
  ) => Promise<void>;
  setImages: React.Dispatch<React.SetStateAction<string[]>>;
}

export function useImageUpload(): UseImageUploadReturn {
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadingStates, setUploadingStates] = useState<
    Record<string, boolean>
  >({});
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const imageService = new ImageService();

  const validateImageFile = (file: File): string | null => {
    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      return `Unsupported image type: ${file.type || "unknown"}.`;
    }
    if (file.size <= 0) return "Image file is empty.";
    if (file.size > MAX_UPLOAD_BYTES)
      return `Image ${file.name} exceeds 5MB.`;
    return null;
  };

  const handleMultipleFilesChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    onFirstImageResolved: (fileName: string) => void,
    onOcrCandidate?: (file: File) => void
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const selectedFiles = Array.from(files);
    const invalidErrors: string[] = [];
    const validFiles = selectedFiles.filter((file) => {
      const error = validateImageFile(file);
      if (error) { invalidErrors.push(error); return false; }
      return true;
    });

    if (validFiles.length === 0) {
      alert(invalidErrors.join("\n") || "No valid images selected.");
      return;
    }

    setUploading(true);
    try {
      const uploadResults = await Promise.allSettled(
        validFiles.map((file) => imageService.uploadImageDetailed(file))
      );

      const uploaded = uploadResults
        .filter(
          (r): r is PromiseFulfilledResult<ImageUploadResult> =>
            r.status === "fulfilled"
        )
        .map((r) => r.value);

      const uploadedFileNames = uploaded.map((r) => r.fileName);
      const legacyFallbackCount = uploaded.filter(
        (r) => r.source === "legacy"
      ).length;

      const uploadErrors = uploadResults
        .filter((r): r is PromiseRejectedResult => r.status === "rejected")
        .map((r) => String(r.reason));

      if (uploadedFileNames.length > 0) {
        setImages((prev) => {
          const next = [...prev, ...uploadedFileNames];
          onFirstImageResolved(next[0]);
          return next;
        });
      }

      if (onOcrCandidate && validFiles[0]) {
        onOcrCandidate(validFiles[0]);
      }

      const allErrors = [...invalidErrors, ...uploadErrors];
      if (allErrors.length > 0) {
        alert(`Some images failed to upload:\n${allErrors.join("\n")}`);
      }

      if (legacyFallbackCount > 0) {
        alert(
          `${legacyFallbackCount} image(s) used legacy upload fallback. Upload completed successfully.`
        );
      }
    } catch (error) {
      console.error("Image upload failed", error);
      alert("Failed to upload images. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (
    index: number,
    onUrlImgUpdate: (next: string) => void
  ) => {
    setImages((prev) => {
      const next = prev.filter((_, i) => i !== index);
      onUrlImgUpdate(next[0] ?? "");
      return next;
    });
  };

  const handleDragStart = (index: number) => setDraggedIndex(index);

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

  const handleDrop = (
    dropIndex: number,
    onUrlImgUpdate: (next: string) => void
  ) => {
    if (draggedIndex === null) return;
    setImages((prev) => {
      const next = [...prev];
      const [dragged] = next.splice(draggedIndex, 1);
      next.splice(dropIndex, 0, dragged);
      onUrlImgUpdate(next[0] ?? "");
      return next;
    });
    setDraggedIndex(null);
  };

  const handleSideImageUpload = async (
    side: SideKey,
    file: File,
    onResolved: (side: SideKey, fileName: string) => void
  ) => {
    const err = validateImageFile(file);
    if (err) { alert(err); return; }

    setUploadingStates((prev) => ({ ...prev, [side]: true }));
    try {
      const uploadResult = await imageService.uploadImageDetailed(file);
      onResolved(side, uploadResult.fileName);

      if (uploadResult.source === "legacy") {
        console.warn(`${side} upload used legacy fallback.`);
      }
    } catch (error) {
      console.error(`Failed to upload ${side} image`, error);
      alert(`Failed to upload ${side} image. Please try again.`);
    } finally {
      setUploadingStates((prev) => ({ ...prev, [side]: false }));
    }
  };

  return {
    images,
    setImages,
    uploading,
    uploadingStates,
    draggedIndex,
    validateImageFile,
    handleMultipleFilesChange,
    removeImage,
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleSideImageUpload,
  };
}
