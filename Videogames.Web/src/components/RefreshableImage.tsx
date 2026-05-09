"use client";

import { useEffect, useMemo, useState } from "react";
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
  const [resolvedSrc, setResolvedSrc] = useState(() =>
    resolveVideogameImageSrc(imageValue, type) ?? fallbackSrc
  );
  const [hasTriedRefresh, setHasTriedRefresh] = useState(false);

  useEffect(() => {
    setResolvedSrc(resolveVideogameImageSrc(imageValue, type) ?? fallbackSrc);
    setHasTriedRefresh(false);
  }, [imageValue, type, fallbackSrc]);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={resolvedSrc}
      alt={alt}
      className={className}
      onError={() => {
        if (hasTriedRefresh) {
          setResolvedSrc(fallbackSrc);
          return;
        }

        const fileName = extractStoredImageFileName(imageValue, type);
        if (!fileName) {
          setResolvedSrc(fallbackSrc);
          setHasTriedRefresh(true);
          return;
        }

        setHasTriedRefresh(true);
        void imageService.refreshImageAccessUrl(fileName).then((refreshedUrl) => {
          if (refreshedUrl) {
            setResolvedSrc(refreshedUrl);
            return;
          }
          setResolvedSrc(fallbackSrc);
        });
      }}
    />
  );
}
