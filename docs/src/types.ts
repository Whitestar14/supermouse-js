
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
  install?: (app: any) => void;
  update?: (app: any, deltaTime: number) => void;
  onEnable?: (app: any) => void;
  onDisable?: (app: any) => void;
  destroy?: (app: any) => void;
}

export interface OptionSchema {
  name: string;
  type: string;
  default?: string;
  description: string;
  reactive?: boolean; // True if it accepts ValueOrGetter<T>
}

export interface PluginMeta {
  id: string;
  name: string;
  description: string;
  code: string;
  icon: string;
  options?: OptionSchema[];
}
