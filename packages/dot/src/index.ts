import { type SupermousePlugin, dom, Layers } from '@supermousejs/core';

export interface DotOptions {
  size?: number;
  color?: string;
  zIndex?: string;
  mixBlendMode?: string;
  /**
   * If true, the dot will vanish when hovering a sticky element
   * (leaving only the Ring highlighter).
   * @default false
   */
  hideOnStick?: boolean;
}

export const Dot = (options: DotOptions = {}): SupermousePlugin => {
  let el: HTMLDivElement;
  const size = options.size || 8;
  const color = options.color || '#750c7e';
  const mixBlendMode = options.mixBlendMode || 'difference';
  const hideOnStick = options.hideOnStick || false;

  let lastTarget: HTMLElement | null = null;

  return {
    name: 'dot',
    
    install(app) {
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
      const target = app.state.hoverTarget;
      let isHidden = false;
      
      // 1. Check Context
      if (target !== lastTarget) {
        lastTarget = target;
        const overrideColor = target?.getAttribute('data-supermouse-color');
        el.style.backgroundColor = overrideColor || color;
      }

      // 2. Check Hide Logic (Scenario 2)
      if (hideOnStick && target && target.hasAttribute('data-supermouse-stick')) {
        isHidden = true;
      }

      // 3. Render
      if (isHidden) {
        el.style.opacity = '0';
      } else {
        el.style.opacity = '1';
        const { x, y } = app.state.target;
        dom.setTransform(el, x, y);
      }
    },
    
    destroy() {
      el.remove();
    }
  };
};