"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_THEME,
  LEGACY_STORAGE_KEY,
  STORAGE_KEY,
  resolveTheme,
  type ThemeId,
} from "./theme/registry";

interface ThemeContextValue {
  theme: ThemeId;
  setTheme: (id: ThemeId) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

/**
 * Read the persisted theme on the client. Returns the default for invalid or
 * disabled stored values so the app can never boot into an unsupported theme.
 */
function readInitialTheme(): ThemeId {
  if (typeof window === "undefined") return DEFAULT_THEME;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return resolveTheme(stored);
}

/**
 * Applies the active theme to <html data-theme="…"> and persists it under the
 * `vmarket-theme` key. The anti-FOUC pre-paint script in layout.tsx already set
 * `data-theme` before hydration; this provider keeps it in sync and normalizes
 * any invalid stored value back to the default.
 */
export default function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>(readInitialTheme);

  // Legacy dual-theme cleanup (design D3): remove the old `theme` key once.
  useEffect(() => {
    window.localStorage.removeItem(LEGACY_STORAGE_KEY);
  }, []);

  // Keep <html data-theme> and localStorage in sync with the active theme.
  // This effect only touches external systems (DOM/LocalStorage), never state,
  // so it does not trigger cascading renders.
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const setTheme = useCallback((id: ThemeId) => {
    // Gate: invalid/disabled ids resolve to the default so the UI never
    // switches to an unsupported theme.
    setThemeState(resolveTheme(id));
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within <ThemeProvider>");
  return ctx;
}
