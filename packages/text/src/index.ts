import type { Supermouse } from "@supermousejs/core";
import { definePlugin, dom, Layers, Easings } from "@supermousejs/utils";

export interface TextOptions {
  name?: string;
  isEnabled?: boolean;
  className?: string;
  offset?: [number, number];
  duration?: number;
}

export const Text = (options: TextOptions = {}) => {
  const className = options.className || "supermouse-text";
  const [offX, offY] = options.offset || [0, 24];
  const duration = options.duration || 200;

  let textNode: HTMLSpanElement;

  return definePlugin<HTMLDivElement>(
    {
      name: "text",
      selector: "[data-supermouse-text]",

      create: () => {
        const el = dom.createActor("div") as HTMLDivElement;

        dom.css(el, {
          zIndex: Layers.OVERLAY,
          opacity: "0",
          transition: `opacity ${duration}ms ${Easings.SMOOTH}`,
          whiteSpace: "nowrap",
          pointerEvents: "none"
        });

        if (className) {
          el.classList.add(...className.split(" ").filter(Boolean));
        }

        textNode = document.createElement("span");
        el.appendChild(textNode);

        dom.setTransform(el, -100, -100);
        return el;
      },

      update: (app, el) => {
        const text = app.state.interaction.text;

        if (app.state.isHover && text) {
          textNode.innerText = text;
          dom.css(el, { opacity: "1" });
          const { x, y } = app.state.smooth;
          dom.setTransform(el, x + offX, y + offY);
        } else {
          dom.css(el, { opacity: "0" });
        }
      }
    },
    options
  );
};
