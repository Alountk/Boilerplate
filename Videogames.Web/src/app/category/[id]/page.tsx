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
        <h1 className="text-2xl font-bold mb-4 text-on-surface">Category not found</h1>
        <Link href="/" className="text-primary hover:underline">
          Return Home
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Breadcrumbs */}
      <nav className="mb-8 flex items-center gap-2 text-sm text-on-surface-variant">
        <Link href="/" className="hover:text-primary transition-colors">
          Home
        </Link>
        <span>/</span>
        <span className="font-semibold text-on-surface uppercase tracking-wide">
          {category.name}
        </span>
      </nav>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Filters */}
        <aside className="w-full md:w-64 shrink-0">
          <div className="sticky top-24">
            <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-4">
              <h2 className="text-lg font-semibold text-on-surface mb-5 border-b border-outline-variant/20 pb-3">
                {category.name}
              </h2>

              <div className="mb-7">
                <h3 className="text-xs font-semibold text-on-surface-variant mb-3 uppercase tracking-wider">
                  Categories
                </h3>
                <ul className="space-y-1.5">
                  {category.subcategories.map((sub) => (
                    <li key={sub}>
                      <button className="w-full rounded-lg px-2.5 py-1.5 text-left text-sm text-on-surface hover:bg-surface-container-highest hover:text-primary transition-colors">
                        {sub}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mb-7">
                <h3 className="text-xs font-semibold text-on-surface-variant mb-3 uppercase tracking-wider">
                  Condition
                </h3>
                <div className="space-y-2">
                  {["New", "Like New", "Very Good", "Good", "Acceptable"].map(
                    (cond) => (
                      <label
                        key={cond}
                        className="flex items-center gap-2 text-sm text-on-surface cursor-pointer hover:text-primary transition-colors"
                      >
                        <input
                          type="checkbox"
                          className="rounded border-outline-variant/60 accent-primary focus:ring-primary/40"
                        />
                        {cond}
                      </label>
                    )
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-semibold text-on-surface-variant mb-3 uppercase tracking-wider">
                  Price Range
                </h3>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Min"
                    className="w-full px-2.5 py-1.5 text-sm border border-outline-variant/40 rounded-lg bg-surface-container-highest text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-1 focus:ring-primary/40"
                  />
                  <span className="text-on-surface-variant">-</span>
                  <input
                    type="text"
                    placeholder="Max"
                    className="w-full px-2.5 py-1.5 text-sm border border-outline-variant/40 rounded-lg bg-surface-container-highest text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-1 focus:ring-primary/40"
                  />
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          {/* Header & Controls */}
          <div className="bg-surface-container p-4 rounded-2xl border border-outline-variant/20 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-on-surface">
                {category.name}
              </h1>
              <p className="text-sm text-on-surface-variant">
                {videogames.length} listings found
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center bg-surface-container-low rounded-xl p-1 border border-outline-variant/20">
                <button className="p-1.5 rounded-lg bg-surface-container-highest shadow-sm text-primary">
                  <Squares2X2Icon className="h-5 w-5" />
                </button>
                <button className="p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface transition-colors">
                  <ListBulletIcon className="h-5 w-5" />
                </button>
              </div>
              <select className="bg-surface-container-highest border border-outline-variant/40 rounded-xl px-3 py-1.5 text-sm font-medium text-on-surface focus:ring-2 focus:ring-primary/40 outline-none">
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
                  className="aspect-3/4 bg-surface-container rounded-xl animate-pulse border border-outline-variant/20"
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
            <div className="py-24 text-center bg-surface-container rounded-2xl border border-dashed border-outline-variant/40">
              <div className="max-w-sm mx-auto">
                <div className="bg-surface-container-highest w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Squares2X2Icon className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-on-surface mb-2">
                  No listings yet
                </h3>
                <p className="text-on-surface-variant mb-6">
                  Be the first to list a game in this category.
                </p>
                <Link
                  href="/create"
                  className="inline-flex items-center gap-2 px-6 py-2 indigo-gradient text-white font-semibold rounded-full transition-opacity hover:opacity-90"
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
