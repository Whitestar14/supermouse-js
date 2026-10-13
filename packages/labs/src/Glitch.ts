import type { SupermouseInstance, SupermousePlugin, ValueOrGetter } from "@supermousejs/core";
import {
  definePlugin,
  normalizeAll,
  css,
  setTransform,
  svg,
  math,
  damp,
  Layers
} from "@supermousejs/utils";

export interface GlitchOptions {
  name?: string;
  isEnabled?: boolean;
  /** Diameter of the cursor in pixels. */
  size?: ValueOrGetter<number>;
  /** Core colour. The ghosts sit either side of it. */
  color?: ValueOrGetter<string>;
  /** Colour of the negative-offset ghost. */
  red?: ValueOrGetter<string>;
  /** Colour of the positive-offset ghost. */
  cyan?: ValueOrGetter<string>;
  /** Maximum separation of the ghosts, in pixels. */
  intensity?: ValueOrGetter<number>;
  /** 0–1. How often the signal tears into a displaced slice. */
  chaos?: ValueOrGetter<number>;
  /** Scale the effect up while hovering a registered target. */
  hoverBoost?: boolean;
  /** Compositing mode for the whole cursor. `screen` reads as light. */
  blend?: string;
}

/** Fixed drawing box, so `size` stays a live option. */
const BOX = 64;
const CENTER = BOX / 2;

/**
 * Signal degradation, drawn as three offset circles behind an SVG
 * displacement map, with the occasional horizontal slice torn out and shifted.
 *
 * Chromatic separation is easy to fake with `box-shadow`, but it reads as a
 * blur rather than a glitch. The displaced `feDisplacementMap` is what makes
 * the edge itself unstable, and the torn band is what makes a frame look like
 * it lost a packet.
 */
