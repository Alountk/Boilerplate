"use client";

import { TrashIcon, PlusIcon } from "@heroicons/react/24/outline";
import { FieldFeedback } from "../FieldFeedback";
import { getInputClassNames } from "../../utils/formUtils";
import { resolveVideogameImageSrc } from "../../utils/videogameImages";
import { SideKey } from "../../hooks/useImageUpload";

type BoxArt = Record<SideKey, string>;

interface LocalizedName {
  language: string;
  name: string;
}

type FormDataSubset = {
  console: string;
  releaseDate: string;
  versionGame: string;
  qr: string;
  codebar: string;
  averagePrice: number;
  acceptOffersRange: number;
  generalState: number;
  score: number;
};

interface AdvancedOptionsProps {
  formData: FormDataSubset;
  showFieldError: (name: string) => string | undefined;
  onChange: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => void;
  onBlur: (
    e: React.FocusEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => void;
  names: LocalizedName[];
  boxArt: BoxArt;
  uploadingStates: Record<string, boolean>;
  onNameChange: (
    index: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => void;
  onAddName: () => void;
  onRemoveName: (index: number) => void;
  onContentChange: (e: React.ChangeEvent<HTMLInputElement>, side: SideKey) => void;
  onSideImageUpload: (side: SideKey, file: File) => void;
}

const SIDE_LABELS: Record<SideKey, string> = {
  frontalUrl: "Front",
  backUrl: "Back",
  rightSideUrl: "Right",
  leftSideUrl: "Left",
  topSideUrl: "Top",
  bottomSideUrl: "Bottom",
};

const BOX_SIDES: SideKey[] = [
  "frontalUrl",
  "backUrl",
  "rightSideUrl",
  "leftSideUrl",
  "topSideUrl",
  "bottomSideUrl",
];

/**
 * Sección avanzada del formulario de creación de videojuego.
 * Incluye: información de lanzamiento, identificadores, precios, puntuaciones,
 * títulos localizados y carátulas de caja (6 lados).
 */
export function AdvancedOptions({
  formData,
  showFieldError,
  onChange,
  onBlur,
  names,
  boxArt,
  uploadingStates,
  onNameChange,
  onAddName,
  onRemoveName,
  onContentChange,
  onSideImageUpload,
}: AdvancedOptionsProps) {
  return (
    <details className="mt-16 bg-surface-container-low p-8 rounded-2xl border border-outline-variant/20 group">
      <summary className="cursor-pointer font-bold text-on-surface flex items-center gap-2 hover:text-primary transition-colors">
        <span className="transition-transform group-open:rotate-90 inline-block" aria-hidden="true">▶</span>
        Advanced Options
      </summary>
      <div className="mt-6 space-y-8">

        {/* Release Information */}
        <section aria-labelledby="release-info-heading">
          <h3 id="release-info-heading" className="text-sm font-bold text-primary mb-4 uppercase tracking-widest">Release Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold tracking-widest uppercase text-on-surface-variant block" htmlFor="adv-console">Console</label>
              <input id="adv-console" name="console" value={formData.console} onChange={onChange} onBlur={onBlur} aria-invalid={!!showFieldError("console")} aria-describedby={showFieldError("console") ? "err-console" : undefined} className={getInputClassNames(!!showFieldError("console"))} placeholder="e.g. Nintendo Switch" />
              <FieldFeedback id="err-console" message={showFieldError("console")} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold tracking-widest uppercase text-on-surface-variant block" htmlFor="adv-releaseDate">Release Date</label>
              <input id="adv-releaseDate" name="releaseDate" type="date" value={formData.releaseDate} onChange={onChange} onBlur={onBlur} aria-invalid={!!showFieldError("releaseDate")} aria-describedby={showFieldError("releaseDate") ? "err-releaseDate" : undefined} className={getInputClassNames(!!showFieldError("releaseDate"))} />
              <FieldFeedback id="err-releaseDate" message={showFieldError("releaseDate")} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold tracking-widest uppercase text-on-surface-variant block" htmlFor="adv-versionGame">Version</label>
              <input id="adv-versionGame" name="versionGame" value={formData.versionGame} onChange={onChange} className={getInputClassNames(false)} placeholder="PAL-ESP, NTSC, etc." />
            </div>
          </div>
        </section>

        {/* Product Identifiers */}
        <section aria-labelledby="identifiers-heading">
          <h3 id="identifiers-heading" className="text-sm font-bold text-primary mb-4 uppercase tracking-widest">Product Identifiers</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold tracking-widest uppercase text-on-surface-variant block" htmlFor="adv-qr">QR Code</label>
              <input id="adv-qr" name="qr" value={formData.qr} onChange={onChange} className={getInputClassNames(false)} placeholder="Optional QR reference" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold tracking-widest uppercase text-on-surface-variant block" htmlFor="adv-codebar">Barcode (EAN/UPC)</label>
              <input id="adv-codebar" name="codebar" value={formData.codebar} onChange={onChange} className={getInputClassNames(false)} placeholder="Optional barcode" />
            </div>
          </div>
        </section>

        {/* Pricing Details */}
        <section aria-labelledby="pricing-heading">
          <h3 id="pricing-heading" className="text-sm font-bold text-primary mb-4 uppercase tracking-widest">Pricing Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold tracking-widest uppercase text-on-surface-variant block" htmlFor="adv-averagePrice">Market Average</label>
              <input id="adv-averagePrice" name="averagePrice" type="number" step="0.01" value={formData.averagePrice} onChange={onChange} className={getInputClassNames(false)} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold tracking-widest uppercase text-on-surface-variant block" htmlFor="adv-acceptOffersRange">Accept Offers Range (%)</label>
              <input id="adv-acceptOffersRange" name="acceptOffersRange" type="number" value={formData.acceptOffersRange} onChange={onChange} className={getInputClassNames(false)} placeholder="e.g. 10" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold tracking-widest uppercase text-on-surface-variant block" htmlFor="adv-generalState">Condition Score (0-10)</label>
              <input id="adv-generalState" name="generalState" type="number" step="0.1" value={formData.generalState} onChange={onChange} className={getInputClassNames(false)} />
            </div>
          </div>
        </section>

        {/* Ratings */}
        <section aria-labelledby="ratings-heading">
          <h3 id="ratings-heading" className="text-sm font-bold text-primary mb-4 uppercase tracking-widest">Ratings & Scores</h3>
          <div className="space-y-2 max-w-xs">
            <label className="text-xs font-bold tracking-widest uppercase text-on-surface-variant block" htmlFor="adv-score">Critical Score</label>
            <input id="adv-score" name="score" type="number" step="0.1" value={formData.score} onChange={onChange} className={getInputClassNames(false)} placeholder="Metacritic or similar score" />
          </div>
        </section>

        {/* Localized Titles */}
        <section aria-labelledby="localized-heading">
          <h3 id="localized-heading" className="text-sm font-bold text-primary mb-4 uppercase tracking-widest">Localized Titles</h3>
          <div className="space-y-4">
            {names.map((item, index) => (
              <div key={index} className="flex gap-4 items-end bg-surface-container p-4 rounded-lg border border-outline-variant/20">
                <div className="flex-1 space-y-1">
                  <label className="block text-xs font-bold mb-1 text-on-surface-variant uppercase" htmlFor={`lang-${index}`}>Language</label>
                  <input id={`lang-${index}`} name="language" value={item.language} onChange={(e) => onNameChange(index, e)} className={getInputClassNames(false)} placeholder="ES, FR, JP, etc." />
                </div>
                <div className="flex-2 space-y-1">
                  <label className="block text-xs font-bold mb-1 text-on-surface-variant uppercase" htmlFor={`name-${index}`}>Localized Title</label>
                  <input id={`name-${index}`} name="name" value={item.name} onChange={(e) => onNameChange(index, e)} className={getInputClassNames(false)} placeholder="Translated game title" />
                </div>
                <button type="button" onClick={() => onRemoveName(index)} aria-label="Remove translation" className="p-2 text-error hover:bg-error/10 rounded-lg transition-colors">
                  <TrashIcon className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
            ))}
            <button type="button" onClick={onAddName} className="flex items-center gap-2 text-primary font-bold hover:underline text-sm">
              <PlusIcon className="h-4 w-4" aria-hidden="true" /> Add Translation
            </button>
          </div>
        </section>

        {/* Box Art (6 Sides) */}
        <section aria-labelledby="boxart-heading">
          <h3 id="boxart-heading" className="text-sm font-bold text-primary mb-4 uppercase tracking-widest">Box Art (6 Sides)</h3>
          <p className="text-xs text-on-surface-variant mb-6">Upload or link high-resolution scans of each side of the game box.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {BOX_SIDES.map((side) => {
              const label = SIDE_LABELS[side];
              const currentUrl = boxArt[side];
              return (
                <div key={side} className="space-y-2">
                  <label className="block text-xs font-bold text-on-surface-variant uppercase">{label}</label>
                  {currentUrl && (
                    <div className="mb-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={resolveVideogameImageSrc(currentUrl) ?? ""}
                        alt={`${label} preview`}
                        className="w-full h-24 object-cover rounded border border-outline-variant/30"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23222a3d' width='100' height='100'/%3E%3C/svg%3E";
                        }}
                      />
                    </div>
                  )}
                  <input type="file" accept="image/*" id={`${side}-upload`} className="sr-only" aria-label={`Upload ${label} box art`}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) onSideImageUpload(side, file);
                    }}
                  />
                  <label htmlFor={`${side}-upload`} className="flex-1 cursor-pointer bg-primary-container hover:brightness-110 text-on-primary-container text-xs py-2 px-3 rounded text-center transition-colors block">
                    {uploadingStates[side] ? "Uploading..." : "Upload"}
                  </label>
                  <input
                    name={side}
                    value={currentUrl}
                    onChange={(e) => onContentChange(e, side)}
                    className={`${getInputClassNames(false)} text-xs mt-2`}
                    placeholder="Or paste URL"
                  />
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </details>
  );
}
