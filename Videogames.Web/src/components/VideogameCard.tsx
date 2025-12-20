import { Videogame } from "../domain/models/Videogame";
import { TrashIcon, HeartIcon } from "@heroicons/react/24/outline";
import { StarIcon } from "@heroicons/react/24/solid";

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
    <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-300 group flex flex-col h-full">
      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden bg-gray-100 dark:bg-gray-900">
        <img
          src={
            videogame.urlImg || "https://via.placeholder.com/300?text=No+Image"
          }
          alt={videogame.englishName}
          className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
        />
        <button className="absolute top-2 right-2 p-1.5 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full text-gray-600 dark:text-gray-400 hover:text-red-500 transition-colors">
          <HeartIcon className="h-5 w-5" />
        </button>
        {videogame.state === 0 && (
          <span className="absolute top-2 left-2 px-2 py-0.5 bg-green-600 text-white text-[10px] font-bold uppercase rounded shadow-sm">
            Sealed
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-3 flex flex-col flex-1">
        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-2 min-h-[40px] mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {videogame.englishName}
        </h3>

        <div className="flex items-center gap-1 mb-2">
          <StarIcon className="h-3 w-3 text-yellow-500" />
          <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
            {videogame.score.toFixed(1)}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-500">
            • {videogame.console}
          </span>
        </div>

        <div className="mt-auto">
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-bold text-gray-900 dark:text-white">
              ${videogame.ownPrice.toFixed(2)}
            </span>
            {videogame.averagePrice > videogame.ownPrice && (
              <span className="text-xs text-gray-500 line-through">
                ${videogame.averagePrice.toFixed(2)}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                isGoodCondition
                  ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                  : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
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
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
