/**
 * Linear Interpolation between two values.
 */
export function lerp(start: number, end: number, factor: number): number {
  return start + (end - start) * factor;
}

/**
 * Frame-rate independent damping (Time-based Lerp).
 */
export function damp(a: number, b: number, lambda: number, dt: number): number {
  return lerp(a, b, 1 - Math.exp(-lambda * dt));
}

/**
 * Calculates the angle in degrees between two points.
 */
export function angle(x: number, y: number): number {
  return Math.atan2(y, x) * (180 / Math.PI);
}