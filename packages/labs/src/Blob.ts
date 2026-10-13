import type { SupermouseInstance, SupermousePlugin, ValueOrGetter } from "@supermousejs/core";
import {
  definePlugin,
  normalizeAll,
  css,
  setTransform,
  clamp,
  math,
  svg,
  Layers
} from "@supermousejs/utils";

export interface BlobOptions {
  name?: string;
  isEnabled?: boolean;
  /** Diameter at rest, in pixels. */
  size?: ValueOrGetter<number>;
  color?: ValueOrGetter<string>;
  /** Outline stroke colour. `transparent` leaves it out. */
  rim?: ValueOrGetter<string>;
  /** Points around the outline. The arrays are allocated once, for the maximum. */
  points?: ValueOrGetter<number>;
  /** How far travel stretches the leading edge, 0–1. */
  squash?: ValueOrGetter<number>;
  /** Depth of the idle breathing, 0–1. */
  wobble?: ValueOrGetter<number>;
  /** Outline spring stiffness. Higher snaps back harder. */
  spring?: ValueOrGetter<number>;
  /** Radius kept per 60Hz frame. Lower is a more sluggish body. */
  drag?: ValueOrGetter<number>;
  /** Diameter while hovering a registered target. */
  hoverSize?: ValueOrGetter<number>;
  blend?: string;
  zIndex?: string;
}

/** Hard ceiling on the outline's resolution; `points` stays a live option. */
const MAX_POINTS = 32;
const BOX = 320;
const CENTER = BOX / 2;

/**
 * A gelatinous body: a closed curve through a ring of points, each of them on
 * its own spring, dragged through the air by its leading edge.
 *
 * The deformation is not keyframed and not noise. Two forces act on the ring:
 * travel, which pushes the leading points out and lets the trailing ones fall
 * in (squash and stretch, as animation has always drawn it), and a slow sine
 * that breathes between them so the body is never perfectly still. A press
 * injects velocity into every point at once, and the springs ring it out —
 * which is why `spring` and `drag` are the two options that decide the
 * character, and why the outline is rebuilt from its points every frame rather
 * than morphed between shapes.
 *
 * Distinct from `Inkblot` on purpose: this body is solid, crisp-edged and
 * keeps its mass, where ink spreads, thins and dries.
 */
