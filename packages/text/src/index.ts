import { type SupermousePlugin, dom, Layers, Easings } from '@supermousejs/core';

export interface TextOptions {
  className?: string;
  offset?: [number, number];
  duration?: number;
}

export const Text = (options: TextOptions = {}): SupermousePlugin => {
  let el: HTMLDivElement;
  let textNode: HTMLSpanElement;
  
  const className = options.className || 'supermouse-text';
  const [offX, offY] = options.offset || [0, 24];
  const duration = options.duration || 200;

  return {
    name: 'text',
    isEnabled: true,

    install(app) {
      el = dom.createDiv();
      el.classList.add(className);
      textNode = document.createElement('span');
      el.appendChild(textNode);

      dom.applyStyles(el, {
        zIndex: Layers.OVERLAY,
        opacity: '0',
        transition: `opacity ${duration}ms ${Easings.SMOOTH}`,
        pointerEvents: 'none',
        whiteSpace: 'nowrap'
      });
      
      dom.setTransform(el, -100, -100);
      
      app.registerHoverTarget('[data-supermouse-text]');
      
      app.container.appendChild(el);
    },

    update(app) {
      const target = app.state.hoverTarget;
      const text = target?.getAttribute('data-supermouse-text');

      if (app.state.isHover && text) {
        textNode.innerText = text;
        el.style.opacity = '1';
        
        const { x, y } = app.state.pointer;
        dom.setTransform(el, x + offX, y + offY);
      } else {
        el.style.opacity = '0';
      }
    },

    onDisable() { el.style.opacity = '0'; },
    onEnable() { /* Update loop will handle opacity */ },
    destroy() { el.remove(); }
  };
};