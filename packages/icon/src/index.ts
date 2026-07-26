import type { ValueOrGetter, SupermouseInstance, SupermousePlugin } from "@supermousejs/core";
import { definePlugin, normalize, dom, Layers } from "@supermousejs/utils";

export interface IconOptions {
  name?: string;
  isEnabled?: boolean;
  /** Raw SVG markup. */
  svg: string;
  /** Size in pixels. */
  size?: ValueOrGetter<number>;
  /** CSS color. */
  color?: ValueOrGetter<string>;
  opacity?: ValueOrGetter<number>;
  /** Offset [x, y] from cursor center. */
  offset?: [number, number];
}

export const Icon = (options: IconOptions): SupermousePlugin => {
  const getSize = normalize(options.size, 24);
  const getOpacity = normalize(options.opacity, 1);
  const getColor = normalize(options.color, "black");
  const [offX, offY] = options.offset ?? [0, 0];

  return definePlugin<HTMLDivElement>(
    {
      name: options.name ?? "icon",

      create: () => {
        const el = dom.createActor("div") as HTMLDivElement;

        dom.css(el, {
          zIndex: String(Layers.CURSOR),
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        });

        el.innerHTML = options.svg;
        return el;
      },

      update: (app: SupermouseInstance, el: HTMLDivElement) => {
        const size = getSize(app.state);

        dom.css(el, {
          width: `${size}px`,
          height: `${size}px`,
          opacity: String(getOpacity(app.state)),
          color: getColor(app.state)
        });

        const { x, y } = app.state.smooth;
        dom.setTransform(el, x + offX, y + offY);
      }
    },
    options
  );
};
