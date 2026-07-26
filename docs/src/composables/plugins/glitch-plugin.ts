import { definePlugin, dom, Layers } from "@supermousejs/utils";
import type { SupermouseInstance, SupermousePlugin } from "@supermousejs/core";

export interface GlitchCursorOptions {
  name?: string;
  isEnabled?: boolean;
  cursorSize?: number;
  glitchColorB?: string;
  glitchColorR?: string;
  hoverSelectors?: string[];
}

export const GlitchCursor = (options: GlitchCursorOptions = {}): SupermousePlugin => {
  const size = options.cursorSize ?? 25;
  const colorB = options.glitchColorB ?? "#00feff";
  const colorR = options.glitchColorR ?? "#ff4f71";

  let previousPointerX = 0;
  let previousPointerY = 0;
  let initialized = false; // guards against first-frame spike
  let moving = false;
  let moveTimeout: ReturnType<typeof setTimeout>;

  return definePlugin<HTMLDivElement>(
    {
      name: options.name || "glitch-cursor",

      create: () => {
        const el = dom.createActor("div") as HTMLDivElement;
        const supportsBackdrop = CSS.supports("backdrop-filter", "invert(1)");

        dom.css(el, {
          position: "fixed",
          top: `${size / -2}px`,
          left: `${size / -2}px`,
          zIndex: Layers.CURSOR,
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: "50%",
          userSelect: "none",
          pointerEvents: "none",
          ...(supportsBackdrop
            ? { backdropFilter: "invert(1)", backgroundColor: "#fff0" }
            : { backgroundColor: "#222" })
        });

        return el;
      },

      update: (app: SupermouseInstance, el: HTMLDivElement) => {
        const { pointer, smooth, isDown } = app.state;

        if (!initialized) {
          previousPointerX = pointer.x;
          previousPointerY = pointer.y;
          initialized = true;
          return; // skip this frame to avoid delta spike
        }

        const rawDX = pointer.x - previousPointerX;
        const rawDY = pointer.y - previousPointerY;

        const clampedDX = Math.max(-10, Math.min(10, rawDX));
        const clampedDY = Math.max(-10, Math.min(10, rawDY));

        previousPointerX = pointer.x;
        previousPointerY = pointer.y;

        const scale = isDown ? " scale(0.75)" : "";
        el.style.transform = `translate3d(${smooth.x}px, ${smooth.y}px, 0)${scale}`;

        if (moving || rawDX !== 0 || rawDY !== 0) {
          const shadow = `${clampedDX}px ${clampedDY}px 0 ${colorB}, ${-clampedDX}px ${-clampedDY}px 0 ${colorR}`;
          dom.setStyle(el, "boxShadow", shadow);
        } else {
          dom.setStyle(el, "boxShadow", "");
        }

        clearTimeout(moveTimeout);
        moving = true;
        moveTimeout = setTimeout(() => {
          moving = false;
        }, 50);
      },

      onEnable: () => {
        initialized = false;
      },

      cleanup: () => {
        clearTimeout(moveTimeout);
      }
    },
    options
  );
};
