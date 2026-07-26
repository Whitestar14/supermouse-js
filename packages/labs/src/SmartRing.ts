import type { SupermousePlugin, ValueOrGetter } from "@supermousejs/core";
import { definePlugin, normalizeAll, dom, math, effects, Layers } from "@supermousejs/utils";

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

  return definePlugin<HTMLDivElement>(
    {
      name: options.name ?? "smart-ring",
      selector: "[data-supermouse-color]",

      create: (app) => {
        const el = dom.createCircle(cfg.size(app.state), cfg.fill(app.state));
        dom.css(el, {
          zIndex: Layers.FOLLOWER,
          mixBlendMode: options.mixBlendMode ?? "difference",
          transition: "opacity 0.2s ease, border-radius 0.2s ease",
          borderStyle: "solid"
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
        dom.css(el, { borderRadius: "50%" });
      },

      onDisable(_app, el) {
        dom.css(el, { borderRadius: "50%" });
      },

      update: (app, el) => {
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

        currentW = math.lerp(currentW, targetW, 0.2);
        currentH = math.lerp(currentH, targetH, 0.2);

        dom.css(el, {
          width: `${currentW}px`,
          height: `${currentH}px`,
          borderRadius: targetRadius,
          borderColor: color,
          backgroundColor: cfg.fill(app.state),
          borderWidth: `${cfg.borderWidth(app.state)}px`
        });

        let targetRot = 0;
        let targetScaleX = 1;
        let targetScaleY = 1;

        if (!shape && options.enableSkew && !app.state.reducedMotion) {
          const { velocity } = app.state;
          const dist = effects.getVelocityDistortion(velocity.x, velocity.y);
          targetRot = dist.rotation;
          targetScaleX = dist.scaleX;
          targetScaleY = dist.scaleY;
          currentRot = math.lerpAngle(currentRot, targetRot, 0.15);
        } else {
          currentRot = 0;
        }

        currentScaleX = math.lerp(currentScaleX, targetScaleX, 0.15);
        currentScaleY = math.lerp(currentScaleY, targetScaleY, 0.15);

        const { x, y } = app.state.smooth;
        dom.setTransform(el, x, y, currentRot, currentScaleX, currentScaleY);
      }
    },
    options
  );
};
