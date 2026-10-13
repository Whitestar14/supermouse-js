import type { SupermouseInstance, SupermousePlugin, ValueOrGetter } from "@supermousejs/core";
import {
  definePlugin,
  normalizeAll,
  css,
  setTransform,
  clamp,
  damp,
  Layers
} from "@supermousejs/utils";
import { cssWithWebkit } from "./internal/prefix";

export interface HalftoneOptions {
  name?: string;
  isEnabled?: boolean;
  /** Diameter of the disc. */
  size?: ValueOrGetter<number>;
  /** Grid pitch at rest, in pixels. */
  cell?: ValueOrGetter<number>;
  /** Dot radius as a fraction of the cell. */
  dot?: ValueOrGetter<number>;
  color?: ValueOrGetter<string>;
  /** Tighten the grid and fatten the dots as the pointer speeds up. */
  react?: boolean;
  /** Fade the grid out at the rim instead of ending it on a hard edge. */
  mask?: boolean;
}

/**
 * A printed dot screen. The cursor is a CSS `radial-gradient` tiled by
 * `background-size`: one dot per cell, no canvas, no per-frame allocations.
 *
 * The only moving part is the pitch. Tightening the grid while the pointer
 * accelerates mimics a press gaining ink, which is the trick that makes a flat
 * pattern feel like material.
 */
export const Halftone = (options: HalftoneOptions = {}): SupermousePlugin => {
  const cfg = normalizeAll(options, {
    size: 132,
    cell: 9,
    dot: 0.32,
    color: "#f2f2f4"
  });

  let currentCell = 9;
  let pressScale = 1;

  return definePlugin<HTMLDivElement>(
    {
      name: options.name ?? "halftone",

      create: () => {
        const el = document.createElement("div");
        css(el, {
          position: "absolute",
          top: "0",
          left: "0",
          borderRadius: "50%",
          pointerEvents: "none",
          willChange: "transform",
          zIndex: Layers.CURSOR
        });
        return el;
      },

      onEnable: (app, el) => {
        currentCell = cfg.cell(app.state);
        pressScale = 1;
        css(el, { opacity: "1" });
      },

      update: (app: SupermouseInstance, el: HTMLDivElement, dtMs: number) => {
        const state = app.state;
        const dt = dtMs / 1000;

        if (!state.hasReceivedInput) {
          css(el, { opacity: "0" });
          return;
        }
        css(el, { opacity: "1" });

        const size = cfg.size(state);
        const base = cfg.cell(state);
        const speed = Math.hypot(state.velocity.x, state.velocity.y);
        // Against a 1000px/s reference, so the screen loads up gradually rather
        // than snapping to full ink the moment the pointer moves.
        const pressure = options.react === false ? 0 : clamp(speed / 900, 0, 1);

        // Fast movement tightens the grid and fattens the dots, so the screen
        // reads as loaded rather than merely displaced.
        const targetCell = base * (1 - pressure * 0.35);
        currentCell = damp(currentCell, targetCell, 9, dt);

        const radius = currentCell * cfg.dot(state) * (1 + pressure * 0.5);
        const color = cfg.color(state);

        css(el, {
          width: `${size}px`,
          height: `${size}px`,
          backgroundImage: `radial-gradient(circle at 50% 50%, ${color} ${radius.toFixed(2)}px, transparent ${(radius + 0.6).toFixed(2)}px)`,
          backgroundSize: `${currentCell.toFixed(2)}px ${currentCell.toFixed(2)}px`,
          backgroundPosition: "center"
        });
        // The rim fade is a mask, so it needs both spellings — through `css()`
        // the prefixed twin comes out as `webkit-mask-image`, which no engine
        // recognises.
        cssWithWebkit(
          el,
          "mask-image",
          options.mask === false
            ? "none"
            : "radial-gradient(circle at 50% 50%, #000 46%, transparent 88%)"
        );

        const press = state.isDown ? 0.86 : 1;
        pressScale = damp(pressScale, press, 20, dt);

        setTransform(el, state.smooth.x, state.smooth.y, 0, pressScale, pressScale);
      }
    },
    options
  );
};
