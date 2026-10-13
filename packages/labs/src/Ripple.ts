import type { SupermouseInstance, SupermousePlugin, ValueOrGetter } from "@supermousejs/core";
import {
  definePlugin,
  normalizeAll,
  css,
  setTransform,
  svg,
  math,
  Layers
} from "@supermousejs/utils";

export interface RippleOptions {
  name?: string;
  isEnabled?: boolean;
  /** Radius a ring reaches before it dies. */
  size?: ValueOrGetter<number>;
  /** Rings that can be alive at once. Set at construction. */
  count?: number;
  /** Milliseconds for one ring to expand out. */
  duration?: ValueOrGetter<number>;
  /** Stroke weight at birth, in pixels. */
  thickness?: ValueOrGetter<number>;
  color?: ValueOrGetter<string>;
  /** Keep emitting rings while the button stays down. */
  hold?: boolean;
  /** Milliseconds between rings while held. */
  interval?: ValueOrGetter<number>;
  /** Emit a ring every time the pointer crosses this many pixels. */
  spacing?: ValueOrGetter<number>;
  blend?: string;
}

interface Ring {
  el: SVGCircleElement;
  x: number;
  y: number;
  radius: number;
  life: number;
  age: number;
}

const BOX = 400;
const CENTER = BOX / 2;

/**
 * Concentric rings that carry outward from the press point and thin as they
 * go, like a struck surface.
 *
 * A ring is one stroked circle: no filters, no compositing, one path per
 * ripple. It is the cheapest effect in the set and, pointed at the right
 * surface, the one that reads as physical fastest.
 */
export const Ripple = (options: RippleOptions = {}): SupermousePlugin => {
  const cfg = normalizeAll(options, {
    size: 96,
    duration: 900,
    thickness: 2,
    color: "#f2f2f4",
    interval: 260,
    spacing: 260
  });

  const poolSize = options.count ?? 10;
  const pool: Ring[] = [];

  let wasDown = false;
  let held = 0;
  let travelled = 0;
  let lastX = 0;
  let lastY = 0;
  let hasLast = false;

  const spawn = (x: number, y: number, maxRadius: number, scale: number): void => {
    // A finished ring is preferred; failing that the oldest one yields, so a
    // fast drag over a small pool keeps emitting instead of silently swallowing
    // its own rings. Inkblot makes the same choice for the same reason.
    const ring =
      pool.find((candidate) => candidate.life >= 1) ??
      pool.reduce(
        (oldest, candidate) => (candidate.life > oldest.life ? candidate : oldest),
        pool[0]
      );
    if (!ring) return;
    ring.x = x;
    ring.y = y;
    ring.radius = maxRadius * scale;
    ring.life = 0;
    ring.age = 0;
    css(ring.el, { opacity: "1" });
  };

  return definePlugin<SVGSVGElement>(
    {
      name: options.name ?? "ripple",

      create: () => {
        const el = svg.createSVGElement("svg", {
          width: BOX,
          height: BOX,
          viewBox: `0 0 ${BOX} ${BOX}`
        });

        css(el, {
          position: "absolute",
          top: "0",
          left: "0",
          width: `${BOX}px`,
          height: `${BOX}px`,
          overflow: "visible",
          pointerEvents: "none",
          willChange: "transform",
          mixBlendMode: options.blend ?? "screen",
          zIndex: Layers.TRACE
        });

        for (let i = 0; i < poolSize; i++) {
          const ring = svg.circle({
            cx: CENTER,
            cy: CENTER,
            r: 0,
            fill: "none"
          });
          el.appendChild(ring);
          pool.push({ el: ring, x: 0, y: 0, radius: 0, life: 1, age: 0 });
        }

        return el;
      },

      onEnable: () => {
        wasDown = false;
        hasLast = false;
        held = 0;
        travelled = 0;
        for (const ring of pool) {
          ring.life = 1;
          css(ring.el, { opacity: "0" });
        }
      },

      update: (app: SupermouseInstance, el: SVGSVGElement, dtMs: number) => {
        const state = app.state;
        const dt = dtMs / 1000;

        if (!state.hasReceivedInput) {
          css(el, { opacity: "0" });
          return;
        }
        css(el, { opacity: "1" });

        const { x, y } = state.pointer;
        const maxRadius = cfg.size(state);

        if (state.isDown && !wasDown) {
          spawn(x, y, maxRadius, math.random(0.85, 1.15));
          held = 0;
          travelled = 0;
        } else if (state.isDown && (options.hold ?? true)) {
          held += dtMs;
          if (held >= cfg.interval(state)) {
            held = 0;
            spawn(x, y, maxRadius, math.random(0.55, 0.9));
          }
        }

        if (state.isDown) {
          if (!hasLast) {
            lastX = x;
            lastY = y;
            hasLast = true;
          }
          travelled += math.dist(x, y, lastX, lastY);
          if (travelled > cfg.spacing(state)) {
            travelled = 0;
            spawn(x, y, maxRadius, math.random(0.4, 0.7));
          }
          lastX = x;
          lastY = y;
        } else {
          hasLast = false;
        }
        wasDown = state.isDown;

        const color = cfg.color(state);
        const thickness = cfg.thickness(state);
        const duration = cfg.duration(state) / 1000;

        for (const ring of pool) {
          if (ring.life >= 1) continue;
          ring.age += dt;
          const t = Math.min(1, ring.age / duration);
          ring.life = t;

          const eased = 1 - (1 - t) * (1 - t) * (1 - t);
          const radius = Math.max(0.5, ring.radius * eased);
          const opacity = Math.max(0, 1 - t);

          svg.setSVGAttrs(ring.el, {
            cx: CENTER,
            cy: CENTER,
            r: radius,
            stroke: color,
            "stroke-width": thickness * (1 - t * 0.7)
          });
          ring.el.setAttribute(
            "transform",
            `translate(${(ring.x - state.smooth.x).toFixed(1)} ${(ring.y - state.smooth.y).toFixed(1)})`
          );
          css(ring.el, { opacity: String(opacity) });
        }

        setTransform(el, state.smooth.x, state.smooth.y);
      }
    },
    options
  );
};
