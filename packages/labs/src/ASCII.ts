import type { SupermouseInstance, SupermousePlugin, ValueOrGetter } from "@supermousejs/core";
import { definePlugin, normalizeAll, css, math, clamp, Layers } from "@supermousejs/utils";
import { createSurface, type Surface } from "./internal/surface";

export interface AsciiOptions {
  name?: string;
  isEnabled?: boolean;
  /** Characters to draw from, walked in order. */
  charset?: ValueOrGetter<string>;
  /** Font size in pixels. */
  size?: ValueOrGetter<number>;
  /** Pixels of travel between stamps. */
  spacing?: ValueOrGetter<number>;
  color?: ValueOrGetter<string>;
  /** How fast the ink evaporates, in alpha per second. */
  fade?: ValueOrGetter<number>;
  /** Random position scatter, in pixels. */
  spread?: ValueOrGetter<number>;
  /** Maximum random rotation of a glyph, in degrees. */
  tilt?: ValueOrGetter<number>;
  /** Widen the spacing with speed, so a fast pass reads as data, not prose. */
  react?: boolean;
  blend?: string;
}

/**
 * The path, transcribed: every few pixels of travel stamps a character from the
 * set — jittered in position and rotation — while the whole page of glyphs
 * decays toward transparent underneath it.
 *
 * The decay is the interesting half. A canvas cleared each frame loses its
 * history, so instead the surface is wiped with a `destination-out` fill: erase
 * by exactly the alpha you paint, which subtracts from what is already there
 * rather than veiling it. That is what lets old characters fade on their own
 * schedule while this frame's land on top at full strength.
 */
export const ASCII = (options: AsciiOptions = {}): SupermousePlugin => {
  const cfg = normalizeAll(options, {
    charset: "0123456789",
    size: 14,
    spacing: 13,
    color: "#f59e0b",
    fade: 1.6,
    spread: 7,
    tilt: 12
  });

  let surface: Surface | null = null;
  let travelled = 0;
  let lastX = 0;
  let lastY = 0;
  let hasLast = false;
  let index = 0;

  return definePlugin<HTMLCanvasElement>(
    {
      name: options.name ?? "ascii",

      create: () => {
        const canvas = document.createElement("canvas");
        surface = createSurface(canvas);
        css(canvas, {
          position: "absolute",
          top: "0",
          left: "0",
          display: "block",
          pointerEvents: "none",
          zIndex: Layers.TRACE,
          mixBlendMode: options.blend ?? "normal"
        });
        return canvas;
      },

      install: () => {
        surface?.fit();
        surface?.observe();
      },

      onEnable: () => {
        surface?.fit();
        surface?.clear();
        travelled = 0;
        hasLast = false;
        index = 0;
      },

      update: (app: SupermouseInstance, el: HTMLCanvasElement, dtMs: number) => {
        if (!surface) return;
        const state = app.state;
        const dt = Math.min(Math.max(dtMs, 0), 50) / 1000;

        // Evaporate first, so this frame's glyphs land on a faded page.
        surface.fade(1 - Math.exp(-cfg.fade(state) * dt));

        // The native pointer is showing, which means no custom cursor is on
        // screen — a trail of characters would belong to nothing.
        if (!state.hasReceivedInput || state.isNative) return;

        const { x, y } = state.smooth;

        if (!hasLast) {
          lastX = x;
          lastY = y;
          hasLast = true;
          return;
        }

        const dx = x - lastX;
        const dy = y - lastY;
        const length = Math.hypot(dx, dy);
        travelled += length;

        const speed = Math.hypot(state.velocity.x, state.velocity.y);
        const spacing = cfg.spacing(state) * (options.react ? 1 + clamp(speed / 900, 0, 1) : 1);

        if (travelled >= spacing) {
          const { ctx } = surface;
          const glyphs = cfg.charset(state) || ".";
          const size = cfg.size(state);
          const spread = cfg.spread(state);
          const tilt = cfg.tilt(state);
          const color = cfg.color(state);

          // Spread the stamps along the segment rather than dropping them all at
          // the destination: a fast flick should write a word, not one letter.
          const steps = Math.min(8, Math.max(1, Math.floor(travelled / spacing)));

          ctx.font = `${size}px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillStyle = color;

          for (let s = 1; s <= steps; s++) {
            const t = s / steps;
            ctx.save();
            ctx.translate(
              lastX + dx * t + math.random(-spread, spread),
              lastY + dy * t + math.random(-spread, spread)
            );
            if (tilt > 0) ctx.rotate((math.random(-tilt, tilt) * Math.PI) / 180);
            // Walking the charset in order reads as a sequence being written;
            // sampling it at random reads as noise.
            ctx.fillText(glyphs[index % glyphs.length], 0, 0);
            ctx.restore();
            index++;
          }

          travelled %= spacing;
        }

        lastX = x;
        lastY = y;

        void el;
      },

      cleanup: () => {
        surface?.dispose();
        surface = null;
      }
    },
    options
  );
};
