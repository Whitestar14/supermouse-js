import { Supermouse } from "@supermousejs/core";

export interface Point {
  x: number;
  y: number;
}

export interface MouseState {
  pointer: Point;
  target: Point;
  smooth: Point;
  velocity: Point;
  isDown: boolean;
  isHover: boolean;
  isNative: boolean;
  forcedCursor: string | null;
  hoverTarget: HTMLElement | null;
  reducedMotion: boolean;
}

export interface SupermouseOptions {
  smoothness?: number;
  enableTouch?: boolean;
  autoDisableOnMobile?: boolean;
  ignoreOnNative?: boolean;
  hideCursor?: boolean;
}

export interface SupermousePlugin {
  name: string;
  isEnabled?: boolean;
  install?: (app: Supermouse) => void;
  update?: (app: Supermouse, deltaTime: number) => void;
  onEnable?: (app: Supermouse) => void;
  onDisable?: (app: Supermouse) => void;
  destroy?: (app: Supermouse) => void;
}

export interface OptionSchema {
  name: string;
  type: string;
  default?: string;
  description: string;
  reactive?: boolean;
}

export interface PluginMeta {
  id: string;
  name: string;
  package: string;
  description: string;
  code: string;
  icon: string;
  options?: OptionSchema[];
}
