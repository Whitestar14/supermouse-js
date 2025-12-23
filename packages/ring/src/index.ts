import type { ValueOrGetter } from '@supermousejs/core';
import { definePlugin, normalize, dom, Layers } from '@supermousejs/utils';

export interface RingOptions {
  name?: string;
  isEnabled?: boolean;
  size?: ValueOrGetter<number>;
  color?: ValueOrGetter<string>;
  borderWidth?: ValueOrGetter<number>;
  opacity?: ValueOrGetter<number>;
  mixBlendMode?: string;
}

export const Ring = (options: RingOptions = {}) => {
  const getSize = normalize(options.size, 20);
  const getColor = normalize(options.color, '#ffffff');
  const getBorder = normalize(options.borderWidth, 2);
  const getOpacity = normalize(options.opacity, 1);

  return definePlugin<HTMLDivElement, RingOptions>({
    name: options.name || 'ring',
    selector: '[data-supermouse-color]',

    create: (app) => {
      const el = dom.createCircle(getSize(app.state), 'transparent');
      dom.applyStyles(el, {
        zIndex: Layers.FOLLOWER,
        mixBlendMode: options.mixBlendMode || 'difference',
        borderStyle: 'solid',
        transition: 'opacity 0.2s ease',
        boxSizing: 'border-box'
      });
      return el;
    },

    update: (app, el) => {
      const size = getSize(app.state);
      let color = getColor(app.state);
      
      // Basic interaction override for color only
      if (app.state.interaction.color) {
        color = app.state.interaction.color;
      }

      dom.setStyle(el, 'width', `${size}px`);
      dom.setStyle(el, 'height', `${size}px`);
      dom.setStyle(el, 'borderRadius', '50%');
      dom.setStyle(el, 'borderColor', color);
      dom.setStyle(el, 'borderWidth', `${getBorder(app.state)}px`);
      dom.setStyle(el, 'opacity', String(getOpacity(app.state)));

      const { x, y } = app.state.smooth;
      dom.setTransform(el, x, y);
    }
  }, options);
};