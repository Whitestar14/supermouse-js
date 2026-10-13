import type { MouseState, ValueOrGetter } from "@supermousejs/core";

/**
 * Normalizes a static value or getter into a plain getter, so the render loop
 * never has to branch on the option's type.
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

/** Normalizes a whole options object against its defaults. */
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

/** True on precise-pointer devices (mouse, trackpad), false on touch. */
export const hasFinePointer = (): boolean =>
  typeof window !== "undefined" && window.matchMedia("(pointer: fine)").matches;
