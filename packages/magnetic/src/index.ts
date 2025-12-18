import { type SupermousePlugin } from '@supermousejs/core';

export interface MagneticOptions {
  force?: number;
}

export const Magnetic = (options: MagneticOptions = {}): SupermousePlugin => {
  const force = options.force || 0.5;
  
  // Cache Mechanism
  let lastTarget: HTMLElement | null = null;
  let cachedRect: DOMRect | null = null;
  let cachedCenter = { x: 0, y: 0 };

  return {
    name: 'magnetic',
    
    update(app) {
      const target = app.state.hoverTarget;
      
      if (target !== lastTarget) {
        lastTarget = target;
        cachedRect = null;
        
        if (target && target.hasAttribute('data-magnetic')) {
          const rect = target.getBoundingClientRect();
          cachedRect = rect;
          cachedCenter = {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2
          };
        }
      }

      // 2. Apply Magnetism if active
      if (cachedRect) {
        const { x: centerX, y: centerY } = cachedCenter;

        const rawX = app.state.pointer.x;
        const rawY = app.state.pointer.y;

        const magnetX = centerX + (rawX - centerX) * force;
        const magnetY = centerY + (rawY - centerY) * force;

        app.state.target.x = magnetX;
        app.state.target.y = magnetY;
      }
    }
  };
};