/**
 * Calculates the SVG Path data for a perfect circle starting at the top center (12 o'clock).
 * 
 * Path moves to (0, -r), then draws two semi-circles.
 * @param r Radius in pixels
 */
export function getCirclePath(r: number): string {
  // Fix floating point precision slightly to avoid rendering artifacts
  const rClean = Math.round(r * 100) / 100;
  
  return `
    M 0, -${rClean}
    A ${rClean},${rClean} 0 1,1 0,${rClean}
    A ${rClean},${rClean} 0 1,1 0,-${rClean}
  `.replace(/\s+/g, ' ').trim();
}

/**
 * Calculates the circumference of a circle.
 * @param r Radius in pixels
 */
export function getCircumference(r: number): number {
  return 2 * Math.PI * r;
}

/**
 * Prepares text for a seamless loop by optionally appending a non-breaking space.
 * This prevents the last character from touching the first character when spread is active.
 * 
 * @param text The source text
 * @param spread Whether auto-fit spreading is enabled
 */
export function formatLoopText(text: string, spread: boolean): string {
  if (!spread) return text;
  // \u00A0 is &nbsp;
  return text + '\u00A0';
}
