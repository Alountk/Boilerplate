/**
 * Hook para OCR + autofill de título de videojuego usando Tesseract.js + RAWG.
 * Extrae la lógica de análisis de imagen del componente create/page.tsx.
 */

import { useState } from "react";
import { RAWGService } from "../infrastructure/services/RAWGService";
import { RAWGGame } from "../domain/ports/IRAWGService";

const BLOCKED_TERMS = new Set([
  "playstation", "ps4", "ps5", "xbox", "xbox one", "nintendo", "switch",
  "rated", "teen", "mature", "pegi", "www", "ubisoft", "electronic arts",
  "capcom", "konami", "bandai", "namco", "square enix", "activision", "sega",
]);

function getLikelyTitleFromOcr(rawText: string): string {
  const candidates = rawText
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length >= 4 && l.length <= 60)
    .filter((l) => /[a-zA-Z]/.test(l))
    .filter((l) => !BLOCKED_TERMS.has(l.toLowerCase()))
    .filter((l) => !/^\d+$/.test(l));

  if (candidates.length === 0) return "";

  const best = candidates
    .sort((a, b) => b.length - a.length)
    .find((l) => !Array.from(BLOCKED_TERMS).some((t) => l.toLowerCase().includes(t)));

  return (best ?? candidates[0]).replace(/[^\w\s:'-]/g, "").trim();
}

export interface UseOcrAutofillReturn {
  ocrLoading: boolean;
  ocrMessage: string | null;
  runOcrAutofillFromImage: (
    file: File,
    onGameDetected: (game: RAWGGame) => Promise<void>,
    currentTitle: string
  ) => Promise<void>;
}

export function useOcrAutofill(): UseOcrAutofillReturn {
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrMessage, setOcrMessage] = useState<string | null>(null);
  const rawgService = new RAWGService();

  const runOcrAutofillFromImage = async (
    file: File,
    onGameDetected: (game: RAWGGame) => Promise<void>,
    currentTitle: string
  ) => {
    // Skip OCR if the user already typed a title
    if (currentTitle.trim().length > 0) return;

    setOcrLoading(true);
    setOcrMessage("Analizando portada para detectar el juego...");
    try {
      const { createWorker } = await import("tesseract.js");
      const worker = await createWorker("eng");
      const { data: { text } } = await worker.recognize(file);
      await worker.terminate();

      const detectedTitle = getLikelyTitleFromOcr(text);
      if (!detectedTitle || detectedTitle.length < 3) {
        setOcrMessage("No se pudo detectar un titulo claro en la portada.");
        return;
      }

      const results = await rawgService.searchGames(detectedTitle);
      if (!results.length) {
        setOcrMessage(`Texto detectado: ${detectedTitle}. No hubo match exacto en RAWG.`);
        return;
      }

      setOcrMessage(`Detectado: ${detectedTitle}. Completando datos con RAWG...`);
      await onGameDetected(results[0]);
      setOcrMessage(`Autocompletado listo: ${results[0].name}.`);
    } catch (error) {
      console.error("OCR autofill failed", error);
      setOcrMessage("No se pudo analizar la imagen automaticamente.");
    } finally {
      setOcrLoading(false);
    }
  };

  return { ocrLoading, ocrMessage, runOcrAutofillFromImage };
}
