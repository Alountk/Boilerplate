"use client";

import { useEffect, useState, use, useMemo } from "react";
import { Videogame } from "../../../domain/models/Videogame";
import { VideogameService } from "../../../infrastructure/services/VideogameService";
import { ChatService } from "../../../infrastructure/services/ChatService";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../context/AuthContext";
import VideogameCover from "../../../components/VideogameCover";
import RefreshableImage from "../../../components/RefreshableImage";
import BlueprintGrid from "../../../components/theme/BlueprintGrid";
import TitleBlock from "../../../components/theme/TitleBlock";
import SpecLabel from "../../../components/theme/SpecLabel";
import Corners from "../../../components/theme/Corners";
import { ChatBubbleLeftRightIcon, ChevronLeftIcon } from "@heroicons/react/24/solid";
import { StarIcon, ShoppingBagIcon } from "@heroicons/react/24/outline";

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [videogame, setVideogame] = useState<Videogame | null>(null);
  const [loading, setLoading] = useState(true);
  const [startingChat, setStartingChat] = useState(false);
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  const videogameService = useMemo(() => new VideogameService(), []);
  const chatService = useMemo(() => new ChatService(), []);

  useEffect(() => {
    videogameService.getById(id).then((data) => {
      setVideogame(data);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, [id, videogameService]);

  const handleContactSeller = async () => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    if (!videogame) return;

    setStartingChat(true);
    try {
      const conv = await chatService.startConversation(videogame.id);
      router.push(`/messages?conv=${conv.id}`);
    } catch (err) {
      console.error("Failed to start conversation", err);
    } finally {
      setStartingChat(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <div className="animate-spin h-12 w-12 rounded-full border-b-2 border-secondary"></div>
    </div>
  );

  if (!videogame) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-surface text-on-surface px-4">
      <h2 className="mb-4 text-2xl font-bold">Product not found</h2>
      <button onClick={() => router.back()} className="flex items-center gap-2 font-bold text-secondary hover:underline">
        <ChevronLeftIcon className="h-5 w-5" /> Go Back
      </button>
    </div>
  );

  const savingsPct = videogame.averagePrice > videogame.ownPrice
    ? Math.round((1 - videogame.ownPrice / videogame.averagePrice) * 100)
    : null;

  return (
    <div className="min-h-screen bg-surface">
      <BlueprintGrid className="min-h-screen">
        <div className="mx-auto max-w-7xl px-4 pt-4">
          <TitleBlock code={`ASSET-${String(videogame.id.slice(0, 4)).toUpperCase()}`} rev="C" date={new Date().toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit" })} />
        </div>

        <div className="mx-auto max-w-7xl px-4 py-6">
          <button
            onClick={() => router.back()}
            className="mb-6 flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-on-surface-muted transition-colors hover:text-secondary"
          >
            <ChevronLeftIcon className="h-4 w-4" /> Back to Marketplace
          </button>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
            {/* Cover — framed asset with corners */}
            <div
              data-testid="product-cover"
              className="relative aspect-square overflow-hidden border border-outline bg-surface-1/40 lg:col-span-2"
            >
              <Corners />
              <VideogameCover
                title={videogame.englishName}
                images={videogame.images}
                urlImg={videogame.urlImg}
                imgClassName="h-full w-full object-cover"
                fallbackClassName="h-full w-full"
              />
              <div className="absolute bottom-2 left-2">
                <span className="inline-flex border border-warning px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest text-warning">
                  {videogame.state === 0 ? 'SELLADO' : 'USADO'}
                </span>
              </div>
            </div>

            {/* Title / price / CTAs */}
            <div className="flex flex-col border border-outline bg-surface-1/40 p-5 lg:col-span-3">
              <div className="flex items-center gap-3">
                <SpecLabel label="SPEC-NAME" className="flex-1">
                  <h1 className="mt-1 font-[family-name:var(--font-space-grotesk)] text-xl font-bold leading-tight text-on-surface md:text-2xl">
                    {videogame.englishName}
                  </h1>
                </SpecLabel>
                <div className="flex items-center gap-1 self-end">
                  <StarIcon className="h-4 w-4 text-tertiary" aria-hidden="true" />
                  <span className="font-mono text-sm font-bold text-tertiary tabular-nums">
                    {videogame.score.toFixed(1)}
                  </span>
                </div>
              </div>

              <div className="my-4 border-t border-outline" aria-hidden="true" />

              <SpecLabel label="SPEC-PRICE">
                <div className="flex items-baseline gap-3">
                  <span className="font-mono text-3xl font-bold text-tertiary tabular-nums">
                    ${videogame.ownPrice.toFixed(2)}
                  </span>
                  {videogame.averagePrice > videogame.ownPrice && (
                    <span className="font-mono text-sm text-on-surface-muted line-through">
                      ${videogame.averagePrice.toFixed(2)}
                    </span>
                  )}
                  {savingsPct !== null && (
                    <span className="border border-success px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-widest text-success">
                      {savingsPct}% AHORRO
                    </span>
                  )}
                </div>
              </SpecLabel>

              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={handleContactSeller}
                  disabled={startingChat}
                  className="flex min-h-12 items-center justify-center gap-2 border border-secondary bg-secondary/10 px-4 font-mono text-xs uppercase tracking-widest text-secondary transition-colors active:bg-secondary/20 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <ChatBubbleLeftRightIcon className="h-4 w-4" aria-hidden="true" />
                  {startingChat ? 'CONECTANDO…' : 'CONTACTAR VENDEDOR'}
                </button>
                <button
                  type="button"
                  className="flex min-h-12 items-center justify-center gap-2 border border-outline px-4 font-mono text-xs uppercase tracking-widest text-on-surface transition-colors active:border-secondary active:text-secondary"
                >
                  <ShoppingBagIcon className="h-4 w-4" aria-hidden="true" />
                  COMPRAR
                </button>
              </div>
            </div>

            {/* Ficha técnica */}
            <div className="mt-2 border border-outline bg-surface-1/40 p-4 lg:col-span-2">
              <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.2em] text-secondary">Ficha Técnica</p>
              <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <SpecLabel label="PLATAFORMA">
                  <dd className="font-mono text-sm text-on-surface">{videogame.console}</dd>
                </SpecLabel>
                <SpecLabel label="ESTADO">
                  <dd className="font-mono text-sm text-on-surface">{videogame.generalState}/10</dd>
                </SpecLabel>
                <SpecLabel label="LANZAMIENTO">
                  <dd className="font-mono text-sm text-on-surface">{new Date(videogame.releaseDate).getFullYear()}</dd>
                </SpecLabel>
                <SpecLabel label="CONDICION">
                  <dd className="font-mono text-sm text-on-surface">{videogame.versionGame || 'REGION DESCONOCIDA'}</dd>
                </SpecLabel>
              </dl>
            </div>

            {/* Thumbnails */}
            {videogame.images && videogame.images.length > 0 ? (
              <div className="mt-2 border border-outline bg-surface-1/40 p-3 lg:col-span-1">
                <div className="grid grid-cols-3 gap-1.5">
                  {videogame.images.slice(0, 6).map((img, i) => (
                    <div key={i} className="aspect-square overflow-hidden border border-outline bg-surface-2/60">
                      <RefreshableImage
                        imageValue={img}
                        alt={`Side ${i + 1}`}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Description */}
            <div className="mt-2 border border-outline bg-surface-1/40 p-5 lg:col-span-4">
              <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-secondary">Descripción</p>
              <p className="text-sm leading-relaxed text-on-surface-muted">
                {videogame.description || "No description provided by the seller."}
              </p>
            </div>
          </div>
        </div>
      </BlueprintGrid>
    </div>
  );
}
