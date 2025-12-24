import type { MouseState, ValueOrGetter } from '@supermousejs/core';

/**
 * Returns a function that always resolves the option value.
 * Eliminates 'typeof' checks inside the render loop by normalizing
 * static values into getter functions during initialization.
 * 
 * @param option The option passed by the user
 * @param defaultValue Fallback value
 */
export function normalize<T>(
  option: ValueOrGetter<T> | undefined, 
  defaultValue: T
): (state: MouseState) => T {
  if (option === undefined) {
    return () => defaultValue;
  }
  if (typeof option === 'function') {
    return option as (state: MouseState) => T;
  }
  return () => option;
}