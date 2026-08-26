"use client";

import { useEffect, useMemo, useState } from "react";
import { ImageService } from "../infrastructure/services/ImageService";
import {
  extractStoredImageFileName,
  getVideogameImageCandidates,
  resolveVideogameImageSrc,
} from "../utils/videogameImages";

const IMAGE_LOAD_TIMEOUT_MS = 10000;

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
  const imageService = useMemo(() => new ImageService(), []);
  const candidates = getVideogameImageCandidates({ images, urlImg });
  const candidatesKey = candidates.join("|");
  const refreshTargets = useMemo(() => {
    const firstUploaded = images?.[0] ?? null;
    const uploadedFileName = extractStoredImageFileName(firstUploaded, "filename");
    const uploadedResolvedSrc = resolveVideogameImageSrc(firstUploaded, "filename");

    const urlImgFileName = extractStoredImageFileName(urlImg, "filename");
    const urlImgResolvedSrc = resolveVideogameImageSrc(urlImg, "filename");

    return [
      uploadedFileName && uploadedResolvedSrc
        ? { fileName: uploadedFileName, src: uploadedResolvedSrc }
        : null,
      urlImgFileName && urlImgResolvedSrc
        ? { fileName: urlImgFileName, src: urlImgResolvedSrc }
        : null,
    ].filter((entry): entry is { fileName: string; src: string } => Boolean(entry));
  }, [images, urlImg]);

  const [coverLoadState, setCoverLoadState] = useState(() => ({
    key: candidatesKey,
    failedSources: new Set<string>(),
    refreshedFileNames: new Set<string>(),
    isLoading: true,
    nonce: 0,
  }));

  const runtimeState = coverLoadState.key === candidatesKey
    ? coverLoadState
    : {
      key: candidatesKey,
      failedSources: new Set<string>(),
      refreshedFileNames: new Set<string>(),
      isLoading: true,
      nonce: 0,
    };

  const currentSrc = candidates.find(
    (src) => !runtimeState.failedSources.has(src)
  );

  useEffect(() => {
    if (!currentSrc) return;

    const timeoutId = window.setTimeout(() => {
      setCoverLoadState((prev) => {
        const prevKeyState = prev.key === candidatesKey
          ? prev
          : {
            key: candidatesKey,
            failedSources: new Set<string>(),
            refreshedFileNames: new Set<string>(),
            isLoading: true,
            nonce: 0,
          };

        if (prevKeyState.failedSources.has(currentSrc)) {
          return prevKeyState;
        }

        const nextFailed = new Set(prevKeyState.failedSources);
        nextFailed.add(currentSrc);
        return {
          key: candidatesKey,
          failedSources: nextFailed,
          refreshedFileNames: prevKeyState.refreshedFileNames,
          isLoading: false,
          nonce: prevKeyState.nonce,
        };
      });
    }, IMAGE_LOAD_TIMEOUT_MS);

    return () => window.clearTimeout(timeoutId);
  }, [candidatesKey, currentSrc]);

  if (!currentSrc) {
    return (
      <div
        className={`${fallbackClassName} flex items-center justify-center p-4 bg-surface-1 text-on-surface`}
        aria-label={alt ?? title}
      >
        <div className="w-full max-w-[90%] flex flex-col items-center gap-3">
          <p className="text-sm md:text-base font-black tracking-tight leading-tight wrap-anywhere line-clamp-6 text-center">
            {title}
          </p>
          {candidates.length > 0 && (
            <button
              type="button"
              className="px-3 py-1.5 rounded-lg border border-outline text-xs font-semibold tracking-wide uppercase hover:bg-surface-1/40"
              onClick={() => {
                setCoverLoadState({
                  key: candidatesKey,
                  failedSources: new Set<string>(),
                  refreshedFileNames: new Set<string>(),
                  isLoading: true,
                  nonce: Date.now(),
                });
              }}
            >
              Retry image
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {runtimeState.isLoading && (
        <div className="absolute inset-0 animate-pulse bg-surface-1" aria-hidden="true" />
      )}

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        key={`${currentSrc}|${runtimeState.nonce}`}
        src={currentSrc}
        alt={alt ?? title}
        className={imgClassName}
        onLoad={() => {
          setCoverLoadState((prev) => {
            const prevKeyState = prev.key === candidatesKey
              ? prev
              : {
                key: candidatesKey,
                failedSources: new Set<string>(),
                refreshedFileNames: new Set<string>(),
                isLoading: true,
                nonce: 0,
              };

            return {
              key: candidatesKey,
              failedSources: prevKeyState.failedSources,
              refreshedFileNames: prevKeyState.refreshedFileNames,
              isLoading: false,
              nonce: prevKeyState.nonce,
            };
          });
        }}
        onError={() => {
          const refreshTarget = refreshTargets.find((entry) => entry.src === currentSrc);

          if (
            refreshTarget &&
            !runtimeState.refreshedFileNames.has(refreshTarget.fileName)
          ) {
            setCoverLoadState((prev) => {
              const prevKeyState = prev.key === candidatesKey
                ? prev
                : {
                  key: candidatesKey,
                  failedSources: new Set<string>(),
                  refreshedFileNames: new Set<string>(),
                  isLoading: true,
                  nonce: 0,
                };

              const nextRefreshed = new Set(prevKeyState.refreshedFileNames);
              nextRefreshed.add(refreshTarget.fileName);
              return {
                key: candidatesKey,
                failedSources: prevKeyState.failedSources,
                refreshedFileNames: nextRefreshed,
                isLoading: true,
                nonce: prevKeyState.nonce,
              };
            });

            void imageService
              .refreshImageAccessUrl(refreshTarget.fileName)
              .then((refreshedAccessUrl) => {
                setCoverLoadState((prev) => {
                  const prevKeyState = prev.key === candidatesKey
                    ? prev
                    : {
                      key: candidatesKey,
                      failedSources: new Set<string>(),
                      refreshedFileNames: new Set<string>(),
                      isLoading: true,
                      nonce: 0,
                    };

                  if (refreshedAccessUrl) {
                    const nextFailed = new Set(prevKeyState.failedSources);
                    nextFailed.delete(currentSrc);
                    return {
                      key: candidatesKey,
                      failedSources: nextFailed,
                      refreshedFileNames: prevKeyState.refreshedFileNames,
                      isLoading: true,
                      nonce: Date.now(),
                    };
                  }

                  const nextFailed = new Set(prevKeyState.failedSources);
                  nextFailed.add(currentSrc);
                  return {
                    key: candidatesKey,
                    failedSources: nextFailed,
                    refreshedFileNames: prevKeyState.refreshedFileNames,
                    isLoading: false,
                    nonce: prevKeyState.nonce,
                  };
                });
              });

            return;
          }

          setCoverLoadState((prev) => {
            const prevKeyState = prev.key === candidatesKey
              ? prev
              : {
                key: candidatesKey,
                failedSources: new Set<string>(),
                refreshedFileNames: new Set<string>(),
                isLoading: true,
                nonce: 0,
              };

            const nextFailed = new Set(prevKeyState.failedSources);
            nextFailed.add(currentSrc);
            return {
              key: candidatesKey,
              failedSources: nextFailed,
              refreshedFileNames: prevKeyState.refreshedFileNames,
              isLoading: false,
              nonce: prevKeyState.nonce,
            };
          });
        }}
      />
    </div>
  );
}
