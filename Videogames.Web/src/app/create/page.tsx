"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { VideogameService } from "../../infrastructure/services/VideogameService";
import { GameState } from "../../domain/models/Videogame";
import {
  PhotoIcon,
  CurrencyDollarIcon,
  BeakerIcon,
  GlobeAltIcon,
  PlusIcon,
  TrashIcon,
  TagIcon,
} from "@heroicons/react/24/outline";

export default function CreateVideogamePage() {
  const router = useRouter();
  const videogameService = new VideogameService();
  const [loading, setLoading] = useState(false);

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

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? parseFloat(value) : value,
    }));
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
        images: [],
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
                <label className="block text-sm font-semibold mb-2 dark:text-gray-300">
                  English Name
                </label>
                <input
                  name="englishName"
                  value={formData.englishName}
                  onChange={handleChange}
                  className="form-input"
                  required
                  placeholder="e.g. The Legend of Zelda"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 dark:text-gray-300">
                  Console
                </label>
                <input
                  name="console"
                  value={formData.console}
                  onChange={handleChange}
                  className="form-input"
                  required
                  placeholder="e.g. Nintendo Switch"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 dark:text-gray-300">
                  Release Date
                </label>
                <input
                  name="releaseDate"
                  type="date"
                  value={formData.releaseDate}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 dark:text-gray-300">
                  Version
                </label>
                <input
                  name="versionGame"
                  value={formData.versionGame}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="e.g. PAL-ESP, NTSC"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 dark:text-gray-300">
                  Category
                </label>
                <select
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
                    <label className="block text-sm font-semibold mb-2 dark:text-gray-300">
                      Average Market Price
                    </label>
                    <input
                      name="averagePrice"
                      type="number"
                      step="0.01"
                      value={formData.averagePrice}
                      onChange={handleChange}
                      className="form-input"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-semibold mb-2 dark:text-gray-300">
                      Your Asking Price
                    </label>
                    <input
                      name="ownPrice"
                      type="number"
                      step="0.01"
                      value={formData.ownPrice}
                      onChange={handleChange}
                      className="form-input"
                    />
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
              <label className="block text-sm font-semibold mb-2 dark:text-gray-300">
                Main Thumbnail URL
              </label>
              <input
                name="urlImg"
                value={formData.urlImg}
                onChange={handleChange}
                className="form-input"
                placeholder="https://..."
              />
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
                  <input
                    name="frontalUrl"
                    value={contents[0].frontalUrl}
                    onChange={(e) => handleContentChange(0, e)}
                    className="form-input text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1 dark:text-gray-500 uppercase">
                    Back
                  </label>
                  <input
                    name="backUrl"
                    value={contents[0].backUrl}
                    onChange={(e) => handleContentChange(0, e)}
                    className="form-input text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1 dark:text-gray-500 uppercase">
                    Right Side
                  </label>
                  <input
                    name="rightSideUrl"
                    value={contents[0].rightSideUrl}
                    onChange={(e) => handleContentChange(0, e)}
                    className="form-input text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1 dark:text-gray-500 uppercase">
                    Left Side
                  </label>
                  <input
                    name="leftSideUrl"
                    value={contents[0].leftSideUrl}
                    onChange={(e) => handleContentChange(0, e)}
                    className="form-input text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1 dark:text-gray-500 uppercase">
                    Top
                  </label>
                  <input
                    name="topSideUrl"
                    value={contents[0].topSideUrl}
                    onChange={(e) => handleContentChange(0, e)}
                    className="form-input text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1 dark:text-gray-500 uppercase">
                    Bottom
                  </label>
                  <input
                    name="bottomSideUrl"
                    value={contents[0].bottomSideUrl}
                    onChange={(e) => handleContentChange(0, e)}
                    className="form-input text-xs"
                  />
                </div>
              </div>
            </div>
          </section>

          <section>
            <label className="block text-sm font-semibold mb-2 dark:text-gray-300">
              Detailed Description
            </label>
            <textarea
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
