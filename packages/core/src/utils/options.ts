import { MouseState, ValueOrGetter } from '../types';

/**
 * Resolves an option that might be a static value or a function.
 * 
 * @param option The option passed by the user (value or function)
 * @param state The current Supermouse state (passed to the function)
 * @param defaultValue Fallback if option is undefined
 */
export function resolve<T>(
  option: ValueOrGetter<T> | undefined, 
  state: MouseState, 
  defaultValue: T
): T {
  if (option === undefined) return defaultValue;
  
  if (typeof option === 'function') {
    return (option as (state: MouseState) => T)(state);
  }
  
  return option;
}