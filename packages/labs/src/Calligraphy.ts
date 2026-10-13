import type { SupermouseInstance, SupermousePlugin, ValueOrGetter } from "@supermousejs/core";
import { definePlugin, normalizeAll, css, Layers } from "@supermousejs/utils";
import { createSurface, type Surface } from "./internal/surface";

export interface CalligraphyOptions {
  name?: string;
  isEnabled?: boolean;
  /** Links in the spring chain. More links, longer ribbon. Set at construction. */
  points?: number;
  /** Stroke width at the nib, in pixels. The chain tapers from here. */
  width?: ValueOrGetter<number>;
  /** Spring stiffness of each link. Higher is a stiffer, shorter ribbon. */
  spring?: ValueOrGetter<number>;
  /** Velocity retained per frame. Lower is more drag. */
  friction?: ValueOrGetter<number>;
  color?: ValueOrGetter<string>;
  /**
   * Draw a dormant signature before the pointer has ever moved. A showcase
   * cursor that does nothing until it is touched reads as broken.
   */
  idle?: boolean;
  /** Rate of the dormant signature. */
  idleRate?: ValueOrGetter<number>;
  blend?: string;
}

interface Link {
  x: number;
  y: number;
  dx: number;
  dy: number;
}

/**
 * A wet nib dragging a spring chain behind the pointer.
 *
 * The chain is simulated rather than keyframed: each link is pulled toward the
 * one ahead of it, keeps a fraction of its own velocity, and is stroked as a
 * quadratic through the midpoints with a width that tapers with depth. That is
 * what produces the calligraphic swell — the ribbon lags, overshoots and
 * thickens where it is moving slowly, none of it authored.
 *
 * Technique from Ksenia Kondrashova, https://codepen.io/ksenia-k/pen/rNoBgbV —
 * this is a port of the plugin that used to live in the playground.
 */
export const Calligraphy = (options: CalligraphyOptions = {}): SupermousePlugin => {
  const cfg = normalizeAll(options, {
    width: 7,
    spring: 0.4,
    friction: 0.5,
    color: "#f59e0b",
    idleRate: 1
  });

  const chainLength = Math.max(8, options.points ?? 40);

  let surface: Surface | null = null;
  let chain: Link[] = [];

  let targetX = 0;
  let targetY = 0;
  let hasTarget = false;
  let wasNative = false;

  const seed = (x: number, y: number): void => {
    chain = Array.from({ length: chainLength }, () => ({ x, y, dx: 0, dy: 0 }));
    targetX = x;
    targetY = y;
    hasTarget = false;
  };

  return definePlugin<HTMLCanvasElement>(
    {
      name: options.name ?? "calligraphy",

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
        seed(window.innerWidth / 2, window.innerHeight / 2);
        return canvas;
      },

      install: () => {
        if (!surface) return;
        surface.fit();
        // A resize invalidates the backing store, so the ribbon is re-seeded
        // rather than stretched from stale coordinates.
        surface.observe(() => seed(targetX, targetY));
      },

      onEnable: (app) => {
        if (!surface) return;
        surface.fit();
        const state = app.state;
        const x = state.hasReceivedInput ? state.smooth.x : surface.width / 2;
        const y = state.hasReceivedInput ? state.smooth.y : surface.height / 2;
        // Re-seeding collapses the chain onto the pointer, so returning to the
        // scope does not draw a ribbon across the whole stage on the way in.
        seed(x, y);
        wasNative = false;
        surface.clear();
      },

      update: (app: SupermouseInstance, el: HTMLCanvasElement, dtMs: number) => {
        if (!surface) return;
        const { ctx } = surface;

        const state = app.state;
        const dt = Math.min(Math.max(dtMs, 0), 50) / 1000;

        // The native pointer is showing, so there is no custom cursor for a nib
        // to belong to. The ribbon is erased rather than left frozen mid-stroke,
        // and the chain is collapsed on the way back in so it cannot draw a line
        // across the stage from wherever it was abandoned.
        if (state.isNative) {
          wasNative = true;
          surface.clear();
          return;
        }
        if (wasNative) {
          wasNative = false;
          seed(
            state.hasReceivedInput ? state.smooth.x : targetX,
            state.hasReceivedInput ? state.smooth.y : targetY
          );
        }

        if (state.hasReceivedInput) {
          targetX = state.smooth.x;
          targetY = state.smooth.y;
          hasTarget = true;
        } else if (options.idle !== false) {
          const t = performance.now() * 0.001 * cfg.idleRate(state);
          targetX = (0.5 + 0.28 * Math.cos(0.9 * t) * Math.sin(0.45 * t)) * surface.width;
          targetY = (0.5 + 0.22 * Math.cos(1.1 * t) + 0.1 * Math.cos(2.2 * t)) * surface.height;
          hasTarget = true;
        }

        if (!hasTarget) return;

        const spring = cfg.spring(state);
        const friction = cfg.friction(state);
        /*
         * The chain is an explicit Euler integration, so its coefficients are
         * per-frame quantities: written naively it would be twice as stiff on a
         * 120Hz display as on a 60Hz one. `frame` expresses the elapsed time in
         * 60Hz frames and both coefficients are scaled by it, which makes the
         * ribbon identical across refresh rates and reduces to the original
         * per-frame numbers at exactly 60Hz.
         */
        const frame = dt * 60;
        const drag = Math.pow(friction, frame);

        for (let i = 0; i < chain.length; i++) {
          const link = chain[i];
          const ahead = i === 0 ? { x: targetX, y: targetY } : chain[i - 1];
          // The head is pulled harder than the body, which is what keeps the
          // nib under the pointer while the ribbon trails behind it.
          const pull = (i === 0 ? spring * 2 : spring) * frame;

          link.dx = (link.dx + (ahead.x - link.x) * pull) * drag;
          link.dy = (link.dy + (ahead.y - link.y) * pull) * drag;
          link.x += link.dx;
          link.y += link.dy;
        }

        surface.clear();

        const color = cfg.color(state);
        const nib = cfg.width(state);

        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.strokeStyle = color;

        ctx.beginPath();
        ctx.moveTo(chain[0].x, chain[0].y);

        for (let i = 1; i < chain.length - 1; i++) {
          const midX = 0.5 * (chain[i].x + chain[i + 1].x);
          const midY = 0.5 * (chain[i].y + chain[i + 1].y);

          ctx.lineWidth = Math.max(0.5, nib * (1 - i / chain.length));
          ctx.quadraticCurveTo(chain[i].x, chain[i].y, midX, midY);
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(midX, midY);
        }

        ctx.lineWidth = 0.5;
        ctx.lineTo(chain[chain.length - 1].x, chain[chain.length - 1].y);
        ctx.stroke();

        void el;
      },

      cleanup: () => {
        surface?.dispose();
        surface = null;
      },

      destroy: () => {
        chain = [];
      }
    },
    options
  );
};
