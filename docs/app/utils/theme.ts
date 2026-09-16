/**
 * Resolve a CSS custom property to a concrete, GSAP-parseable color.
 */
export function resolveTokenColor(token: string, fallback = "#000000"): string {
  if (typeof document === "undefined") return fallback;
  const raw = getComputedStyle(document.documentElement).getPropertyValue(token).trim();
  if (!raw) return fallback;
  try {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 1;
    const ctx = canvas.getContext("2d");
    if (!ctx) return fallback;
    ctx.fillStyle = "#000000";
    ctx.fillStyle = raw;
    // Browsers normalise on assignment; the getter returns a parseable color.
    return ctx.fillStyle;
  } catch {
    return fallback;
  }
}

/**
 * Resolve a token to an `rgba()` string at a fixed alpha.
 */
export function resolveTokenRgba(token: string, alpha: number, fallback = "#000000"): string {
  const color = resolveTokenColor(token, fallback);
  const hex = /^#([0-9a-f]{6})$/i.exec(color);
  if (hex) {
    const n = parseInt(hex[1], 16);
    return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
  }
  const rgb = /^rgba?\((\d+)[,\s]+(\d+)[,\s]+(\d+)/i.exec(color);
  if (rgb) return `rgba(${rgb[1]}, ${rgb[2]}, ${rgb[3]}, ${alpha})`;
  return color;
}
