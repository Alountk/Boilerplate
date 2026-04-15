"use client";

import { useEffect, useMemo, useState } from "react";
import { getVideogameImageCandidates } from "../utils/videogameImages";

interface VideogameCoverProps {
  title: string;
  images?: string[];
  urlImg?: string;
  alt?: string;
  imgClassName?: string;
  fallbackClassName?: string;
}

export default function VideogameCover({
  title,
  images,
  urlImg,
  alt,
  imgClassName = "w-full h-full object-cover",
  fallbackClassName = "w-full h-full",
}: VideogameCoverProps) {
  const candidates = useMemo(
    () => getVideogameImageCandidates({ images, urlImg }),
    [images, urlImg]
  );
  const [index, setIndex] = useState(0);
  const [showFallback, setShowFallback] = useState(candidates.length === 0);

  useEffect(() => {
    setIndex(0);
    setShowFallback(candidates.length === 0);
  }, [candidates]);

  const currentSrc = candidates[index];

  if (showFallback || !currentSrc) {
    return (
      <div
        className={`${fallbackClassName} flex items-center justify-center p-4 bg-surface-container-low text-on-surface`}
        aria-label={alt ?? title}
      >
        <div className="w-full max-w-[90%]">
          <p className="text-sm md:text-base font-black tracking-tight leading-tight [overflow-wrap:anywhere] line-clamp-6 text-center">
            {title}
          </p>
        </div>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={currentSrc}
      alt={alt ?? title}
      className={imgClassName}
      onError={() => {
        if (index + 1 < candidates.length) {
          setIndex(index + 1);
          return;
        }
        setShowFallback(true);
      }}
    />
  );
}
