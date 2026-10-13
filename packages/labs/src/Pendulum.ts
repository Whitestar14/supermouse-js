import type { SupermouseInstance, SupermousePlugin, ValueOrGetter } from "@supermousejs/core";
import {
  definePlugin,
  normalizeAll,
  css,
  setTransform,
  clamp,
  damp,
  svg,
  Layers
} from "@supermousejs/utils";

export interface PendulumOptions {
  name?: string;
  isEnabled?: boolean;
  /** Rod length in pixels. */
  rod?: ValueOrGetter<number>;
  /** Bob diameter in pixels. */
  bob?: ValueOrGetter<number>;
  color?: ValueOrGetter<string>;
  /** Downward acceleration, in pixels per second squared. */
  gravity?: ValueOrGetter<number>;
  /** Kinetic energy kept per 60Hz frame. Lower is a heavier bob in thicker air. */
  drag?: ValueOrGetter<number>;
  /** How far off the vertical the bob is released, as a fraction of a quarter turn. */
  entrance?: ValueOrGetter<number>;
  /** Bob diameter while hovering a registered target. */
  hoverSize?: ValueOrGetter<number>;
  blend?: string;
  zIndex?: string;
}

/** Fixed drawing box, so `rod` and `bob` stay live options. */
const BOX = 440;
const CENTER = BOX / 2;
const MAX_ROD = 160;

/**
 * A bob on a rigid rod, hinged at the pointer, integrated with Verlet rather
 * than the Euler scheme the other chain-like plugins use.
 *
 * Verlet is the reason this exists: the rod is a *position* constraint, and
 * Verlet satisfies constraints by moving a point and letting the implied
 * velocity fall out of the position history. Enforcing the rod that way removes
 * radial velocity for free — no spring constant to tune, no energy added by the
 * solver — so a flick carries the bob around the hinge exactly as far as the
 * hand moved, and drag is the only thing that takes it away.
 *
 * The hinge is the *raw* pointer, not the smoothed position: the point of this
 * cursor is that it answers to the hand, and stacking the engine's easing on top
 * of a physical simulation would blur which of the two is lagging.
 */
export const Pendulum = (options: PendulumOptions = {}): SupermousePlugin => {
  const cfg = normalizeAll(options, {
    rod: 96,
    bob: 14,
    color: "#f59e0b",
    gravity: 2600,
    drag: 0.985,
    entrance: 0.4,
    hoverSize: 24
  });

  let rodEl: SVGLineElement;
  let bobEl: SVGCircleElement;
  let pivotEl: SVGCircleElement;

  /** Bob position and its previous position — this is the whole Verlet state. */
  let bx = CENTER;
  let by = CENTER;
  let pbx = CENTER;
  let pby = CENTER;
  let bobSize = 0;
  /** Hinge of the last frame, so the drawn rod and the constraint agree. */
  let anchorX = 0;
  let anchorY = 0;
  let seeded = false;

  /** Releases the bob `kick` of a quarter turn off the vertical, swinging inward. */
  const seed = (ax: number, ay: number, rod: number, kick: number): void => {
    const start = ((90 - kick * 75) * Math.PI) / 180;
    const behind = start - kick * 0.08;
    bx = ax + Math.cos(start) * rod;
    by = ay + Math.sin(start) * rod;
    // The previous position sits *behind* the bob on its way to the vertical:
    // Verlet stores motion as where the body was, so one frame of "behind" is
    // one frame of velocity, here aimed inward so the entrance is a real swing.
    pbx = ax + Math.cos(behind) * rod;
    pby = ay + Math.sin(behind) * rod;
  };

  return definePlugin<SVGSVGElement>(
    {
      name: options.name ?? "pendulum",
      hoverSelector: "[data-hover]",

      create: (app) => {
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
          // Hidden until the first frame decides otherwise: a fresh plugin would
          // otherwise sit at the stage origin for one frame.
          opacity: "0",
          mixBlendMode: options.blend ?? "normal",
          zIndex: options.zIndex ?? Layers.CURSOR
        });

        rodEl = svg.createSVGElement("line", {
          x1: CENTER,
          y1: CENTER,
          x2: CENTER,
          y2: CENTER,
          strokeWidth: 1,
          strokeOpacity: 0.35
        });
        pivotEl = svg.circle({ cx: CENTER, cy: CENTER, r: 2.5 });
        bobEl = svg.circle({ cx: CENTER, cy: CENTER, r: cfg.bob(app.state) / 2 });

        el.append(rodEl, pivotEl, bobEl);
        return el;
      },

      onEnable: (app) => {
        const state = app.state;
        seeded = state.hasReceivedInput;
        anchorX = state.pointer.x;
        anchorY = state.pointer.y;
        bobSize = cfg.bob(state);
        seed(anchorX, anchorY, cfg.rod(state), cfg.entrance(state));
      },

      update: (app: SupermouseInstance, el: SVGSVGElement, dtMs: number) => {
        const state = app.state;

        if (!state.hasReceivedInput) {
          css(el, { opacity: "0" });
          return;
        }
        css(el, { opacity: "1" });

        const rod = clamp(cfg.rod(state), 20, MAX_ROD);
        const ax = state.pointer.x;
        const ay = state.pointer.y;

        if (!seeded) {
          seeded = true;
          seed(ax, ay, rod, cfg.entrance(state));
        }

        // Capped at 30ms: a longer step both overshoots the rod constraint and
        // lets gravity tunnel the bob through the hinge on a slow frame.
        const h = clamp(dtMs / 1000, 0, 1 / 30);
        const drag = Math.pow(clamp(cfg.drag(state), 0.5, 0.999), h * 60);
        const gravity = cfg.gravity(state);

        const vx = (bx - pbx) * drag;
        const vy = (by - pby) * drag;
        pbx = bx;
        pby = by;
        bx += vx;
        by += vy + gravity * h * h;

        // The rod as a constraint rather than a spring: put the bob back on the
        // circle and leave the previous position alone, so the solver eats the
        // radial part of the motion and keeps the tangential part.
        const dx = bx - ax;
        const dy = by - ay;
        const distance = Math.hypot(dx, dy) || 1;
        bx = ax + (dx / distance) * rod;
        by = ay + (dy / distance) * rod;
        anchorX = ax;
        anchorY = ay;

        const goal = state.isHover
          ? Math.max(cfg.bob(state), cfg.hoverSize(state))
          : cfg.bob(state);
        bobSize = damp(bobSize, goal, 14, h);

        // Both ends are placed relative to the box, and the box is placed on the
        // smoothed position: while the hand outruns the easing the hinge sits
        // off-centre, and the rod still has to reach it.
        const color = cfg.color(state);
        const offsetX = CENTER + (anchorX - state.smooth.x);
        const offsetY = CENTER + (anchorY - state.smooth.y);
        const bobX = CENTER + (bx - state.smooth.x);
        const bobY = CENTER + (by - state.smooth.y);

        svg.setSVGAttrs(rodEl, {
          x1: offsetX.toFixed(2),
          y1: offsetY.toFixed(2),
          x2: bobX.toFixed(2),
          y2: bobY.toFixed(2),
          stroke: color
        });
        svg.setSVGAttrs(pivotEl, {
          cx: offsetX.toFixed(2),
          cy: offsetY.toFixed(2),
          fill: color
        });
        svg.setSVGAttrs(bobEl, {
          cx: bobX.toFixed(2),
          cy: bobY.toFixed(2),
          r: (bobSize / 2).toFixed(2),
          fill: color
        });

        setTransform(el, state.smooth.x, state.smooth.y);
      }
    },
    options
  );
};
