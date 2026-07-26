import type { MouseState, ValueOrGetter } from "@supermousejs/core";

/**
 * Returns a function that always resolves the option value.
 * Eliminates 'typeof' checks inside the render loop by normalizing
 * static values into getter functions during initialization.
 *
 * @param option The option passed by the user
 * @param defaultValue Fallback value
 * @returns A function that returns the resolved value of the option
 */
export function normalize<T>(
  option: ValueOrGetter<T> | undefined,
  defaultValue: T
): (state: MouseState) => T {
  if (option === undefined) {
    return () => defaultValue;
  }
  if (typeof option === "function") {
    return option as (state: MouseState) => T;
  }
  return () => option;
}

/**
 * Normalizes multiple options in one call.
 *
 * @example
 * const cfg = normalizeAll(options, {
 *   size: 20,
 *   color: "#fff",
 *   opacity: 1,
 * });
 *
 * // In update():
 * const size = cfg.size(app.state);
 *
 * @param defaults Default values for the options
 * @param options User-provided options to normalize
 * @returns An object with normalized getter functions for each option
 */
export function normalizeAll<T extends Record<string, unknown>>(
  options: Partial<{ [K in keyof T]: ValueOrGetter<T[K]> }>,
  defaults: T
): { [K in keyof T]: (state: MouseState) => T[K] } {
  const result = {} as { [K in keyof T]: (state: MouseState) => T[K] };

  for (const key of Object.keys(defaults) as Array<keyof T>) {
    result[key] = normalize(
      options[key] as ValueOrGetter<T[typeof key]> | undefined,
      defaults[key]
    );
  }

  return result;
}

/**
 * Checks if the current device has a fine pointer (e.g., mouse) or a coarse pointer (e.g., touch).
 * This is useful for conditionally enabling or disabling cursor effects based on the input device.
 *
 * @returns True if the device has a fine pointer, false otherwise.
 */
export const hasFinePointer = (): boolean =>
  typeof window !== "undefined" && window.matchMedia("(pointer: fine)").matches;
