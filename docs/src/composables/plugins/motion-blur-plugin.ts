import { definePlugin, dom, Layers } from "@supermousejs/utils";
import type { Supermouse } from "@supermousejs/core";

export interface MotionBlurOptions {
  name?: string;
  isEnabled?: boolean;
  cursorSize?: number;
  cursorColor?: string;
  samples?: number;
  intensity?: number;
  maxSpread?: number;
}

export const MotionBlur = (options: MotionBlurOptions = {}) => {
  const cursorSize = options.cursorSize ?? 8;
  const cursorColor = options.cursorColor ?? "#ffffff";
  const sampleCount = options.samples ?? 12;
  const intensity = options.intensity ?? 0.4;
  const maxSpread = options.maxSpread ?? 80;

  let mainEl: HTMLDivElement;
  const trailEls: HTMLDivElement[] = [];

  return definePlugin<HTMLDivElement, MotionBlurOptions>(
    {
      name: options.name || "motion-blur",
      create: (app) => {
        mainEl = dom.createCircle(cursorSize, cursorColor) as HTMLDivElement;
        dom.setStyle(mainEl, "zIndex", Layers.CURSOR);
        dom.setStyle(mainEl, "opacity", "0");

        // 2. Trail samples
        for (let i = 0; i < sampleCount; i++) {
          const el = dom.createCircle(cursorSize, cursorColor) as HTMLDivElement;
          dom.setStyle(el, "opacity", "0");
          dom.setStyle(el, "pointerEvents", "none");
          dom.setStyle(el, "zIndex", Layers.FOLLOWER);
          app.container.appendChild(el);
          trailEls.push(el);
        }

        return mainEl;
      },

      update: (app) => {
        const { smooth, velocity } = app.state;
        const speed = Math.hypot(velocity.x, velocity.y);

        if (!app.state.hasReceivedInput) {
          dom.setStyle(mainEl, "opacity", "0");
          trailEls.forEach((el) => dom.setStyle(el, "opacity", "0"));
          return;
        }

        dom.setStyle(mainEl, "opacity", "1");
        dom.setTransform(mainEl, smooth.x, smooth.y);

        if (speed < 0.5) {
          trailEls.forEach((el) => dom.setStyle(el, "opacity", "0"));
          return;
        }

        const spread = Math.min(speed * intensity, maxSpread);
        const dirX = velocity.x / speed;
        const dirY = velocity.y / speed;

        for (let i = 0; i < sampleCount; i++) {
          const el = trailEls[i];
          const t = (i - (sampleCount - 1) / 2) * (3 / (sampleCount - 1)); // roughly -1.5…+1.5

          const weight = Math.exp(-(t * t) / 2);
          const opacity = weight * 0.6;

          dom.setStyle(el, "opacity", String(opacity));

          const offsetX = dirX * t * spread;
          const offsetY = dirY * t * spread;
          dom.setTransform(el, smooth.x + offsetX, smooth.y + offsetY);
        }
      },

      cleanup: () => {
        trailEls.forEach((el) => el.remove());
        trailEls.length = 0;
      }
    },
    options
  );
};
