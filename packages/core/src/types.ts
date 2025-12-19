
import { Supermouse } from './Supermouse';

export interface MousePosition {
  x: number;
  y: number;
}

export interface MouseState {
  pointer: MousePosition;
  target: MousePosition;
  smooth: MousePosition;
  velocity: MousePosition;
  isDown: boolean;
  isHover: boolean;
  isNative: boolean;
  hoverTarget: HTMLElement | null;
  reducedMotion: boolean;
}

export interface SupermouseOptions {
  smoothness?: number;
  hoverSelector?: string;
  enableTouch?: boolean;
  autoDisableOnMobile?: boolean;
  ignoreOnNative?: boolean;
  hideCursor?: boolean;
}

/**
 * Helper type: Allows a property to be a static value OR a function that returns the value based on state.
 */
export type ValueOrGetter<T> = T | ((state: MouseState) => T);

export interface SupermousePlugin {
  name: string;
  /** 
   * If false, update() will not be called. 
   * @default true 
   */
  isEnabled?: boolean;

  install?: (instance: Supermouse) => void;
  update?: (instance: Supermouse, deltaTime: number) => void;
  destroy?: (instance: Supermouse) => void;

  /** Called when the plugin is enabled via .enablePlugin() */
  onEnable?: (instance: Supermouse) => void;
  /** Called when the plugin is disabled via .disablePlugin() */
  onDisable?: (instance: Supermouse) => void;
}
