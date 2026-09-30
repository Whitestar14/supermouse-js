import type { ValueOrGetter, SupermouseInstance, SupermousePlugin } from "@supermousejs/core";
import {
  definePlugin,
  normalizeAll,
  createActor,
  css,
  injectStyles,
  math,
  Layers
} from "@supermousejs/utils";

import { resolveSemanticState } from "./resolveSemanticState";

export type { SmartIconMap } from "./resolveSemanticState";
import type { SmartIconMap } from "./resolveSemanticState";

export type SmartIconAnchor = "center" | "top-left" | "top-right" | "bottom-left" | "bottom-right";

export interface SmartIconOptions {
  name?: string;
  isEnabled?: boolean;
  icons: SmartIconMap;
  defaultState?: string;
  /**
   * If true (default), resolve icon state from the semantic meaning of the
   * pointer target — text inputs become "text", links become "pointer",
   * authored cursors feed the "text"/"grab" icons. If false, only
   * `data-supermouse-icon` attributes drive state, with `defaultState`
   * as the fallback.
   */
  useSemanticDetection?: boolean;
  transitionDuration?: number;
  /** Minimum ms a state must be requested before committing. Default 80. */
  switchDelay?: number;
  size?: ValueOrGetter<number>;
  /** Color applied to icons that use `currentColor` in their SVG. */
  color?: ValueOrGetter<string>;
  offset?: [number, number];
  anchor?: ValueOrGetter<SmartIconAnchor>;
  followStrategy?: ValueOrGetter<"smooth" | "raw">;
  rotateWithVelocity?: ValueOrGetter<boolean>;
}

