import type { ValueOrGetter, SupermouseInstance, SupermousePlugin } from "@supermousejs/core";
import { definePlugin, normalizeAll, dom, math, Layers } from "@supermousejs/utils";

export interface SmartIconMap {
  [key: string]: string;
}

export type SmartIconAnchor = "center" | "top-left" | "top-right" | "bottom-left" | "bottom-right";

export interface SmartIconOptions {
  name?: string;
  isEnabled?: boolean;
  icons: SmartIconMap;
  defaultState?: string;
  useSemanticTags?: boolean;
  transitionDuration?: number;
  /** Minimum ms a state must be requested before committing. Default 80. */
  switchDelay?: number;
  size?: ValueOrGetter<number>;
  color?: ValueOrGetter<string>;
  offset?: [number, number];
  anchor?: ValueOrGetter<SmartIconAnchor>;
  followStrategy?: ValueOrGetter<"smooth" | "raw">;
  rotateWithVelocity?: ValueOrGetter<boolean>;
}

function resolveSemanticState(target: HTMLElement, icons: SmartIconMap): string | null {
  const tag = target.tagName.toLowerCase();

  if (tag === "input" || tag === "textarea" || target.isContentEditable) {
    const type = (target as HTMLInputElement).type;
    if (!["button", "submit", "checkbox", "radio", "range", "color"].includes(type)) {
      if (icons["text"]) return "text";
    } else if (icons["pointer"]) {
      return "pointer";
    }
  } else if (tag === "a" || tag === "button" || target.closest("a") || target.closest("button")) {
    if (icons["pointer"]) return "pointer";
  }
  return null;
}

export const SmartIcon = (options: SmartIconOptions): SupermousePlugin => {
  let contentWrapper: HTMLDivElement;

  let currentState = options.defaultState ?? "default";
  let targetState = options.defaultState ?? "default";

  let lastTarget: HTMLElement | null = null;
  let cachedSemanticState: string | null = null;

  let isTransitioning = false;
  let transitionTimer: ReturnType<typeof setTimeout>;

  let pendingState: string | null = null;
  let pendingTimer = 0;
  const switchDelay = options.switchDelay ?? 80;

  let currentRotation = 0;
  let lastTargetRotation = 0;

  const cfg = normalizeAll(options, {
    size: 24,
    followStrategy: "smooth",
    anchor: "center",
    rotateWithVelocity: false
  });

  const useSemanticTags = options.useSemanticTags ?? true;
  const duration = options.transitionDuration ?? 200;
  const userOffX = options.offset?.[0] ?? 0;
  const userOffY = options.offset?.[1] ?? 0;

  function commitTransition(nextState: string): void {
    targetState = nextState;
    isTransitioning = true;

    clearTimeout(transitionTimer);
    dom.css(contentWrapper, { transform: "scale(0)" });

    transitionTimer = setTimeout(() => {
      currentState = targetState;
      contentWrapper.innerHTML = options.icons[currentState] ?? "";
      dom.css(contentWrapper, { transform: "scale(1)" });

      transitionTimer = setTimeout(() => {
        isTransitioning = false;
      }, duration / 2);
    }, duration / 2);
  }

  return definePlugin<HTMLDivElement>(
    {
      name: options.name ?? "smart-icon",
      selector: "[data-supermouse-icon]",

      create: () => {
        const el = dom.createActor("div") as HTMLDivElement;
        dom.css(el, { zIndex: Layers.CURSOR });

        contentWrapper = dom.createActor("div") as HTMLDivElement;
        dom.css(contentWrapper, {
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transformOrigin: "center center",
          transform: "scale(1)",
          transition: `transform ${duration / 2}ms cubic-bezier(0.16, 1, 0.3, 1)`
        });

        contentWrapper.innerHTML = options.icons[currentState] ?? "";

        dom.injectStyles(
          "supermouse-smart-icon-styles",
          `
          @keyframes sm {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          .supermouse-spin {
            animation: sm 1s linear infinite;
          }
          `
        );

        el.appendChild(contentWrapper);
        return el;
      },

      update: (app: SupermouseInstance, el: HTMLDivElement, dtMs: number) => {
        const icons = options.icons;
        const target = app.state.hoverTarget;

        let nextState = options.defaultState ?? "default";

        if (target) {
          if (target !== lastTarget) {
            lastTarget = target;
            cachedSemanticState = useSemanticTags ? resolveSemanticState(target, icons) : null;
          }

          const attrIcon = app.state.interaction?.icon;

          if (attrIcon && icons[attrIcon]) {
            nextState = attrIcon;
          } else if (cachedSemanticState) {
            nextState = cachedSemanticState;
          }
        } else {
          lastTarget = null;
          cachedSemanticState = null;
        }

        // Hysteresis
        if (nextState !== currentState && !isTransitioning) {
          if (!icons[nextState] && nextState !== (options.defaultState ?? "default")) {
            pendingState = null;
            pendingTimer = 0;
          } else if (nextState !== pendingState) {
            pendingState = nextState;
            pendingTimer = 0;
          } else {
            pendingTimer += dtMs;
            if (pendingTimer >= switchDelay) {
              commitTransition(nextState);
              pendingState = null;
              pendingTimer = 0;
            }
          }
        } else if (nextState === currentState) {
          pendingState = null;
          pendingTimer = 0;
        }

        const size = cfg.size(app.state);
        dom.css(el, {
          width: `${size}px`,
          height: `${size}px`
        });

        let anchorX = 0;
        let anchorY = 0;
        const half = size / 2;
        const anchor = cfg.anchor(app.state);

        if (anchor !== "center") {
          if (anchor.includes("left")) anchorX = half;
          if (anchor.includes("right")) anchorX = -half;
          if (anchor.includes("top")) anchorY = half;
          if (anchor.includes("bottom")) anchorY = -half;
        }

        const isSemanticState = currentState === "pointer" || currentState === "text";

        if (cfg.rotateWithVelocity(app.state) && !isSemanticState && !app.state.reducedMotion) {
          const { x: vx, y: vy } = app.state.velocity;
          const speed = math.dist(vx, vy);

          if (speed > 1) {
            lastTargetRotation = math.angle(vx, vy);
          }
          currentRotation = math.lerpAngle(currentRotation, lastTargetRotation, 0.15);
        } else {
          currentRotation = math.lerpAngle(currentRotation, 0, 0.15);
        }

        const pos = cfg.followStrategy(app.state) === "raw" ? app.state.pointer : app.state.smooth;

        dom.setTransform(
          el,
          pos.x + userOffX + anchorX,
          pos.y + userOffY + anchorY,
          currentRotation
        );
      },

      cleanup() {
        clearTimeout(transitionTimer);
      }
    },
    options
  );
};
