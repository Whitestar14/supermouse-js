import { type SupermousePlugin, dom, math, effects, Layers } from '@supermousejs/core';

export interface RingOptions {
  size?: number;
  hoverSize?: number;
  color?: string;
  borderWidth?: number;
  mixBlendMode?: string;
  
  enableSkew?: boolean;
  enableStick?: boolean;
  stickPadding?: number;
}

export const Ring = (options: RingOptions = {}): SupermousePlugin => {
  let el: HTMLDivElement;
  
  const baseSize = options.size || 20;
  const hoverSize = options.hoverSize || 40;
  const color = options.color || '#ffffff';
  const borderWidth = options.borderWidth || 2;
  const mixBlendMode = options.mixBlendMode || 'difference';
  
  const enableSkew = options.enableSkew ?? false;
  const enableStick = options.enableStick ?? true;
  const stickPadding = options.stickPadding || 10;

  let currentW = baseSize;
  let currentH = baseSize;
  
  let lastTarget: HTMLElement | null = null;
  let stickCache: ReturnType<typeof effects.getStickyDimensions> | null = null;

  return {
    name: 'ring',
    
    install(app) {
      el = dom.createCircle(baseSize, 'transparent');
      dom.applyStyles(el, {
        border: `${borderWidth}px solid ${color}`,
        zIndex: Layers.FOLLOWER,
        mixBlendMode: mixBlendMode,
        transition: 'border-color 0.2s ease'
      });
      app.container.appendChild(el);
    },

    update(app) {
      const target = app.state.hoverTarget;
      
      let targetW = baseSize;
      let targetH = baseSize;
      let targetRadius = 50;
      let isStuck = false;

      if (enableStick && target && target.hasAttribute('data-cursor-stick')) {
        isStuck = true;
        
        if (target !== lastTarget) {
          lastTarget = target;
          stickCache = effects.getStickyDimensions(target, stickPadding);
        }

        if (stickCache) {
          targetW = stickCache.width;
          targetH = stickCache.height;
          targetRadius = stickCache.radius;
        }
      } else {
        if (lastTarget) {
          lastTarget = null;
          stickCache = null;
        }
        
        if (app.state.isHover) {
          targetW = hoverSize;
          targetH = hoverSize;
        }
        if (app.state.isDown) {
          targetW *= 0.8;
          targetH *= 0.8;
        }
      }

      currentW = math.lerp(currentW, targetW, 0.2);
      currentH = math.lerp(currentH, targetH, 0.2);

      el.style.width = `${currentW}px`;
      el.style.height = `${currentH}px`;
      
      el.style.borderRadius = isStuck ? `${targetRadius}px` : '50%';

      let x, y;
      let rotation = 0;
      let scaleX = 1;
      let scaleY = 1;

      if (isStuck && stickCache) {
        x = stickCache.x;
        y = stickCache.y;
      } else {
        x = app.state.smooth.x;
        y = app.state.smooth.y;

        if (enableSkew && !app.state.reducedMotion) {
          const { velocity } = app.state;
          const skew = effects.getVelocitySkew(velocity.x, velocity.y);
          
          rotation = skew.rotation;
          scaleX = skew.scaleX;
          scaleY = skew.scaleY;
        }
      }

      el.style.transform = `
        translate3d(${x}px, ${y}px, 0) 
        translate(-50%, -50%) 
        rotate(${rotation}deg) 
        scale(${scaleX}, ${scaleY})
      `;
    },

    destroy() {
      el.remove();
    }
  };
};