export const Blob = (options: BlobOptions = {}): SupermousePlugin => {
  const cfg = normalizeAll(options, {
    size: 64,
    color: "#f59e0b",
    rim: "rgba(255, 255, 255, 0.35)",
    points: 14,
    squash: 0.7,
    wobble: 0.6,
    spring: 0.22,
    drag: 0.86,
    hoverSize: 88
  });

  /** Per-point radius and its velocity toward the goal radius. */
  const radii = new Array<number>(MAX_POINTS).fill(0);
  const speeds = new Array<number>(MAX_POINTS).fill(0);

  let body: SVGPathElement;
  let highlight: SVGCircleElement;
  let elapsed = 0;
  let wasDown = false;

  return definePlugin<SVGSVGElement>(
    {
      name: options.name ?? "blob",
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
          // Hidden until the first frame decides otherwise.
          opacity: "0",
          mixBlendMode: options.blend ?? "normal",
          zIndex: options.zIndex ?? Layers.CURSOR
        });

        const base = Math.max(4, cfg.size(app.state)) / 2;
        radii.fill(base);

        body = svg.path("", { strokeWidth: 1.5, strokeLinejoin: "round" });
        // One specular dot, riding the upper-left of the mass. It is placed from
        // the live size rather than tracked against the deformed outline: a
        // highlight that slid around the shape would read as a second object.
        highlight = svg.circle({
          r: base * 0.2,
          fill: "#ffffff",
          opacity: 0.18
        });

        el.append(body, highlight);
        return el;
      },

      onEnable: (app) => {
        const base = Math.max(4, cfg.size(app.state)) / 2;
        for (let i = 0; i < MAX_POINTS; i++) {
          radii[i] = base;
          speeds[i] = 0;
        }
        wasDown = app.state.isDown;
        elapsed = 0;
      },

      update: (app: SupermouseInstance, el: SVGSVGElement, dtMs: number) => {
        const state = app.state;

        if (!state.hasReceivedInput) {
          css(el, { opacity: "0" });
          return;
        }
        css(el, { opacity: "1" });

        const dt = clamp(dtMs / 1000, 0, 0.05);
        elapsed += dt;
        /** Frame-length in 60Hz frames, so the Euler coefficients below are rates. */
        const frame = dt * 60;

        const rest = Math.max(4, state.isHover ? cfg.hoverSize(state) : cfg.size(state));
        const base = rest / 2;
        const count = clamp(Math.round(cfg.points(state)), 6, MAX_POINTS);
        const speed = Math.hypot(state.velocity.x, state.velocity.y);
        const travel = (state.angle * Math.PI) / 180;
        // `speed` is pixels per second, so this is "fully stretched at about
        // 1400px/s" rather than an arbitrary coefficient.
        const stretch = clamp((speed / 1400) * cfg.squash(state), 0, 0.4);
        const wobble = state.reducedMotion ? 0 : clamp(cfg.wobble(state), 0, 1);
        const pull = clamp(cfg.spring(state), 0.02, 0.7) * frame;
        const keep = Math.pow(clamp(cfg.drag(state), 0.4, 0.98), frame);

        // A press puts velocity into every point at once. The springs turn that
        // single impulse into a wobble that decays on its own, which is the
        // difference between a body being struck and a body being scaled.
        if (state.isDown && !wasDown) {
          for (let i = 0; i < MAX_POINTS; i++) speeds[i] += base * math.random(0.02, 0.05);
        }
        wasDown = state.isDown;

        for (let i = 0; i < count; i++) {
          const a = (i / count) * Math.PI * 2;
          // Leading points bulge, trailing points tuck: one cosine is both.
          const lead = 1 + stretch * Math.cos(a - travel);
          const breath = 1 + wobble * 0.1 * Math.sin(elapsed * 1.7 + i * 1.9);
          const goal = base * lead * breath;

          speeds[i] = (speeds[i] + (goal - radii[i]) * pull) * keep;
          radii[i] += speeds[i];
        }

        const px = new Array<number>(count);
        const py = new Array<number>(count);
        for (let i = 0; i < count; i++) {
          const a = (i / count) * Math.PI * 2;
          px[i] = CENTER + Math.cos(a) * radii[i];
          py[i] = CENTER + Math.sin(a) * radii[i];
        }

        // Catmull-Rom through the points, written as the cubic Béziers SVG
        // understands: each control point is a sixth of the chord between its
        // neighbours' neighbours. That is what keeps the outline smooth while the
        // radii underneath it are anything but.
        const at = (i: number): number => ((i % count) + count) % count;
        let d = `M ${px[0].toFixed(1)} ${py[0].toFixed(1)}`;
        for (let i = 0; i < count; i++) {
          const i0 = at(i - 1);
          const i1 = at(i);
          const i2 = at(i + 1);
          const i3 = at(i + 2);
          const c1x = px[i1] + (px[i2] - px[i0]) / 6;
          const c1y = py[i1] + (py[i2] - py[i0]) / 6;
          const c2x = px[i2] - (px[i3] - px[i1]) / 6;
          const c2y = py[i2] - (py[i3] - py[i1]) / 6;
          d += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)} ${c2x.toFixed(1)} ${c2y.toFixed(1)} ${px[i2].toFixed(1)} ${py[i2].toFixed(1)}`;
        }
        d += " Z";

        const rim = cfg.rim(state);
        svg.setSVGAttrs(body, {
          d,
          fill: cfg.color(state),
          stroke: rim,
          "stroke-opacity": rim === "transparent" ? 0 : 1
        });
        svg.setSVGAttrs(highlight, {
          cx: (CENTER - base * 0.3).toFixed(1),
          cy: (CENTER - base * 0.34).toFixed(1),
          r: (base * 0.2).toFixed(1)
        });

        setTransform(el, state.smooth.x, state.smooth.y);
      }
    },
    options
  );
};
