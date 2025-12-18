/**
 * Linear Interpolation.
 * @param start Current value
 * @param end Target value
 * @param factor Speed (0-1)
 */
export function lerp(start: number, end: number, factor: number): number {
  return start + (end - start) * factor;
}

/**
 * Calculates a random number between min and max.
 */
export function random(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}