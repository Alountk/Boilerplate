"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { Videogame } from "../domain/models/Videogame";
import { VideogameService } from "../infrastructure/services/VideogameService";
import { useAuth } from "../context/AuthContext";
import VideogameCard from "../components/VideogameCard";
import { ArchiveBoxIcon, ArrowRightIcon } from "@heroicons/react/24/outline";

import { CATEGORIES } from "../constants/categories";

const PAGE_SIZE = 12;

export default function Home() {
  const [videogames, setVideogames] = useState<Videogame[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const { isAuthenticated } = useAuth();
  const [videogameService] = useState(() => new VideogameService());
  const sentinelRef = useRef<HTMLDivElement>(null);
  const isFetchingRef = useRef(false);

  const loadPage = useCallback(
    async (pageNum: number, replace = false) => {
      if (isFetchingRef.current) return;
      isFetchingRef.current = true;

      try {
        const result = await videogameService.getPaged(pageNum, PAGE_SIZE);
        setVideogames((prev) => (replace ? result.items : [...prev, ...result.items]));
        setHasMore(result.hasMore);
        setPage(pageNum);
      } catch (error) {
        console.error("Failed to load videogames", error);
      } finally {
        isFetchingRef.current = false;
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [videogameService]
  );

  // Initial load
  useEffect(() => {
    loadPage(1, true);
  }, [loadPage]);

  // IntersectionObserver sentinel
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isFetchingRef.current) {
          setLoadingMore(true);
          loadPage(page + 1);
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, page, loadPage]);

  const handleDelete = useCallback(
    async (id: string) => {
      if (confirm("Are you sure you want to delete this listing?")) {
        try {
          await videogameService.delete(id);
          // Reload from page 1 to keep state consistent
          setLoading(true);
          setVideogames([]);
          setHasMore(true);
          loadPage(1, true);
        } catch (error) {
          console.error("Failed to delete videogame", error);
        }
      }
    },
    [loadPage, videogameService]
  );

  return (
    <div className="min-h-screen bg-surface text-on-surface">
      {/* ─── Hero ─────────────────────────────────────── */}
      <section className="relative w-full h-[614px] flex items-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=2000&q=80"
            alt="Neon gaming setup with monitors and controller"
            className="w-full h-full object-cover opacity-30 grayscale"
          />
          <div className="absolute inset-0 bg-linear-to-t from-surface via-surface/60 to-transparent" />
        </div>
        <div className="relative z-10 px-8 md:px-24 max-w-4xl w-full">
          <span className="text-primary-fixed uppercase tracking-[0.3em] font-bold text-xs mb-4 block">
            Gamer Marketplace
          </span>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter text-on-surface leading-none mb-6">
            Find your next{" "}
            <br />
            <span className="text-transparent bg-clip-text bg-linear-to-r from-primary-container to-primary">
              Legendary Game.
            </span>
          </h1>
          <p className="text-on-surface-variant text-lg max-w-xl mb-10 leading-relaxed">
            Buy and sell retro titles, modern hits, limited editions, consoles, and gaming accessories in one trusted marketplace.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href="#recently-added"
              className="bg-primary-container text-on-primary-container px-8 py-4 rounded-xl font-bold flex items-center gap-3 hover:opacity-90 transition-all"
            >
              Explore Collection
              <ArrowRightIcon className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Categories ───────────────────────────────── */}
      {/* ─── Categories ───────────────────────────────── */}
      <section className="px-8 md:px-12 py-20 max-w-[1440px] mx-auto">
        <div className="flex justify-between items-end mb-10">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-on-surface">Browse Platforms</h2>
            <p className="text-on-surface-variant mt-2">Find games by console</p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.id}
              href={`/category/${cat.id}`}
              className="group relative rounded-2xl overflow-hidden aspect-3/4 bg-surface-container block"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={cat.img}
                alt={cat.name}
                className="absolute inset-0 w-full h-full object-cover opacity-50 grayscale transition-all duration-500 group-hover:opacity-80 group-hover:grayscale-0 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-linear-to-t from-surface via-surface/40 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5">
                <h3 className="text-base font-black uppercase tracking-widest text-on-surface leading-tight">
                  {cat.name}
                </h3>
                <p className="text-xs text-primary font-bold mt-1.5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  Explore <ArrowRightIcon className="h-3 w-3" />
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ─── Recently Added ───────────────────────────── */}
      <section id="recently-added" className="px-8 md:px-12 py-12 max-w-[1440px] mx-auto">
        <h2 className="text-3xl font-bold tracking-tight text-on-surface mb-2">Recently Added</h2>
        <p className="text-on-surface-variant mb-12">Fresh listings from the community right now.</p>

        {/* Initial skeleton */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8">
            {Array.from({ length: PAGE_SIZE }).map((_, i) => (
              <div key={i} className="aspect-3/4 bg-surface-container rounded-xl animate-pulse" />
            ))}
          </div>
        ) : videogames.length === 0 ? (
          <div className="py-20 text-center bg-surface-container-low rounded-2xl" role="status">
            <ArchiveBoxIcon className="mx-auto mb-4 h-12 w-12 text-outline" />
            <p className="text-on-surface-variant mb-4">No videogames listed yet. Be the first to publish one.</p>
            <Link
              href="/create"
              className="bg-primary-container text-on-primary-container px-6 py-2.5 rounded-xl font-bold text-sm inline-block hover:opacity-90 transition-all"
            >
              List an item now
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-8 gap-y-12">
              {videogames.map((game) => (
                <VideogameCard
                  key={game.id}
                  videogame={game}
                  isAuthenticated={isAuthenticated}
                  onDelete={handleDelete}
                />
              ))}
            </div>

            {/* Load-more skeleton — shown while fetching next page */}
            {loadingMore && (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-8 gap-y-12 mt-12">
                {Array.from({ length: PAGE_SIZE }).map((_, i) => (
                  <div key={i} className="aspect-3/4 bg-surface-container rounded-xl animate-pulse" />
                ))}
              </div>
            )}

            {/* Sentinel: IntersectionObserver target */}
            {hasMore && (
              <div ref={sentinelRef} className="h-1 mt-8" aria-hidden="true" />
            )}

            {!hasMore && videogames.length > 0 && (
              <p className="text-center text-on-surface-variant/50 text-sm mt-16">
                You&apos;ve seen all listings.
              </p>
            )}
          </>
        )}
      </section>

      {/* ─── Newsletter CTA ───────────────────────────── */}
      <section className="my-16 mx-8 md:mx-12 p-12 md:p-16 rounded-3xl bg-linear-to-br from-surface-container-low to-surface relative overflow-hidden flex flex-col md:flex-row items-center gap-12">
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-primary-container/10 rounded-full blur-[100px]" />
        <div className="relative z-10 flex-1">
          <h2 className="text-4xl font-black tracking-tighter mb-4">Stay in the Loop.</h2>
          <p className="text-on-surface-variant max-w-md">
            Get weekly updates about hot listings, price drops, and newly published games.
          </p>
        </div>
        <div className="relative z-10 w-full md:w-auto flex gap-4">
          {/* FEATURE-PENDING: newsletter subscription */}
          <input
            className="bg-surface-container-highest border-none rounded-xl px-6 py-4 w-full md:w-72 focus:ring-1 focus:ring-primary outline-none text-on-surface placeholder:text-outline/50"
            placeholder="Email address"
            type="email"
            disabled
          />
          <button disabled className="bg-on-surface text-surface font-bold px-6 py-4 rounded-xl opacity-60 cursor-not-allowed">
            Join
          </button>
        </div>
      </section>

      {/* ─── Footer ───────────────────────────────────── */}
      <footer className="w-full mt-8 tonal-architecture-shift">
        <div className="w-full px-8 md:px-12 py-12 flex flex-col md:flex-row justify-between items-center max-w-[1440px] mx-auto">
          <div className="mb-8 md:mb-0">
            <span className="text-on-surface font-black italic text-xl">vMarket</span>
            <p className="text-on-surface-variant mt-2 text-xs opacity-80">
              © {new Date().getFullYear()} vMarket. The gamer marketplace.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-8">
            {/* FEATURE-PENDING: footer pages */}
            <span className="text-on-surface-variant opacity-60 text-sm">Privacy Policy</span>
            <span className="text-on-surface-variant opacity-60 text-sm">Terms</span>
            <span className="text-on-surface-variant opacity-60 text-sm">Support</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
