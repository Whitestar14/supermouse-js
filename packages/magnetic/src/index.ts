import { type SupermousePlugin } from '@supermousejs/core';

export interface MagneticOptions {
  /** 
   * How "sticky" the magnet is. 0.1 = very sticky, 0.8 = loose.
   * @default 0.5 
   */
  force?: number;
}

export const Magnetic = (options: MagneticOptions = {}): SupermousePlugin => {
  const force = options.force || 0.5;

  return {
    name: 'magnetic',
    
    update(app) {
      const targetEl = app.state.hoverTarget;
      if (!targetEl || !targetEl.hasAttribute('data-magnetic')) return;

      // 1. Calculate Center of Button
      const rect = targetEl.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      // 2. Calculate "Sticky" Position
      // Instead of going straight to the mouse (pointer),
      // we interpolate between the Center and the Pointer.
      const rawX = app.state.pointer.x;
      const rawY = app.state.pointer.y;

      const magnetX = centerX + (rawX - centerX) * force;
      const magnetY = centerY + (rawY - centerY) * force;

      // 3. Hijack the Core Target
      // The cursor will now fly towards this sticky point
      app.state.target.x = magnetX;
      app.state.target.y = magnetY;
    }
  };
};