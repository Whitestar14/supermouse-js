
import { definePlugin, dom, math, Layers, normalize, type ValueOrGetter } from '@supermousejs/core';

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
  opacity?: ValueOrGetter<number>;
}

const DEFAULT_SVG = `
<svg viewBox="0 0 100 100" fill="currentColor" style="display: block; width: 100%; height: 100%;">
  <path d="M10 20 L90 50 L10 80 L25 50 Z" />
</svg>
`;

export const Pointer = (options: PointerOptions = {}) => {
  const defSize = 32;
  const smoothing = options.rotationSmoothing || 0.15;
  const svgContent = options.svg || DEFAULT_SVG;
  
  const getSize = normalize(options.size, defSize);
  const getRestingAngle = normalize(options.restingAngle, -45);
  const getReturnToRest = normalize(options.returnToRest, true);
  const getRestDelay = normalize(options.restDelay, 200);
  const getOpacity = normalize(options.opacity, 1);

  let currentRotation = 0;
  let lastRotation = 0;
  let stopTime = 0;

  return definePlugin<HTMLDivElement, PointerOptions>({
    name: 'pointer',

    create: (app) => {
      const el = dom.createActor('div') as HTMLDivElement;
      el.style.zIndex = Layers.CURSOR;
      el.style.transformOrigin = 'center center'; 
      
      const restAngle = getRestingAngle(app.state);
      currentRotation = restAngle;
      lastRotation = restAngle;
      
      el.innerHTML = svgContent;
      
      return el;
    },

    styles: {
      color: 'color'
    },

    update: (app, el) => {
      const size = getSize(app.state);
      const restingAngle = getRestingAngle(app.state);
      const returnToRest = getReturnToRest(app.state);
      const restDelay = getRestDelay(app.state);
      const opacity = getOpacity(app.state);

      dom.setStyle(el, 'width', `${size}px`);
      dom.setStyle(el, 'height', `${size}px`);
      dom.setStyle(el, 'opacity', String(opacity));

      const { x: vx, y: vy } = app.state.velocity;
      const speed = math.dist(vx, vy);
      const now = performance.now();
      
      let targetRotation = lastRotation;
      
      if (speed > 1) {
        targetRotation = app.state.angle;
        lastRotation = targetRotation;
        stopTime = now;
      } else {
        if (returnToRest && (now - stopTime > restDelay)) {
            targetRotation = restingAngle;
        }
      }

      // Use core interpolation with shortest-path logic
      const isReturning = speed <= 1 && returnToRest && (now - stopTime > restDelay);
      const factor = isReturning ? 0.05 : smoothing;
      
      currentRotation = math.lerpAngle(currentRotation, targetRotation, factor);

      const { x, y } = app.state.smooth;
      dom.setTransform(el, x, y, currentRotation);
    }
  }, options);
};
