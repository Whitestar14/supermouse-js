import type { SupermouseInstance, SupermousePlugin, ValueOrGetter } from "@supermousejs/core";
import {
  definePlugin,
  normalizeAll,
  css,
  setTransform,
  svg,
  clamp,
  Layers
} from "@supermousejs/utils";

export interface GrainOptions {
  name?: string;
  isEnabled?: boolean;
  /** Diameter of the disc. */
  size?: ValueOrGetter<number>;
  /** Noise frequency. Higher is finer grain. */
  grain?: ValueOrGetter<number>;
  /** 0–1. How much of the noise survives to become visible speckle. */
  density?: ValueOrGetter<number>;
  /** Palette: the grain is painted in this colour. */
  color?: ValueOrGetter<string>;
  /** New noise fields per second. `0` freezes the grain. */
  flicker?: ValueOrGetter<number>;
  /** Increase the grain while the pointer is moving. */
  react?: boolean;
  blend?: string;
  zIndex?: string;
}

/** Fixed box, so `size` stays a live option. */
const BOX = 128;
const CENTER = BOX / 2;

/** `#abc` / `#aabbcc` → the 0–1 triplet a colour matrix wants. */
function channels(color: string): [number, number, number] {
  const hex = color.replace("#", "").trim();
  const full =
    hex.length === 3
      ? hex
          .split("")
          .map((c) => c + c)
          .join("")
      : hex.padEnd(6, "0").slice(0, 6);

  const r = parseInt(full.slice(0, 2), 16) || 0;
  const g = parseInt(full.slice(2, 4), 16) || 0;
  const b = parseInt(full.slice(4, 6), 16) || 0;
  return [r / 255, g / 255, b / 255];
}

/**
 * Film grain: a `feTurbulence` field mapped into a coloured speckle and clipped
 * to a disc.
 *
 * The colour matrix is doing something slightly unusual — it throws the noise's
 * red channel into **alpha** and takes the RGB from a constant. That is what
 * makes the grain a single colour instead of rainbow static, and it means
 * `density` is a threshold on the noise rather than an opacity on the element:
 * thinning the grain thins the speckle, where an opacity would just dim a grey
 * wash laid over the whole page.
 */
export const Grain = (options: GrainOptions = {}): SupermousePlugin => {
  const cfg = normalizeAll(options, {
    size: 96,
    grain: 0.75,
    density: 0.55,
    color: "#f2f2f4",
    flicker: 8
  });

  const uid = `sm-grain-${Math.random().toString(36).slice(2, 9)}`;
  const clipId = `${uid}-clip`;

  let turbulence: SVGFETurbulenceElement;
  let matrix: SVGElement;
  let clipCircle: SVGCircleElement;

  /** Last values written, so a static field is not re-generated every frame. */
  let lastFrequency = -1;
  let lastSeed = -1;
  let lastDensity = -1;
  let sinceFlicker = 0;
  let seed = 1;

  return definePlugin<SVGSVGElement>(
    {
      name: options.name ?? "grain",

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
          zIndex: options.zIndex ?? Layers.CURSOR
        });

        turbulence = svg.turbulence("0.75", {
          type: "fractalNoise",
          numOctaves: 2,
          seed,
          stitchTiles: "stitch",
          result: "noise"
        });

        // RGB is constant (the tint); alpha is the noise's red channel scaled
        // and offset, and that offset is the `density` threshold.
        matrix = svg.createSVGElement("feColorMatrix", {
          in: "noise",
          type: "matrix",
          values: "0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0.9 0 0 0 -0.25"
        });

        el.appendChild(
          svg.filter(`${uid}-field`, { x: "0%", y: "0%", width: "100%", height: "100%" }, [
            turbulence,
            matrix
          ])
        );

        clipCircle = svg.circle({ cx: CENTER, cy: CENTER, r: cfg.size(app.state) / 2 });
        const clipPath = svg.createSVGElement("clipPath", { id: clipId });
        clipPath.appendChild(clipCircle);
        el.appendChild(clipPath);

        const rectEl = svg.rect({
          x: "0",
          y: "0",
          width: BOX,
          height: BOX,
          filter: `url(#${uid}-field)`,
          "clip-path": `url(#${clipId})`
        });
        el.appendChild(rectEl);

        return el;
      },

      onEnable: () => {
        lastFrequency = -1;
        lastSeed = -1;
        lastDensity = -1;
        sinceFlicker = 0;
        seed = 1;
      },

      update: (app: SupermouseInstance, el: SVGSVGElement, dtMs: number) => {
        const state = app.state;

        if (!state.hasReceivedInput) {
          css(el, { opacity: "0" });
          return;
        }
        css(el, { opacity: "1" });

        const size = cfg.size(state);
        const color = cfg.color(state);
        const [r, g, b] = channels(color);

        // Speed fattens the grain: a moving frame is a longer exposure, and a
        // longer exposure is more visible emulsion.
        const speed = Math.hypot(state.velocity.x, state.velocity.y);
        const exposure = options.react === false ? 0 : clamp(speed / 1200, 0, 1);
        const frequency = cfg.grain(state) * (1 - exposure * 0.25);
        const density = clamp(cfg.density(state) * (1 + exposure * 0.5), 0, 1);

        const flicker = cfg.flicker(state);
        if (flicker > 0 && !state.reducedMotion) {
          sinceFlicker += dtMs;
          const interval = 1000 / flicker;
          if (sinceFlicker >= interval) {
            sinceFlicker %= interval;
            seed = (seed % 97) + 1;
          }
        }

        // `feTurbulence` regenerates its whole field whenever an attribute it
        // depends on is written, so every write here is guarded by a comparison
        // against what the last frame already set.
        if (frequency !== lastFrequency) {
          lastFrequency = frequency;
          turbulence.setAttribute("baseFrequency", frequency.toFixed(3));
        }
        if (seed !== lastSeed) {
          lastSeed = seed;
          turbulence.setAttribute("seed", String(seed));
        }
        if (density !== lastDensity) {
          lastDensity = density;
          // Rows: R, G, B constants, then alpha = 0.9 * noiseR + (density - 1).
          matrix.setAttribute(
            "values",
            `0 0 0 0 ${r.toFixed(3)}  0 0 0 0 ${g.toFixed(3)}  0 0 0 0 ${b.toFixed(3)}  0.9 0 0 0 ${(density - 1).toFixed(3)}`
          );
        }

        svg.setSVGAttrs(clipCircle, { r: size / 2 });
        setTransform(el, state.smooth.x, state.smooth.y);
      }
    },
    options
  );
};
