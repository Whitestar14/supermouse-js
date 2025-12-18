import { type SupermousePlugin, resolve, type ValueOrGetter } from '@supermousejs/core';

export interface MagneticOptions {
  force?: ValueOrGetter<number>;
}

export const Magnetic = (options: MagneticOptions = {}): SupermousePlugin => {
  const defForce = 0.5;
  
  let lastTarget: HTMLElement | null = null;
  let cachedRect: DOMRect | null = null;
  let cachedCenter = { x: 0, y: 0 };

  return {
    name: 'magnetic',
    isEnabled: true,
    
    install(app) {
      app.registerHoverTarget('[data-supermouse-magnetic]');
    },
    
    update(app) {
      const target = app.state.hoverTarget;
      const force = resolve(options.force, app.state, defForce);
      
      if (target !== lastTarget) {
        lastTarget = target;
        cachedRect = null;
        if (target && target.hasAttribute('data-supermouse-magnetic')) {
          const rect = target.getBoundingClientRect();
          cachedRect = rect;
          cachedCenter = {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2
          };
        }
      }

      if (cachedRect) {
        const { x: centerX, y: centerY } = cachedCenter;
        const rawX = app.state.pointer.x;
        const rawY = app.state.pointer.y;

        const magnetX = centerX + (rawX - centerX) * force;
        const magnetY = centerY + (rawY - centerY) * force;

        app.state.target.x = magnetX;
        app.state.target.y = magnetY;
      }
    },
  };
};