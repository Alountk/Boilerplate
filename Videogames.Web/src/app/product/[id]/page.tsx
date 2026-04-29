"use client";

import { useEffect, useState, use, useMemo } from "react";
import { Videogame } from "../../../domain/models/Videogame";
import { VideogameService } from "../../../infrastructure/services/VideogameService";
import { ChatService } from "../../../infrastructure/services/ChatService";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../context/AuthContext";
import VideogameCover from "../../../components/VideogameCover";
import { resolveVideogameImageSrc } from "../../../utils/videogameImages";
import { 
  ChatBubbleLeftRightIcon, 
  ChevronLeftIcon,
  ShieldCheckIcon,
  ShoppingBagIcon,
  StarIcon as StarIconSolid 
} from "@heroicons/react/24/solid";
import { 
  StarIcon as StarIconOutline,
  CalendarIcon,
  CpuChipIcon,
  CheckBadgeIcon
} from "@heroicons/react/24/outline";

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
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );

  if (!videogame) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-surface text-on-surface">
      <h2 className="text-2xl font-bold mb-4">Product not found</h2>
      <button onClick={() => router.back()} className="text-primary font-bold hover:underline flex items-center gap-2">
        <ChevronLeftIcon className="h-5 w-5" /> Go Back
      </button>
    </div>
  );

  const savingsPct = videogame.averagePrice > videogame.ownPrice
    ? Math.round((1 - videogame.ownPrice / videogame.averagePrice) * 100)
    : null;

  return (
    <div className="min-h-screen bg-surface py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <button 
          onClick={() => router.back()}
          className="mb-8 flex items-center gap-2 text-on-surface-variant hover:text-on-surface transition-colors text-sm font-medium"
        >
          <ChevronLeftIcon className="h-4 w-4" /> Back to Marketplace
        </button>

        {/*
          Bento grid (lg+): 5 cols × 3 rows
          ┌────────────────────┬───────────────────┐
          │  Cover Image       │   Title / Price   │
          │  (2col × 2row)     │   (3col × 1row)   │
          │                    ├──────┬────────────┤
          │                    │Badges│  Specs     │
          │                    │(1×1) │  (2×1)     │
          ├──────────┬─────────┴──────┴────────────┤
          │ Thumbs   │    Description (full width)  │
          │ (1×1)    │    (4col × 1row)             │
          └──────────┴──────────────────────────────┘
          Mobile: single column stack.
        */}
        <div className="grid grid-cols-1 lg:grid-cols-5 lg:grid-rows-3 gap-4 lg:gap-5">

          {/* ── Cover image — 2×2 ─────────────────────── */}
          <div className="lg:col-span-2 lg:row-span-2 relative rounded-2xl overflow-hidden bg-surface-container-low border border-outline-variant/20 aspect-square lg:aspect-auto group">
            <VideogameCover
              title={videogame.englishName}
              images={videogame.images}
              urlImg={videogame.urlImg}
              imgClassName="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-105"
              fallbackClassName="w-full h-full"
            />
            <div className="absolute top-4 left-4">
              <span className="px-3 py-1 bg-tertiary-container text-on-tertiary-container text-xs font-bold uppercase rounded-full">
                {videogame.state === 0 ? 'Sealed' : 'Used'}
              </span>
            </div>
          </div>

          {/* ── Title / Price — 3×1 ───────────────────── */}
          <div className="lg:col-span-3 lg:row-span-1 glass-card rounded-2xl border-outline-variant/20 p-6 flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold text-primary tracking-widest uppercase">
                {videogame.console}
              </span>
              <span className="text-outline/40">•</span>
              <div className="flex items-center gap-1">
                <StarIconSolid className="h-4 w-4 text-yellow-400" />
                <span className="text-sm font-bold text-on-surface">{videogame.score.toFixed(1)}</span>
              </div>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-on-surface mb-4 leading-tight">
              {videogame.englishName}
            </h1>
            <div className="flex items-baseline gap-3 flex-wrap">
              <span className="text-4xl font-black text-on-surface">
                ${videogame.ownPrice.toFixed(2)}
              </span>
              {videogame.averagePrice > videogame.ownPrice && (
                <span className="text-lg text-outline line-through">
                  ${videogame.averagePrice.toFixed(2)}
                </span>
              )}
              {savingsPct !== null && (
                <span className="text-sm font-bold text-on-tertiary-container bg-tertiary-container/30 px-2 py-1 rounded-lg">
                  {savingsPct}% savings
                </span>
              )}
            </div>
            {/* Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
              <button
                type="button"
                className="flex items-center justify-center gap-3 indigo-gradient text-white py-3.5 px-6 rounded-xl font-bold shadow-lg hover:opacity-90 transition-opacity active:scale-95"
              >
                <ShoppingBagIcon className="h-5 w-5" /> Buy Now
              </button>
              <button 
                type="button"
                onClick={handleContactSeller}
                disabled={startingChat}
                className="flex items-center justify-center gap-3 glass-surface border border-outline-variant/30 hover:border-primary/50 text-on-surface py-3.5 px-6 rounded-xl font-bold transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <ChatBubbleLeftRightIcon className="h-5 w-5 text-primary" />
                {startingChat ? 'Connecting…' : 'Contact Seller'}
              </button>
            </div>
          </div>

          {/* ── Trust badges — 1×1 ───────────────────── */}
          <div className="lg:col-span-1 lg:row-span-1 glass-card rounded-2xl border-outline-variant/20 p-5 flex flex-col justify-around gap-3">
            <div className="flex items-center gap-3">
              <ShieldCheckIcon className="h-5 w-5 text-tertiary shrink-0" />
              <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Purchase Protection</span>
            </div>
            <div className="flex items-center gap-3">
              <CalendarIcon className="h-5 w-5 text-primary shrink-0" />
              <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Released {new Date(videogame.releaseDate).getFullYear()}</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckBadgeIcon className="h-5 w-5 text-primary-fixed shrink-0" />
              <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Verified Seller</span>
            </div>
          </div>

          {/* ── Specs — 2×1 ──────────────────────────── */}
          <div className="lg:col-span-2 lg:row-span-1 glass-card rounded-2xl border-outline-variant/20 p-5 grid grid-cols-2 gap-4">
            <div>
              <h5 className="text-xs font-bold text-on-surface-variant mb-1 flex items-center gap-1.5 uppercase tracking-widest">
                <CpuChipIcon className="h-3.5 w-3.5 text-primary" aria-hidden="true" /> Platform
              </h5>
              <p className="text-sm font-medium text-on-surface">{videogame.console}</p>
              <p className="text-xs text-outline mt-0.5">{videogame.versionGame || 'Region Unknown'}</p>
            </div>
            <div>
              <h5 className="text-xs font-bold text-on-surface-variant mb-1 flex items-center gap-1.5 uppercase tracking-widest">
                <StarIconOutline className="h-3.5 w-3.5 text-primary" aria-hidden="true" /> Condition
              </h5>
              <p className="text-sm font-medium text-on-surface">{videogame.generalState}/10</p>
              <p className="text-xs text-outline mt-0.5">General State</p>
            </div>
          </div>

          {/* ── Thumbnails — 1×1 ─────────────────────── */}
          <div className="lg:col-span-1 lg:row-span-1 rounded-2xl border border-outline-variant/20 bg-surface-container-low p-3">
            {videogame.images && videogame.images.length > 0 ? (
              <div className="grid grid-cols-3 gap-1.5 h-full">
                {videogame.images.slice(0, 6).map((img, i) => (
                  <div key={i} className="aspect-square bg-surface-container rounded-lg overflow-hidden border border-outline-variant/20 cursor-pointer hover:border-primary/50 transition-all">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={resolveVideogameImageSrc(img) || ""} alt={`Side ${i + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-outline text-center">No additional images</div>
            )}
          </div>

          {/* ── Description — 4×1 ────────────────────── */}
          <div className="lg:col-span-4 lg:row-span-1 glass-card rounded-2xl border-outline-variant/20 p-6">
            <h4 className="text-sm font-bold text-on-surface mb-3 uppercase tracking-widest">Product Description</h4>
            <p className="text-on-surface-variant leading-relaxed text-sm">
              {videogame.description || "No description provided by the seller."}
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
