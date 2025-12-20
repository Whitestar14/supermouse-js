
import { type SupermousePlugin, dom, math, Layers, resolve, type ValueOrGetter } from '@supermousejs/core';

export interface PointerOptions {
  /** Size of the pointer in pixels. Default 32. */
  size?: ValueOrGetter<number>;
  /** Color of the pointer. Default black. */
  color?: ValueOrGetter<string>;
  /** Custom SVG string. Must point to the right (0deg) for correct rotation. */
  svg?: string;
  /** Rotation smoothing (0-1). Lower is smoother. Default 0.15. */
  rotationSmoothing?: number;
  /** Angle to return to when stopped (in degrees). Default -45 (Top-Left). */
  restingAngle?: ValueOrGetter<number>;
  /** Whether to return to the resting angle when stopped. Default true. */
  returnToRest?: ValueOrGetter<boolean>;
  /** Delay in milliseconds before returning to rest angle after stopping. Default 200. */
  restDelay?: ValueOrGetter<number>;
}

// A sharp, brutalist arrow pointing Right (0 deg)
const DEFAULT_SVG = `
<svg viewBox="0 0 100 100" fill="currentColor" style="display: block; width: 100%; height: 100%;">
  <path d="M10 20 L90 50 L10 80 L25 50 Z" />
</svg>
`;

export const Pointer = (options: PointerOptions = {}): SupermousePlugin => {
  let el: HTMLDivElement;
  let currentRotation = 0;
  
  const defSize = 32;
  const defColor = '#000000';
  const smoothing = options.rotationSmoothing || 0.15;
  
  // State
  let lastRotation = 0;
  let stopTime = 0;
  let lastSvg = '';

  return {
    name: 'pointer',
    isEnabled: true,

    install(app) {
      el = dom.createDiv();
      el.style.zIndex = Layers.CURSOR;
      el.style.transformOrigin = 'center center'; 
      
      app.container.appendChild(el);
      
      // Init rotation
      const restAngle = resolve(options.restingAngle, app.state, -45);
      currentRotation = restAngle;
      lastRotation = restAngle;
    },

    update(app) {
      // 1. Resolve Props
      const size = resolve(options.size, app.state, defSize);
      const color = resolve(options.color, app.state, defColor);
      const restingAngle = resolve(options.restingAngle, app.state, -45);
      const returnToRest = resolve(options.returnToRest, app.state, true);
      const restDelay = resolve(options.restDelay, app.state, 200);
      const svg = options.svg || DEFAULT_SVG;

      // 2. DOM Updates (Dirty Checks)
      el.style.width = `${size}px`;
      el.style.height = `${size}px`;
      el.style.color = color;

      if (svg !== lastSvg) {
        el.innerHTML = svg;
        lastSvg = svg;
      }

      // 3. Physics (Rotation)
      const { x: vx, y: vy } = app.state.velocity;
      const speed = math.dist(vx, vy);
      const now = performance.now();
      
      let targetRotation = lastRotation;
      
      // If moving significantly (speed > 1), steer towards velocity
      if (speed > 1) {
        targetRotation = math.angle(vx, vy);
        lastRotation = targetRotation;
        stopTime = now;
      } else {
        // Stopped
        if (returnToRest && (now - stopTime > restDelay)) {
            targetRotation = restingAngle;
        }
      }

      // Smooth rotation with shortest path interpolation (wrapping 360 -> 0)
      const diff = targetRotation - currentRotation;
      let delta = ((diff + 180) % 360) - 180;
      if (delta < -180) delta += 360;
      
      // Use standard smoothing when steering
      // When returning to rest, use a fixed slower smoothing for "settling" feel
      const isReturning = speed <= 1 && returnToRest && (now - stopTime > restDelay);
      const factor = isReturning ? 0.05 : smoothing;
      
      currentRotation += delta * factor;

      // 4. Transform
      const { x, y } = app.state.smooth;
      dom.setTransform(el, x, y, currentRotation);
    },
    
    destroy() { el.remove(); }
  };
};
