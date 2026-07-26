import type { ValueOrGetter, SupermouseInstance, SupermousePlugin } from "@supermousejs/core";
import { definePlugin, normalizeAll, dom, Layers } from "@supermousejs/utils";

export interface RingOptions {
  name?: string;
  isEnabled?: boolean;
  size?: ValueOrGetter<number>;
  color?: ValueOrGetter<string>;
  borderWidth?: ValueOrGetter<number>;
  opacity?: ValueOrGetter<number>;
  mixBlendMode?: string;
}

export const Ring = (options: RingOptions = {}): SupermousePlugin => {
  const cfg = normalizeAll(options, {
    size: 20,
    color: "#ffffff",
    borderWidth: 2,
    opacity: 1
  });

  return definePlugin<HTMLDivElement>(
    {
      name: options.name || "ring",
      selector: "[data-supermouse-color]",

      create: (app: SupermouseInstance) => {
        const el = dom.createCircle(cfg.size(app.state), "transparent");
        dom.css(el, {
          zIndex: Layers.FOLLOWER,
          mixBlendMode: options.mixBlendMode || "difference",
          borderStyle: "solid",
          transition: "opacity 0.2s ease",
          boxSizing: "border-box"
        });
        return el;
      },

      update: (app, el) => {
        const size = cfg.size(app.state);
        const color = app.state.interaction.color || cfg.color(app.state);

        dom.css(el, {
          width: `${size}px`,
          height: `${size}px`,
          borderColor: color,
          borderWidth: `${cfg.borderWidth(app.state)}px`,
          opacity: String(cfg.opacity(app.state)),
          borderRadius: "50%"
        });

        const { x, y } = app.state.smooth;
        dom.setTransform(el, x, y);
      }
    },
    options
  );
};
