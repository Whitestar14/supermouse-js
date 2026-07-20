import { definePlugin, dom } from "@supermousejs/utils";
import type { Supermouse } from "@supermousejs/core";

export interface SpotlightRevealOptions {
  selector?: string;
  maxRadius?: number;
  expandSpeed?: number;
  lagSpeed?: number;
  blendMode?: string;
}

export const SpotlightReveal = (options: SpotlightRevealOptions = {}) => {
  const selector = options.selector ?? ".spotlight-container";
  const maxRadius = options.maxRadius ?? 400;
  const expandSpeed = options.expandSpeed ?? 0.08;
  const lagSpeed = options.lagSpeed ?? 0.12; // smooth trailing (1 = instant)
  const blendMode = options.blendMode ?? "difference";

  interface Instance {
    el: HTMLDivElement;
    inner: HTMLDivElement;
    currentRadius: number;
    isHover: boolean;
    trailX: number; // current trailing position (local to container)
    trailY: number;
  }

  const instances = new Map<HTMLElement, Instance>();

  function getOrCreate(container: HTMLElement, rect: DOMRect): Instance {
    if (instances.has(container)) return instances.get(container)!;

    const el = dom.createActor("div") as HTMLDivElement;
    dom.applyStyles(el, {
      position: "absolute",
      top: "0",
      left: "0",
      pointerEvents: "none",
      zIndex: "50",
      mixBlendMode: blendMode,
      willChange: "transform"
    });

    const inner = dom.createActor("div") as HTMLDivElement;
    dom.applyStyles(inner, {
      backgroundColor: "white",
      borderRadius: "50%",
      willChange: "transform"
    });
    el.appendChild(inner);

    container.style.position = "relative";
    container.appendChild(el);

    // Start at the center so it doesn’t jump when first hovered
    const instance: Instance = {
      el,
      inner,
      currentRadius: 0,
      isHover: false,
      trailX: rect.width / 2,
      trailY: rect.height / 2
    };
    instances.set(container, instance);
    return instance;
  }

  return definePlugin({
    name: "spotlight-reveal",
    priority: 100,

    update(app: Supermouse) {
      const containers = document.querySelectorAll(selector);

      containers.forEach((container) => {
        const rect = container.getBoundingClientRect();
        const inst = getOrCreate(container as HTMLElement, rect);

        const isOver =
          app.state.hasReceivedInput &&
          app.state.pointer.x >= rect.left &&
          app.state.pointer.x <= rect.right &&
          app.state.pointer.y >= rect.top &&
          app.state.pointer.y <= rect.bottom;

        inst.isHover = isOver;

        // Desired position (cursor’s local coords)
        let targetX = inst.trailX;
        let targetY = inst.trailY;

        if (isOver) {
          targetX = app.state.smooth.x - rect.left;
          targetY = app.state.smooth.y - rect.top;
        }

        // Smoothly chase the target
        inst.trailX += (targetX - inst.trailX) * lagSpeed;
        inst.trailY += (targetY - inst.trailY) * lagSpeed;

        // Radius animation
        const targetR = isOver ? maxRadius : 0;
        inst.currentRadius += (targetR - inst.currentRadius) * expandSpeed;

        if (inst.currentRadius < 0.5) {
          dom.setStyle(inst.el, "opacity", "0");
          return;
        }
        dom.setStyle(inst.el, "opacity", "1");

        const size = inst.currentRadius * 2;
        dom.setStyle(inst.inner, "width", `${size}px`);
        dom.setStyle(inst.inner, "height", `${size}px`);

        // Render at the lagged trail position (clamped to container bounds)
        const renderX = Math.max(0, Math.min(rect.width, inst.trailX));
        const renderY = Math.max(0, Math.min(rect.height, inst.trailY));
        dom.setTransform(inst.el, renderX, renderY);
        dom.setStyle(inst.inner, "transform", "translate(-50%, -50%)");
      });
    },

    destroy() {
      instances.forEach(({ el }) => el.remove());
      instances.clear();
    }
  });
};
