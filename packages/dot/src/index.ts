import { type SupermousePlugin, dom, Layers, resolve, type ValueOrGetter } from '@supermousejs/core';

export interface DotOptions {
  size?: ValueOrGetter<number>;
  color?: ValueOrGetter<string>;
  opacity?: ValueOrGetter<number>;
  zIndex?: string;
  mixBlendMode?: string;
}

export const Dot = (options: DotOptions = {}): SupermousePlugin => {
  let el: HTMLDivElement;
  
  // Defaults
  const defSize = 8;
  const defColor = '#750c7e';
  const defOpacity = 1;
  const mixBlendMode = options.mixBlendMode || 'difference';

  return {
    name: 'dot',
    isEnabled: true,
    
    install(app) {
      const size = resolve(options.size, app.state, defSize);
      const color = resolve(options.color, app.state, defColor);

      el = dom.createCircle(size, color);
      
      dom.applyStyles(el, {
        zIndex: options.zIndex || Layers.CURSOR, 
        mixBlendMode: mixBlendMode,
        transition: 'background-color 0.2s ease, opacity 0.2s ease'
      });
      
      app.registerHoverTarget('[data-supermouse-color]');
      app.container.appendChild(el);
    },
    
    update(app) {
      const size = resolve(options.size, app.state, defSize);
      const opacity = resolve(options.opacity, app.state, defOpacity);
      
      let color = resolve(options.color, app.state, defColor);
      const target = app.state.hoverTarget;
      
      if (target) {
        const overrideColor = target.getAttribute('data-supermouse-color');
        if (overrideColor) color = overrideColor;
      }

      // 2. Apply Styles
      el.style.width = `${size}px`;
      el.style.height = `${size}px`;
      el.style.backgroundColor = color;
      el.style.opacity = String(opacity);

      const { x, y } = app.state.target;
      dom.setTransform(el, x, y);
    },

    onDisable() {
      el.style.opacity = '0';
    },

    onEnable() {},
    
    destroy() {
      el.remove();
    }
  };
};