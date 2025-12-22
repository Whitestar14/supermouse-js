
import { Supermouse } from './Supermouse';

export interface MousePosition {
  x: number;
  y: number;
}

export interface ShapeState {
  width: number;
  height: number;
  borderRadius: number;
}

/**
 * The Interface for interaction state.
 * Plugins should use Module Augmentation to add their specific properties to this interface.
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
  /** 
   * Allow arbitrary keys for rapid prototyping. 
   * For type safety, use module augmentation to define expected keys.
   */
  [key: string]: any;
}

export interface MouseState {
  /** The raw position of the input pointer (mouse/touch). */
  pointer: MousePosition;
  /** The target position the cursor logic wants to reach. */
  target: MousePosition;
  /** The smoothed/interpolated position used for rendering. */
  smooth: MousePosition;
  /** The current velocity vector of the smooth position. */
  velocity: MousePosition;
  /** The angle of movement in degrees. Calculated from velocity. */
  angle: number;
  /** Whether the pointer is currently pressed down. */
  isDown: boolean;
  /** Whether the pointer is currently hovering over a registered interactive element. */
  isHover: boolean;
  /** Whether the native cursor is currently forced visible. */
  isNative: boolean;
  /** The DOM element currently being hovered, if any. */
  hoverTarget: HTMLElement | null;
  /** Whether the user has `prefers-reduced-motion` enabled. */
  reducedMotion: boolean;
  /** Whether the system has received valid input coordinates at least once. */
  hasReceivedInput: boolean;
  /** Defines a specific geometric shape the cursor should conform to. */
  shape: ShapeState | null;
  /** Centralized store for hover metadata from data attributes. */
  interaction: InteractionState;
}

/**
 * Configuration options passed to the Supermouse constructor.
 */
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
   * Whether to fallback to native cursor on semantic elements like inputs/textareas.
   * @default true
   */
  ignoreOnNative?: boolean;
  /**
   * Whether to hide the native cursor via global CSS injection.
   * @default true
   */
  hideCursor?: boolean;
  /**
   * Whether to hide the custom cursor when the mouse leaves the browser window.
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
   * @example { 'button': { icon: 'pointer' } }
   */
  rules?: Record<string, InteractionState>;
  /**
   * Custom strategy to resolve interaction state from a hovered element.
   * Overrides the default data-attribute scraping.
   */
  resolveInteraction?: (target: HTMLElement) => InteractionState;
}

/**
 * Helper type: Allows a property to be a static value OR a function that returns the value based on state.
 */
export type ValueOrGetter<T> = T | ((state: MouseState) => T);

/**
 * Interface for defining a Supermouse Plugin.
 */
export interface SupermousePlugin {
  /** Unique name for the plugin. Used for toggling/retrieval. */
  name: string;
  /** Execution priority. Lower numbers run first. */
  priority?: number;
  /** If false, update() will not be called. */
  isEnabled?: boolean;

  /** Called when `app.use()` is executed. */
  install?: (instance: Supermouse) => void;
  /** Called on every animation frame. */
  update?: (instance: Supermouse, deltaTime: number) => void;
  /** Called when the plugin is removed or the app is destroyed. */
  destroy?: (instance: Supermouse) => void;

  /** Called when the plugin is enabled via .enablePlugin() */
  onEnable?: (instance: Supermouse) => void;
  /** Called when the plugin is disabled via .disablePlugin() */
  onDisable?: (instance: Supermouse) => void;
}
