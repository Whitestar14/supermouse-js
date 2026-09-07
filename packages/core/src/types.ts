import type { SupermouseInstance } from "./Supermouse";

export interface MousePosition {
  x: number;
  y: number;
}

export interface ShapeState {
  width: number;
  height: number;
  borderRadius: number;
}

export type RuleValue = string | boolean | number;
export type RuleSet = Record<string, RuleValue | ((el: HTMLElement) => RuleValue)>;
export type RuleDefinition = RuleSet | ((el: HTMLElement) => RuleSet);

/**
 * Interaction state consumed by plugins.
 * Extend via module augmentation for type safety.
 *
 * @example
 * declare module '@supermousejs/core' {
 *   interface InteractionState {
 *     magnetic: boolean | number;
 *     text: string;
 *   }
 * }
 */
export interface InteractionState {
  /** Arbitrary keys allowed for quick prototyping. */
  [key: string]: any;
}

export interface MouseState {
  /** Raw pointer position from the latest event (before smoothing). */
  pointer: MousePosition;
  /** Goal position the core loop drives toward. */
  target: MousePosition;
  /** Smoothed position used for rendering. */
  smooth: MousePosition;
  /** Movement vector derived from smoothed state. */
  velocity: MousePosition;
  /** Remaining distance to target. */
  displacement: MousePosition;
  /** Movement angle in degrees. */
  angle: number;
  /** Pointer is pressed down. */
  isDown: boolean;
  /** Hovering over a registered interactive element. */
  isHover: boolean;
  /** Native cursor temporarily restored due to native-input heuristics. */
  isNative: boolean;
  /** Current cursor mode: auto, custom, native, or both. */
  cursorMode: "auto" | "custom" | "native" | "both";
  /** Currently hovered DOM element, if any. */
  hoverTarget: HTMLElement | null;
  /** User has `prefers-reduced-motion` enabled. */
  reducedMotion: boolean;
  /** At least one valid input coordinate received. */
  hasReceivedInput: boolean;
  /** Geometric shape the cursor should conform to. */
  shape: ShapeState | null;
  /** Centralized store for hover metadata from data attributes and rules. */
  interaction: InteractionState;
}

/** Configuration options for the Supermouse constructor. */
export interface SupermouseOptions {
  /**
   * The interpolation factor (0 to 1). Lower is smoother/slower.
   * @default 0.15
   */
  smoothness?: number;
  /**
   * List of CSS selectors that trigger the "Hover" state.
   * Overrides the default set if provided.
   */
  hoverSelectors?: string[];
  /**
   * Whether to enable custom cursor effects on touch devices.
   * @default false
   */
  enableTouch?: boolean;
  /**
   * Whether to automatically disable the custom cursor on devices with coarse pointers.
   * @default true
   */
  autoDisableOnMobile?: boolean;
  /**
   * Overall cursor mode.
   * - `"auto"`: use built-in heuristic to decide per element.
   * - `"custom"`: always show custom cursor, hide native.
   * - `"native"`: always show native cursor, hide custom.
   * - `"both"`: always show custom cursor **and** native cursor together (no suppression).
   * @default "auto"
   */
  cursor?: "auto" | "custom" | "native" | "both";
  /**
   * Whether to hide the custom cursor when the pointer leaves the browser viewport.
   * @default true
   */
  hideOnLeave?: boolean;
  /**
   * List of plugins to initialize with the instance.
   */
  plugins?: SupermousePlugin[];
  /**
   * The DOM element to append the cursor stage to.
   * @default document.body
   */
  container?: HTMLElement;
  /**
   * Whether to start the internal animation loop automatically.
   * @default true
   */
  autoStart?: boolean;
  /**
   * Semantic rules mapping CSS selectors to interaction state.
   * Rules are evaluated against hovered elements and merged into `state.interaction`.
   * @example { 'button': { icon: 'pointer' } }
   */
  rules?: Record<string, RuleDefinition>;
  /**
   * The prefix used for data attributes to store hover metadata.
   * @default "supermouse"
   */
  dataPrefix?: string;
  /**
   * The `z-index` applied to the cursor stage element.
   * @default 9999
   */
  zIndex?: number;
}

/** Static value or function that returns a value based on state. */
export type ValueOrGetter<T> = T | ((state: MouseState) => T);

/** Interface for defining a Supermouse plugin. */
export interface SupermousePlugin {
  /** Unique plugin name. */
  name: string;
  /** Execution priority; lower runs first. */
  priority?: number;
  /** If false, `update()` will not be called. */
  isEnabled?: boolean;
  /** Root DOM element, if any. Hidden when plugin disabled. */
  element?: HTMLElement | SVGElement;

  /** Called when `app.use()` is executed. */
  install?: (instance: SupermouseInstance) => void;
  /** Called every animation frame with delta time in ms. */
  update?: (instance: SupermouseInstance, deltaTime: number) => void;
  /** Called when plugin removed or instance destroyed. */
  destroy?: (instance: SupermouseInstance) => void;

  /** Called when plugin enabled via `.enablePlugin()`. */
  onEnable?: (instance: SupermouseInstance) => void;
  /** Called when plugin disabled via `.disablePlugin()`. */
  onDisable?: (instance: SupermouseInstance) => void;
}
