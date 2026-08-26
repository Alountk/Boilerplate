"use client";

import { PhotoIcon } from "@heroicons/react/24/outline";
import RefreshableImage from "../RefreshableImage";

interface ImageUploadZoneProps {
  images: string[];
  uploading: boolean;
  ocrLoading: boolean;
  ocrMessage: string | null;
  onFilesChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: (index: number) => void;
  onDragStart: (index: number) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (index: number) => void;
  onDropZoneDrop: (e: React.DragEvent) => void;
}

/**
 * Zona de arrastrar y soltar imágenes + miniaturas con reordenamiento.
 * Utilizada en la página de creación de videojuego.
 */
export function ImageUploadZone({
  images,
  uploading,
  ocrLoading,
  ocrMessage,
  onFilesChange,
  onRemove,
  onDragStart,
  onDragOver,
  onDrop,
  onDropZoneDrop,
}: ImageUploadZoneProps) {
  return (
    <div className="space-y-4">
      <label className="block text-xs font-bold tracking-widest uppercase text-secondary mb-4">
        Game Gallery
      </label>
      <div className="grid grid-cols-2 gap-4 h-[400px]">
        {/* Main drop zone */}
        <div
          className="relative group cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed border-outline hover:border-secondary transition-all bg-surface-1/40 flex items-center justify-center col-span-2 row-span-1"
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDropZoneDrop}
        >
          <label className="cursor-pointer w-full h-full flex items-center justify-center">
            <div className="text-center p-8">
              <PhotoIcon className="mx-auto mb-3 h-10 w-10 text-secondary" aria-hidden="true" />
              <p className="text-sm font-medium text-on-surface">Upload game photos</p>
              <p className="text-xs text-on-surface-muted mt-1">PNG, JPG up to 5MB each</p>
              <input
                id="imageUpload"
                type="file"
                accept="image/*"
                multiple
                onChange={onFilesChange}
                className="sr-only"
                disabled={uploading}
                aria-label="Upload game images"
              />
            </div>
          </label>
        </div>

        {/* Thumbnails */}
        {images.slice(0, 3).map((img, index) => (
          <div
            key={index}
            draggable
            onDragStart={() => onDragStart(index)}
            onDragOver={onDragOver}
            onDrop={() => onDrop(index)}
            className="relative group cursor-move overflow-hidden rounded-xl border border-outline hover:border-secondary transition-all bg-surface-2/60 flex items-center justify-center"
          >
            <RefreshableImage
              imageValue={img}
              alt={`Game image ${index + 1}`}
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={() => onRemove(index)}
              aria-label={`Remove image ${index + 1}`}
              className="absolute top-1 right-1 min-w-8 min-h-8 bg-error text-surface rounded-full p-1 transition-opacity focus:opacity-100 flex items-center justify-center"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      {/* Status messages */}
      {uploading && (
        <div className="flex items-center gap-2 text-secondary text-sm font-medium" role="status">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" aria-hidden="true" />
          Uploading...
        </div>
      )}
      {ocrLoading && (
        <div className="flex items-center gap-2 text-secondary text-sm font-medium" role="status">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" aria-hidden="true" />
          Analizando portada con OCR...
        </div>
      )}
      {ocrMessage && (
        <p className="text-xs text-on-surface-muted bg-surface-2/60 rounded-lg px-3 py-2 border border-outline" role="status">
          {ocrMessage}
        </p>
      )}
      {images.length > 3 && (
        <p className="text-xs text-on-surface-muted">
          +{images.length - 3} more image{images.length - 3 !== 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}
