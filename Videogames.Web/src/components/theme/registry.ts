/**
 * Theme registry — single source of truth for the multi-theme system.
 *
 * Slice 1 ships `blueprint` (default + active). `neon-arcade` and `indigo-v2`
 * are registered as *disabled* ("próximamente") per the theme-system spec: they
 * are valid ids so stored/boot values are not treated as invalid, but the
 * ThemeProvider gate refuses `setTheme` calls for disabled themes until they
 * are implemented in a future slice.
 *
 * NOTE: the `data-theme` value on <html> and the `:root[data-theme="…"]` CSS
 * blocks must stay in sync with `THEME_IDS` below AND with the inline pre-paint
 * script in `src/app/layout.tsx`.
 */

export type ThemeId = "blueprint" | "neon-arcade" | "indigo-v2";

export interface ThemeDef {
  id: ThemeId;
  name: string;
  disabled?: boolean;
  description: string;
}

export const DEFAULT_THEME: ThemeId = "blueprint";

/** localStorage key that persists the active theme. */
export const STORAGE_KEY = "vmarket-theme";

/**
 * Legacy storage key. The design (D3) mandates removing the old dual-theme
 * system (the `theme` key plus a hardcoded HTML "dark" class) and clearing the
 * leftover key on boot. The new architecture must NOT read or write this key.
 */
export const LEGACY_STORAGE_KEY = "theme";

export const THEME_IDS: readonly ThemeId[] = ["blueprint", "neon-arcade", "indigo-v2"];

export const THEME_REGISTRY: readonly ThemeDef[] = [
  { id: "blueprint", name: "Blueprint", description: "El mercado, dibujado a escala" },
  { id: "neon-arcade", name: "Neon Arcade", disabled: true, description: "Próximamente" },
  { id: "indigo-v2", name: "Indigo v2", disabled: true, description: "Próximamente" },
];

/**
 * Type guard: true when `value` is a known theme id. Used by the boot path and
 * the pre-paint script so an invalid stored value falls back to the default.
 */
export function isValidTheme(value: unknown): value is ThemeId {
  return typeof value === "string" && (THEME_IDS as readonly string[]).includes(value);
}

/**
 * Pure resolution of a persisted/target theme id to a valid, *enabled* theme id.
 * Invalid or disabled values resolve to `DEFAULT_THEME` so the UI can never be
 * driven into an unsupported theme by stored state.
 */
export function resolveTheme(value: unknown): ThemeId {
  if (!isValidTheme(value)) return DEFAULT_THEME;
  const def = THEME_REGISTRY.find((t) => t.id === value);
  return def && def.disabled ? DEFAULT_THEME : value;
}