export const SmartIcon = (options: SmartIconOptions): SupermousePlugin => {
  let contentWrapper: HTMLDivElement;

  let currentState = options.defaultState ?? "default";
  let lastTarget: HTMLElement | null = null;
  let cachedSemanticState: string | null;

  let transitionPhase: "idle" | "out" | "in" = "idle";
  let transitionStartTime = 0;
  let targetState = currentState;

  let pendingState: string | null = null;
  let pendingTimer = 0;

  let currentRotation = 0;
  let lastTargetRotation = 0;

  const cfg = normalizeAll(options, {
    size: 24,
    color: "",
    followStrategy: "smooth",
    anchor: "center",
    rotateWithVelocity: false
  });

  const useSemanticDetection = options.useSemanticDetection ?? true;
  const duration = options.transitionDuration ?? 200;
  const switchDelay = options.switchDelay ?? 80;
  const userOffX = options.offset?.[0] ?? 0;
  const userOffY = options.offset?.[1] ?? 0;

  const defaultState = options.defaultState ?? "default";
  const halfDuration = duration / 2;

  function applyScale(s: number): void {
    css(contentWrapper, { transform: `scale(${s})` });
  }

  function swapContent(state: string): void {
    currentState = state;
    contentWrapper.innerHTML = options.icons[state] ?? "";
  }

  let previousCursor: "auto" | "native" | "custom" | "both";

  return definePlugin<HTMLDivElement>(
    {
      name: options.name ?? "smart-icon",
      selector: "[data-supermouse-icon]",

      create: (app) => {
        const el = createActor("div") as HTMLDivElement;
        css(el, { zIndex: Layers.CURSOR });

        contentWrapper = createActor("div") as HTMLDivElement;
        css(contentWrapper, {
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transformOrigin: "center center",
          transform: "scale(1)",
          transition: `transform ${halfDuration}ms cubic-bezier(0.16, 1, 0.3, 1)`
        });

        contentWrapper.innerHTML = options.icons[currentState] ?? "";

        injectStyles(
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

        previousCursor = app.state.cursorMode;
        app.setCursor("custom");

        el.appendChild(contentWrapper);
        return el;
      },

      update: (app: SupermouseInstance, el: HTMLDivElement, dtMs: number) => {
        const time = performance.now();
        const dt = dtMs / 1000;
        const icons = options.icons;
        const target = app.state.pointerTarget;
        const hasTarget = !!target;
        const targetChanged = hasTarget && target !== lastTarget;

        let desiredState = defaultState;

        if (hasTarget) {
          if (targetChanged) {
            lastTarget = target;
            cachedSemanticState = useSemanticDetection
              ? resolveSemanticState(target, icons, app.state.authoredCursor)
              : null;
          }

          const attrIcon = app.state.interaction?.icon;
          if (attrIcon && icons[attrIcon]) {
            desiredState = attrIcon;
          } else if (cachedSemanticState) {
            desiredState = cachedSemanticState;
          }
        } else {
          if (lastTarget) {
            lastTarget = null;
            cachedSemanticState = null;
          }
        }

        if (desiredState !== currentState && transitionPhase === "idle") {
          const isValid = !!icons[desiredState] || desiredState === defaultState;

          if (!isValid) {
            pendingState = null;
            pendingTimer = 0;
          } else if (targetChanged) {
            swapContent(desiredState);
            applyScale(1);
            pendingState = null;
            pendingTimer = 0;
          } else if (desiredState !== pendingState) {
            pendingState = desiredState;
            pendingTimer = 0;
          } else {
            pendingTimer += dtMs;
            if (pendingTimer >= switchDelay) {
              targetState = desiredState;
              transitionPhase = "out";
              transitionStartTime = time;
              applyScale(0);
              pendingState = null;
              pendingTimer = 0;
            }
          }
        } else if (desiredState === currentState) {
          pendingState = null;
          pendingTimer = 0;
        }

        if (transitionPhase === "out") {
          if (time - transitionStartTime >= halfDuration) {
            swapContent(targetState);
            transitionPhase = "in";
            transitionStartTime = time;
            applyScale(0);
          }
        }

        if (transitionPhase === "in") {
          if (time - transitionStartTime >= halfDuration) {
            transitionPhase = "idle";
            applyScale(1);
          }
        }

        const size = cfg.size(app.state);
        const color = cfg.color(app.state);

        css(el, {
          width: `${size}px`,
          height: `${size}px`,
          color: color || "inherit"
        });

        let anchorX = 0;
        let anchorY = 0;
        const half = size / 2;
        const anchor = cfg.anchor(app.state);

        switch (anchor) {
          case "center":
            anchorX = -half;
            anchorY = -half;
            break;
          case "top-left":
            anchorX = 0;
            anchorY = 0;
            break;
          case "top-right":
            anchorX = -size;
            anchorY = 0;
            break;
          case "bottom-left":
            anchorX = 0;
            anchorY = -size;
            break;
          case "bottom-right":
            anchorX = -size;
            anchorY = -size;
            break;
        }

        const isSemanticState = currentState === "pointer" || currentState === "text";
        if (cfg.rotateWithVelocity(app.state) && !isSemanticState && !app.state.reducedMotion) {
          const { x: vx, y: vy } = app.state.velocity;
          const speed = math.dist(vx, vy);
          if (speed > 1) lastTargetRotation = math.angle(vx, vy);

          const angleFactor = 1 - Math.exp(-20 * dt);
          currentRotation = math.lerpAngle(currentRotation, lastTargetRotation, angleFactor);
        } else {
          const angleFactor = 1 - Math.exp(-20 * dt);
          currentRotation = math.lerpAngle(currentRotation, 0, angleFactor);
        }

        const pos = cfg.followStrategy(app.state) === "raw" ? app.state.pointer : app.state.smooth;
        const transform = `translate3d(${pos.x + userOffX + anchorX}px, ${pos.y + userOffY + anchorY}px, 0) rotate(${currentRotation}deg)`;
        el.style.transform = transform;
      },

      cleanup(app) {
        app.setCursor(previousCursor);
      }
    },
    options
  );
};
