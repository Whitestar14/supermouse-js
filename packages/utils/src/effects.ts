
import { dist, angle, clamp } from './math';

/**
 * Calculates Rotation and Scale based on velocity to create a "Squash and Stretch" effect.
 * 
 * @param vx Velocity X
 * @param vy Velocity Y
 * @param intensity Stretch factor (default: 0.004)
 * @param maxStretch Max stretch percentage (default: 0.5 = 150% length)
 */
export function getVelocityDistortion(vx: number, vy: number, intensity = 0.004, maxStretch = 0.5) {
  const speed = dist(vx, vy);
  
  // Deadzone: If moving too slow, don't rotate (prevents jittering at rest)
  if (speed < 0.1) {
    return { rotation: 0, scaleX: 1, scaleY: 1 };
  }

  // 1. Point towards movement
  const rotation = angle(vx, vy);

  // 2. Stretch based on speed
  const stretch = clamp(speed * intensity, 0, maxStretch);
  
  // 3. Scale X grows, Scale Y shrinks (to preserve volume-ish)
  const scaleX = 1 + stretch;
  const scaleY = 1 - (stretch * 0.5); // Squash factor

  return {
    rotation,
    scaleX,
    scaleY
  };
}
