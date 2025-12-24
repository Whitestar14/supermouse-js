import type { ValueOrGetter } from '@supermousejs/core';
import { definePlugin, normalize, dom, Layers } from '@supermousejs/utils';

export interface IconOptions {
  name?: string;
  isEnabled?: boolean;
  /** SVG Content String */
  svg: string;
  /** Size in pixels (default 24) */
  size?: ValueOrGetter<number>;
  /** CSS Color (default black) */
  color?: ValueOrGetter<string>;
  opacity?: ValueOrGetter<number>;
  /** Offset [x, y] from cursor center */
  offset?: [number, number];
}

export const Icon = (options: IconOptions) => {
  const getSize = normalize(options.size, 24);
  const getOpacity = normalize(options.opacity, 1);
  const getColor = normalize(options.color, 'black');
  const [offX, offY] = options.offset || [0, 0];

  return definePlugin<HTMLDivElement, IconOptions>({
    name: options.name || 'icon',
    
    create: () => {
      const el = dom.createActor('div') as HTMLDivElement;
      el.style.zIndex = Layers.CURSOR;
      el.style.display = 'flex';
      el.style.alignItems = 'center';
      el.style.justifyContent = 'center';
      el.innerHTML = options.svg;
      return el;
    },

    styles: {
      color: 'color'
    },

    update: (app, el) => {
      const size = getSize(app.state);
      dom.setStyle(el, 'width', `${size}px`);
      dom.setStyle(el, 'height', `${size}px`);
      dom.setStyle(el, 'opacity', String(getOpacity(app.state)));
      dom.setStyle(el, 'color', getColor(app.state));

      const { x, y } = app.state.smooth;
      dom.setTransform(el, x + offX, y + offY, 0);
    }
  }, options);
};