
import { Supermouse } from './Supermouse';

/**
 * Represents a 2D coordinate point.
 */
export interface MousePosition {
  x: number;
  y: number;
}

/**
 * The global state object shared across the Supermouse instance and all plugins.
 */
export interface MouseState {
  /** The raw position of the input pointer (mouse/touch). */
  pointer: MousePosition;
  /** The target position the cursor logic wants to reach (modified by logic plugins like Magnetic). */
  target: MousePosition;
  /** The smoothed/interpolated position used for rendering. */
  smooth: MousePosition;
  /** The current velocity vector of the smooth position. */
  velocity: MousePosition;
  /** Whether the pointer is currently pressed down. */
  isDown: boolean;
  /** Whether the pointer is currently hovering over a registered interactive element. */
  isHover: boolean;
  /** 
   * Whether the native cursor is currently forced visible (e.g. over inputs or `data-supermouse-ignore`).
   * If true, custom cursor elements often hide themselves. 
   */
  isNative: boolean;
  /** The DOM element currently being hovered, if any. */
  hoverTarget: HTMLElement | null;
  /** Whether the user has `prefers-reduced-motion` enabled. */
  reducedMotion: boolean;
  /** Whether the system has received valid input coordinates at least once. */
  hasReceivedInput: boolean;
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
   * Selector string used to identify interactive elements. 
   * Plugins typically register their own selectors automatically.
   */
  hoverSelector?: string;
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
  /** 
   * Execution priority. Lower numbers run first.
   * Logic plugins (like Magnetic) should use negative numbers.
   * Visual plugins (Dot, Ring) default to 0.
   * @default 0
   */
  priority?: number;
  /** 
   * If false, update() will not be called. 
   * @default true 
   */
  isEnabled?: boolean;

  /** Called when `app.use()` is executed. Use for DOM creation and event binding. */
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
