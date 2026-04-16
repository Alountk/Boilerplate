"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { VideogameService } from "../../infrastructure/services/VideogameService";
import { ImageService } from "../../infrastructure/services/ImageService";
import { GameState } from "../../domain/models/Videogame";
import {
  ArrowLeftIcon,
  MagnifyingGlassIcon,
  ExclamationCircleIcon,
  TrashIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import { scrollToFirstError, getInputClassNames } from "../../utils/formUtils";
import { RAWGService } from "../../infrastructure/services/RAWGService";
import { RAWGGame } from "../../domain/ports/IRAWGService";

import { useAuth } from "../../context/AuthContext";

function FieldFeedback({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="mt-1 flex items-center gap-1.5 text-xs text-error font-medium">
      <ExclamationCircleIcon className="h-4 w-4 shrink-0" />
      <span>{message}</span>
    </p>
  );
}

export default function CreateVideogamePage() {
  const { user, loading: authLoading } = useAuth();

  const [formData, setFormData] = useState({
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
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const validate = (data: typeof formData) => {
    const nextErrors: Record<string, string> = {};
    if (!data.englishName.trim()) nextErrors.englishName = "English name is required.";
    if (!data.console.trim()) nextErrors.console = "Console is required.";
    if (!data.releaseDate) nextErrors.releaseDate = "Release date is required.";
    if (data.ownPrice <= 0) nextErrors.ownPrice = "Asking price must be greater than 0.";
    return nextErrors;
  };

  const showFieldError = (name: string) => {
    if (errors[name] && (touched[name] || submitAttempted)) return errors[name];
    return undefined;
  };

  const router = useRouter();
  const videogameService = useMemo(() => new VideogameService(), []);
  const imageService = useMemo(() => new ImageService(), []);
  const rawgService = useMemo(() => new RAWGService(), []);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrMessage, setOcrMessage] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<RAWGGame[]>([]);
  const [showSearch, setShowSearch] = useState(false);

  const getImageUrl = (filename: string) => {
    // We must use the full filename (with extension) because that's how it's stored in S3.
    // The backend proxy endpoint /api/Images/{fileName} will stream the image content.
    const baseUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:5017/api";
    return `${baseUrl}/Images/${filename}`;
  };
  const [uploadingStates, setUploadingStates] = useState<
    Record<string, boolean>
  >({});
  const [images, setImages] = useState<string[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const [names, setNames] = useState([{ language: "", name: "" }]);
  const [contents, setContents] = useState([
    {
      frontalUrl: "",
      backUrl: "",
      rightSideUrl: "",
      leftSideUrl: "",
      topSideUrl: "",
      bottomSideUrl: "",
    },
  ]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  // RAWG Search Effect
  useEffect(() => {
    const searchTerm = formData.englishName.trim();
    if (searchTerm.length < 3) {
      setSearchResults([]);
      setShowSearch(false);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await rawgService.searchGames(searchTerm);
        setSearchResults(results);
        setShowSearch(results.length > 0);
      } catch (error) {
        console.error("RAWG Search failed", error);
      } finally {
        setSearching(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.englishName, rawgService]);

  const getLikelyTitleFromOcr = (rawText: string) => {
    const blockedTerms = new Set([
      "playstation",
      "ps4",
      "ps5",
      "xbox",
      "xbox one",
      "nintendo",
      "switch",
      "rated",
      "teen",
      "mature",
      "pegi",
      "www",
      "ubisoft",
      "electronic arts",
      "capcom",
      "konami",
      "bandai",
      "namco",
      "square enix",
      "activision",
      "sega",
    ]);

    const candidates = rawText
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length >= 4 && line.length <= 60)
      .filter((line) => /[a-zA-Z]/.test(line))
      .filter((line) => !blockedTerms.has(line.toLowerCase()))
      .filter((line) => !/^\d+$/.test(line));

    if (candidates.length === 0) return "";

    const best = candidates
      .sort((a, b) => b.length - a.length)
      .find((line) => {
        const lower = line.toLowerCase();
        return !Array.from(blockedTerms).some((term) => lower.includes(term));
      });

    return (best || candidates[0]).replace(/[^\w\s:'-]/g, "").trim();
  };

  const runOcrAutofillFromImage = async (file: File) => {
    setOcrLoading(true);
    setOcrMessage("Analizando portada para detectar el juego...");

    try {
      const { createWorker } = await import("tesseract.js");
      const worker = await createWorker("eng");
      const {
        data: { text },
      } = await worker.recognize(file);
      await worker.terminate();

      const detectedTitle = getLikelyTitleFromOcr(text);
      if (!detectedTitle || detectedTitle.length < 3) {
        setOcrMessage("No se pudo detectar un titulo claro en la portada.");
        return;
      }

      const results = await rawgService.searchGames(detectedTitle);
      if (!results.length) {
        setFormData((prev) => ({
          ...prev,
          englishName: prev.englishName || detectedTitle,
        }));
        setOcrMessage(`Texto detectado: ${detectedTitle}. No hubo match exacto en RAWG.`);
        return;
      }

      setOcrMessage(`Detectado: ${detectedTitle}. Completando datos con RAWG...`);
      await handleSelectGame(results[0]);
      setOcrMessage(`Autocompletado listo: ${results[0].name}.`);
    } catch (error) {
      console.error("OCR autofill failed", error);
      setOcrMessage("No se pudo analizar la imagen automaticamente.");
    } finally {
      setOcrLoading(false);
    }
  };

  const handleSelectGame = async (game: RAWGGame) => {
    setShowSearch(false);
    setLoading(true);
    try {
      const details = await rawgService.getGameDetails(game.id);
      
      // Map platform to category
      const platformNames = details.platforms.map(p => p.platform.slug.toLowerCase());
      let category = 5; // Other
      if (platformNames.some(p => p.includes('playstation'))) category = 0;
      else if (platformNames.some(p => p.includes('xbox'))) category = 1;
      else if (platformNames.some(p => p.includes('nintendo') || p.includes('switch') || p.includes('wii') || p.includes('gamecube') || p.includes('n64') || p.includes('snes') || p.includes('nes'))) category = 2;
      else if (platformNames.some(p => p.includes('sega') || p.includes('genesis') || p.includes('saturn') || p.includes('dreamcast'))) category = 3;
      else if (platformNames.some(p => p.includes('pc'))) category = 4;

      // Extract console name
      const consoleName = details.platforms.length > 0 ? details.platforms[0].platform.name : "";

      setFormData(prev => ({
        ...prev,
        englishName: details.name,
        releaseDate: details.released || "",
        console: consoleName,
        description: details.description_raw || prev.description,
        score: details.metacritic || 0,
        category: category,
        urlImg: details.background_image || prev.urlImg
      }));
    } catch (error) {
      console.error("Failed to fetch game details", error);
    } finally {
      setLoading(false);
    }
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
      const fieldErrors = validate(next);
      setErrors(fieldErrors);
      return next;
    });
    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  const handleMultipleFilesChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    console.log({files})
    setUploading(true);
    try {
      console.log({files})
      const uploadPromises = Array.from(files).map((file) =>
        imageService.uploadImage(file)
      );
      const fileNames = await Promise.all(uploadPromises);

      setImages((prev) => [...prev, ...fileNames]);
      // Set first image as urlImg for backward compatibility
      if (images.length === 0 && fileNames.length > 0) {
        setFormData((prev) => ({ ...prev, urlImg: fileNames[0] }));
      }

      // MVP: OCR on first uploaded image to infer game title and autofill via RAWG.
      if (formData.englishName.trim().length === 0 && files[0]) {
        void runOcrAutofillFromImage(files[0]);
      }
    } catch (error) {
      console.error("Image upload failed", error);
      alert("Failed to upload images. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
    // Update urlImg to first remaining image or empty
    setFormData((prev) => ({ ...prev, urlImg: newImages[0] || "" }));
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (dropIndex: number) => {
    if (draggedIndex === null) return;

    const newImages = [...images];
    const [draggedImage] = newImages.splice(draggedIndex, 1);
    newImages.splice(dropIndex, 0, draggedImage);

    setImages(newImages);
    setFormData((prev) => ({ ...prev, urlImg: newImages[0] || "" }));
    setDraggedIndex(null);
  };

  const handleSideImageUpload = async (side: string, file: File) => {
    setUploadingStates((prev) => ({ ...prev, [side]: true }));
    try {
      const fileName = await imageService.uploadImage(file);
      const newContents = [...contents];
      newContents[0] = { ...newContents[0], [side]: fileName };
      setContents(newContents);
    } catch (error) {
      console.error(`Failed to upload ${side} image`, error);
      alert(`Failed to upload ${side} image. Please try again.`);
    } finally {
      setUploadingStates((prev) => ({ ...prev, [side]: false }));
    }
  };

  const handleNameChange = (
    index: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const newNames = [...names];
    newNames[index] = { ...newNames[index], [e.target.name]: e.target.value };
    setNames(newNames);
  };

  const addName = () => setNames([...names, { language: "", name: "" }]);
  const removeName = (index: number) =>
    setNames(names.filter((_, i) => i !== index));

  const handleContentChange = (
    index: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const newContents = [...contents];
    newContents[index] = {
      ...newContents[index],
      [e.target.name]: e.target.value,
    };
    setContents(newContents);
  };

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

      // If there are no uploaded images and no cover URL, fetch an official cover from RAWG.
      if (images.length === 0 && !resolvedUrlImg.trim() && formData.englishName.trim().length >= 3) {
        const officialMatches = await rawgService.searchGames(formData.englishName.trim());
        resolvedUrlImg = officialMatches[0]?.background_image || "";
      }

      // Ensure numeric fields are numbers and filter empty localized names
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
        names: names.filter(
          (n) => n.name.trim() !== "" && n.language.trim() !== ""
        ),
        assets: [],
        images: images, // Use the images array
        // Ensure date is in ISO format
        releaseDate: new Date(formData.releaseDate).toISOString(),
        contents: contents.map((c) => ({
          frontalUrl: c.frontalUrl || "",
          backUrl: c.backUrl || "",
          rightSideUrl: c.rightSideUrl || "",
          leftSideUrl: c.leftSideUrl || "",
          topSideUrl: c.topSideUrl || "",
          bottomSideUrl: c.bottomSideUrl || "",
        })),
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await videogameService.create(payload as any);
      router.push("/");
    } catch (error) {
      console.error("Failed to create videogame", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface text-on-surface flex flex-col">
      {/* Back to Dashboard */}
      <div className="max-w-7xl w-full mx-auto px-6 md:px-12 py-12">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-primary hover:text-on-surface transition-colors group mb-8"
        >
          <ArrowLeftIcon className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-bold tracking-widest uppercase">Back to Marketplace</span>
        </Link>

        {/* Main Grid: Left Hero + Upload | Right Form */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 md:gap-16">
          {/* LEFT SIDE: Hero & Upload Zone */}
          <div className="lg:col-span-5">
            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tighter text-on-surface mb-8 leading-[1.1]">
              List your <br/>
              <span className="text-transparent bg-clip-text bg-linear-to-br from-primary-container to-primary">
                next favorite
              </span><br/>
              <span className="text-transparent bg-clip-text bg-linear-to-br from-primary-container to-primary">
                game.
              </span>
            </h1>
            <p className="text-on-surface-variant text-lg leading-relaxed mb-12 max-w-md">
              Share detailed information and high-quality images of your videogame. Help collectors and gamers find their next treasure.
            </p>

            {/* Media Upload Zone */}
            <div className="space-y-4">
              <label className="block text-xs font-bold tracking-widest uppercase text-primary mb-4">
                Game Gallery
              </label>
              <div className="grid grid-cols-2 gap-4 h-[400px]">
                {/* Main upload area */}
                <div className="relative group cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed border-outline-variant/30 hover:border-primary/50 transition-all bg-surface-container-low flex items-center justify-center col-span-2 row-span-1"
                  onDragOver={(e) => { e.preventDefault(); }}
                  onDrop={(e) => {
                    e.preventDefault();
                    const files = e.dataTransfer.files;
                    if (files && files.length > 0) {
                      const input = document.getElementById('imageUpload') as HTMLInputElement;
                      if (input) {
                        input.files = files;
                        const event = new Event('change', { bubbles: true });
                        input.dispatchEvent(event);
                      }
                    }
                  }}
                >
                  <label className="cursor-pointer w-full h-full flex items-center justify-center">
                    <div className="text-center p-8">
                      <div className="material-symbols-outlined text-4xl text-primary mb-3 block text-center">
                        add_a_photo
                      </div>
                      <p className="text-sm font-medium text-on-surface">Upload game photos</p>
                      <p className="text-xs text-on-surface-variant mt-1">PNG, JPG up to 5MB each</p>
                      <input
                        id="imageUpload"
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleMultipleFilesChange}
                        className="hidden"
                        disabled={uploading}
                      />
                    </div>
                  </label>
                </div>

                {/* Image thumbnails grid */}
                {images.length > 0 && (
                  <>
                    {images.slice(0, 3).map((img, index) => (
                      <div
                        key={index}
                        draggable
                        onDragStart={() => handleDragStart(index)}
                        onDragOver={handleDragOver}
                        onDrop={() => handleDrop(index)}
                        className="relative group cursor-move overflow-hidden rounded-xl border border-outline-variant/10 hover:border-primary/50 transition-all bg-surface-container-highest flex items-center justify-center"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={getImageUrl(img)}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23222a3d" width="100" height="100"/%3E%3Ctext fill="%23666" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3E%3C/text%3E%3C/svg%3E';
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-1 right-1 bg-error hover:brightness-110 text-on-error rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </>
                )}
              </div>
              {uploading && (
                <div className="flex items-center gap-2 text-primary text-sm font-medium">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  Uploading...
                </div>
              )}
              {ocrLoading && (
                <div className="flex items-center gap-2 text-primary text-sm font-medium">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  Analizando portada con OCR...
                </div>
              )}
              {ocrMessage && (
                <p className="text-xs text-on-surface-variant bg-surface-container-high rounded-lg px-3 py-2 border border-outline-variant/20">
                  {ocrMessage}
                </p>
              )}
              {images.length > 3 && (
                <p className="text-xs text-on-surface-variant">
                  +{images.length - 3} more image{images.length - 3 !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>

          {/* RIGHT SIDE: Form */}
          <div className="lg:col-span-7 bg-surface-container-low p-8 md:p-12 rounded-3xl shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary-container/5 blur-[120px] -z-10"></div>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Game Title */}
              <div className="space-y-2">
                <label className="text-xs font-bold tracking-widest uppercase text-on-surface-variant ml-1">
                  Game Title
                </label>
                <div className="relative">
                  <input
                    id="englishName"
                    name="englishName"
                    value={formData.englishName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className="w-full bg-surface-container-highest border-none focus:ring-1 focus:ring-primary rounded-xl px-6 py-4 text-on-surface placeholder:text-outline/50 transition-all font-medium"
                    aria-invalid={!!showFieldError('englishName')}
                    placeholder="e.g. The Legend of Zelda"
                  />
                  <FieldFeedback message={showFieldError('englishName')} />
                  {searching && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
                    </div>
                  )}
                  {showSearch && searchResults.length > 0 && (
                    <div className="absolute z-50 w-full mt-2 bg-surface-container rounded-lg shadow-2xl border border-outline-variant/30 max-h-60 overflow-y-auto top-full">
                      {searchResults.map((game) => (
                        <button
                          key={game.id}
                          type="button"
                          onClick={() => handleSelectGame(game)}
                          className="w-full flex items-center gap-3 p-3 hover:bg-surface-container-high text-left transition-colors border-b last:border-0 border-outline-variant/20"
                        >
                          {game.background_image ? (
                            <Image
                              src={game.background_image}
                              alt={game.name}
                              width={48}
                              height={48}
                              className="w-12 h-12 object-cover rounded shadow-sm"
                              unoptimized
                            />
                          ) : (
                            <div className="w-12 h-12 bg-surface-container-high flex items-center justify-center rounded">
                              <MagnifyingGlassIcon className="h-4 w-4 text-outline" />
                            </div>
                          )}
                          <div className="flex-1">
                            <div className="font-bold text-on-surface text-sm">{game.name}</div>
                            <div className="text-xs text-on-surface-variant">
                              {game.released ? new Date(game.released).getFullYear() : 'TBA'} • {game.platforms?.[0]?.platform.name || 'Platform'}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Category & Condition */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold tracking-widest uppercase text-on-surface-variant ml-1">
                    Platform
                  </label>
                  <div className="relative">
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
                    <svg className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-outline w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold tracking-widest uppercase text-on-surface-variant ml-1">
                    Condition
                  </label>
                  <div className="relative">
                    <select
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      className="w-full appearance-none bg-surface-container-highest border-none focus:ring-1 focus:ring-primary rounded-xl px-6 py-4 text-on-surface transition-all font-medium cursor-pointer"
                    >
                      <option value={GameState.Sealed}>Sealed</option>
                      <option value={GameState.Opened}>Like New</option>
                      <option value={GameState.Damaged}>Good</option>
                    </select>
                    <svg className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-outline w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M7.172 7.172C5.026 9.318 5.026 12.682 7.172 14.828m10.656-10.656C18.974 9.318 18.974 12.682 16.828 14.828" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Price */}
              <div className="space-y-2">
                <label className="text-xs font-bold tracking-widest uppercase text-on-surface-variant ml-1">
                  Asking Price
                </label>
                <div className="relative">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 text-primary font-bold text-lg">$</span>
                  <input
                    id="ownPrice"
                    name="ownPrice"
                    type="number"
                    step="0.01"
                    value={formData.ownPrice}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className="w-full bg-surface-container-highest border-none focus:ring-1 focus:ring-primary rounded-xl pl-14 pr-6 py-4 text-on-surface placeholder:text-outline/50 transition-all font-medium [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    aria-invalid={!!showFieldError('ownPrice')}
                    placeholder="0.00"
                  />
                  <FieldFeedback message={showFieldError('ownPrice')} />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="text-xs font-bold tracking-widest uppercase text-on-surface-variant ml-1">
                  Game Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full bg-surface-container-highest border-none focus:ring-1 focus:ring-primary rounded-xl px-6 py-4 text-on-surface placeholder:text-outline/50 transition-all font-medium resize-none"
                  placeholder="Describe the game, condition, and any notable details..."
                  rows={6}
                />
              </div>

              {/* Action Buttons */}
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

        {/* Collapsible Advanced Section */}
        <details className="mt-16 bg-surface-container-low p-8 rounded-2xl border border-outline-variant/20 group">
          <summary className="cursor-pointer font-bold text-on-surface flex items-center gap-2 hover:text-primary transition-colors">
            <span className="transition-transform group-open:rotate-90 inline-block">▶</span>
            Advanced Options
          </summary>
          <div className="mt-6 space-y-8">
            {/* Console / Release Date / Version */}
            <section>
              <h3 className="text-sm font-bold text-primary mb-4 uppercase tracking-widest">Release Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold tracking-widest uppercase text-on-surface-variant">Console</label>
                  <input
                    id="console"
                    name="console"
                    value={formData.console}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={getInputClassNames(!!showFieldError('console'))}
                    placeholder="e.g. Nintendo Switch"
                  />
                  <FieldFeedback message={showFieldError('console')} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold tracking-widest uppercase text-on-surface-variant">Release Date</label>
                  <input
                    id="releaseDate"
                    name="releaseDate"
                    type="date"
                    value={formData.releaseDate}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={getInputClassNames(!!showFieldError('releaseDate'))}
                  />
                  <FieldFeedback message={showFieldError('releaseDate')} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold tracking-widest uppercase text-on-surface-variant">Version</label>
                  <input
                    id="versionGame"
                    name="versionGame"
                    value={formData.versionGame}
                    onChange={handleChange}
                    className={getInputClassNames(false)}
                    placeholder="PAL-ESP, NTSC, etc."
                  />
                </div>
              </div>
            </section>

            {/* Barcodes */}
            <section>
              <h3 className="text-sm font-bold text-primary mb-4 uppercase tracking-widest">Product Identifiers</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold tracking-widest uppercase text-on-surface-variant">QR Code</label>
                  <input
                    name="qr"
                    value={formData.qr}
                    onChange={handleChange}
                    className={getInputClassNames(false)}
                    placeholder="Optional QR reference"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold tracking-widest uppercase text-on-surface-variant">Barcode (EAN/UPC)</label>
                  <input
                    name="codebar"
                    value={formData.codebar}
                    onChange={handleChange}
                    className={getInputClassNames(false)}
                    placeholder="Optional barcode"
                  />
                </div>
              </div>
            </section>

            {/* Pricing Details */}
            <section>
              <h3 className="text-sm font-bold text-primary mb-4 uppercase tracking-widest">Pricing Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold tracking-widest uppercase text-on-surface-variant">Market Average</label>
                  <input
                    id="averagePrice"
                    name="averagePrice"
                    type="number"
                    step="0.01"
                    value={formData.averagePrice}
                    onChange={handleChange}
                    className={getInputClassNames(false)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold tracking-widest uppercase text-on-surface-variant">Accept Offers Range (%)</label>
                  <input
                    name="acceptOffersRange"
                    type="number"
                    value={formData.acceptOffersRange}
                    onChange={handleChange}
                    className={getInputClassNames(false)}
                    placeholder="e.g. 10"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold tracking-widest uppercase text-on-surface-variant">Condition Score (0-10)</label>
                  <input
                    name="generalState"
                    type="number"
                    step="0.1"
                    value={formData.generalState}
                    onChange={handleChange}
                    className={getInputClassNames(false)}
                  />
                </div>
              </div>
            </section>

            {/* Ratings */}
            <section>
              <h3 className="text-sm font-bold text-primary mb-4 uppercase tracking-widest">Ratings & Scores</h3>
              <div className="space-y-2">
                <label className="text-xs font-bold tracking-widest uppercase text-on-surface-variant">Critical Score</label>
                <input
                  name="score"
                  type="number"
                  step="0.1"
                  value={formData.score}
                  onChange={handleChange}
                  className={getInputClassNames(false)}
                  placeholder="Metacritic or similar score"
                />
              </div>
            </section>

            {/* Localized Names */}
            <section>
              <h3 className="text-sm font-bold text-primary mb-4 uppercase tracking-widest">Localized Titles</h3>
              <div className="space-y-4">
                {names.map((name, index) => (
                  <div
                    key={index}
                    className="flex gap-4 items-end bg-surface-container p-4 rounded-lg border border-outline-variant/20"
                  >
                    <div className="flex-1">
                      <label className="block text-xs font-bold mb-1 text-on-surface-variant uppercase">Language</label>
                      <input
                        name="language"
                        value={name.language}
                        onChange={(e) => handleNameChange(index, e)}
                        className={getInputClassNames(false)}
                        placeholder="ES, FR, JP, etc."
                      />
                    </div>
                    <div className="flex-2">
                      <label className="block text-xs font-bold mb-1 text-on-surface-variant uppercase">Localized Title</label>
                      <input
                        name="name"
                        value={name.name}
                        onChange={(e) => handleNameChange(index, e)}
                        className={getInputClassNames(false)}
                        placeholder="Translated game title"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeName(index)}
                      className="p-2 text-error hover:bg-error/10 rounded-lg"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addName}
                  className="flex items-center gap-2 text-primary font-bold hover:underline text-sm"
                >
                  <PlusIcon className="h-4 w-4" /> Add Translation
                </button>
              </div>
            </section>

            {/* Box Art (6 Sides) */}
            <section>
              <h3 className="text-sm font-bold text-primary mb-4 uppercase tracking-widest">Box Art (6 Sides)</h3>
              <p className="text-xs text-on-surface-variant mb-6">Upload or link high-resolution scans of each side of the game box.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {['frontalUrl', 'backUrl', 'rightSideUrl', 'leftSideUrl', 'topSideUrl', 'bottomSideUrl'].map((side, i) => {
                  const sideLabel = {
                    frontalUrl: 'Front',
                    backUrl: 'Back',
                    rightSideUrl: 'Right',
                    leftSideUrl: 'Left',
                    topSideUrl: 'Top',
                    bottomSideUrl: 'Bottom',
                  }[side] || side;

                  return (
                    <div key={i}>
                      <label className="block text-xs font-bold mb-2 text-on-surface-variant uppercase">
                        {sideLabel}
                      </label>
                      {contents[0][side as keyof typeof contents[0]] && (
                        <div className="mb-2">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={getImageUrl(contents[0][side as keyof typeof contents[0]] as string)}
                            alt={`${sideLabel} preview`}
                            className="w-full h-24 object-cover rounded border border-outline-variant/30"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23222a3d" width="100" height="100"/%3E%3C/svg%3E';
                            }}
                          />
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleSideImageUpload(side, file);
                        }}
                        className="hidden"
                        id={`${side}-upload`}
                      />
                      <label
                        htmlFor={`${side}-upload`}
                        className="flex-1 cursor-pointer bg-primary-container hover:brightness-110 text-on-primary-container text-xs py-2 px-3 rounded text-center transition-colors block"
                      >
                        {uploadingStates[side] ? "Uploading..." : "Upload"}
                      </label>
                      <input
                        name={side}
                        value={contents[0][side as keyof typeof contents[0]] as string}
                        onChange={(e) => handleContentChange(0, e)}
                        className={getInputClassNames(false) + " text-xs mt-2"}
                        placeholder="Or paste URL"
                      />
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        </details>
      </div>

      <style jsx>{`
        .form-input {
          width: 100%;
          padding: 0.875rem 1rem;
          border-radius: 0.5rem;
          border: 1px solid rgba(70, 69, 85, 0.4);
          background-color: #2d3449;
          color: #dae2fd;
          transition: all 0.2s;
        }
        .form-input::placeholder {
          color: rgba(145, 143, 161, 0.75);
        }
        .form-input:focus {
          outline: none;
          border-color: #c3c0ff;
          box-shadow: 0 0 0 2px rgba(195, 192, 255, 0.35);
        }
      `}</style>
    </div>
  );
}

