
import { definePlugin, dom, Layers, normalize, type ValueOrGetter } from '@supermousejs/core';

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

  // Normalize options once during setup
  const getSize = normalize(options.size, defSize);
  // We keep resolve logic for context-aware color in the loop, or we can handle it partly here.
  // Since color depends on hoverTarget attributes (which isn't strictly in 'state' cleanly yet), 
  // we might still need some logic. But we can normalize the base color.
  const getColor = normalize(options.color, defColor);

  return definePlugin<HTMLDivElement, DotOptions>({
    name: 'dot',
    selector: '[data-supermouse-color]',

    create: (app) => {
      // Initial values
      const size = getSize(app.state);
      const color = getColor(app.state);
      
      const el = dom.createCircle(size, color);
      dom.applyStyles(el, {
        zIndex: options.zIndex || Layers.CURSOR, 
        mixBlendMode: options.mixBlendMode || 'difference',
        transition: 'background-color 0.2s ease, opacity 0.2s ease'
      });
      return el;
    },

    styles: {
      // Removed 'color' from here because we need custom logic for attributes
      opacity: 'opacity'
    },

    update: (app, el) => {
      // Manual Size Update
      const size = getSize(app.state);
      dom.setStyle(el, 'width', `${size}px`);
      dom.setStyle(el, 'height', `${size}px`);

      // Context Override for Color
      const target = app.state.hoverTarget;
      if (target?.hasAttribute('data-supermouse-color')) {
        const override = target.getAttribute('data-supermouse-color')!;
        dom.setStyle(el, 'backgroundColor', override);
      } else {
        dom.setStyle(el, 'backgroundColor', getColor(app.state));
      }

      const { x, y } = app.state.target;
      dom.setTransform(el, x, y);
    }
  }, options);
};
