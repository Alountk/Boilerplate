import { TrashIcon, HeartIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { StarIcon } from "@heroicons/react/24/solid";
import { Videogame } from "../domain/models/Videogame";

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
      className="bg-white dark:bg-slate-900 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-colors group flex flex-col h-full"
    >
      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden bg-slate-100 dark:bg-slate-950">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={videogame.urlImg || "/placeholder-game.jpg"}
          alt={videogame.englishName}
          className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
        />
        <button
          type="button"
          aria-label={`Add ${videogame.englishName} to favorites`}
          className="absolute top-2 right-2 p-1.5 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-full text-slate-600 dark:text-slate-300 hover:text-red-500 transition-colors"
        >
          <HeartIcon className="h-5 w-5" />
        </button>
        {videogame.state === 0 && (
          <span className="absolute top-2 left-2 px-2 py-0.5 bg-emerald-600 text-white text-[10px] font-semibold uppercase rounded">
            Sealed
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-3 flex flex-col flex-1">
        <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100 line-clamp-2 min-h-10 mb-1 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors">
          {videogame.englishName}
        </h3>

        <div className="flex items-center gap-1 mb-2">
          <StarIcon className="h-3 w-3 text-yellow-500" />
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            {videogame.score.toFixed(1)}
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            • {videogame.console}
          </span>
        </div>

        <div className="mt-auto">
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-bold text-slate-900 dark:text-slate-100">
              ${videogame.ownPrice.toFixed(2)}
            </span>
            {videogame.averagePrice > videogame.ownPrice && (
              <span className="text-xs text-slate-500 line-through">
                ${videogame.averagePrice.toFixed(2)}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span
              className={`text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase ${
                isGoodCondition
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                  : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
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
                className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
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
