"use client";

import { PhotoIcon } from "@heroicons/react/24/outline";
import { resolveVideogameImageSrc } from "../../utils/videogameImages";

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
      <label className="block text-xs font-bold tracking-widest uppercase text-primary mb-4">
        Game Gallery
      </label>
      <div className="grid grid-cols-2 gap-4 h-[400px]">
        {/* Main drop zone */}
        <div
          className="relative group cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed border-outline-variant/30 hover:border-primary/50 transition-all bg-surface-container-low flex items-center justify-center col-span-2 row-span-1"
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDropZoneDrop}
        >
          <label className="cursor-pointer w-full h-full flex items-center justify-center">
            <div className="text-center p-8">
              <PhotoIcon className="mx-auto mb-3 h-10 w-10 text-primary" aria-hidden="true" />
              <p className="text-sm font-medium text-on-surface">Upload game photos</p>
              <p className="text-xs text-on-surface-variant mt-1">PNG, JPG up to 5MB each</p>
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
            className="relative group cursor-move overflow-hidden rounded-xl border border-outline-variant/10 hover:border-primary/50 transition-all bg-surface-container-highest flex items-center justify-center"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={resolveVideogameImageSrc(img) ?? ""}
              alt={`Game image ${index + 1}`}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23222a3d' width='100' height='100'/%3E%3C/svg%3E";
              }}
            />
            <button
              type="button"
              onClick={() => onRemove(index)}
              aria-label={`Remove image ${index + 1}`}
              className="absolute top-1 right-1 bg-error hover:brightness-110 text-on-error rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
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
        <div className="flex items-center gap-2 text-primary text-sm font-medium" role="status">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" aria-hidden="true" />
          Uploading...
        </div>
      )}
      {ocrLoading && (
        <div className="flex items-center gap-2 text-primary text-sm font-medium" role="status">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" aria-hidden="true" />
          Analizando portada con OCR...
        </div>
      )}
      {ocrMessage && (
        <p className="text-xs text-on-surface-variant bg-surface-container-high rounded-lg px-3 py-2 border border-outline-variant/20" role="status">
          {ocrMessage}
        </p>
      )}
      {images.length > 3 && (
        <p className="text-xs text-on-surface-variant">
          +{images.length - 3} more image{images.length - 3 !== 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}
