"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { VideogameService } from "../../infrastructure/services/VideogameService";
import { GameState } from "../../domain/models/Videogame";
import {
  ArrowLeftIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import { scrollToFirstError, getInputClassNames } from "../../utils/formUtils";
import { RAWGService } from "../../infrastructure/services/RAWGService";
import { RAWGGame } from "../../domain/ports/IRAWGService";
import { useAuth } from "../../context/AuthContext";
import { FieldFeedback } from "../../components/FieldFeedback";
import { GameSearchDropdown } from "../../components/create/GameSearchDropdown";
import { ImageUploadZone } from "../../components/create/ImageUploadZone";
import { AdvancedOptions } from "../../components/create/AdvancedOptions";
import { useImageUpload, SideKey } from "../../hooks/useImageUpload";
import { useOcrAutofill } from "../../hooks/useOcrAutofill";

// ── Form shape ─────────────────────────────────────────────────────────────
type FormData = {
  englishName: string;
  qr: string;
  codebar: string;
  console: string;
  state: number;
  releaseDate: string;
  versionGame: string;
  description: string;
  urlImg: string;
  generalState: number;
  averagePrice: number;
  ownPrice: number;
  acceptOffersRange: number;
  score: number;
  category: number;
};

const INITIAL_FORM: FormData = {
  englishName: "",
  qr: "",
  codebar: "",
  console: "",
  state: GameState.Sealed,
  releaseDate: "",
  versionGame: "",
  description: "",
  urlImg: "",
  generalState: 0,
  averagePrice: 0,
  ownPrice: 0,
  acceptOffersRange: 0,
  score: 0,
  category: 0,
};

type BoxArt = {
  frontalUrl: string;
  backUrl: string;
  rightSideUrl: string;
  leftSideUrl: string;
  topSideUrl: string;
  bottomSideUrl: string;
};

const INITIAL_BOX_ART: BoxArt = {
  frontalUrl: "",
  backUrl: "",
  rightSideUrl: "",
  leftSideUrl: "",
  topSideUrl: "",
  bottomSideUrl: "",
};

// ── Validation ──────────────────────────────────────────────────────────────
function validate(data: FormData): Record<string, string> {
  const err: Record<string, string> = {};
  if (!data.englishName.trim()) err.englishName = "English name is required.";
  if (!data.console.trim()) err.console = "Console is required.";
  if (!data.releaseDate) err.releaseDate = "Release date is required.";
  if (data.ownPrice <= 0) err.ownPrice = "Asking price must be greater than 0.";
  return err;
}

// ── Component ───────────────────────────────────────────────────────────────
export default function CreateVideogamePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const videogameService = useMemo(() => new VideogameService(), []);
  const rawgService = useMemo(() => new RAWGService(), []);

  // Form state
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [loading, setLoading] = useState(false);

  // Localized names & box art
  const [names, setNames] = useState([{ language: "", name: "" }]);
  const [boxArt, setBoxArt] = useState<BoxArt>(INITIAL_BOX_ART);

  // RAWG search state
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<RAWGGame[]>([]);
  const [showSearch, setShowSearch] = useState(false);

  // Image upload hook
  const {
    images,
    uploading,
    uploadingStates,
    handleMultipleFilesChange,
    removeImage,
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleSideImageUpload,
  } = useImageUpload();

  // OCR hook
  const { ocrLoading, ocrMessage, runOcrAutofillFromImage } = useOcrAutofill();

  // ── Guard: redirect to /login if unauthenticated ──────────────────────────
  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  // ── RAWG debounced search ─────────────────────────────────────────────────
  useEffect(() => {
    const term = formData.englishName.trim();
    if (term.length < 3) {
      setSearchResults([]);
      setShowSearch(false);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await rawgService.searchGames(term);
        setSearchResults(results);
        setShowSearch(results.length > 0);
      } catch (err) {
        console.error("RAWG Search failed", err);
      } finally {
        setSearching(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [formData.englishName, rawgService]);

  // ── RAWG game selection ───────────────────────────────────────────────────
  const handleSelectGame = useCallback(
    async (game: RAWGGame) => {
      setShowSearch(false);
      setLoading(true);
      try {
        const details = await rawgService.getGameDetails(game.id);
        const platformNames = details.platforms.map((p) =>
          p.platform.slug.toLowerCase()
        );
        let category = 5;
        if (platformNames.some((p) => p.includes("playstation"))) category = 0;
        else if (platformNames.some((p) => p.includes("xbox"))) category = 1;
        else if (
          platformNames.some((p) =>
            ["nintendo", "switch", "wii", "gamecube", "n64", "snes", "nes"].some(
              (n) => p.includes(n)
            )
          )
        )
          category = 2;
        else if (
          platformNames.some((p) =>
            ["sega", "genesis", "saturn", "dreamcast"].some((n) => p.includes(n))
          )
        )
          category = 3;
        else if (platformNames.some((p) => p.includes("pc"))) category = 4;

        const consoleName =
          details.platforms.length > 0 ? details.platforms[0].platform.name : "";

        setFormData((prev) => ({
          ...prev,
          englishName: details.name,
          releaseDate: details.released ?? "",
          console: consoleName,
          description: details.description_raw ?? prev.description,
          score: details.metacritic ?? 0,
          category,
          urlImg: details.background_image ?? prev.urlImg,
        }));
      } catch (err) {
        console.error("Failed to fetch game details", err);
      } finally {
        setLoading(false);
      }
    },
    [rawgService]
  );

  // ── Form handlers ─────────────────────────────────────────────────────────
  const showFieldError = (name: string) => {
    if (errors[name] && (touched[name] || submitAttempted)) return errors[name];
    return undefined;
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type } = e.target;
    const val = type === "number" ? parseFloat(value) : value;
    setFormData((prev) => {
      const next = { ...prev, [name]: val };
      setErrors(validate(next));
      return next;
    });
    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  const handleBlur = (
    e: React.FocusEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => setTouched((prev) => ({ ...prev, [e.target.name]: true }));

  // ── Image callbacks ───────────────────────────────────────────────────────
  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    void handleMultipleFilesChange(
      e,
      (firstFile) =>
        setFormData((prev) => ({ ...prev, urlImg: prev.urlImg || firstFile })),
      (file) =>
        void runOcrAutofillFromImage(file, handleSelectGame, formData.englishName)
    );
  };

  const handleDropZoneDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (!files?.length) return;
    const input = document.getElementById("imageUpload") as HTMLInputElement | null;
    if (input) {
      const dt = new DataTransfer();
      Array.from(files).forEach((f) => dt.items.add(f));
      input.files = dt.files;
      input.dispatchEvent(new Event("change", { bubbles: true }));
    }
  };

  const handleRemoveImage = (index: number) =>
    removeImage(index, (next) =>
      setFormData((prev) => ({ ...prev, urlImg: next }))
    );

  const handleDropImage = (dropIndex: number) =>
    handleDrop(dropIndex, (next) =>
      setFormData((prev) => ({ ...prev, urlImg: next }))
    );

  // ── Box art callbacks ─────────────────────────────────────────────────────
  const handleBoxArtUpload = (side: SideKey, file: File) => {
    void handleSideImageUpload(side, file, (s, fileName) =>
      setBoxArt((prev) => ({ ...prev, [s]: fileName }))
    );
  };

  const handleBoxArtChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    side: SideKey
  ) => setBoxArt((prev) => ({ ...prev, [side]: e.target.value }));

  // ── Localized names callbacks ─────────────────────────────────────────────
  const handleNameChange = (
    index: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) =>
    setNames((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [e.target.name]: e.target.value };
      return next;
    });

  const addName = () =>
    setNames((prev) => [...prev, { language: "", name: "" }]);
  const removeName = (index: number) =>
    setNames((prev) => prev.filter((_, i) => i !== index));

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitAttempted(true);
    const fieldErrors = validate(formData);
    setErrors(fieldErrors);

    if (Object.keys(fieldErrors).length > 0) {
      scrollToFirstError();
      return;
    }

    setLoading(true);
    try {
      let resolvedUrlImg = formData.urlImg;
      if (
        images.length === 0 &&
        !resolvedUrlImg.trim() &&
        formData.englishName.trim().length >= 3
      ) {
        const matches = await rawgService.searchGames(
          formData.englishName.trim()
        );
        resolvedUrlImg = matches[0]?.background_image ?? "";
      }

      const payload = {
        ...formData,
        urlImg: resolvedUrlImg,
        generalState: Number(formData.generalState),
        averagePrice: Number(formData.averagePrice),
        ownPrice: Number(formData.ownPrice),
        acceptOffersRange: Number(formData.acceptOffersRange),
        score: Number(formData.score),
        category: Number(formData.category),
        state: Number(formData.state),
        names: names.filter((n) => n.name.trim() && n.language.trim()),
        assets: [],
        images,
        releaseDate: new Date(formData.releaseDate).toISOString(),
        contents: [
          {
            frontalUrl: boxArt.frontalUrl,
            backUrl: boxArt.backUrl,
            rightSideUrl: boxArt.rightSideUrl,
            leftSideUrl: boxArt.leftSideUrl,
            topSideUrl: boxArt.topSideUrl,
            bottomSideUrl: boxArt.bottomSideUrl,
          },
        ],
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await videogameService.create(payload as any);
      router.push("/");
    } catch (err) {
      console.error("Failed to create videogame", err);
    } finally {
      setLoading(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-surface text-on-surface flex flex-col">
      <div className="max-w-7xl w-full mx-auto px-6 md:px-12 py-12">
        {user && !user.emailVerified && (
          <div className="mb-8 rounded-xl bg-warning-container/20 border border-warning/40 px-4 py-3 flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-warning flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-warning-container text-xs font-bold">!</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-warning mb-1">Email verification required</p>
              <p className="text-xs text-on-surface-variant">Verify your email before publishing listings. Go to your profile to complete verification.</p>
            </div>
          </div>
        )}

        <Link
          href="/"
          className="inline-flex items-center gap-2 text-primary hover:text-on-surface transition-colors group mb-8"
        >
          <ArrowLeftIcon className="h-5 w-5 group-hover:-translate-x-1 transition-transform" aria-hidden="true" />
          <span className="text-sm font-bold tracking-widest uppercase">Back to Marketplace</span>
        </Link>

        {/* Main Grid: Left Hero + Upload | Right Form */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 md:gap-16">
          {/* LEFT: Hero + Upload Zone */}
          <div className="lg:col-span-5">
            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tighter text-on-surface mb-8 leading-[1.1]">
              List your <br />
              <span className="text-transparent bg-clip-text bg-linear-to-br from-primary-container to-primary">
                next favorite
              </span>
              <br />
              <span className="text-transparent bg-clip-text bg-linear-to-br from-primary-container to-primary">
                game.
              </span>
            </h1>
            <p className="text-on-surface-variant text-lg leading-relaxed mb-12 max-w-md">
              Share detailed information and high-quality images of your
              videogame. Help collectors and gamers find their next treasure.
            </p>

            <ImageUploadZone
              images={images}
              uploading={uploading}
              ocrLoading={ocrLoading}
              ocrMessage={ocrMessage}
              onFilesChange={handleFilesChange}
              onRemove={handleRemoveImage}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDropImage}
              onDropZoneDrop={handleDropZoneDrop}
            />
          </div>

          {/* RIGHT: Form */}
          <div className="lg:col-span-7 glass-card border border-outline-variant/20 p-8 md:p-12 rounded-3xl shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary-container/5 blur-[120px] -z-10" aria-hidden="true" />

            <form onSubmit={handleSubmit} className="space-y-8" noValidate>
              {/* Game Title + RAWG Search */}
              <div className="space-y-2">
                <label
                  className="text-xs font-bold tracking-widest uppercase text-on-surface-variant ml-1"
                  htmlFor="englishName"
                >
                  Game Title
                </label>
                <div className="relative">
                  <input
                    id="englishName"
                    name="englishName"
                    value={formData.englishName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    aria-invalid={!!showFieldError("englishName")}
                    aria-describedby={
                      showFieldError("englishName") ? "err-englishName" : undefined
                    }
                    className="w-full bg-surface-container-highest border-none focus:ring-1 focus:ring-primary rounded-xl px-6 py-4 text-on-surface placeholder:text-outline/50 transition-all font-medium"
                    placeholder="e.g. The Legend of Zelda"
                  />
                  {searching && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2" aria-hidden="true">
                      <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                    </div>
                  )}
                  {!searching && (
                    <MagnifyingGlassIcon
                      className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-outline pointer-events-none"
                      aria-hidden="true"
                    />
                  )}
                  {showSearch && (
                    <GameSearchDropdown
                      results={searchResults}
                      onSelect={handleSelectGame}
                      loading={searching}
                    />
                  )}
                </div>
                <FieldFeedback id="err-englishName" message={showFieldError("englishName")} />
              </div>

              {/* Platform & Condition */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label
                    className="text-xs font-bold tracking-widest uppercase text-on-surface-variant ml-1"
                    htmlFor="category"
                  >
                    Platform
                  </label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full appearance-none bg-surface-container-highest border-none focus:ring-1 focus:ring-primary rounded-xl px-6 py-4 text-on-surface transition-all font-medium cursor-pointer"
                  >
                    <option value={0}>PlayStation</option>
                    <option value={1}>Xbox</option>
                    <option value={2}>Nintendo</option>
                    <option value={3}>Sega</option>
                    <option value={4}>PC</option>
                    <option value={5}>Other</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label
                    className="text-xs font-bold tracking-widest uppercase text-on-surface-variant ml-1"
                    htmlFor="state"
                  >
                    Condition
                  </label>
                  <select
                    id="state"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    className="w-full appearance-none bg-surface-container-highest border-none focus:ring-1 focus:ring-primary rounded-xl px-6 py-4 text-on-surface transition-all font-medium cursor-pointer"
                  >
                    <option value={GameState.Sealed}>Sealed</option>
                    <option value={GameState.Opened}>Like New</option>
                    <option value={GameState.Damaged}>Good</option>
                  </select>
                </div>
              </div>

              {/* Asking Price */}
              <div className="space-y-2">
                <label
                  className="text-xs font-bold tracking-widest uppercase text-on-surface-variant ml-1"
                  htmlFor="ownPrice"
                >
                  Asking Price
                </label>
                <div className="relative">
                  <span
                    className="absolute left-6 top-1/2 -translate-y-1/2 text-primary font-bold text-lg"
                    aria-hidden="true"
                  >
                    $
                  </span>
                  <input
                    id="ownPrice"
                    name="ownPrice"
                    type="number"
                    step="0.01"
                    value={formData.ownPrice}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    aria-invalid={!!showFieldError("ownPrice")}
                    aria-describedby={
                      showFieldError("ownPrice") ? "err-ownPrice" : undefined
                    }
                    className="w-full bg-surface-container-highest border-none focus:ring-1 focus:ring-primary rounded-xl pl-14 pr-6 py-4 text-on-surface placeholder:text-outline/50 transition-all font-medium [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    placeholder="0.00"
                  />
                </div>
                <FieldFeedback id="err-ownPrice" message={showFieldError("ownPrice")} />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label
                  className="text-xs font-bold tracking-widest uppercase text-on-surface-variant ml-1"
                  htmlFor="description"
                >
                  Game Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className={`${getInputClassNames(false)} resize-none`}
                  placeholder="Describe the game, condition, and any notable details..."
                  rows={6}
                />
              </div>

              {/* CTA Buttons */}
              <div className="pt-6 flex flex-col md:flex-row gap-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-linear-to-br from-primary-container to-[#6366F1] text-on-primary-container py-4 rounded-xl font-extrabold text-base tracking-tight hover:brightness-110 active:scale-[0.98] transition-all shadow-lg shadow-primary-container/20 disabled:opacity-50"
                >
                  {loading ? "Publishing..." : "Publish Listing"}
                </button>
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="px-8 py-4 rounded-xl font-bold text-on-surface-variant hover:bg-surface-container-highest transition-colors active:scale-[0.98]"
                >
                  Save Draft
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Advanced Options */}
        <AdvancedOptions
          formData={formData}
          showFieldError={showFieldError}
          onChange={handleChange}
          onBlur={handleBlur}
          names={names}
          boxArt={boxArt}
          uploadingStates={uploadingStates}
          onNameChange={handleNameChange}
          onAddName={addName}
          onRemoveName={removeName}
          onContentChange={handleBoxArtChange}
          onSideImageUpload={handleBoxArtUpload}
        />
      </div>
    </div>
  );
}
