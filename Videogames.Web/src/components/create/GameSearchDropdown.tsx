"use client";

import Image from "next/image";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { RAWGGame } from "../../domain/ports/IRAWGService";

interface GameSearchDropdownProps {
  results: RAWGGame[];
  onSelect: (game: RAWGGame) => void;
  loading: boolean;
}

/**
 * Dropdown de resultados de búsqueda RAWG para el formulario de creación.
 * Componente presentacional puro — recibe resultados y notifica la selección.
 */
export function GameSearchDropdown({
  results,
  onSelect,
  loading,
}: GameSearchDropdownProps) {
  if (loading) {
    return (
      <div className="absolute z-50 w-full mt-2 bg-surface-1/60 rounded-lg shadow-2xl border border-outline top-full">
        <div className="flex items-center gap-3 p-4 text-on-surface-muted text-sm">
          <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
          Searching games...
        </div>
      </div>
    );
  }

  if (!results.length) return null;

  return (
    <div className="absolute z-50 w-full mt-2 bg-surface-1/60 rounded-lg shadow-2xl border border-outline max-h-60 overflow-y-auto top-full">
      {results.map((game) => (
        <button
          key={game.id}
          type="button"
          onClick={() => onSelect(game)}
          className="w-full flex items-center gap-3 p-3 hover:bg-surface-1/60-high text-left transition-colors border-b last:border-0 border-outline"
        >
          {game.background_image ? (
            <Image
              src={game.background_image}
              alt={game.name}
              width={48}
              height={48}
              className="w-12 h-12 object-cover rounded shadow-sm"
              unoptimized
            />
          ) : (
            <div className="w-12 h-12 bg-surface-1/60-high flex items-center justify-center rounded" aria-hidden="true">
              <MagnifyingGlassIcon className="h-4 w-4 text-outline" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="font-bold text-on-surface text-sm truncate">{game.name}</div>
            <div className="text-xs text-on-surface-muted">
              {game.released ? new Date(game.released).getFullYear() : "TBA"}
              {" · "}
              {game.platforms?.[0]?.platform.name ?? "Platform"}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
