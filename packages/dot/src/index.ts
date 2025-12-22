
import { definePlugin, dom, Layers, normalize, type ValueOrGetter } from '@supermousejs/core';

export interface DotOptions {
  name?: string;
  isEnabled?: boolean;
  size?: ValueOrGetter<number>;
  color?: ValueOrGetter<string>;
  opacity?: ValueOrGetter<number>;
  zIndex?: string;
  mixBlendMode?: string;
  /** Whether to hide the dot when the cursor is in a 'shape' state (e.g. Stuck). Default true. */
  hideOnShape?: boolean;
}

export const Dot = (options: DotOptions = {}) => {
  const defSize = 8;
  const defColor = '#750c7e';
  const hideOnShape = options.hideOnShape ?? true;

  // Normalize options once during setup
  const getSize = normalize(options.size, defSize);
  const getColor = normalize(options.color, defColor);
  const getOpacity = normalize(options.opacity, 1);

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

    styles: {}, 

    update: (app, el) => {
      const size = getSize(app.state);
      dom.setStyle(el, 'width', `${size}px`);
      dom.setStyle(el, 'height', `${size}px`);

      // Handle Color via Interaction State
      const interactionColor = app.state.interaction.color;
      if (interactionColor) {
        dom.setStyle(el, 'backgroundColor', interactionColor);
      } else {
        dom.setStyle(el, 'backgroundColor', getColor(app.state));
      }

      let targetOpacity = getOpacity(app.state);

      if (hideOnShape && app.state.shape) {
        targetOpacity = 0;
      }

      dom.setStyle(el, 'opacity', String(targetOpacity));

      const { x, y } = app.state.target;
      dom.setTransform(el, x, y);
    }
  }, options);
};