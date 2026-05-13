"use client";

import { useMemo, useState } from "react";
import { ImageService } from "../infrastructure/services/ImageService";
import {
  extractStoredImageFileName,
  resolveVideogameImageSrc,
  VideogameImageValueType,
} from "../utils/videogameImages";

const DEFAULT_FALLBACK_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23222a3d' width='100' height='100'/%3E%3C/svg%3E";

interface RefreshableImageProps {
  imageValue?: string | null;
  alt: string;
  className?: string;
  type?: VideogameImageValueType;
  fallbackSrc?: string;
}

export default function RefreshableImage({
  imageValue,
  alt,
  className,
  type = "filename",
  fallbackSrc = DEFAULT_FALLBACK_IMAGE,
}: RefreshableImageProps) {
  const imageService = useMemo(() => new ImageService(), []);
  const sourceKey = `${type}:${imageValue ?? ""}:${fallbackSrc}`;
  const baseResolvedSrc = resolveVideogameImageSrc(imageValue, type) ?? fallbackSrc;

  const [refreshState, setRefreshState] = useState(() => ({
    sourceKey,
    resolvedSrc: baseResolvedSrc,
    hasTriedRefresh: false,
  }));

  const viewState =
    refreshState.sourceKey === sourceKey
      ? refreshState
      : {
          sourceKey,
          resolvedSrc: baseResolvedSrc,
          hasTriedRefresh: false,
        };

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={viewState.resolvedSrc}
      alt={alt}
      className={className}
      onError={() => {
        if (viewState.hasTriedRefresh) {
          setRefreshState((prev) =>
            prev.sourceKey === sourceKey ? { ...prev, resolvedSrc: fallbackSrc } : prev
          );
          return;
        }

        const fileName = extractStoredImageFileName(imageValue, type);
        if (!fileName) {
          setRefreshState((prev) =>
            prev.sourceKey === sourceKey
              ? { ...prev, resolvedSrc: fallbackSrc, hasTriedRefresh: true }
              : prev
          );
          return;
        }

        setRefreshState((prev) =>
          prev.sourceKey === sourceKey ? { ...prev, hasTriedRefresh: true } : prev
        );
        void imageService.refreshImageAccessUrl(fileName).then((refreshedUrl) => {
          setRefreshState((prev) => {
            if (prev.sourceKey !== sourceKey) return prev;
            return {
              ...prev,
              resolvedSrc: refreshedUrl ?? fallbackSrc,
            };
          });
        });
      }}
    />
  );
}
