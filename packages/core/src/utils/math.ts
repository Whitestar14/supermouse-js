/**
 * Linear Interpolation between two values.
 */
export function lerp(start: number, end: number, factor: number): number {
  return start + (end - start) * factor;
}

/**
 * Frame-rate independent damping (Time-based Lerp).
 * Ensures smooth animation consistent across 60hz, 120hz, etc.
 * 
 * @param a Current value
 * @param b Target value
 * @param lambda Smoothing factor (approx 1-20). Higher is faster.
 * @param dt Delta time in seconds (not milliseconds)
 */
export function damp(a: number, b: number, lambda: number, dt: number): number {
  return lerp(a, b, 1 - Math.exp(-lambda * dt));
}

/**
 * Linear Interpolation between two angles in degrees, taking the shortest path.
 * Handles wrap-around at 360 degrees.
 */
export function lerpAngle(start: number, end: number, factor: number): number {
  const diff = ((((end - start) % 360) + 540) % 360) - 180;
  return start + diff * factor;
}

/**
 * Returns a random number between min and max.
 * Usage: math.random(10, 20) -> 14.5
 */
export function random(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

/**
 * Constrains a value between a minimum and maximum.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Calculates the distance (hypotenuse) between two points (or magnitude of a vector).
 * If x2/y2 are omitted, calculates magnitude of vector x1/y1.
 */
export function dist(x1: number, y1: number, x2: number = 0, y2: number = 0): number {
  const dx = x1 - x2;
  const dy = y1 - y2;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculates the angle in degrees between two points (or vector direction).
 */
export function angle(x: number, y: number): number {
  return Math.atan2(y, x) * (180 / Math.PI);
}
