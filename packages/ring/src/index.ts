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

  // State
  let currentW = baseSize;
  let currentH = baseSize;
  let currentRot = 0;
  let currentScaleX = 1;
  let currentScaleY = 1;
  
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
      
      app.registerHoverTarget('[data-supermouse-stick]');
      app.registerHoverTarget('[data-supermouse-color]');
      
      app.container.appendChild(el);
    },

    update(app) {
      const target = app.state.hoverTarget;
      
      let targetW = baseSize;
      let targetH = baseSize;
      let targetRadius = 50;
      let isStuck = false;

      // 1. Determine Logic (Fixed Logic check)
      if (enableStick && target && target.hasAttribute('data-supermouse-stick')) {
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
        
        if (target && target.hasAttribute('data-supermouse-color')) {
             el.style.borderColor = target.getAttribute('data-supermouse-color')!;
        } else {
             el.style.borderColor = color;
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

      // 2. Animate Shape
      currentW = math.lerp(currentW, targetW, 0.2);
      currentH = math.lerp(currentH, targetH, 0.2);

      el.style.width = `${currentW}px`;
      el.style.height = `${currentH}px`;
      el.style.borderRadius = isStuck ? `${targetRadius}px` : '50%';

      let targetRot = 0;
      let targetScaleX = 1;
      let targetScaleY = 1;

      if (enableSkew && !app.state.reducedMotion && !isStuck) {
        const { velocity } = app.state;
        const skew = effects.getVelocitySkew(velocity.x, velocity.y);
        
        targetRot = skew.rotation;
        targetScaleX = skew.scaleX;
        targetScaleY = skew.scaleY;
      }

      if (isStuck) {
        currentRot = 0; 
        currentScaleX = math.lerp(currentScaleX, 1, 0.15);
        currentScaleY = math.lerp(currentScaleY, 1, 0.15);
      } else {
        currentRot = math.lerp(currentRot, targetRot, 0.15);
        currentScaleX = math.lerp(currentScaleX, targetScaleX, 0.15);
        currentScaleY = math.lerp(currentScaleY, targetScaleY, 0.15);
      }

      // 5. Position & Render (Using Utils)
      let x, y;
      
      if (isStuck && stickCache) {
        x = stickCache.x;
        y = stickCache.y;
      } else {
        x = app.state.smooth.x;
        y = app.state.smooth.y;
      }

      dom.setTransform(el, x, y, currentRot, currentScaleX, currentScaleY);
    },

    destroy() {
      el.remove();
    }
  };
};