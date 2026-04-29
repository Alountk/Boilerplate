import { TrashIcon, HeartIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { StarIcon } from "@heroicons/react/24/solid";
import { Videogame } from "../domain/models/Videogame";
import VideogameCover from "./VideogameCover";

interface VideogameCardProps {
  videogame: Videogame;
  onDelete?: (id: string) => void;
  isAuthenticated: boolean;
}

export default function VideogameCard({
  videogame,
  onDelete,
  isAuthenticated,
}: VideogameCardProps) {
  const isGoodCondition = videogame.generalState >= 8;

  return (
    <Link 
      href={`/product/${videogame.id}`}
      className="bg-surface-container rounded-xl overflow-hidden border border-outline-variant/20 hover:border-primary/40 transition-colors group flex flex-col h-full"
    >
      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden bg-surface-container-lowest">
        <VideogameCover
          title={videogame.englishName}
          images={videogame.images}
          urlImg={videogame.urlImg}
          imgClassName="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
          fallbackClassName="w-full h-full"
        />
        <button
          type="button"
          aria-label={`Add ${videogame.englishName} to favorites`}
          className="absolute top-2 right-2 min-w-11 min-h-11 flex items-center justify-center bg-surface-container/80 backdrop-blur-sm rounded-full text-on-surface-variant hover:text-error transition-colors"
        >
          <HeartIcon className="h-5 w-5" />
        </button>
        {videogame.state === 0 && (
          <span className="absolute top-2 left-2 px-2 py-0.5 bg-tertiary-container text-on-tertiary-container text-xs font-semibold uppercase rounded">
            Sealed
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-3 flex flex-col flex-1">
        <h3 className="text-sm font-medium text-on-surface line-clamp-2 min-h-10 mb-1 group-hover:text-on-surface-variant transition-colors">
          {videogame.englishName}
        </h3>

        <div className="flex items-center gap-1 mb-2">
          <StarIcon className="h-3 w-3 text-yellow-500" />
          <span className="text-xs font-semibold text-on-surface">
            {videogame.score.toFixed(1)}
          </span>
          <span className="text-xs text-on-surface-variant">
            • {videogame.console}
          </span>
        </div>

        <div className="mt-auto">
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-bold text-on-surface">
              ${videogame.ownPrice.toFixed(2)}
            </span>
            {videogame.averagePrice > videogame.ownPrice && (
              <span className="text-xs text-outline line-through">
                ${videogame.averagePrice.toFixed(2)}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between mt-2 pt-2 border-t border-outline-variant/20">
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded uppercase ${
                isGoodCondition
                  ? "bg-tertiary-container/30 text-on-tertiary-container"
                  : "bg-surface-container-high text-on-surface-variant"
              }`}
            >
              Condition: {videogame.generalState}/10
            </span>

            {isAuthenticated && onDelete && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  onDelete(videogame.id);
                }}
                className="min-w-11 min-h-11 flex items-center justify-center text-error hover:bg-error/10 rounded-md transition-colors"
                title="Delete listing"
                aria-label={`Delete listing ${videogame.englishName}`}
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
