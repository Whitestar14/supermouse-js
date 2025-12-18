import { type SupermousePlugin, dom, Layers } from '@supermousejs/core';

export interface DotOptions {
  size?: number;
  color?: string;
}

export const Dot = (options: DotOptions = {}): SupermousePlugin => {
  let el: HTMLDivElement;
  const size = options.size || 8;
  const color = options.color || '#750c7e';

  return {
    name: 'builtin-dot',
    
    install(app) {
      el = dom.createCircle(size, color);
      
      el.style.zIndex = Layers.CURSOR;
      
      app.container.appendChild(el);
    },
    
    update(app) {
      const { x, y } = app.state.target;
      dom.setTransform(el, x, y);
    },
    
    destroy() {
      el.remove();
    }
  };
};