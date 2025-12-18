import { dist, angle, clamp } from './math';

/**
 * Calculates rotation and scale based on 2D velocity.
 * Used for the "Cartoon Skew" effect.
 * 
 * @param vx Velocity X
 * @param vy Velocity Y
 * @param intensity How much to stretch per unit of speed (default: 0.005)
 * @param maxStretch Maximum percentage of stretch (default: 0.5 = 50%)
 */
export function getVelocitySkew(vx: number, vy: number, intensity = 0.005, maxStretch = 0.5) {
  const speed = dist(vx, vy);
  
  if (speed < 0.1) {
    return { rotation: 0, scaleX: 1, scaleY: 1 };
  }

  const rotation = angle(vx, vy);
  const stretch = clamp(speed * intensity, 0, maxStretch);
  
  return {
    rotation,
    scaleX: 1 + stretch,
    scaleY: 1 - stretch * 0.5
  };
}

/**
 * Measures an element to get its geometry for the "Stick" effect.
 * 
 * @param target The element to stick to
 * @param padding Extra padding to add to the dimensions
 */
export function getStickyDimensions(target: HTMLElement, padding: number = 0) {
  const rect = target.getBoundingClientRect();
  const style = window.getComputedStyle(target);
  
  return {
    width: rect.width + padding,
    height: rect.height + padding,
    // Try to parse px value, fallback to 0 if %, but stick works best with px
    radius: parseFloat(style.borderRadius) || 0,
    // Center point
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2
  };
}