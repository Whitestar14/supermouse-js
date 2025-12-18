import { type SupermousePlugin, dom, Layers } from '@supermousejs/core';

export interface DotOptions {
  size?: number;
  color?: string;
  zIndex?: string;
  mixBlendMode?: string;
}

export const Dot = (options: DotOptions = {}): SupermousePlugin => {
  let el: HTMLDivElement;
  const size = options.size || 8;
  const color = options.color || '#750c7e';
  const mixBlendMode = options.mixBlendMode || 'difference';

  return {
    name: 'builtin-dot',
    
    install(app) {
      el = dom.createCircle(size, color);
      
      dom.applyStyles(el, {
        zIndex: options.zIndex || Layers.CURSOR, 
        mixBlendMode: options.mixBlendMode
      })
      
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