import { ref } from "vue";

/**
 * Theme state for the app. The initial value comes from `<html class="dark">`,
 * set pre-paint by the inline script in `nuxt.config.ts`.
 */
const STORAGE_KEY = "supermouse-theme";

const isDark = ref(
  typeof document !== "undefined" && document.documentElement.classList.contains("dark")
);

const setDark = (dark: boolean): void => {
  isDark.value = dark;
  if (typeof document !== "undefined") {
    document.documentElement.classList.toggle("dark", dark);
  }
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
