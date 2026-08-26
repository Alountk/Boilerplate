"use client";

import { useEffect, useState, useCallback, use } from "react";
import Link from "next/link";
import { CATEGORIES } from "../../../constants/categories";
import { Videogame } from "../../../domain/models/Videogame";
import { VideogameService } from "../../../infrastructure/services/VideogameService";
import VideogameCover from "../../../components/VideogameCover";
import BlueprintGrid from "../../../components/theme/BlueprintGrid";
import TitleBlock from "../../../components/theme/TitleBlock";
import SpecLabel from "../../../components/theme/SpecLabel";
import TechChip from "../../../components/theme/TechChip";
import TechCard from "../../../components/theme/TechCard";

const FACETS = ["New", "Like New", "Very Good", "Good", "Acceptable"];

export default function CategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [videogames, setVideogames] = useState<Videogame[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFacet, setActiveFacet] = useState<string | null>(null);
  const [videogameService] = useState(() => new VideogameService());

  const category = CATEGORIES.find((c) => c.id === id);

  const loadVideogames = useCallback(async () => {
    if (!category) return;
    try {
      setLoading(true);
      const allGames = await videogameService.getAll();
      const filtered = allGames.filter((g) => g.category === category.categoryId);
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

  if (!category) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center bg-surface min-h-screen">
        <h1 className="mb-4 text-on-surface">Category not found</h1>
        <Link href="/" className="text-secondary hover:underline">Return Home</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      <BlueprintGrid className="min-h-screen">
        <div className="mx-auto max-w-7xl px-4 pt-4">
          <TitleBlock code={`CAT-${category.id.toUpperCase()}`} rev="A" date={new Date().toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit" })} />
        </div>

        <div className="mx-auto max-w-7xl px-4 py-8">
          {/* Breadcrumb — SpecLabel */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-3">
            <Link href="/" className="font-mono text-[11px] uppercase tracking-widest text-secondary hover:underline">HOME</Link>
            <span className="text-outline" aria-hidden="true">/</span>
            <SpecLabel label={`CATEGORIA: ${category.name.toUpperCase()}`}>
              <span className="font-mono text-xs uppercase tracking-widest text-on-surface">
                {videogames.length} LISTINGS
              </span>
            </SpecLabel>
          </nav>

          <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-12">
            {/* Sidebar filters — decorative TechChips */}
            <aside className="lg:col-span-3">
              <div className="border border-outline bg-surface-1/40 p-4">
                <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.2em] text-secondary">FILTROS</p>

                <div>
                  <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-on-surface-muted">Condición</p>
                  <div className="flex flex-wrap gap-2">
                    {FACETS.map((f) => (
                      <TechChip
                        key={f}
                        label={f.toUpperCase()}
                        active={activeFacet === f}
                        onClick={() => setActiveFacet(activeFacet === f ? null : f)}
                      />
                    ))}
                  </div>
                </div>

                <div className="mt-6">
                  <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-on-surface-muted">Precio</p>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="MIN"
                      className="w-full border border-outline bg-surface-2/60 px-3 py-2 font-mono text-xs uppercase text-on-surface placeholder:text-on-surface-muted/50 outline-none transition-colors focus:border-secondary"
                      aria-label="Precio mínimo"
                    />
                    <span className="text-on-surface-muted" aria-hidden="true">–</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="MAX"
                      className="w-full border border-outline bg-surface-2/60 px-3 py-2 font-mono text-xs uppercase text-on-surface placeholder:text-on-surface-muted/50 outline-none transition-colors focus:border-secondary"
                      aria-label="Precio máximo"
                    />
                  </div>
                </div>
              </div>
            </aside>

            {/* Main content */}
            <main className="lg:col-span-9">
              <div className="mb-6 flex flex-col gap-4 border-b border-outline pb-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h1 className="font-[family-name:var(--font-space-grotesk)] text-2xl font-bold tracking-tight text-on-surface">
                    {category.name}
                  </h1>
                  <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-on-surface-muted">
                    {videogames.length} listings
                  </p>
                </div>
                <TechChip label="BEST MATCH" className="min-h-10" />
              </div>

              {loading ? (
                <div data-testid="category-grid" className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="aspect-square animate-pulse border border-outline bg-surface-1/40" />
                  ))}
                </div>
              ) : videogames.length > 0 ? (
                <div data-testid="category-grid" className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                  {videogames.map((game) => (
                    <TechCard
                      key={game.id}
                      code={`CMP-${String(game.id.slice(0, 2)).toUpperCase()}-${game.generalState}`}
                      title={game.englishName}
                      sub={game.console}
                      price={game.ownPrice}
                      badge={{ label: "ACTIVO", tone: "success" }}
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
                        <Link
                          href={`/product/${game.id}`}
                          className="inline-flex min-h-10 items-center border border-secondary px-3 font-mono text-[10px] uppercase tracking-widest text-secondary transition-colors active:bg-secondary/20"
                        >
                          VER ▸
                        </Link>
                      }
                    />
                  ))}
                </div>
              ) : (
                <div className="border border-outline bg-surface-1/40 py-16 text-center">
                  <p className="mb-4 text-on-surface-muted">No hay listings en esta categoría todavía.</p>
                  <Link
                    href="/create"
                    className="inline-flex min-h-12 items-center justify-center border border-secondary px-6 font-mono text-xs uppercase tracking-widest text-secondary transition-colors active:bg-secondary/20"
                  >
                    Publicar listing
                  </Link>
                </div>
              )}
            </main>
          </div>
        </div>
      </BlueprintGrid>
    </div>
  );
}
