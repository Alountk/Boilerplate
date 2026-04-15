"use client";

import { useMemo, useState } from "react";
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
  const candidatesKey = useMemo(() => candidates.join("|"), [candidates]);
  const [state, setState] = useState(() => ({
    key: candidatesKey,
    failedSources: new Set<string>(),
  }));

  const runtimeState = state.key === candidatesKey
    ? state
    : { key: candidatesKey, failedSources: new Set<string>() };

  const currentSrc = candidates.find(
    (src) => !runtimeState.failedSources.has(src)
  );

  if (!currentSrc) {
    return (
      <div
        className={`${fallbackClassName} flex items-center justify-center p-4 bg-surface-container-low text-on-surface`}
        aria-label={alt ?? title}
      >
        <div className="w-full max-w-[90%]">
          <p className="text-sm md:text-base font-black tracking-tight leading-tight wrap-anywhere line-clamp-6 text-center">
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
        setState((prev) => {
          const prevKeyState = prev.key === candidatesKey
            ? prev
            : { key: candidatesKey, failedSources: new Set<string>() };

          const nextFailed = new Set(prevKeyState.failedSources);
          nextFailed.add(currentSrc);
          return {
            key: candidatesKey,
            failedSources: nextFailed,
          };
        });
      }}
    />
  );
}
