import type { ValueOrGetter, SupermouseInstance, SupermousePlugin } from "@supermousejs/core";
import { definePlugin, normalizeAll, dom, math, Layers } from "@supermousejs/utils";

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
<svg viewBox="0 0 100 100" fill="currentColor" style="display:block;width:100%;height:100%;">
  <path d="M10 20 L90 50 L10 80 L25 50 Z" />
</svg>
`;

export const Pointer = (options: PointerOptions = {}): SupermousePlugin => {
  const smoothing = options.rotationSmoothing ?? 0.15;
  const svgContent = options.svg ?? DEFAULT_SVG;

  const cfg = normalizeAll(options, {
    size: 32,
    color: "currentColor",
    rotationSmoothing: 0.15,
    restingAngle: -45,
    returnToRest: true,
    restDelay: 200,
    opacity: 1
  });

  let currentRotation = 0;
  let lastRotation = 0;
  let stopTime = 0;

  return definePlugin<HTMLDivElement>(
    {
      name: "pointer",

      create: (app) => {
        const el = dom.createActor("div") as HTMLDivElement;

        dom.css(el, {
          zIndex: String(Layers.CURSOR),
          transformOrigin: "center center"
        });

        const restAngle = cfg.restingAngle(app.state);
        currentRotation = restAngle;
        lastRotation = restAngle;

        el.innerHTML = svgContent;
        return el;
      },

      update: (app: SupermouseInstance, el: HTMLDivElement): void => {
        const size = cfg.size(app.state);
        const restingAngle = cfg.restingAngle(app.state);
        const returnToRest = cfg.returnToRest(app.state);
        const restDelay = cfg.restDelay(app.state);
        const now = performance.now();

        dom.css(el, {
          width: `${size}px`,
          height: `${size}px`,
          opacity: String(cfg.opacity(app.state)),
          color: cfg.color(app.state)
        });

        const { x: vx, y: vy } = app.state.velocity;
        const speed = math.dist(vx, vy);

        let targetRotation = lastRotation;

        if (speed > 1) {
          targetRotation = app.state.angle;
          lastRotation = targetRotation;
          stopTime = now;
        } else if (returnToRest && now - stopTime > restDelay) {
          targetRotation = restingAngle;
        }

        const isReturning = speed <= 1 && returnToRest && now - stopTime > restDelay;
        const factor = isReturning ? 0.05 : smoothing;

        currentRotation = math.lerpAngle(currentRotation, targetRotation, factor);

        const { x, y } = app.state.smooth;
        dom.setTransform(el, x, y, currentRotation);
      }
    },
    options
  );
};
