"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { VideogameService } from "../../infrastructure/services/VideogameService";
import { ImageService } from "../../infrastructure/services/ImageService";
import { GameState } from "../../domain/models/Videogame";
import {
  PhotoIcon,
  CurrencyDollarIcon,
  BeakerIcon,
  GlobeAltIcon,
  PlusIcon,
  TrashIcon,
  TagIcon,
  MagnifyingGlassIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";
import { scrollToFirstError, getInputClassNames } from "../../utils/formUtils";
import { RAWGService } from "../../infrastructure/services/RAWGService";
import { RAWGGame } from "../../domain/ports/IRAWGService";

import { useAuth } from "../../context/AuthContext";

function FieldFeedback({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="mt-1 flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400 font-medium">
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
  const videogameService = new VideogameService();
  const imageService = new ImageService();
  const rawgService = new RAWGService();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [searching, setSearching] = useState(false);
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
  }, [formData.englishName]);

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

      // If there is an image, we could add it to the images array too
      if (details.background_image) {
        // Note: This image is external, won't be in our S3, but we can store the URL for now
        // if the system supports external URLs in urlImg
      }

    } catch (error) {
      console.error("Failed to fetch game details", error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

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

    setUploading(true);
    try {
      const uploadPromises = Array.from(files).map((file) =>
        imageService.uploadImage(file)
      );
      const fileNames = await Promise.all(uploadPromises);

      setImages((prev) => [...prev, ...fileNames]);
      // Set first image as urlImg for backward compatibility
      if (images.length === 0 && fileNames.length > 0) {
        setFormData((prev) => ({ ...prev, urlImg: fileNames[0] }));
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
      // Ensure numeric fields are numbers and filter empty localized names
      const payload = {
        ...formData,
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
    <div className="min-h-screen py-12 px-4 bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700">
        <div className="bg-blue-600 p-6 text-white text-center">
          <h2 className="text-3xl font-bold">List an Item for Sale</h2>
          <p className="opacity-80">Share your game with the community</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-10">
          {/* Basic Info */}
          <section>
            <div className="flex items-center gap-2 mb-6 text-blue-600 dark:text-blue-400 border-b border-gray-100 dark:border-gray-700 pb-2">
              <BeakerIcon className="h-6 w-6" />
              <h3 className="text-xl font-bold">Basic Information</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="englishName"
                  className="block text-sm font-semibold mb-2 dark:text-gray-300"
                >
                  English Name
                </label>
                <div className="relative">
                  <input
                    id="englishName"
                    name="englishName"
                    value={formData.englishName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={getInputClassNames(!!showFieldError('englishName'))}
                    aria-invalid={!!showFieldError('englishName')}
                    placeholder="e.g. The Legend of Zelda"
                  />
                  <FieldFeedback message={showFieldError('englishName')} />
                  {searching && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                    </div>
                  )}
                  {showSearch && searchResults.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-100 dark:border-gray-700 max-h-60 overflow-y-auto">
                      {searchResults.map((game) => (
                        <button
                          key={game.id}
                          type="button"
                          onClick={() => handleSelectGame(game)}
                          className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 text-left transition-colors border-b last:border-0 border-gray-50 dark:border-gray-700"
                        >
                          {game.background_image ? (
                            <img 
                              src={game.background_image} 
                              alt={game.name} 
                              className="w-12 h-12 object-cover rounded shadow-sm"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 flex items-center justify-center rounded">
                              <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
                            </div>
                          )}
                          <div className="flex-1">
                            <div className="font-bold text-gray-900 dark:text-gray-100 text-sm">{game.name}</div>
                            <div className="text-xs text-gray-500">
                              {game.released ? new Date(game.released).getFullYear() : 'TBA'} • {game.platforms?.[0]?.platform.name || 'Unknown platform'}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label
                  htmlFor="console"
                  className="block text-sm font-semibold mb-2 dark:text-gray-300"
                >
                  Console
                </label>
                <input
                  id="console"
                  name="console"
                  value={formData.console}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={getInputClassNames(!!showFieldError('console'))}
                  aria-invalid={!!showFieldError('console')}
                  placeholder="e.g. Nintendo Switch"
                />
                <FieldFeedback message={showFieldError('console')} />
              </div>
              <div>
                <label
                  htmlFor="releaseDate"
                  className="block text-sm font-semibold mb-2 dark:text-gray-300"
                >
                  Release Date
                </label>
                <input
                  id="releaseDate"
                  name="releaseDate"
                  type="date"
                  value={formData.releaseDate}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={getInputClassNames(!!showFieldError('releaseDate'))}
                  aria-invalid={!!showFieldError('releaseDate')}
                />
                <FieldFeedback message={showFieldError('releaseDate')} />
              </div>
              <div>
                <label
                  htmlFor="versionGame"
                  className="block text-sm font-semibold mb-2 dark:text-gray-300"
                >
                  Version
                </label>
                <input
                  id="versionGame"
                  name="versionGame"
                  value={formData.versionGame}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="e.g. PAL-ESP, NTSC"
                />
              </div>
              <div>
                <label
                  htmlFor="category"
                  className="block text-sm font-semibold mb-2 dark:text-gray-300"
                >
                  Category
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="form-input"
                  required
                >
                  <option value={0}>PlayStation</option>
                  <option value={1}>Xbox</option>
                  <option value={2}>Nintendo</option>
                  <option value={3}>Sega</option>
                  <option value={4}>PC</option>
                  <option value={5}>Other</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2 dark:text-gray-300">
                    QR Code
                  </label>
                  <input
                    name="qr"
                    value={formData.qr}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="QR Reference"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2 dark:text-gray-300">
                    Barcode
                  </label>
                  <input
                    name="codebar"
                    value={formData.codebar}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="EAN/UPC"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Multilingual Names */}
          <section>
            <div className="flex items-center gap-2 mb-6 text-blue-600 dark:text-blue-400 border-b border-gray-100 dark:border-gray-700 pb-2">
              <GlobeAltIcon className="h-6 w-6" />
              <h3 className="text-xl font-bold">Localized Names</h3>
            </div>
            <div className="space-y-4">
              {names.map((name, index) => (
                <div
                  key={index}
                  className="flex gap-4 items-end bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg"
                >
                  <div className="flex-1">
                    <label className="block text-xs font-bold mb-1 dark:text-gray-400 uppercase">
                      Language
                    </label>
                    <input
                      name="language"
                      value={name.language}
                      onChange={(e) => handleNameChange(index, e)}
                      className="form-input"
                      placeholder="e.g. ES, FR, JP"
                    />
                  </div>
                  <div className="flex-2">
                    <label className="block text-xs font-bold mb-1 dark:text-gray-400 uppercase">
                      Localized Name
                    </label>
                    <input
                      name="name"
                      value={name.name}
                      onChange={(e) => handleNameChange(index, e)}
                      className="form-input"
                      placeholder="e.g. La Leyenda de Zelda"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeName(index)}
                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addName}
                className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold hover:underline"
              >
                <PlusIcon className="h-4 w-4" /> Add Another Language
              </button>
            </div>
          </section>

          {/* Pricing & State */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div>
              <div className="flex items-center gap-2 mb-6 text-blue-600 dark:text-blue-400 border-b border-gray-100 dark:border-gray-700 pb-2">
                <CurrencyDollarIcon className="h-6 w-6" />
                <h3 className="text-xl font-bold">Pricing</h3>
              </div>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label
                      htmlFor="averagePrice"
                      className="block text-sm font-semibold mb-2 dark:text-gray-300"
                    >
                      Average Market Price
                    </label>
                    <input
                      id="averagePrice"
                      name="averagePrice"
                      type="number"
                      step="0.01"
                      value={formData.averagePrice}
                      onChange={handleChange}
                      className="form-input"
                    />
                  </div>
                  <div className="flex-1">
                    <label
                      htmlFor="ownPrice"
                      className="block text-sm font-semibold mb-2 dark:text-gray-300"
                    >
                      Your Asking Price
                    </label>
                    <input
                      id="ownPrice"
                      name="ownPrice"
                      type="number"
                      step="0.01"
                      value={formData.ownPrice}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={getInputClassNames(!!showFieldError('ownPrice'))}
                      aria-invalid={!!showFieldError('ownPrice')}
                    />
                    <FieldFeedback message={showFieldError('ownPrice')} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2 dark:text-gray-300">
                    Accept Offers Range (%)
                  </label>
                  <input
                    name="acceptOffersRange"
                    type="number"
                    value={formData.acceptOffersRange}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="e.g. 10 for 10% range"
                  />
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-6 text-blue-600 dark:text-blue-400 border-b border-gray-100 dark:border-gray-700 pb-2">
                <TagIcon className="h-6 w-6" />
                <h3 className="text-xl font-bold">Condition</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2 dark:text-gray-300">
                    General State (0-10)
                  </label>
                  <input
                    name="generalState"
                    type="number"
                    step="0.1"
                    value={formData.generalState}
                    onChange={handleChange}
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2 dark:text-gray-300">
                    Official Score
                  </label>
                  <input
                    name="score"
                    type="number"
                    step="0.1"
                    value={formData.score}
                    onChange={handleChange}
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2 dark:text-gray-300">
                    Packaging State
                  </label>
                  <select
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    className="form-input"
                  >
                    <option value={GameState.Sealed}>Sealed (New)</option>
                    <option value={GameState.Opened}>Opened (Used)</option>
                    <option value={GameState.Damaged}>Damaged</option>
                  </select>
                </div>
              </div>
            </div>
          </section>

          {/* Media & 6-Side Details */}
          <section>
            <div className="flex items-center gap-2 mb-6 text-blue-600 dark:text-blue-400 border-b border-gray-100 dark:border-gray-700 pb-2">
              <PhotoIcon className="h-6 w-6" />
              <h3 className="text-xl font-bold">Photos & Dimensions</h3>
            </div>

            <div className="mb-6">
              <label
                htmlFor="imageUpload"
                className="block text-sm font-semibold mb-2 dark:text-gray-300"
              >
                Upload Cover Images
              </label>
              <div className="space-y-4">
                <div>
                  <input
                    id="imageUpload"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleMultipleFilesChange}
                    className="form-input"
                    disabled={uploading}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    JPG, PNG or WebP. Max 5MB each. You can upload multiple
                    images.
                  </p>
                </div>
                {uploading && (
                  <div className="flex items-center gap-2 text-blue-600 text-sm font-medium">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    Uploading...
                  </div>
                )}
                {images.length > 0 && !uploading && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {images.map((img, index) => (
                      <div
                        key={index}
                        draggable
                        onDragStart={() => handleDragStart(index)}
                        onDragOver={handleDragOver}
                        onDrop={() => handleDrop(index)}
                        className="relative group cursor-move rounded-lg overflow-hidden border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 transition-all"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={getImageUrl(img)}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-32 object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EImage%3C/text%3E%3C/svg%3E';
                          }}
                        />
                        <div className="absolute top-1 left-1 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                          {index + 1}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
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
                  </div>
                )}
              </div>
              <input type="hidden" name="urlImg" value={formData.urlImg} />
            </div>

            <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-xl space-y-6">
              <h4 className="font-bold text-gray-700 dark:text-gray-300 mb-4 uppercase text-xs tracking-widest">
                The 6 Sides (URLs)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold mb-1 dark:text-gray-500 uppercase">
                    Front
                  </label>
                  {contents[0].frontalUrl && (
                    <div className="mb-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={getImageUrl(contents[0].frontalUrl)}
                        alt="Front preview"
                        className="w-full h-24 object-cover rounded border border-gray-300 dark:border-gray-600"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EFront%3C/text%3E%3C/svg%3E';
                        }}
                      />
                    </div>
                  )}
                  <div className="flex gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleSideImageUpload("frontalUrl", file);
                      }}
                      className="hidden"
                      id="frontalUrl-upload"
                    />
                    <label
                      htmlFor="frontalUrl-upload"
                      className="flex-1 cursor-pointer bg-blue-500 hover:bg-blue-600 text-white text-xs py-2 px-3 rounded text-center transition-colors"
                    >
                      {uploadingStates["frontalUrl"]
                        ? "Uploading..."
                        : "Upload"}
                    </label>
                  </div>
                  <input
                    name="frontalUrl"
                    value={contents[0].frontalUrl}
                    onChange={(e) => handleContentChange(0, e)}
                    className="form-input text-xs mt-2"
                    placeholder="Or paste URL"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1 dark:text-gray-500 uppercase">
                    Back
                  </label>
                  {contents[0].backUrl && (
                    <div className="mb-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={getImageUrl(contents[0].backUrl)}
                        alt="Back preview"
                        className="w-full h-24 object-cover rounded border border-gray-300 dark:border-gray-600"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EBack%3C/text%3E%3C/svg%3E';
                        }}
                      />
                    </div>
                  )}
                  <div className="flex gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleSideImageUpload("backUrl", file);
                      }}
                      className="hidden"
                      id="backUrl-upload"
                    />
                    <label
                      htmlFor="backUrl-upload"
                      className="flex-1 cursor-pointer bg-blue-500 hover:bg-blue-600 text-white text-xs py-2 px-3 rounded text-center transition-colors"
                    >
                      {uploadingStates["backUrl"] ? "Uploading..." : "Upload"}
                    </label>
                  </div>
                  <input
                    name="backUrl"
                    value={contents[0].backUrl}
                    onChange={(e) => handleContentChange(0, e)}
                    className="form-input text-xs mt-2"
                    placeholder="Or paste URL"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1 dark:text-gray-500 uppercase">
                    Right Side
                  </label>
                  {contents[0].rightSideUrl && (
                    <div className="mb-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={getImageUrl(contents[0].rightSideUrl)}
                        alt="Right side preview"
                        className="w-full h-24 object-cover rounded border border-gray-300 dark:border-gray-600"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3ERight%3C/text%3E%3C/svg%3E';
                        }}
                      />
                    </div>
                  )}
                  <div className="flex gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleSideImageUpload("rightSideUrl", file);
                      }}
                      className="hidden"
                      id="rightSideUrl-upload"
                    />
                    <label
                      htmlFor="rightSideUrl-upload"
                      className="flex-1 cursor-pointer bg-blue-500 hover:bg-blue-600 text-white text-xs py-2 px-3 rounded text-center transition-colors"
                    >
                      {uploadingStates["rightSideUrl"]
                        ? "Uploading..."
                        : "Upload"}
                    </label>
                  </div>
                  <input
                    name="rightSideUrl"
                    value={contents[0].rightSideUrl}
                    onChange={(e) => handleContentChange(0, e)}
                    className="form-input text-xs mt-2"
                    placeholder="Or paste URL"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1 dark:text-gray-500 uppercase">
                    Left Side
                  </label>
                  {contents[0].leftSideUrl && (
                    <div className="mb-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={getImageUrl(contents[0].leftSideUrl)}
                        alt="Left side preview"
                        className="w-full h-24 object-cover rounded border border-gray-300 dark:border-gray-600"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3ELeft%3C/text%3E%3C/svg%3E';
                        }}
                      />
                    </div>
                  )}
                  <div className="flex gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleSideImageUpload("leftSideUrl", file);
                      }}
                      className="hidden"
                      id="leftSideUrl-upload"
                    />
                    <label
                      htmlFor="leftSideUrl-upload"
                      className="flex-1 cursor-pointer bg-blue-500 hover:bg-blue-600 text-white text-xs py-2 px-3 rounded text-center transition-colors"
                    >
                      {uploadingStates["leftSideUrl"]
                        ? "Uploading..."
                        : "Upload"}
                    </label>
                  </div>
                  <input
                    name="leftSideUrl"
                    value={contents[0].leftSideUrl}
                    onChange={(e) => handleContentChange(0, e)}
                    className="form-input text-xs mt-2"
                    placeholder="Or paste URL"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1 dark:text-gray-500 uppercase">
                    Top
                  </label>
                  {contents[0].topSideUrl && (
                    <div className="mb-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={getImageUrl(contents[0].topSideUrl)}
                        alt="Top preview"
                        className="w-full h-24 object-cover rounded border border-gray-300 dark:border-gray-600"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3ETop%3C/text%3E%3C/svg%3E';
                        }}
                      />
                    </div>
                  )}
                  <div className="flex gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleSideImageUpload("topSideUrl", file);
                      }}
                      className="hidden"
                      id="topSideUrl-upload"
                    />
                    <label
                      htmlFor="topSideUrl-upload"
                      className="flex-1 cursor-pointer bg-blue-500 hover:bg-blue-600 text-white text-xs py-2 px-3 rounded text-center transition-colors"
                    >
                      {uploadingStates["topSideUrl"]
                        ? "Uploading..."
                        : "Upload"}
                    </label>
                  </div>
                  <input
                    name="topSideUrl"
                    value={contents[0].topSideUrl}
                    onChange={(e) => handleContentChange(0, e)}
                    className="form-input text-xs mt-2"
                    placeholder="Or paste URL"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1 dark:text-gray-500 uppercase">
                    Bottom
                  </label>
                  {contents[0].bottomSideUrl && (
                    <div className="mb-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={getImageUrl(contents[0].bottomSideUrl)}
                        alt="Bottom preview"
                        className="w-full h-24 object-cover rounded border border-gray-300 dark:border-gray-600"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EBottom%3C/text%3E%3C/svg%3E';
                        }}
                      />
                    </div>
                  )}
                  <div className="flex gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleSideImageUpload("bottomSideUrl", file);
                      }}
                      className="hidden"
                      id="bottomSideUrl-upload"
                    />
                    <label
                      htmlFor="bottomSideUrl-upload"
                      className="flex-1 cursor-pointer bg-blue-500 hover:bg-blue-600 text-white text-xs py-2 px-3 rounded text-center transition-colors"
                    >
                      {uploadingStates["bottomSideUrl"]
                        ? "Uploading..."
                        : "Upload"}
                    </label>
                  </div>
                  <input
                    name="bottomSideUrl"
                    value={contents[0].bottomSideUrl}
                    onChange={(e) => handleContentChange(0, e)}
                    className="form-input text-xs mt-2"
                    placeholder="Or paste URL"
                  />
                </div>
              </div>
            </div>
          </section>

          <section>
            <label
              htmlFor="description"
              className="block text-sm font-semibold mb-2 dark:text-gray-300"
            >
              Detailed Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={5}
              className="form-input"
              placeholder="Describe the item condition, history, etc..."
            />
          </section>

          <div className="pt-8 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-8 py-3 font-bold text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-12 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-full transition-all shadow-lg shadow-blue-500/25 disabled:opacity-50"
            >
              {loading ? "Publishing..." : "List Item Now"}
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        .form-input {
          width: 100%;
          padding: 0.75rem;
          border-radius: 0.5rem;
          border: 1px solid #e5e7eb;
          background-color: transparent;
          transition: all 0.2s;
        }
        :global(.dark) .form-input {
          border-color: #374151;
          color: white;
        }
        .form-input:focus {
          outline: none;
          ring: 2px;
          ring-color: #3b82f6;
          border-color: #3b82f6;
        }
      `}</style>
    </div>
  );
}
