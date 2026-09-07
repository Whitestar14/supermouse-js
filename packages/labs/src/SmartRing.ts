import type { SupermousePlugin, ValueOrGetter } from "@supermousejs/core";
import {
  definePlugin,
  normalizeAll,
  css,
  createCircle,
  setTransform,
  effects,
  damp,
  lerpAngle,
  Layers
} from "@supermousejs/utils";

export interface SmartRingOptions {
  name?: string;
  isEnabled?: boolean;
  size?: ValueOrGetter<number>;
  hoverSize?: ValueOrGetter<number>;
  color?: ValueOrGetter<string>;
  fill?: ValueOrGetter<string>;
  borderWidth?: ValueOrGetter<number>;
  mixBlendMode?: string;
  enableSkew?: boolean;
}

export const SmartRing = (options: SmartRingOptions = {}): SupermousePlugin => {
  const cfg = normalizeAll(options, {
    size: 20,
    hoverSize: 40,
    color: "#ffffff",
    fill: "transparent",
    borderWidth: 2
  });

  let currentW = 20;
  let currentH = 20;
  let currentRot = 0;
  let currentScaleX = 1;
  let currentScaleY = 1;
  const exitDuration = 150;
  let exitTimeout: ReturnType<typeof setTimeout> | null = null;

  return definePlugin<HTMLDivElement>(
    {
      name: options.name ?? "smart-ring",
      selector: "[data-supermouse-color]",

      create: (app) => {
        const el = createCircle(cfg.size(app.state), cfg.fill(app.state));
        css(el, {
          zIndex: Layers.FOLLOWER,
          mixBlendMode: options.mixBlendMode ?? "difference",
          transition: "border-radius 0.2s ease",
          borderStyle: "solid",
          opacity: "0"
        });
        return el;
      },

      onEnable(_app, el) {
        const base = cfg.size(_app.state);
        currentW = base * 0.5;
        currentH = base * 0.5;
        currentRot = 0;
        currentScaleX = 1;
        currentScaleY = 1;

        clearTimeout(exitTimeout ?? undefined);
        el.style.display = "block";
        el.style.opacity = "1";
        el.style.transition = "border-radius 0.2s ease";
      },

      beforeDisable(app, el) {
        const { x, y } = app.state.smooth;
        el.style.transition = `opacity ${exitDuration}ms ease, transform ${exitDuration}ms ease`;
        el.style.opacity = "0";
        setTransform(el, x, y, 0, 0.2, 0.2);

        return new Promise<void>((resolve) => {
          exitTimeout = setTimeout(() => {
            el.style.transition = "border-radius 0.2s ease";
            resolve();
          }, exitDuration);
        });
      },

      update: (app, el, dtMs) => {
        if (el.style.display === "none") return;

        const dt = dtMs / 1000;
        const baseSize = cfg.size(app.state);
        const shape = app.state.shape;

        let targetW = baseSize;
        let targetH = baseSize;
        let targetRadius = "50%";
        let color = cfg.color(app.state);

        if (shape) {
          targetW = shape.width;
          targetH = shape.height;
          targetRadius = `${shape.borderRadius}px`;
        } else {
          if (app.state.isHover) {
            targetW = cfg.hoverSize(app.state);
            targetH = cfg.hoverSize(app.state);
          }
          if (app.state.isDown) {
            targetW *= 0.9;
            targetH *= 0.9;
          }
        }

        if (app.state.interaction.color) color = app.state.interaction.color;

        currentW = damp(currentW, targetW, 20, dt);
        currentH = damp(currentH, targetH, 20, dt);

        css(el, {
          width: `${currentW}px`,
          height: `${currentH}px`,
          borderRadius: targetRadius,
          borderColor: color,
          backgroundColor: cfg.fill(app.state),
          borderWidth: `${cfg.borderWidth(app.state)}px`,
          opacity: "1"
        });

        let targetRot = 0;
        let targetScaleX = 1;
        let targetScaleY = 1;

        if (!shape && options.enableSkew && !app.state.reducedMotion) {
          const { displacement } = app.state;
          const dist = effects.getVelocityDistortion(displacement.x, displacement.y);
          targetRot = dist.rotation;
          targetScaleX = dist.scaleX;
          targetScaleY = dist.scaleY;

          const angleFactor = 1 - Math.exp(-20 * dt);
          currentRot = lerpAngle(currentRot, targetRot, angleFactor);
        } else {
          currentRot = 0;
        }

        currentScaleX = damp(currentScaleX, targetScaleX, 20, dt);
        currentScaleY = damp(currentScaleY, targetScaleY, 20, dt);

        const { x, y } = app.state.smooth;
        setTransform(el, x, y, currentRot, currentScaleX, currentScaleY);
      }
    },
    options
  );
};
