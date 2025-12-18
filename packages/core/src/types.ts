import { Supermouse } from './Supermouse';

export interface MousePosition {
  x: number;
  y: number;
}

export interface MouseState {
  /** Raw hardware mouse position (ReadOnly-ish) */
  pointer: MousePosition;
  /** Where the cursor *wants* to be (Modifiable by Magnetic plugins) */
  target: MousePosition;
  /** The interpolated "smooth" position (Visuals follow this) */
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

export interface SupermousePlugin {
  name: string;
  install?: (instance: Supermouse) => void;
  update?: (instance: Supermouse, deltaTime: number) => void;
  destroy?: (instance: Supermouse) => void;
}