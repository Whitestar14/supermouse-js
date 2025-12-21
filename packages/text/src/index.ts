
import { definePlugin, dom, Layers, Easings, normalize, type ValueOrGetter } from '@supermousejs/core';

export interface TextOptions {
  name?: string;
  isEnabled?: boolean;
  className?: string;
  offset?: [number, number];
  duration?: number;
}

export const Text = (options: TextOptions = {}) => {
  const className = options.className || 'supermouse-text';
  const [offX, offY] = options.offset || [0, 24];
  const duration = options.duration || 200;
  
  let textNode: HTMLSpanElement;

  return definePlugin<HTMLDivElement, TextOptions>({
    name: 'text',
    selector: '[data-supermouse-text]',

    create: () => {
      const el = dom.createActor('div') as HTMLDivElement;
      el.classList.add(className);
      
      textNode = document.createElement('span');
      el.appendChild(textNode);

      dom.applyStyles(el, {
        zIndex: Layers.OVERLAY,
        opacity: '0',
        transition: `opacity ${duration}ms ${Easings.SMOOTH}`,
        whiteSpace: 'nowrap'
      });
      dom.setTransform(el, -100, -100);
      return el;
    },

    update: (app, el) => {
      const target = app.state.hoverTarget;
      const text = target?.getAttribute('data-supermouse-text');

      if (app.state.isHover && text) {
        textNode.innerText = text;
        dom.setStyle(el, 'opacity', '1');
        
        // Dynamic position based on pointer
        const { x, y } = app.state.pointer;
        dom.setTransform(el, x + offX, y + offY);
      } else {
        dom.setStyle(el, 'opacity', '0');
      }
    }
  }, options);
};