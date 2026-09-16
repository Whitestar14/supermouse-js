import { ref } from "vue";

/**
 * Theme state, owned by the app rather than by the navbar.
 *
 * The initial value is read from `<html class="dark">`, which a pre-paint
 * inline script in `nuxt.config` sets from localStorage / OS preference
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
