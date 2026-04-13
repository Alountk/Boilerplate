"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Videogame } from "../domain/models/Videogame";
import { VideogameService } from "../infrastructure/services/VideogameService";
import { useAuth } from "../context/AuthContext";
import VideogameCard from "../components/VideogameCard";

import { CATEGORIES } from "../constants/categories";

const CATEGORY_ICONS = ["devices", "apparel", "chair", "watch", "auto_stories", "auto_awesome"];

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

  const archiveCategories = CATEGORIES.slice(0, 6).map((cat, index) => ({
    ...cat,
    icon: CATEGORY_ICONS[index] ?? "auto_awesome",
  }));

  return (
    <div className="min-h-screen bg-surface text-on-surface">
      {/* ─── Hero ─────────────────────────────────────── */}
      <section className="relative w-full h-[614px] flex items-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuApJdBiy1QMDWtKSSDJm3J5r8XHSoKyckcPsnqILeSGaB6fcGMJal8FTK08McueRbotPTgPCmdhHnkV_d40ngUPrUH9Le5hNQjc7L1lFHAWPw2-q1F0XyihpUISzizzHSPMHa01hum5tRiPNo0jNnHnUdi9BE-N310AZu_BhETX888NmG3mj3FKc86HHOO60h6wO3qvEj1TLzzVEAC_s6twfHu3onThu1CrLcCZSw0vB7fGeDk_ruwTMistNAN5ixIH4aV_S5YapVY"
            alt="Minimalist retro tech setup with atmospheric indigo lighting"
            className="w-full h-full object-cover opacity-30 grayscale"
          />
          <div className="absolute inset-0 bg-linear-to-t from-surface via-surface/60 to-transparent" />
        </div>
        <div className="relative z-10 px-8 md:px-24 max-w-4xl w-full">
          <span className="text-primary-fixed uppercase tracking-[0.3em] font-bold text-xs mb-4 block">
            Curated Excellence
          </span>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter text-on-surface leading-none mb-6">
            Discovery in the{" "}
            <br />
            <span className="text-transparent bg-clip-text bg-linear-to-r from-primary-container to-primary">
              Shadows.
            </span>
          </h1>
          <p className="text-on-surface-variant text-lg max-w-xl mb-10 leading-relaxed">
            Access a subterranean marketplace of rare electronics, high-fashion archives, and timeless artifacts curated for the discerning eye.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href="#recently-added"
              className="bg-primary-container text-on-primary-container px-8 py-4 rounded-xl font-bold flex items-center gap-3 hover:opacity-90 transition-all"
            >
              Explore Collection
              <span className="material-symbols-outlined">arrow_forward</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Categories ───────────────────────────────── */}
      <section className="px-8 md:px-12 py-20 max-w-[1440px] mx-auto">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-on-surface">Categories</h2>
            <p className="text-on-surface-variant mt-2">Filter by archive department</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {archiveCategories.map((cat) => (
            <Link
              key={cat.id}
              href={`/category/${cat.id}`}
              className="group cursor-pointer"
            >
              <div className="bg-surface-container-low aspect-square rounded-full flex flex-col items-center justify-center gap-4 transition-all duration-300 group-hover:bg-surface-container-high group-hover:-translate-y-2">
                <span className="material-symbols-outlined text-4xl text-primary">{cat.icon}</span>
                <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface text-center px-3">{cat.name}</h3>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ─── Recently Added ───────────────────────────── */}
      <section id="recently-added" className="px-8 md:px-12 py-12 max-w-[1440px] mx-auto">
        <h2 className="text-3xl font-bold tracking-tight text-on-surface mb-2">Recently Added</h2>
        <p className="text-on-surface-variant mb-12">New acquisitions entered into the archive today.</p>
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="aspect-3/4 bg-surface-container rounded-xl animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-8 gap-y-12">
            {videogames.map((game) => (
              <VideogameCard
                key={game.id}
                videogame={game}
                isAuthenticated={isAuthenticated}
                onDelete={handleDelete}
              />
            ))}
            {videogames.length === 0 && (
              <div className="col-span-full py-20 text-center bg-surface-container-low rounded-2xl" role="status">
                <span className="material-symbols-outlined text-5xl text-outline mb-4 block">inventory_2</span>
                <p className="text-on-surface-variant mb-4">No items found in the archive. Be the first to contribute.</p>
                <Link
                  href="/create"
                  className="bg-primary-container text-on-primary-container px-6 py-2.5 rounded-xl font-bold text-sm inline-block hover:opacity-90 transition-all"
                >
                  List an item now
                </Link>
              </div>
            )}
          </div>
        )}
      </section>

      {/* ─── Newsletter CTA ───────────────────────────── */}
      <section className="my-16 mx-8 md:mx-12 p-12 md:p-16 rounded-3xl bg-linear-to-br from-surface-container-low to-surface relative overflow-hidden flex flex-col md:flex-row items-center gap-12">
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-primary-container/10 rounded-full blur-[100px]" />
        <div className="relative z-10 flex-1">
          <h2 className="text-4xl font-black tracking-tighter mb-4">Stay in the Loop.</h2>
          <p className="text-on-surface-variant max-w-md">
            Receive weekly manifests of newly archived collectibles before they hit the public vault.
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
              © {new Date().getFullYear()} vMarket. Curated for collectors.
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
