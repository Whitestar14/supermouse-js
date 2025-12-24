
import type { ValueOrGetter } from '@supermousejs/core';
import { definePlugin, normalize, dom } from '@supermousejs/utils';

export interface StickOptions {
  name?: string;
  isEnabled?: boolean;
  /** Extra padding around the element when calculating shape. Default 10. */
  padding?: ValueOrGetter<number>;
}

export const Stick = (options: StickOptions = {}) => {
  const getPadding = normalize(options.padding, 10);
  
  let lastTarget: HTMLElement | null = null;
  let cache: { width: number; height: number; radius: number; x: number; y: number } | null = null;

  return definePlugin({
    name: options.name || 'stick',
    // Logic plugin: must run before visuals to set the shape state
    priority: -10, 
    
    install(app) {
      app.registerHoverTarget('[data-supermouse-stick]');
    },

    update(app) {
      // Check normalized interaction key (camelCase, no prefix)
      const target = app.state.hoverTarget;
      const isSticky = app.state.interaction.stick === true || app.state.interaction.stick === 'true';
      
      if (target && isSticky) {
        
        // Recalculate only if target changed or on first frame
        if (target !== lastTarget || !cache) {
          lastTarget = target;
          
          const rect = dom.projectRect(target, app.container);
          const style = window.getComputedStyle(target);
          const padding = getPadding(app.state);

          cache = {
            width: rect.width + padding,
            height: rect.height + padding,
            radius: parseFloat(style.borderRadius) || 0,
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2
          };
        }

        if (cache) {
          // 1. Override Target (Physics) - Snap target to center of element
          app.state.target.x = cache.x;
          app.state.target.y = cache.y;

          // 2. Set Shape (Visuals) - Visual plugins like Ring will read this
          app.state.shape = {
            width: cache.width,
            height: cache.height,
            borderRadius: cache.radius
          };
        }
      } else {
        // Reset
        if (lastTarget) {
          lastTarget = null;
          cache = null;
        }
        app.state.shape = null;
      }
    }
  }, options);
};
