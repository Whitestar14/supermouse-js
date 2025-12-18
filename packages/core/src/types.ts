import { Supermouse } from './Supermouse';

export interface MousePosition {
  x: number;
  y: number;
}

export interface MouseState {
  client: MousePosition;
  smooth: MousePosition;
  velocity: MousePosition;
  isDown: boolean;
  isHover: boolean;
  hoverTarget: HTMLElement | null;
}

export interface SupermouseOptions {
  smoothness?: number;
  hoverSelector?: string;
  enableTouch?: boolean;
}

export interface SupermousePlugin {
  name: string;
  install?: (instance: Supermouse) => void;
  update?: (instance: Supermouse, deltaTime: number) => void;
  destroy?: (instance: Supermouse) => void;
}