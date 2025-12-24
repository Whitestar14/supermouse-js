import type { ValueOrGetter } from "@supermousejs/core";
import { definePlugin, normalize, dom, math, effects, Layers } from "@supermousejs/utils";

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

export const SmartRing = (options: SmartRingOptions = {}) => {
  const getSize = normalize(options.size, 20);
  const getHoverSize = normalize(options.hoverSize, 40);
  const getColor = normalize(options.color, "#ffffff");
  const getBorder = normalize(options.borderWidth, 2);
  const getFill = normalize(options.fill, "transparent");

  let currentW = 20;
  let currentH = 20;
  let currentRot = 0;
  let currentScaleX = 1;
  let currentScaleY = 1;

  return definePlugin<HTMLDivElement, SmartRingOptions>(
    {
      name: options.name || "smart-ring",
      selector: "[data-supermouse-color]",

      create: (app) => {
        const el = dom.createCircle(getSize(app.state), getFill(app.state));
        dom.applyStyles(el, {
          zIndex: Layers.FOLLOWER,
          mixBlendMode: options.mixBlendMode || "difference",
          transition: "opacity 0.2s ease, border-radius 0.2s ease",
          borderStyle: "solid",
        });
        return el;
      },

      update: (app, el) => {
        const baseSize = getSize(app.state);
        const shape = app.state.shape;

        let targetW = baseSize;
        let targetH = baseSize;
        let targetRadius = "50%";
        let color = getColor(app.state);

        if (shape) {
          targetW = shape.width;
          targetH = shape.height;
          targetRadius = `${shape.borderRadius}px`;
        } else {
          if (app.state.isHover) {
            targetW = getHoverSize(app.state);
            targetH = getHoverSize(app.state);
          }
          if (app.state.isDown) {
            targetW *= 0.9;
            targetH *= 0.9;
          }
        }

        if (app.state.interaction.color) color = app.state.interaction.color;

        currentW = math.lerp(currentW, targetW, 0.2);
        currentH = math.lerp(currentH, targetH, 0.2);

        dom.setStyle(el, "width", `${currentW}px`);
        dom.setStyle(el, "height", `${currentH}px`);
        dom.setStyle(el, "borderRadius", targetRadius);
        dom.setStyle(el, "borderColor", color);
        dom.setStyle(el, "backgroundColor", getFill(app.state));
        dom.setStyle(el, "borderWidth", `${getBorder(app.state)}px`);

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
      },
    },
    options
  );
};