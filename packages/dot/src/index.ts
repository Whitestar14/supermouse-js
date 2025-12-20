import { definePlugin, dom, Layers, resolve, type ValueOrGetter } from '@supermousejs/core';

export interface DotOptions {
  name?: string;
  isEnabled?: boolean;
  size?: ValueOrGetter<number>;
  color?: ValueOrGetter<string>;
  opacity?: ValueOrGetter<number>;
  zIndex?: string;
  mixBlendMode?: string;
}

export const Dot = (options: DotOptions = {}) => {
  const defSize = 8;
  const defColor = '#750c7e';

  return definePlugin<HTMLDivElement, DotOptions>({
    name: 'dot',
    selector: '[data-supermouse-color]',

    create: (app) => {
      const size = resolve(options.size, app.state, defSize);
      const color = resolve(options.color, app.state, defColor);
      
      const el = dom.createCircle(size, color);
      dom.applyStyles(el, {
        zIndex: options.zIndex || Layers.CURSOR, 
        mixBlendMode: options.mixBlendMode || 'difference',
        transition: 'background-color 0.2s ease, opacity 0.2s ease'
      });
      return el;
    },

    styles: {
      color: 'backgroundColor',
      opacity: 'opacity'
    },

    update: (app, el) => {
      // Manual Size Update (due to 'px' suffix requirement)
      const size = resolve(options.size, app.state, defSize);
      dom.setStyle(el, 'width', `${size}px`);
      dom.setStyle(el, 'height', `${size}px`);

      // Context Override for Color
      const target = app.state.hoverTarget;
      if (target?.hasAttribute('data-supermouse-color')) {
        const override = target.getAttribute('data-supermouse-color')!;
        dom.setStyle(el, 'backgroundColor', override);
      }

      const { x, y } = app.state.target;
      dom.setTransform(el, x, y);
    }
  }, options);
};