export const Glitch = (options: GlitchOptions = {}): SupermousePlugin => {
  const cfg = normalizeAll(options, {
    size: 18,
    color: "#f2f2f4",
    red: "#ff2e63",
    cyan: "#00e5ff",
    intensity: 6,
    chaos: 0.35
  });

  const uid = `sm-glitch-${Math.random().toString(36).slice(2, 9)}`;
  const clipId = `${uid}-slice`;

  let core: SVGCircleElement;
  let ghostR: SVGCircleElement;
  let ghostC: SVGCircleElement;
  let bandR: SVGCircleElement;
  let bandC: SVGCircleElement;
  let bandRect: SVGRectElement;
  let displacement: SVGElement;

  /** Tear state. `until` is a timestamp; the slice hides once it passes. */
  let tearY = 0;
  let tearH = 0;
  let tearShift = 0;
  let tearUntil = 0;
  let nextBurst = 0;
  let driftX = 0;
  let driftY = 0;

  const burst = (now: number, strength: number): void => {
    tearH = math.random(4, 14);
    tearY = math.random(0, BOX - tearH);
    tearShift = math.random(-1, 1) * (8 + strength * 14);
    tearUntil = now + math.random(50, 150);
  };

  return definePlugin<SVGSVGElement>(
    {
      name: options.name ?? "glitch",
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
          mixBlendMode: options.blend ?? "screen",
          zIndex: Layers.CURSOR
        });

        // The noise field is built once; only its scale is animated. That is
        // the cheap half of the filter and the half that reads as movement.
        const turbulence = svg.turbulence("0.85", {
          type: "fractalNoise",
          numOctaves: 2,
          seed: 4,
          result: "noise"
        });
        displacement = svg.createSVGElement("feDisplacementMap", {
          in: "SourceGraphic",
          in2: "noise",
          scale: 0,
          xChannelSelector: "R",
          yChannelSelector: "G"
        });
        el.appendChild(
          svg.filter(uid, { x: "-60%", y: "-60%", width: "220%", height: "220%" }, [
            turbulence,
            displacement
          ])
        );

        bandRect = svg.rect({ x: "0", y: "0", width: BOX, height: 0 });
        const clipPath = svg.createSVGElement("clipPath", { id: clipId });
        clipPath.appendChild(bandRect);
        el.appendChild(clipPath);

        const state = app.state;
        const circle = (fill: string): SVGCircleElement =>
          svg.circle({ cx: CENTER, cy: CENTER, r: cfg.size(state) / 2, fill });

        ghostR = circle(cfg.red(state));
        ghostC = circle(cfg.cyan(state));
        core = circle(cfg.color(state));
        const group = svg.group({ filter: `url(#${uid})` });
        group.append(ghostR, ghostC, core);

        bandR = circle(cfg.red(state));
        bandC = circle(cfg.cyan(state));
        const band = svg.group({ "clip-path": `url(#${clipId})` });
        band.append(bandR, bandC);

        el.append(group, band);
        return el;
      },

      onEnable: () => {
        // Re-entry must not inherit the previous activation's tear, or the
        // cursor opens with a stale slice on screen.
        tearUntil = 0;
        nextBurst = 0;
        driftX = 0;
        driftY = 0;
      },

      update: (app: SupermouseInstance, el: SVGSVGElement, dtMs: number) => {
        const state = app.state;
        const now = performance.now();
        const dt = dtMs / 1000;

        if (!state.hasReceivedInput) {
          css(el, { opacity: "0" });
          return;
        }
        css(el, { opacity: "1" });

        const size = cfg.size(state);
        const intensity = cfg.intensity(state) * (options.hoverBoost && state.isHover ? 1.8 : 1);
        const chaos = cfg.chaos(state);

        // Separation follows the direction of travel — a signal smears along
        // its own motion — then relaxes when the pointer stops.
        const speed = math.dist(state.velocity.x, state.velocity.y);
        // Graded against a 1000px/s sweep. Against a per-frame threshold the
        // ghosts would separate fully on the first twitch and then stop
        // answering how fast the hand is actually moving.
        const travel = Math.min(1, speed / 900);
        const angle = state.angle * (Math.PI / 180);
        driftX = damp(driftX, Math.cos(angle) * intensity * travel, 12, dt);
        driftY = damp(driftY, Math.sin(angle) * intensity * travel, 12, dt);

        // `chaos` is the tear *rate*, so it maps onto the gap between tears
        // rather than onto a coin flip inside a fixed window: every window that
        // elapses tears, and a higher chaos simply shortens the window. That
        // keeps the option monotonic — twice the chaos is roughly twice as many
        // tears — which a probability under a fixed window does not.
        if (!state.reducedMotion && chaos > 0.001 && now >= nextBurst) {
          nextBurst = now + math.random(280, 900) / (0.4 + chaos);
          burst(now, intensity / 6);
        }

        const tearing = now < tearUntil;
        const spread = tearing ? 1.8 : 1;

        svg.setSVGAttrs(core, { r: size / 2, fill: cfg.color(state) });
        svg.setSVGAttrs(ghostR, { r: size / 2, fill: cfg.red(state) });
        svg.setSVGAttrs(ghostC, { r: size / 2, fill: cfg.cyan(state) });
        svg.setSVGAttrs(bandR, { r: size / 2, fill: cfg.red(state) });
        svg.setSVGAttrs(bandC, { r: size / 2, fill: cfg.cyan(state) });

        ghostR.setAttribute("transform", `translate(${-driftX * spread} ${-driftY * spread})`);
        ghostC.setAttribute("transform", `translate(${driftX * spread} ${driftY * spread})`);

        // The displacement scale is the edge instability. It only lifts while a
        // tear is live, so the cursor stays legible at rest.
        displacement.setAttribute("scale", String(tearing ? intensity * 0.9 : intensity * 0.18));

        bandRect.setAttribute("y", String(tearY));
        bandRect.setAttribute("height", String(tearing ? tearH : 0));
        bandR.setAttribute("transform", `translate(${-tearShift} 0)`);
        bandC.setAttribute("transform", `translate(${tearShift} 0)`);

        const press = state.isDown ? 0.7 : 1;
        setTransform(el, state.smooth.x, state.smooth.y, 0, press, press);
      }
    },
    options
  );
};
