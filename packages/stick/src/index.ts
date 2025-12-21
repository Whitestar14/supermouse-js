
import { definePlugin, normalize, type ValueOrGetter } from '@supermousejs/core';

export interface StickOptions {
  name?: string;
  isEnabled?: boolean;
  /** Extra padding around the element when calculating shape. Default 10. */
  padding?: ValueOrGetter<number>;
}

/**
 * Internal utility to measure an element for sticky positioning.
 */
function getStickyDimensions(target: HTMLElement, padding: number = 0) {
  const rect = target.getBoundingClientRect();
  const style = window.getComputedStyle(target);
  
  return {
    width: rect.width + padding,
    height: rect.height + padding,
    // Try to parse px value, fallback to 0 if %, but stick works best with px
    radius: parseFloat(style.borderRadius) || 0,
    // Center point
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2
  };
}

export const Stick = (options: StickOptions = {}) => {
  const getPadding = normalize(options.padding, 10);
  
  let lastTarget: HTMLElement | null = null;
  let cache: ReturnType<typeof getStickyDimensions> | null = null;

  return definePlugin({
    name: options.name || 'stick',
    // Logic plugin: must run before visuals to set the shape state
    priority: -10, 
    
    install(app) {
      app.registerHoverTarget('[data-supermouse-stick]');
    },

    update(app) {
      const target = app.state.hoverTarget;
      
      if (target && target.hasAttribute('data-supermouse-stick')) {
        
        // Recalculate only if target changed or on first frame
        if (target !== lastTarget || !cache) {
          lastTarget = target;
          cache = getStickyDimensions(target, getPadding(app.state));
        }

        if (cache) {
          // 1. Override Target (Physics)
          app.state.target.x = cache.x;
          app.state.target.y = cache.y;

          // 2. Set Shape (Visuals)
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
