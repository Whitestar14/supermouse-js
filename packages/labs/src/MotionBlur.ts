import type { SupermouseInstance, SupermousePlugin, ValueOrGetter } from "@supermousejs/core";
import {
  definePlugin,
  normalizeAll,
  css,
  setTransform,
  svg,
  math,
  clamp,
  damp,
  Layers
} from "@supermousejs/utils";

export interface MotionBlurOptions {
  name?: string;
  isEnabled?: boolean;
  /** Diameter of the head in pixels. */
  size?: ValueOrGetter<number>;
  color?: ValueOrGetter<string>;
  /** Pixels of blur at 1000px/s of travel. */
  intensity?: ValueOrGetter<number>;
  /** Ceiling for the blur, so a fast flick does not shred the cursor. */
  maxSpread?: ValueOrGetter<number>;
  /** Squash and widen the head along the motion axis. */
  stretch?: boolean;
  blend?: string;
}

/** Fixed drawing box, so `size` stays a live option. */
const BOX = 128;
const CENTER = BOX / 2;

/**
 * A camera-shutter blur: a Gaussian kernel stretched along the direction of
 * travel and rotated to match it, so the cursor draws a comet head that only
 * exists while it is moving.
 *
 * `feGaussianBlur` takes `stdDeviation="x y"`, which is the whole trick — an
 * anisotropic kernel is a motion blur, an isotropic one is just a soft blob.
 */
export const MotionBlur = (options: MotionBlurOptions = {}): SupermousePlugin => {
  const cfg = normalizeAll(options, {
    size: 12,
    color: "#f2f2f4",
    intensity: 26,
    maxSpread: 40
  });

  const uid = `sm-blur-${Math.random().toString(36).slice(2, 9)}`;

  let blur: SVGFEGaussianBlurElement;
  let group: SVGGElement;
  let head: SVGCircleElement;
  let rotation = 0;
  let pressScale = 1;
  let started = false;

  return definePlugin<SVGSVGElement>(
    {
      name: options.name ?? "motion-blur",

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
          mixBlendMode: options.blend ?? "screen",
          zIndex: Layers.CURSOR
        });

        blur = svg.gaussianBlur("0 0");
        el.appendChild(
          svg.filter(uid, { x: "-100%", y: "-100%", width: "300%", height: "300%" }, [blur])
        );

        group = svg.group({ filter: `url(#${uid})` });
        head = svg.circle({
          cx: CENTER,
          cy: CENTER,
          r: cfg.size(app.state) / 2,
          fill: cfg.color(app.state)
        });
        group.appendChild(head);
        el.appendChild(group);

        return el;
      },

      onEnable: () => {
        started = false;
        rotation = 0;
        pressScale = 1;
      },

      update: (app: SupermouseInstance, el: SVGSVGElement, dtMs: number) => {
        const state = app.state;

        if (!state.hasReceivedInput) {
          css(el, { opacity: "0" });
          return;
        }
        css(el, { opacity: "1" });

        const dt = dtMs / 1000;
        const size = cfg.size(state);
        const speed = math.dist(state.velocity.x, state.velocity.y);

        // The first frame after activation has no meaningful velocity; letting
        // it through would smear the cursor across the whole stage.
        if (!started) {
          started = true;
          rotation = state.angle;
        }

        if (speed > 0.15) {
          rotation = math.lerpAngle(rotation, state.angle, 1 - Math.exp(-18 * dt));
        }

        // `velocity` is pixels per second, so the blur is a fraction of the
        // option at 1000px/s. Written against speed directly it saturates in the
        // first few pixels of motion, and "the faster it goes the longer the
        // smear" stops being true.
        const spread = clamp((speed / 1000) * cfg.intensity(state), 0, cfg.maxSpread(state));
        blur.setAttribute("stdDeviation", `${spread.toFixed(2)} 0`);

        const press = state.isDown ? 0.72 : 1;
        const stretch = options.stretch && speed > 120 ? 1 + Math.min(speed / 1400, 0.9) : 1;

        svg.setSVGAttrs(head, { r: size / 2, fill: cfg.color(state) });
        group.setAttribute(
          "transform",
          `rotate(${rotation.toFixed(2)} ${CENTER} ${CENTER}) translate(${((1 - stretch) * CENTER).toFixed(2)} 0) scale(${stretch.toFixed(3)} 1)`
        );

        pressScale = damp(pressScale, press, 18, dt);
        setTransform(el, state.smooth.x, state.smooth.y, 0, pressScale, pressScale);
      }
    },
    options
  );
};
