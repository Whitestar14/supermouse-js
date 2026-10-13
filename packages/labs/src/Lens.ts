import type { SupermouseInstance, SupermousePlugin, ValueOrGetter } from "@supermousejs/core";
import { definePlugin, normalizeAll, css, setTransform, damp, Layers } from "@supermousejs/utils";
import { cssWithWebkit } from "./internal/prefix";

export interface LensOptions {
  name?: string;
  isEnabled?: boolean;
  /** Diameter at rest. */
  size?: ValueOrGetter<number>;
  /** Diameter while hovering a registered target. */
  hoverSize?: ValueOrGetter<number>;
  /** Backdrop blur radius, in pixels. */
  blur?: ValueOrGetter<number>;
  /** Backdrop saturation multiplier. */
  saturation?: ValueOrGetter<number>;
  /** Backdrop brightness multiplier. */
  brightness?: ValueOrGetter<number>;
  /** Glass tint laid over the backdrop. Use `transparent` for none. */
  tint?: ValueOrGetter<string>;
  /** Colour of the rim highlight. */
  rim?: ValueOrGetter<string>;
  /** Scale the lens down while pressed, so a press reads as contact. */
  press?: boolean;
  zIndex?: string;
}

/**
 * A lens: the page underneath the cursor is blurred, brightened and oversaturated
 * while the rim catches a highlight, so the cursor reads as a piece of glass
 * held over the content rather than a shape drawn on top of it.
 *
 * `backdrop-filter` is doing the real work. Everything else — the tint, the
 * inset rim, the slow swell on hover — exists to sell it as a physical object.
 */
export const Lens = (options: LensOptions = {}): SupermousePlugin => {
  const cfg = normalizeAll(options, {
    size: 64,
    hoverSize: 108,
    blur: 5,
    saturation: 1.5,
    brightness: 1.12,
    tint: "rgba(255, 255, 255, 0.05)",
    rim: "rgba(255, 255, 255, 0.55)"
  });

  let currentSize = 0;
  let pressScale = 1;

  return definePlugin<HTMLDivElement>(
    {
      name: options.name ?? "lens",
      hoverSelector: "[data-hover]",

      create: () => {
        const el = document.createElement("div");
        css(el, {
          position: "absolute",
          top: "0",
          left: "0",
          borderRadius: "50%",
          pointerEvents: "none",
          willChange: "transform",
          overflow: "hidden",
          zIndex: options.zIndex ?? Layers.CURSOR
        });
        return el;
      },

      onEnable: (app, el) => {
        currentSize = cfg.size(app.state);
        pressScale = 1;
        css(el, { width: `${currentSize}px`, height: `${currentSize}px`, opacity: "1" });
      },

      update: (app: SupermouseInstance, el: HTMLDivElement, dtMs: number) => {
        const state = app.state;
        const dt = dtMs / 1000;

        if (!state.hasReceivedInput) {
          css(el, { opacity: "0" });
          return;
        }
        css(el, { opacity: "1" });

        const resting = cfg.size(state);
        const target = state.isHover ? Math.max(resting, cfg.hoverSize(state)) : resting;
        currentSize = damp(currentSize, target, 12, dt);

        const blur = cfg.blur(state);
        const saturate = cfg.saturation(state);
        const bright = cfg.brightness(state);
        const rim = cfg.rim(state);

        css(el, {
          width: `${currentSize}px`,
          height: `${currentSize}px`,
          backgroundColor: cfg.tint(state),
          boxShadow: `inset 0 0 0 1px ${rim}, inset 0 -10px 22px -12px rgba(255, 255, 255, 0.65), inset 0 10px 26px -14px rgba(0, 0, 0, 0.75)`
        });
        // Glass, in both spellings: the whole effect is this one line, and a
        // WebKit browser that only knows the prefixed property would render a
        // tinted disc with no blur at all.
        cssWithWebkit(
          el,
          "backdrop-filter",
          `blur(${blur}px) saturate(${saturate}) brightness(${bright})`
        );

        const press = options.press === false ? 1 : state.isDown ? 0.88 : 1;
        pressScale = damp(pressScale, press, 20, dt);

        setTransform(el, state.smooth.x, state.smooth.y, 0, pressScale, pressScale);
      }
    },
    options
  );
};
