"use client";

import { useState, useEffect, useMemo, useCallback, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { VideogameService } from "../../infrastructure/services/VideogameService";
import { GameState, Videogame } from "../../domain/models/Videogame";
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
import TitleBlock from "../../components/theme/TitleBlock";

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

function mapItemToForm(item: Videogame): FormData {
  return {
    englishName: item.englishName,
    qr: item.qr,
    codebar: item.codebar,
    console: item.console,
    state: item.state,
    releaseDate: item.releaseDate ? item.releaseDate.slice(0, 10) : "",
    versionGame: item.versionGame,
    description: item.description,
    urlImg: item.urlImg,
    generalState: item.generalState,
    averagePrice: item.averagePrice,
    ownPrice: item.ownPrice,
    acceptOffersRange: item.acceptOffersRange,
    score: item.score,
    category: item.category,
  };
}

// ── Component (inner — needs useSearchParams under Suspense) ───────────────
function CreateVideogameContent() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("id");

  const videogameService = useMemo(() => new VideogameService(), []);
  const rawgService = useMemo(() => new RAWGService(), []);

  // Form state
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);

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
    if (!authLoading && !user) router.replace("/login");
  }, [user, authLoading, router]);

  // ── Edit flow: load existing listing and pre-fill the form ────────────────
  useEffect(() => {
    if (!editId || !user) return;
    let cancelled = false;
    setEditLoading(true);
    videogameService
      .getById(editId)
      .then((item) => {
        if (cancelled) return;
        setFormData(mapItemToForm(item));
        setNames(item.names.length > 0 ? item.names : [{ language: "", name: "" }]);
        if (item.contents && item.contents[0]) {
          setBoxArt({
            frontalUrl: item.contents[0].frontalUrl,
            backUrl: item.contents[0].backUrl,
            rightSideUrl: item.contents[0].rightSideUrl,
            leftSideUrl: item.contents[0].leftSideUrl,
            topSideUrl: item.contents[0].topSideUrl,
            bottomSideUrl: item.contents[0].bottomSideUrl,
          });
        }
      })
      .catch((err) => console.error("Failed to load listing for edit", err))
      .finally(() => {
        if (!cancelled) setEditLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [editId, videogameService, user]);

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

      if (editId) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await videogameService.update(editId, { ...payload, id: editId } as any);
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await videogameService.create(payload as any);
      }
      router.push("/");
    } catch (err) {
      console.error("Failed to save videogame", err);
    } finally {
      setLoading(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <div className="mx-auto max-w-7xl px-4 pt-4">
        <TitleBlock code={editId ? `EDIT-${editId.slice(0, 4).toUpperCase()}` : "CREATE"} rev="C" date={new Date().toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit" })} />
      </div>

      <div className="mx-auto max-w-7xl w-full px-4 py-8">
        {user && !user.emailVerified && (
          <div className="mb-8 border border-warning/40 bg-warning/10 px-4 py-3 flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-warning flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-warning-container text-xs font-bold">!</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-warning mb-1">Email verification required</p>
              <p className="text-xs text-on-surface-muted">Verify your email before publishing listings. Go to your profile to complete verification.</p>
            </div>
          </div>
        )}

        {/* Progress bar */}
        <div data-testid="create-progress" className="mb-8" aria-label="Progresso de publicación">
          <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.2em] text-on-surface-muted">
            <span>{editId ? "EDITAR COMPONENTE" : "NUEVO COMPONENTE"}</span>
            <span>PASO 1/3</span>
          </div>
          <div className="mt-2 h-2 w-full border border-outline bg-surface-1/40">
            <div className="h-full w-[33%] bg-secondary" />
          </div>
        </div>

        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-secondary transition-colors group"
        >
          <ArrowLeftIcon className="h-5 w-5 group-hover:-translate-x-1 transition-transform" aria-hidden="true" />
          Back to Marketplace
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 md:gap-16">
          {/* LEFT: Upload Zone */}
          <div className="lg:col-span-5">
            <TitleBlock code="ASSET-BAY" rev="B" className="mb-4" />
            {editLoading ? (
              <div className="flex justify-center py-16">
                <div className="animate-spin h-12 w-12 rounded-full border-t-2 border-secondary" />
              </div>
            ) : (
              <>
                <p className="mb-6 font-mono text-xs uppercase tracking-widest text-on-surface-muted">
                  {editId ? "EDITANDO LISTING EXISTENTE" : "GALERÍA DE IMÁGENES"}
                </p>
                <div data-testid="create-zone">
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
              </>
            )}
          </div>

          {/* RIGHT: Form */}
          <div className="lg:col-span-7 border border-outline bg-surface-1/40 p-6 md:p-10 relative">
            <form onSubmit={handleSubmit} className="space-y-8" noValidate>
              {/* Game Title + RAWG Search */}
              <div className="space-y-2">
                <label
                  className="font-mono text-[10px] uppercase tracking-widest text-on-surface-muted block ml-1"
                  htmlFor="englishName"
                >
                  Game Title <span className="text-error" aria-hidden="true">*</span>
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
                    className="w-full border border-outline bg-surface-2/60 px-4 py-3 font-mono text-sm text-on-surface placeholder:text-on-surface-muted/50 outline-none transition-colors focus:border-secondary"
                    placeholder="e.g. The Legend of Zelda"
                  />
                  {searching && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2" aria-hidden="true">
                      <div className="animate-spin h-4 w-4 border-2 border-secondary border-t-transparent rounded-full" />
                    </div>
                  )}
                  {!searching && (
                    <MagnifyingGlassIcon
                      className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-muted pointer-events-none"
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
                    className="font-mono text-[10px] uppercase tracking-widest text-on-surface-muted block ml-1"
                    htmlFor="category"
                  >
                    Platform <span className="text-error" aria-hidden="true">*</span>
                  </label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full appearance-none border border-outline bg-surface-2/60 px-4 py-3 font-mono text-sm text-on-surface outline-none transition-colors focus:border-secondary cursor-pointer"
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
                    className="font-mono text-[10px] uppercase tracking-widest text-on-surface-muted block ml-1"
                    htmlFor="state"
                  >
                    Condition <span className="text-error" aria-hidden="true">*</span>
                  </label>
                  <select
                    id="state"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    className="w-full appearance-none border border-outline bg-surface-2/60 px-4 py-3 font-mono text-sm text-on-surface outline-none transition-colors focus:border-secondary cursor-pointer"
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
                  className="font-mono text-[10px] uppercase tracking-widest text-on-surface-muted block ml-1"
                  htmlFor="ownPrice"
                >
                  Asking Price <span className="text-error" aria-hidden="true">*</span>
                </label>
                <div className="relative">
                  <span
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary font-bold text-lg"
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
                    className="w-full border border-outline bg-surface-2/60 pl-10 pr-4 py-3 font-mono text-sm text-on-surface placeholder:text-on-surface-muted/50 outline-none transition-colors focus:border-secondary [appearance:textfield]"
                    placeholder="0.00"
                  />
                </div>
                <FieldFeedback id="err-ownPrice" message={showFieldError("ownPrice")} />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label
                  className="font-mono text-[10px] uppercase tracking-widest text-on-surface-muted block ml-1"
                  htmlFor="description"
                >
                  Game Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className={`${getInputClassNames(false)} resize-none font-mono`}
                  placeholder="Describe the game, condition, and any notable details..."
                  rows={6}
                />
              </div>

              {/* CTA Buttons */}
              <div className="pt-6 flex flex-col md:flex-row gap-4">
                <button
                  type="submit"
                  disabled={loading || editLoading}
                  className="flex-1 min-h-12 border border-secondary bg-secondary/10 px-4 font-mono text-xs uppercase tracking-widest text-secondary transition-colors active:bg-secondary/20 disabled:opacity-60"
                >
                  {loading ? "PUBLICANDO…" : editId ? "ACTUALIZAR LISTING" : "PUBLICAR COMPONENTE"}
                </button>
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="px-8 min-h-12 border border-outline px-4 font-mono text-xs uppercase tracking-widest text-on-surface-muted transition-colors active:border-secondary active:text-secondary"
                >
                  Cancelar
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

export default function CreateVideogamePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-surface" />}>
      <CreateVideogameContent />
    </Suspense>
  );
}
