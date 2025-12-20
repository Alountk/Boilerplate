"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { TagIcon, ArrowRightIcon } from "@heroicons/react/24/outline";
import { Videogame } from "../domain/models/Videogame";
import { VideogameService } from "../infrastructure/services/VideogameService";
import { useAuth } from "../context/AuthContext";
import VideogameCard from "../components/VideogameCard";

const CATEGORIES = [
  {
    id: "ps",
    name: "PlayStation",
    color: "bg-blue-600",
    img: "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?auto=format&fit=crop&q=80&w=400",
    subcategories: ["Videogames", "Accessories", "Merchandising"],
  },
  {
    id: "xbox",
    name: "Xbox",
    color: "bg-green-600",
    img: "https://images.unsplash.com/photo-1605901309584-818e25960a8f?auto=format&fit=crop&q=80&w=400",
    subcategories: ["Videogames", "Accessories", "Merchandising"],
  },
  {
    id: "nintendo",
    name: "Nintendo",
    color: "bg-red-600",
    img: "https://images.unsplash.com/photo-1595166180155-23c3479ecc38?auto=format&fit=crop&q=80&w=400",
    subcategories: ["Videogames", "Accessories", "Merchandising"],
  },
  {
    id: "pc",
    name: "PC Gaming",
    color: "bg-gray-800",
    img: "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&q=80&w=400",
    subcategories: ["Hardware", "Games", "Peripherals"],
  },
  {
    id: "retro",
    name: "Retro Gaming",
    color: "bg-yellow-600",
    img: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=400",
    subcategories: ["Consoles", "Arcade", "Collectibles"],
  },
];

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
    <div className="max-w-7xl mx-auto px-4 py-8 bg-white dark:bg-gray-900 transition-colors duration-300">
      {/* Hero Section */}
      <section className="mb-12 bg-linear-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-8 md:p-12 border border-blue-100 dark:border-gray-800 flex flex-col md:flex-row items-center gap-8">
        <div className="flex-1 text-center md:text-left">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-4 leading-tight text-pretty">
            The Ultimate{" "}
            <span className="text-blue-600 italic">Marketplace</span> for Gamers
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-lg">
            Buy, sell, and trade your favorite videogames, accessories, and
            merchandising. Build your perfect collection today.
          </p>
          <div className="flex flex-wrap gap-4 justify-center md:justify-start">
            <Link
              href="#"
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-full transition-all flex items-center gap-2 shadow-lg shadow-blue-500/25"
            >
              Start Shopping <ArrowRightIcon className="h-5 w-5" />
            </Link>
            <Link
              href="/create"
              className="px-8 py-3 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-bold rounded-full border-2 border-gray-200 dark:border-gray-700 transition-all flex items-center gap-2"
            >
              <TagIcon className="h-5 w-5" /> Sell an Item
            </Link>
          </div>
        </div>
        <div className="flex-1 w-full max-w-md">
          <div className="relative group">
            <div className="absolute inset-0 bg-blue-500 blur-3xl opacity-10 group-hover:opacity-20 transition-opacity"></div>
            <img
              src="https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=800"
              alt="Gaming Scene"
              className="rounded-2xl shadow-2xl relative z-10 transform group-hover:scale-[1.02] transition-transform duration-500"
            />
          </div>
        </div>
      </section>

      {/* Category Grid */}
      <section className="mb-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Shop by Category
          </h2>
          <Link
            href="#"
            className="text-blue-600 dark:text-blue-400 font-semibold hover:underline flex items-center gap-1"
          >
            Browse all categories <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {CATEGORIES.map((cat) => (
            <div
              key={cat.id}
              className="group bg-white dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300"
            >
              <div className="h-40 overflow-hidden relative">
                <img
                  src={cat.img}
                  alt={cat.name}
                  className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent"></div>
                <h3 className="absolute bottom-4 left-4 text-xl font-bold text-white uppercase tracking-wider">
                  {cat.name}
                </h3>
              </div>
              <div className="p-4">
                <ul className="space-y-2">
                  {cat.subcategories.map((sub) => (
                    <li key={sub}>
                      <Link
                        href="#"
                        className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 flex items-center justify-between group/link"
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
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">
          Recently Added Items
        </h2>
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="aspect-3/4 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse border border-gray-100 dark:border-gray-700"
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
              <div className="col-span-full py-12 text-center bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700">
                <p className="text-gray-500 dark:text-gray-400">
                  No items found in the marketplace. Be the first to sell!
                </p>
                <Link
                  href="/create"
                  className="text-blue-600 dark:text-blue-400 font-bold hover:underline mt-2 inline-block"
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
