import type { ValueOrGetter } from "@supermousejs/core";
import { definePlugin, normalize, dom, Layers } from "@supermousejs/utils";

export interface RingOptions {
  name?: string;
  isEnabled?: boolean;
  size?: ValueOrGetter<number>;
  color?: ValueOrGetter<string>;
  borderWidth?: ValueOrGetter<number>;
  opacity?: ValueOrGetter<number>;
  mixBlendMode?: string;
}

export const Ring = (options: RingOptions = {}) => {
  const getSize = normalize(options.size, 20);
  const getColor = normalize(options.color, "#ffffff");
  const getBorder = normalize(options.borderWidth, 2);
  const getOpacity = normalize(options.opacity, 1);

  return definePlugin<HTMLDivElement, RingOptions>(
    {
      name: options.name || "ring",
      selector: "[data-supermouse-color]",

      create: (app) => {
        const el = dom.createCircle(getSize(app.state), "transparent");
        dom.applyStyles(el, {
          zIndex: Layers.FOLLOWER,
          mixBlendMode: options.mixBlendMode || "difference",
          borderStyle: "solid",
          transition: "opacity 0.2s ease",
          boxSizing: "border-box",
        });
        return el;
      },

      update: (app, el) => {
        const size = getSize(app.state);
        const color = app.state.interaction.color || getColor(app.state);

        dom.applyStyles(el, {
          width: `${size}px`,
          height: `${size}px`,
          borderColor: color,
          borderWidth: `${getBorder(app.state)}px`,
          opacity: String(getOpacity(app.state)),
          borderRadius: "50%",
        });

        const { x, y } = app.state.smooth;
        dom.setTransform(el, x, y);
      },
    },
    options
  );
};
