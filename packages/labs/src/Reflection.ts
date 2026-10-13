import type { SupermouseInstance, SupermousePlugin, ValueOrGetter } from "@supermousejs/core";
import {
  definePlugin,
  normalizeAll,
  css,
  createCircle,
  setTransform,
  Layers
} from "@supermousejs/utils";

export interface ReflectionOptions {
  name?: string;
  isEnabled?: boolean;
  /** "x" mirrors across the vertical axis, "y" the horizontal, "both" does both. */
  axis?: ValueOrGetter<string>;
  size?: ValueOrGetter<number>;
  color?: ValueOrGetter<string>;
  opacity?: ValueOrGetter<number>;
  /** Draw the mirror axis as a hairline. */
  lines?: boolean;
  /** Blur on the reflection, to separate it from the real cursor. */
  blur?: ValueOrGetter<number>;
  blend?: string;
  zIndex?: string;
}

/**
 * The cursor's own reflection: a ghost that moves as the pointer would if the
 * viewport were a mirror, flipped on the mirrored axis so it reads as a
 * likeness rather than a second cursor.
 *
 * Built the way a mirror actually behaves — reflect the position, invert the
 * axis — which is why it needs the size of the surface it is reflecting in,
 * re-measured whenever that surface or the window changes. It is also the one
 * plugin in the set whose output is *entirely* a function of where the pointer
 * is, so a static screenshot of it is half a picture.
 */
export const Reflection = (options: ReflectionOptions = {}): SupermousePlugin => {
  const cfg = normalizeAll(options, {
    axis: "x",
    size: 10,
    color: "#f59e0b",
    opacity: 0.55,
    blur: 0
  });

  let container: HTMLDivElement;
  let ghosts: HTMLDivElement[] = [];
  let lines: HTMLDivElement[] = [];
  /**
   * The surface being reflected in is the cursor stage, not the window. The
   * stage fills the viewport when it hangs off `body`, but it is inset to its
   * container otherwise — and reflecting about the wrong rectangle puts the
   * likeness off by exactly that inset.
   */
  let stageW = 0;
  let stageH = 0;
  let observer: ResizeObserver | null = null;
  let onResize: (() => void) | null = null;

  const measure = (): void => {
    const stage = container?.parentElement ?? null;
    stageW = stage?.clientWidth || window.innerWidth;
    stageH = stage?.clientHeight || window.innerHeight;
  };

  return definePlugin<HTMLDivElement>(
    {
      name: options.name ?? "reflection",

      create: () => {
        container = document.createElement("div");
        css(container, {
          position: "absolute",
          top: "0",
          left: "0",
          width: "0",
          height: "0",
          pointerEvents: "none",
          zIndex: options.zIndex ?? Layers.FOLLOWER,
          mixBlendMode: options.blend ?? "difference"
        });

        // Three ghosts are created up front and shown per axis: the plugin has
        // no way to know which axis a live option will ask for later, and
        // creating elements mid-frame is the one thing worth avoiding.
        for (let i = 0; i < 3; i++) {
          const ghost = createCircle(10, "#f59e0b");
          css(ghost, { position: "absolute", top: "0", left: "0", display: "none" });
          ghosts.push(ghost);
          container.appendChild(ghost);
        }

        for (let i = 0; i < 2; i++) {
          const line = document.createElement("div");
          css(line, {
            position: "absolute",
            backgroundColor: "rgba(255, 255, 255, 0.08)",
            pointerEvents: "none",
            display: "none"
          });
          lines.push(line);
          container.appendChild(line);
        }

        measure();
        return container;
      },

      install: () => {
        // The element is attached by now, so the stage can finally be measured.
        measure();
        onResize = (): void => measure();
        window.addEventListener("resize", onResize, { passive: true });

        // The stage can also change size with the window standing still — a
        // panel opening, a scrolled list, a devtools split.
        const stage = container.parentElement;
        if (stage && typeof ResizeObserver !== "undefined") {
          observer = new ResizeObserver(() => measure());
          observer.observe(stage);
        }
      },

      onEnable: () => {
        measure();
      },

      update: (app: SupermouseInstance, el: HTMLDivElement) => {
        const state = app.state;

        if (!state.hasReceivedInput) {
          css(el, { opacity: "0" });
          return;
        }
        css(el, { opacity: "1" });

        const axis = cfg.axis(state);
        const size = cfg.size(state);
        const color = cfg.color(state);
        const opacity = String(cfg.opacity(state));
        const blur = cfg.blur(state);
        const { x, y } = state.smooth;

        const mirrors: Array<{ x: number; y: number; sx: number; sy: number }> = [];
        if (axis === "x" || axis === "both") mirrors.push({ x: stageW - x, y, sx: -1, sy: 1 });
        if (axis === "y" || axis === "both") mirrors.push({ x, y: stageH - y, sx: 1, sy: -1 });
        if (axis === "both") mirrors.push({ x: stageW - x, y: stageH - y, sx: -1, sy: -1 });

        for (let i = 0; i < ghosts.length; i++) {
          const ghost = ghosts[i];
          const mirror = mirrors[i];

          if (!mirror) {
            css(ghost, { display: "none" });
            continue;
          }

          css(ghost, {
            display: "block",
            width: `${size}px`,
            height: `${size}px`,
            backgroundColor: color,
            opacity,
            filter: blur > 0 ? `blur(${blur}px)` : "none"
          });
          setTransform(ghost, mirror.x, mirror.y, 0, mirror.sx, mirror.sy);
        }

        const showLines = options.lines === true;
        const lineWidth = 1;

        css(lines[0], {
          display: showLines && (axis === "x" || axis === "both") ? "block" : "none",
          width: `${lineWidth}px`,
          height: `${stageH}px`,
          transform: `translate3d(${stageW / 2}px, 0, 0)`
        });
        css(lines[1], {
          display: showLines && (axis === "y" || axis === "both") ? "block" : "none",
          width: `${stageW}px`,
          height: `${lineWidth}px`,
          transform: `translate3d(0, ${stageH / 2}px, 0)`
        });
      },

      cleanup: () => {
        if (onResize) window.removeEventListener("resize", onResize);
        onResize = null;
        observer?.disconnect();
        observer = null;
        ghosts = [];
        lines = [];
      }
    },
    options
  );
};
