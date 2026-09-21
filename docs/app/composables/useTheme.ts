import { ref } from "vue";

/**
 * Theme state for the app. The initial value comes from `<html class="dark">`,
 * set pre-paint by the inline script in `nuxt.config.ts`.
 */
const STORAGE_KEY = "supermouse-theme";

const isDark = ref(
  typeof document !== "undefined" && document.documentElement.classList.contains("dark")
);

let restoring = false;

/**
 * Swaps the token block with transitions disabled for a single frame.
 *
 * Without this, elements carrying `transition-colors` (the logo, the search
 * bar, nav links) would animate to the new palette at their own pace while
 * everything else snapped — which reads as a half-applied theme. See
 * `html.theme-switching` in `index.css`.
 */
const setDark = (dark: boolean): void => {
  isDark.value = dark;
  if (typeof document === "undefined") return;

  const root = document.documentElement;
  root.classList.add("theme-switching");
  root.classList.toggle("dark", dark);
  // Force the style flush while transitions are suppressed.
  void root.offsetHeight;

  if (restoring) return;
  restoring = true;
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      root.classList.remove("theme-switching");
      restoring = false;
    })
  );

  try {
    localStorage.setItem(STORAGE_KEY, dark ? "dark" : "light");
  } catch {
    // Storage can be unavailable (private mode) — the class still applies.
  }
};

export function useTheme() {
  return {
    isDark,
    setDark,
    toggle: (): void => setDark(!isDark.value)
  };
}
