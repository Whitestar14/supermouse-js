import type { SupermouseInstance, SupermousePlugin, ValueOrGetter } from "@supermousejs/core";
import { definePlugin, normalizeAll, css, damp } from "@supermousejs/utils";

export interface SpotlightOptions {
  name?: string;
  isEnabled?: boolean;
  /** Containers that get a reveal disc. Rescanned on an interval. */
  selector?: string;
  /** Radius the disc opens to while the pointer is inside a container. */
  maxRadius?: ValueOrGetter<number>;
  /** Easing rate for the disc's radius. */
  expandRate?: ValueOrGetter<number>;
  /** Easing rate for the disc's trailing position. */
  lagRate?: ValueOrGetter<number>;
  /** Colour of the disc. `difference` against white reads as a cut-out. */
  color?: ValueOrGetter<string>;
  blendMode?: string;
  /** Milliseconds between container rescans. */
  rescan?: number;
  zIndex?: string;
}

interface Reveal {
  container: HTMLElement;
  el: HTMLDivElement;
  inner: HTMLDivElement;
  radius: number;
  trailX: number;
  trailY: number;
}

/**
 * A hole in the page: containers matched by `selector` get a disc that opens
 * under the pointer, revealing whatever sits behind the container. On a dark
 * overlay this reads as a torch; with `difference` blending it reads as a
 * punch-through to an inverted layer.
 *
 * Each container owns its disc, and the disc trails the pointer on its own
 * easing, so a fast pass drags the reveal behind the cursor instead of
 * snapping it — the difference between a light on a stick and a light with
 * mass. Containers are rescanned on an interval rather than every frame: a
 * `querySelectorAll` per frame is a layout query, and the answer almost never
 * changes between frames.
 */
export const Spotlight = (options: SpotlightOptions = {}): SupermousePlugin => {
  const cfg = normalizeAll(options, {
    maxRadius: 190,
    expandRate: 6,
    lagRate: 8,
    color: "#ffffff"
  });

  const selector = options.selector ?? "[data-supermouse-spotlight]";
  const rescanEvery = options.rescan ?? 400;

  const reveals = new Map<HTMLElement, Reveal>();
  /** Containers this plugin gave `position: relative`, so it can hand it back. */
  const restyled = new Set<HTMLElement>();
  // Starts at the interval so the first frame scans immediately.
  let sinceRescan = rescanEvery;

  const remove = (reveal: Reveal): void => {
    reveal.el.remove();
    // Only undo what was ours to do, and only on containers the plugin itself
    // restyled — the core stage follows the same rule when it detaches.
    if (restyled.delete(reveal.container)) reveal.container.style.position = "";
    reveals.delete(reveal.container);
  };

  const scan = (): void => {
    if (typeof document === "undefined") return;

    const found = new Set<HTMLElement>();
    document.querySelectorAll(selector).forEach((node) => {
      if (node instanceof HTMLElement) found.add(node);
    });

    for (const [container, reveal] of reveals) {
      if (!found.has(container) || !container.isConnected) remove(reveal);
    }

    for (const container of found) {
      if (reveals.has(container)) continue;

      const el = document.createElement("div");
      css(el, {
        position: "absolute",
        top: "0",
        left: "0",
        pointerEvents: "none",
        opacity: "0",
        willChange: "transform",
        zIndex: options.zIndex ?? "50"
      });

      const inner = document.createElement("div");
      css(inner, {
        borderRadius: "50%",
        willChange: "transform",
        transform: "translate(-50%, -50%)"
      });
      el.appendChild(inner);

      if (getComputedStyle(container).position === "static") {
        container.style.position = "relative";
        restyled.add(container);
      }
      container.appendChild(el);

      const rect = container.getBoundingClientRect();
      reveals.set(container, {
        container,
        el,
        inner,
        radius: 0,
        trailX: rect.width / 2,
        trailY: rect.height / 2
      });
    }
  };

  return definePlugin(
    {
      name: options.name ?? "spotlight",
      priority: 100,
      // The disc lives inside the container it reveals, so this is a DOM query
      // plugin rather than a stage actor; it takes no `create` element.
      update: (app: SupermouseInstance, dtMs: number) => {
        const dt = dtMs / 1000;
        const state = app.state;

        // On the interval, always. The old `reveals.size === 0` escape hatch
        // meant the empty case — a page whose containers have not mounted yet,
        // or one that has none at all — ran the per-frame `querySelectorAll`
        // this plugin exists to avoid.
        sinceRescan += dtMs;
        if (sinceRescan >= rescanEvery) {
          sinceRescan = 0;
          scan();
        }
        if (reveals.size === 0) return;

        const maxRadius = cfg.maxRadius(state);
        const color = cfg.color(state);

        for (const reveal of reveals.values()) {
          const rect = reveal.container.getBoundingClientRect();
          const isOver =
            state.hasReceivedInput &&
            state.pointer.x >= rect.left &&
            state.pointer.x <= rect.right &&
            state.pointer.y >= rect.top &&
            state.pointer.y <= rect.bottom;

          const targetX = isOver ? state.smooth.x - rect.left : reveal.trailX;
          const targetY = isOver ? state.smooth.y - rect.top : reveal.trailY;

          reveal.trailX = damp(reveal.trailX, targetX, cfg.lagRate(state), dt);
          reveal.trailY = damp(reveal.trailY, targetY, cfg.lagRate(state), dt);
          reveal.radius = damp(reveal.radius, isOver ? maxRadius : 0, cfg.expandRate(state), dt);

          if (reveal.radius < 0.5) {
            css(reveal.el, { opacity: "0" });
            continue;
          }

          const size = reveal.radius * 2;
          css(reveal.el, {
            opacity: "1",
            mixBlendMode: options.blendMode ?? "difference"
          });
          css(reveal.inner, {
            width: `${size}px`,
            height: `${size}px`,
            backgroundColor: color
          });

          // Clamped to the container so the disc never eats a neighbour's edge.
          // The inner element carries the `-50%` centring, so the outer is a
          // plain translate rather than `setTransform`'s centred helper.
          const renderX = Math.max(0, Math.min(rect.width, reveal.trailX));
          const renderY = Math.max(0, Math.min(rect.height, reveal.trailY));
          css(reveal.el, { transform: `translate3d(${renderX}px, ${renderY}px, 0)` });
        }
      },

      destroy: () => {
        for (const reveal of Array.from(reveals.values())) remove(reveal);
        reveals.clear();
      }
    },
    options
  );
};
