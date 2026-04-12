"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { TagIcon, ArrowRightIcon } from "@heroicons/react/24/outline";
import { Videogame } from "../domain/models/Videogame";
import { VideogameService } from "../infrastructure/services/VideogameService";
import { useAuth } from "../context/AuthContext";
import VideogameCard from "../components/VideogameCard";

import { CATEGORIES } from "../constants/categories";

export default function Home() {
  const [videogames, setVideogames] = useState<Videogame[]>([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuth();
  const [videogameService] = useState(() => new VideogameService());

  const loadVideogames = useCallback(async () => {
    try {
      const data = await videogameService.getAll();
      setVideogames(data);
    } catch (error) {
      console.error("Failed to load videogames", error);
    } finally {
      setLoading(false);
    }
  }, [videogameService]);

  useEffect(() => {
    loadVideogames();
  }, [loadVideogames]);

  const handleDelete = useCallback(
    async (id: string) => {
      if (confirm("Are you sure you want to delete this listing?")) {
        try {
          await videogameService.delete(id);
          loadVideogames();
        } catch (error) {
          console.error("Failed to delete videogame", error);
        }
      }
    },
    [loadVideogames, videogameService]
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 md:py-10 transition-colors duration-300">
      {/* Hero Section */}
      <section className="mb-12 bg-white dark:bg-slate-900 rounded-2xl p-6 md:p-10 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center gap-8">
        <div className="flex-1 text-center md:text-left">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-slate-100 mb-4 leading-tight text-balance">
            Marketplace for gamers, built for real collectors
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-300 mb-8 max-w-xl">
            Buy, sell, and trade your favorite videogames, accessories, and
            merchandising. Build your perfect collection today.
          </p>
          <div className="flex flex-wrap gap-4 justify-center md:justify-start">
            <Link
              href="#"
              className="px-6 py-3 bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
            >
              Start Shopping <ArrowRightIcon className="h-5 w-5" />
            </Link>
            <Link
              href="/create"
              className="px-6 py-3 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold rounded-lg border border-slate-300 dark:border-slate-700 transition-colors flex items-center gap-2"
            >
              <TagIcon className="h-5 w-5" /> Sell an Item
            </Link>
          </div>
        </div>
        <div className="flex-1 w-full max-w-md">
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop"
              alt="Gaming setup 1"
              className="w-full h-full object-cover rounded-xl"
            />
          </div>
        </div>
      </section>

      {/* Category Grid */}
      <section className="mb-16">
        <div className="flex items-center justify-between mb-8 gap-3">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Shop by Category
          </h2>
          <Link
            href="#"
            className="text-slate-600 dark:text-slate-300 font-medium hover:text-slate-900 dark:hover:text-slate-100 hover:underline underline-offset-4 flex items-center gap-1"
          >
            Browse all categories <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {CATEGORIES.map((cat) => (
            <div
              key={cat.id}
              className="group bg-white dark:bg-slate-900 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
            >
              <Link
                href={`/category/${cat.id}`}
                className="block h-40 overflow-hidden relative group/img"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={cat.img}
                  alt={cat.name}
                  className="w-full h-full object-cover transform group-hover/img:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/55 to-transparent"></div>
                <h3 className="absolute bottom-4 left-4 text-xl font-bold text-white uppercase tracking-wider">
                  {cat.name}
                </h3>
              </Link>
              <div className="p-4">
                <ul className="space-y-2">
                  {cat.subcategories.map((sub) => (
                    <li key={sub}>
                      <Link
                        href={`/category/${cat.id}`}
                        className="text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 flex items-center justify-between group/link"
                      >
                        {sub}
                        <ArrowRightIcon className="h-3 w-3 opacity-0 group-hover/link:opacity-100 transform -translate-x-2 group-hover/link:translate-x-0 transition-all" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Items */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-8">
          Recently Added Items
        </h2>
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="aspect-3/4 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse border border-slate-200 dark:border-slate-700"
              ></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {videogames.map((game) => (
              <VideogameCard
                key={game.id}
                videogame={game}
                isAuthenticated={isAuthenticated}
                onDelete={handleDelete}
              />
            ))}
            {videogames.length === 0 && (
              <div className="col-span-full py-12 text-center bg-slate-50 dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700" role="status">
                <p className="text-slate-600 dark:text-slate-300">
                  No items found in the marketplace. Be the first to sell!
                </p>
                <Link
                  href="/create"
                  className="text-slate-900 dark:text-slate-100 font-semibold hover:underline mt-2 inline-block"
                >
                  List an item now
                </Link>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
