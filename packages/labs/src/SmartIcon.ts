import type { ValueOrGetter } from "@supermousejs/core";
import { definePlugin, normalize, dom, math, Layers } from "@supermousejs/utils";

export interface SmartIconMap {
  [key: string]: string;
}

export type SmartIconAnchor =
  | "center"
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right";

export interface SmartIconOptions {
  name?: string;
  isEnabled?: boolean;
  icons: SmartIconMap;
  defaultState?: string;
  useSemanticTags?: boolean;
  transitionDuration?: number;
  size?: ValueOrGetter<number>;
  color?: ValueOrGetter<string>;
  offset?: [number, number];
  anchor?: ValueOrGetter<SmartIconAnchor>;
  followStrategy?: ValueOrGetter<"smooth" | "raw">;
  rotateWithVelocity?: ValueOrGetter<boolean>;
}

function resolveSemanticState(
  target: HTMLElement,
  icons: SmartIconMap
): string | null {
  const tag = target.tagName.toLowerCase();

  if (tag === "input" || tag === "textarea" || target.isContentEditable) {
    const type = (target as HTMLInputElement).type;
    if (
      !["button", "submit", "checkbox", "radio", "range", "color"].includes(
        type
      )
    ) {
      if (icons["text"]) return "text";
    } else if (icons["pointer"]) {
      return "pointer";
    }
  } else if (
    tag === "a" ||
    tag === "button" ||
    target.closest("a") ||
    target.closest("button")
  ) {
    if (icons["pointer"]) return "pointer";
  }
  return null;
}

export const SmartIcon = (options: SmartIconOptions) => {
  let contentWrapper: HTMLDivElement;

  // State
  let currentState = options.defaultState || "default";
  let targetState = options.defaultState || "default";

  let lastTarget: HTMLElement | null = null;
  let cachedSemanticState: string | null = null;

  let isTransitioning = false;
  let transitionTimer: ReturnType<typeof setTimeout>;

  // Rotation State
  let currentRotation = 0;
  let lastTargetRotation = 0;

  // Normalized Getters (Pre-calculated)
  const getSize = normalize(options.size, 24);
  const getColor = normalize(options.color, "black");
  const getStrategy = normalize(options.followStrategy, "smooth");
  const getAnchor = normalize(options.anchor, "center");
  const getShouldRotate = normalize(options.rotateWithVelocity, false);

  const useSemanticTags = options.useSemanticTags ?? true;
  const duration = options.transitionDuration ?? 200;
  const userOffX = options.offset ? options.offset[0] : 0;
  const userOffY = options.offset ? options.offset[1] : 0;

  return definePlugin<HTMLDivElement, SmartIconOptions>(
    {
      name: options.name || "smart-icon",
      selector: "[data-supermouse-icon]",

      create: () => {
        const el = dom.createActor("div") as HTMLDivElement;
        el.style.zIndex = Layers.CURSOR;

        contentWrapper = dom.createActor("div") as HTMLDivElement;
        dom.applyStyles(contentWrapper, {
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transformOrigin: "center center",
          transform: "scale(1)",
          // Pre-baked ease. Note: If duration changes dynamically, this won't update.
          transition: `transform ${
            duration / 2
          }ms cubic-bezier(0.16, 1, 0.3, 1)`,
        });

        contentWrapper.innerHTML = options.icons[currentState] || "";

        el.appendChild(contentWrapper);
        return el;
      },

      styles: {
        color: "color",
      },

      update: (app, el) => {
        const icons = options.icons;
        const target = app.state.hoverTarget;

        // 1. Determine Next State
        let nextState = options.defaultState || "default";

        if (target) {
          // A. Update Cache if target changed (Performance Fix)
          if (target !== lastTarget) {
            lastTarget = target;
            cachedSemanticState = useSemanticTags
              ? resolveSemanticState(target, icons)
              : null;
          }

          // B. Resolve Logic
          // Check Unified Interaction State (Attribute)
          const attrSmartIcon = app.state.interaction?.icon; // Optional chaining safety

          if (attrSmartIcon && icons[attrSmartIcon]) {
            nextState = attrSmartIcon;
          } else if (cachedSemanticState) {
            nextState = cachedSemanticState;
          }
        } else {
          lastTarget = null;
          cachedSemanticState = null;
        }

        // 2. Handle State Transition
        if (nextState !== currentState && !isTransitioning) {
          if (
            icons[nextState] ||
            nextState === (options.defaultState || "default")
          ) {
            targetState = nextState;
            isTransitioning = true;

            // Clean up any pending timer to avoid race conditions
            clearTimeout(transitionTimer);

            // Scale Down
            contentWrapper.style.transform = "scale(0)";

            transitionTimer = setTimeout(() => {
              currentState = targetState;
              contentWrapper.innerHTML = icons[currentState] || "";
              contentWrapper.style.transform = "scale(1)";

              transitionTimer = setTimeout(() => {
                isTransitioning = false;
              }, duration / 2);
            }, duration / 2);
          }
        }

        // 3. Layout & Styling
        const size = getSize(app.state);
        dom.setStyle(el, "width", `${size}px`);
        dom.setStyle(el, "height", `${size}px`);

        // 4. Calculate Anchor
        let anchorX = 0;
        let anchorY = 0;
        const half = size / 2;
        const anchor = getAnchor(app.state);

        if (anchor !== "center") {
          if (anchor.includes("left")) anchorX = half;
          if (anchor.includes("right")) anchorX = -half;
          if (anchor.includes("top")) anchorY = half;
          if (anchor.includes("bottom")) anchorY = -half;
        }

        // 5. Rotation
        const isSemanticState =
          currentState === "pointer" || currentState === "text";

        if (
          getShouldRotate(app.state) &&
          !isSemanticState &&
          !app.state.reducedMotion
        ) {
          const { x: vx, y: vy } = app.state.velocity;
          const speed = math.dist(vx, vy);

          if (speed > 1) {
            lastTargetRotation = math.angle(vx, vy);
          }
          // Assuming math.lerpAngle handles the 360 wrap logic correctly
          currentRotation = math.lerpAngle(
            currentRotation,
            lastTargetRotation,
            0.15
          );
        } else {
          currentRotation = math.lerpAngle(currentRotation, 0, 0.15);
        }

        // 6. Render
        const pos =
          getStrategy(app.state) === "raw"
            ? app.state.pointer
            : app.state.smooth;
        dom.setTransform(
          el,
          pos.x + userOffX + anchorX,
          pos.y + userOffY + anchorY,
          currentRotation
        );
      },

      cleanup() {
        clearTimeout(transitionTimer);
      },
    },
    options
  );
};