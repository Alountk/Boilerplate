"use client";

import { useEffect, useState, useCallback, use } from "react";
import { Squares2X2Icon, ListBulletIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { CATEGORIES } from "../../../constants/categories";
import { Videogame } from "../../../domain/models/Videogame";
import { VideogameService } from "../../../infrastructure/services/VideogameService";
import { useAuth } from "../../../context/AuthContext";
import VideogameCard from "../../../components/VideogameCard";

export default function CategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [videogames, setVideogames] = useState<Videogame[]>([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuth();
  const [videogameService] = useState(() => new VideogameService());

  const category = CATEGORIES.find((c) => c.id === id);

  const loadVideogames = useCallback(async () => {
    if (!category) return;
    try {
      setLoading(true);
      const allGames = await videogameService.getAll();
      // Filter by categoryId (mapping categorical ID to back-end int)
      const filtered = allGames.filter(
        (g) => g.category === category.categoryId
      );
      setVideogames(filtered);
    } catch (error: unknown) {
      console.error("Failed to load videogames for category", error);
    } finally {
      setLoading(false);
    }
  }, [videogameService, category]);

  useEffect(() => {
    loadVideogames();
  }, [loadVideogames]);

  const handleDelete = useCallback(
    async (gameId: string) => {
      if (confirm("Are you sure you want to delete this listing?")) {
        try {
          await videogameService.delete(gameId);
          loadVideogames();
        } catch (error) {
          console.error("Failed to delete videogame", error);
        }
      }
    },
    [loadVideogames, videogameService]
  );

  if (!category) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold mb-4 text-slate-900 dark:text-slate-100">Category not found</h1>
        <Link href="/" className="text-[#285A48] dark:text-[#B0E4CC] hover:underline">
          Return Home
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 transition-colors duration-300">
      {/* Breadcrumbs */}
      <nav className="mb-8 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
        <Link href="/" className="hover:text-[#285A48] dark:hover:text-[#B0E4CC] transition-colors">
          Home
        </Link>
        <span>/</span>
        <span className="font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wide">
          {category.name}
        </span>
      </nav>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Filters */}
        <aside className="w-full md:w-64 shrink-0">
          <div className="sticky top-24">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/85 dark:bg-slate-900/80 backdrop-blur-sm p-4">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-5 border-b border-slate-200 dark:border-slate-800 pb-3">
                {category.name}
              </h2>

              <div className="mb-7">
                <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-3 uppercase tracking-wider">
                  Categories
                </h3>
                <ul className="space-y-1.5">
                  {category.subcategories.map((sub) => (
                    <li key={sub}>
                      <button className="w-full rounded-md px-2.5 py-1.5 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-[#B0E4CC]/35 dark:hover:bg-[#285A48]/40 hover:text-[#285A48] dark:hover:text-[#B0E4CC] transition-colors">
                        {sub}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mb-7">
                <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-3 uppercase tracking-wider">
                  Condition
                </h3>
                <div className="space-y-2">
                  {["New", "Like New", "Very Good", "Good", "Acceptable"].map(
                    (cond) => (
                      <label
                        key={cond}
                        className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer hover:text-[#285A48] dark:hover:text-[#B0E4CC] transition-colors"
                      >
                        <input
                          type="checkbox"
                          className="rounded border-slate-300 dark:border-slate-600 text-[#285A48] focus:ring-[#408A71]"
                        />
                        {cond}
                      </label>
                    )
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-3 uppercase tracking-wider">
                  Price Range
                </h3>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Min"
                    className="w-full px-2.5 py-1.5 text-sm border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200"
                  />
                  <span className="text-slate-400">-</span>
                  <input
                    type="text"
                    placeholder="Max"
                    className="w-full px-2.5 py-1.5 text-sm border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200"
                  />
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          {/* Header & Controls */}
          <div className="bg-white/88 dark:bg-slate-900/82 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 backdrop-blur-sm">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                {category.name}
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {videogames.length} listings found
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-1 border border-slate-200 dark:border-slate-700">
                <button className="p-1.5 rounded-md bg-white dark:bg-slate-700 shadow-sm text-[#285A48] dark:text-[#B0E4CC]">
                  <Squares2X2Icon className="h-5 w-5" />
                </button>
                <button className="p-1.5 rounded-md text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 transition-colors">
                  <ListBulletIcon className="h-5 w-5" />
                </button>
              </div>
              <select className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-[#408A71] outline-none">
                <option>Best Match</option>
                <option>Price: Low to High</option>
                <option>Price: High to Low</option>
                <option>Newly Listed</option>
              </select>
            </div>
          </div>

          {/* Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div
                  key={i}
                  className="aspect-3/4 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse border border-slate-200 dark:border-slate-700"
                ></div>
              ))}
            </div>
          ) : videogames.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {videogames.map((game) => (
                <VideogameCard
                  key={game.id}
                  videogame={game}
                  isAuthenticated={isAuthenticated}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          ) : (
            <div className="py-24 text-center bg-white/65 dark:bg-slate-900/45 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
              <div className="max-w-sm mx-auto">
                <div className="bg-[#B0E4CC]/55 dark:bg-[#285A48]/45 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Squares2X2Icon className="h-8 w-8 text-[#285A48] dark:text-[#B0E4CC]" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  No items found
                </h3>
                <p className="text-slate-500 dark:text-slate-400 mb-6">
                  There are currently no items listed in this category.
                </p>
                <Link
                  href="/create"
                  className="inline-flex items-center gap-2 px-6 py-2 bg-[#285A48] hover:bg-[#1f4739] dark:bg-[#408A71] dark:hover:bg-[#53a689] text-white font-semibold rounded-full transition-colors"
                >
                  Post your listing
                </Link>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
