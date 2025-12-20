import { definePlugin, dom, math, Layers, resolve, type ValueOrGetter } from '@supermousejs/core';

export interface PointerOptions {
  name?: string;
  isEnabled?: boolean;
  size?: ValueOrGetter<number>;
  color?: ValueOrGetter<string>;
  svg?: string;
  rotationSmoothing?: number;
  restingAngle?: ValueOrGetter<number>;
  returnToRest?: ValueOrGetter<boolean>;
  restDelay?: ValueOrGetter<number>;
}

const DEFAULT_SVG = `
<svg viewBox="0 0 100 100" fill="currentColor" style="display: block; width: 100%; height: 100%;">
  <path d="M10 20 L90 50 L10 80 L25 50 Z" />
</svg>
`;

export const Pointer = (options: PointerOptions = {}) => {
  const defSize = 32;
  const smoothing = options.rotationSmoothing || 0.15;
  
  let currentRotation = 0;
  let lastRotation = 0;
  let stopTime = 0;
  let lastSvg = '';

  return definePlugin<HTMLDivElement, PointerOptions>({
    name: 'pointer',

    create: (app) => {
      const el = dom.createDiv();
      el.style.zIndex = Layers.CURSOR;
      el.style.transformOrigin = 'center center'; 
      
      const restAngle = resolve(options.restingAngle, app.state, -45);
      currentRotation = restAngle;
      lastRotation = restAngle;
      return el;
    },

    styles: {
      color: 'color'
    },

    update: (app, el) => {
      const size = resolve(options.size, app.state, defSize);
      const restingAngle = resolve(options.restingAngle, app.state, -45);
      const returnToRest = resolve(options.returnToRest, app.state, true);
      const restDelay = resolve(options.restDelay, app.state, 200);
      const svg = options.svg || DEFAULT_SVG;

      dom.setStyle(el, 'width', `${size}px`);
      dom.setStyle(el, 'height', `${size}px`);

      if (svg !== lastSvg) {
        el.innerHTML = svg;
        lastSvg = svg;
      }

      const { x: vx, y: vy } = app.state.velocity;
      const speed = math.dist(vx, vy);
      const now = performance.now();
      
      let targetRotation = lastRotation;
      
      if (speed > 1) {
        targetRotation = math.angle(vx, vy);
        lastRotation = targetRotation;
        stopTime = now;
      } else {
        if (returnToRest && (now - stopTime > restDelay)) {
            targetRotation = restingAngle;
        }
      }

      const diff = targetRotation - currentRotation;
      let delta = ((diff + 180) % 360) - 180;
      if (delta < -180) delta += 360;
      
      const isReturning = speed <= 1 && returnToRest && (now - stopTime > restDelay);
      const factor = isReturning ? 0.05 : smoothing;
      
      currentRotation += delta * factor;

      const { x, y } = app.state.smooth;
      dom.setTransform(el, x, y, currentRotation);
    }
  }, options);
};