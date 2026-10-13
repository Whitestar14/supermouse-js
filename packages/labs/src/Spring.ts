import type { SupermouseInstance, SupermousePlugin, ValueOrGetter } from "@supermousejs/core";
import {
  definePlugin,
  normalizeAll,
  css,
  setTransform,
  clamp,
  damp,
  math,
  Layers
} from "@supermousejs/utils";

export interface SpringOptions {
  name?: string;
  isEnabled?: boolean;
  /** Diameter of the body at rest, in pixels. */
  size?: ValueOrGetter<number>;
  color?: ValueOrGetter<string>;
  /** Undamped natural frequency in hertz: how fast the body chases the pointer. */
  frequency?: ValueOrGetter<number>;
  /** Damping ratio. `1` settles without overshooting, below `1` bounces. */
  damping?: ValueOrGetter<number>;
  /** How far the body stretches along its direction of travel, 0–1. */
  squash?: ValueOrGetter<number>;
  /** Diameter while hovering a registered target. */
  hoverSize?: ValueOrGetter<number>;
  /** Draw the raw pointer as a hairline, so the lag is legible. */
  showTarget?: boolean;
  blend?: string;
  zIndex?: string;
}

/**
 * The largest step the integrator will take, in seconds. A spring's stiffness is
 * set live, so a frequency high enough to be interesting is also high enough for
 * one 16ms step of semi-implicit Euler to go unstable — see the sub-stepping in
 * `update`.
 */
const MAX_STEP = 1 / 120;

/**
 * A second-order follower: instead of the engine's exponential ease, the body is
 * a mass on a spring, so `frequency` and `damping` are physical quantities with
 * names — how fast it wants to arrive, and whether it overshoots. Critically
 * damped it arrives cleanly; underdamped it rings, and that ring is the whole
 * reason to offer it next to the built-in smoothing.
 *
 * It integrates its own position rather than reading `state.smooth`, because the
 * point of the plugin is to *replace* that easing. The engine's smoothing still
 * runs underneath and still feeds `velocity`, `angle` and every other plugin;
 * this one just declines to use its position. The hairline at the raw pointer is
 * there so the difference between the two is visible.
 */
export const Spring = (options: SpringOptions = {}): SupermousePlugin => {
  const cfg = normalizeAll(options, {
    size: 16,
    color: "#f59e0b",
    frequency: 3.2,
    damping: 0.75,
    squash: 0.5,
    hoverSize: 26
  });

  /** Follower state. `x`/`y` in stage pixels, `vx`/`vy` in pixels per second. */
  let x = 0;
  let y = 0;
  let vx = 0;
  let vy = 0;
  let rotation = 0;
  let size = 0;
  /** Cleared on enable, so the first frame after activation snaps rather than flies in. */
  let placed = false;

  let body: HTMLDivElement;
  let target: HTMLDivElement;

  return definePlugin<HTMLDivElement>(
    {
      name: options.name ?? "spring",
      hoverSelector: "[data-hover]",

      create: () => {
        const el = document.createElement("div");
        css(el, {
          position: "absolute",
          top: "0",
          left: "0",
          width: "0",
          height: "0",
          pointerEvents: "none",
          // Hidden until the first frame decides otherwise: a fresh plugin would
          // otherwise sit at the stage origin for one frame.
          opacity: "0",
          zIndex: options.zIndex ?? Layers.CURSOR,
          mixBlendMode: options.blend ?? "normal"
        });

        // The pointer itself. Without it the lag has nothing to be measured
        // against, and a spring just looks like a lazy cursor.
        target = document.createElement("div");
        css(target, {
          position: "absolute",
          top: "0",
          left: "0",
          boxSizing: "border-box",
          borderRadius: "50%",
          borderWidth: "1px",
          borderStyle: "solid",
          opacity: "0.4",
          willChange: "transform"
        });

        body = document.createElement("div");
        css(body, {
          position: "absolute",
          top: "0",
          left: "0",
          borderRadius: "50%",
          willChange: "transform"
        });

        el.append(target, body);
        return el;
      },

      onEnable: (app) => {
        const state = app.state;
        // Snap, never swing in from wherever the last activation left it.
        placed = state.hasReceivedInput;
        x = state.pointer.x;
        y = state.pointer.y;
        vx = 0;
        vy = 0;
        size = cfg.size(state);
        rotation = state.angle;
      },

      update: (app: SupermouseInstance, el: HTMLDivElement, dtMs: number) => {
        const state = app.state;

        if (!state.hasReceivedInput) {
          css(el, { opacity: "0" });
          return;
        }
        css(el, { opacity: "1" });

        const tx = state.pointer.x;
        const ty = state.pointer.y;
        if (!placed) {
          placed = true;
          x = tx;
          y = ty;
          vx = 0;
          vy = 0;
        }

        const dt = clamp(dtMs / 1000, 0, 0.1);
        const omega = 2 * Math.PI * Math.max(0.2, cfg.frequency(state));
        const stiffness = omega * omega;
        const drag = 2 * Math.max(0.05, cfg.damping(state)) * omega;

        // Sub-stepped semi-implicit Euler. The stability limit for this scheme
        // is roughly `omega * h < 2`, which a 14Hz spring exceeds at 60Hz — so
        // the step is capped and the frame is split. Without this the damping
        // ratio is a lie: a stiff spring would ring no matter what it is set to.
        const steps = clamp(Math.ceil(dt / MAX_STEP), 1, 16);
        const h = dt / steps;
        for (let i = 0; i < steps; i++) {
          vx += ((tx - x) * stiffness - vx * drag) * h;
          vy += ((ty - y) * stiffness - vy * drag) * h;
          x += vx * h;
          y += vy * h;
        }

        const speed = Math.hypot(vx, vy);
        if (speed > 0.5) {
          rotation = math.lerpAngle(rotation, math.angle(vx, vy), 1 - Math.exp(-14 * dt));
        }

        const rest = Math.max(1, cfg.size(state));
        const goal = state.isHover ? Math.max(rest, cfg.hoverSize(state)) : rest;
        size = damp(size, goal, 12, dt);

        // The stretch is the velocity the spring is carrying, not the pointer's:
        // the body is the thing that has momentum.
        const stretch = clamp((speed / 900) * cfg.squash(state), 0, 0.45);
        css(body, {
          width: `${size}px`,
          height: `${size}px`,
          backgroundColor: cfg.color(state)
        });
        setTransform(body, x, y, rotation, 1 + stretch, 1 - stretch * 0.7);

        const showTarget = options.showTarget !== false;
        css(target, {
          display: showTarget ? "block" : "none",
          width: `${rest * 2.4}px`,
          height: `${rest * 2.4}px`,
          borderColor: cfg.color(state)
        });
        setTransform(target, tx, ty);
      }
    },
    options
  );
};
