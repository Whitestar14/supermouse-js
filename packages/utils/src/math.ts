export function lerp(start: number, end: number, factor: number): number {
  return start + (end - start) * factor;
}

/** Time-based lerp, so easing is identical at 60Hz and 240Hz. */
export function damp(a: number, b: number, lambda: number, dt: number): number {
  return lerp(a, b, 1 - Math.exp(-lambda * dt));
}

/** Interpolates along the shortest path, so 350° -> 10° turns 20° not 340°. */
export function lerpAngle(start: number, end: number, factor: number): number {
  const diff = ((((end - start) % 360) + 540) % 360) - 180;
  return start + diff * factor;
}

export function random(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Vector magnitude; with no second point, the magnitude of `(x1, y1)`. */
export function dist(x1: number, y1: number, x2: number = 0, y2: number = 0): number {
  const dx = x1 - x2;
  const dy = y1 - y2;
  return Math.sqrt(dx * dx + dy * dy);
}

/** Vector direction in degrees. */
export function angle(x: number, y: number): number {
  return Math.atan2(y, x) * (180 / Math.PI);
}

export function circumference(r: number): number {
  return 2 * Math.PI * r;
}
