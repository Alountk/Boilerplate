"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { Videogame } from "../domain/models/Videogame";
import { VideogameService } from "../infrastructure/services/VideogameService";
import { useAuth } from "../context/AuthContext";
import VideogameCover from "../components/VideogameCover";
import BlueprintGrid from "../components/theme/BlueprintGrid";
import TitleBlock from "../components/theme/TitleBlock";
import DimensionLine from "../components/theme/DimensionLine";
import TechCard from "../components/theme/TechCard";

import { CATEGORIES } from "../constants/categories";
import { resolveFrontendAssetSrc } from "../utils/videogameImages";

const PAGE_SIZE = 12;
const HOME_HERO_IMAGE = resolveFrontendAssetSrc("assets/backgrounds/home-hero-gaming.jpg");

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
    <div className="relative bg-surface min-h-screen">
      <BlueprintGrid showCrosshairs className="min-h-screen">
        {/* ─── Title block (cajetín) ─────────────────── */}
        <div className="mx-auto max-w-7xl px-4 pt-4">
          <TitleBlock code="VMKT-BP-001" rev="C" date={new Date().toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit" })} />
        </div>

        {/* ─── Hero — plano de montaje compacto ─────── */}
        <section aria-labelledby="sys01-home" className="relative mx-auto max-w-7xl px-4 py-10 md:py-16">
          <div className="absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={HOME_HERO_IMAGE}
              alt=""
              className="h-full w-full object-cover opacity-20 grayscale"
            />
          </div>
          <span id="sys01-home" className="font-mono text-[10px] uppercase tracking-[0.25em] text-secondary">
            SYS.01 — HOME
          </span>
          <h1 className="mt-3 font-[family-name:var(--font-space-grotesk)] text-3xl font-bold leading-tight tracking-tighter text-on-surface sm:text-5xl">
            EL MERCADO,
            <br />
            DIBUJADO A ESCALA
          </h1>
          <div className="mt-6 max-w-md">
            <DimensionLine measure="390px" />
          </div>
          <p className="mt-6 max-w-md text-sm leading-relaxed text-on-surface-muted md:text-base">
            Compra y vende títulos retro, hits modernos, ediciones limitadas, consolas y accesorios en un solo marketplace de confianza.
          </p>
          <Link
            href="#recently-added"
            className="mt-8 inline-flex min-h-12 items-center justify-center border border-secondary px-6 font-mono text-xs uppercase tracking-widest text-secondary transition-colors active:bg-secondary/20"
          >
            EXPLORAR
            <span className="ml-2" aria-hidden="true">▸</span>
          </Link>
        </section>

        {/* ─── Categories — chips técnicos ──────────── */}
        <section aria-labelledby="sys02-categories" className="mx-auto max-w-7xl px-4 py-8">
          <div className="mb-4 flex items-end justify-between gap-4">
            <h2 id="sys02-categories" className="font-mono text-xs uppercase tracking-[0.2em] text-on-surface">
              Categorías
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.id}
                href={`/category/${cat.id}`}
                className="inline-flex min-h-10 min-w-[88px] items-center justify-center border border-outline px-3 py-1 font-mono text-xs uppercase tracking-widest text-on-surface-muted transition-colors active:border-secondary active:text-secondary"
              >
                {cat.name.toUpperCase()}
              </Link>
            ))}
          </div>
        </section>

        {/* ─── Recently Added — TechCards ───────────── */}
        <section id="recently-added" aria-labelledby="sys03-recent" className="mx-auto max-w-7xl px-4 py-8">
          <div className="mb-6 flex items-end justify-between gap-4 border-b border-outline pb-2">
            <h2 id="sys03-recent" className="font-mono text-xs uppercase tracking-[0.2em] text-on-surface">
              Recién Llegados
            </h2>
            <span className="font-mono text-[10px] uppercase tracking-widest text-on-surface-muted">
              Pulse — LIVE
            </span>
          </div>

          {loading ? (
            <div data-testid="recently-added-grid" className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
              {Array.from({ length: PAGE_SIZE }).map((_, i) => (
                <div key={i} className="aspect-square animate-pulse border border-outline bg-surface-1/40" />
              ))}
            </div>
          ) : videogames.length === 0 ? (
            <div className="border border-outline bg-surface-1/40 py-16 text-center" role="status">
              <p className="mb-4 text-on-surface-muted">No hay videojuegos listados todavía. Sé el primero en publicar uno.</p>
              <Link
                href="/create"
                className="inline-flex min-h-12 items-center justify-center border border-secondary px-6 font-mono text-xs uppercase tracking-widest text-secondary transition-colors active:bg-secondary/20"
              >
                Listar un ítem
              </Link>
            </div>
          ) : (
            <>
              <div data-testid="recently-added-grid" className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
                {videogames.map((game) => (
                  <TechCard
                    key={game.id}
                    code={`CMP-${String(game.id.slice(0, 2)).toUpperCase()}-${game.generalState}`}
                    title={game.englishName}
                    sub={game.console}
                    price={game.ownPrice}
                    cover={
                      <VideogameCover
                        title={game.englishName}
                        images={game.images}
                        urlImg={game.urlImg}
                        imgClassName="aspect-square w-full object-cover"
                        fallbackClassName="aspect-square w-full"
                      />
                    }
                    actions={
                      isAuthenticated ? (
                        <button
                          type="button"
                          onClick={() => handleDelete(game.id)}
                          className="min-w-11 min-h-11 px-2 text-error transition-colors hover:bg-error/10"
                          aria-label={`Eliminar listing ${game.englishName}`}
                        >
                          ✕
                        </button>
                      ) : null
                    }
                  />
                ))}
              </div>

              {loadingMore && (
                <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
                  {Array.from({ length: PAGE_SIZE }).map((_, i) => (
                    <div key={i} className="aspect-square animate-pulse border border-outline bg-surface-1/40" />
                  ))}
                </div>
              )}

              {hasMore && (
                <div ref={sentinelRef} className="h-1 mt-8" aria-hidden="true" />
              )}

              {!hasMore && videogames.length > 0 && (
                <p className="mt-12 text-center font-mono text-xs uppercase tracking-widest text-on-surface-muted/60">
                  Has visto todos los listings.
                </p>
              )}
            </>
          )}
        </section>

        {/* ─── Footer mínimo ────────────────────────── */}
        <footer className="mt-12 border-t border-outline">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 md:flex-row">
            <span className="font-mono text-sm uppercase tracking-widest text-on-surface">vMarket</span>
            <p className="font-mono text-[10px] uppercase tracking-widest text-on-surface-muted">
              © {new Date().getFullYear()} vMarket. THE GAMER MARKETPLACE.
            </p>
          </div>
        </footer>
      </BlueprintGrid>
    </div>
  );
}
