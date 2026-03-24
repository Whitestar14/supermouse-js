export function lerp(start: number, end: number, factor: number): number {
  return start + (end - start) * factor;
}

export function damp(a: number, b: number, lambda: number, dt: number): number {
  return lerp(a, b, 1 - Math.exp(-lambda * dt));
}

export function angle(x: number, y: number): number {
  return Math.atan2(y, x) * (180 / Math.PI);
}