import { type SupermousePlugin, dom, math, effects, Layers, resolve, type ValueOrGetter } from '@supermousejs/core';

export interface RingOptions {
  size?: ValueOrGetter<number>;
  hoverSize?: ValueOrGetter<number>;
  color?: ValueOrGetter<string>;
  borderWidth?: ValueOrGetter<number>;
  
  mixBlendMode?: string;
  enableSkew?: boolean;
  enableStick?: boolean;
  stickPadding?: number;
}

export const Ring = (options: RingOptions = {}): SupermousePlugin => {
  let el: HTMLDivElement;
  
  // Defaults
  const defSize = 20;
  const defHoverSize = 40;
  const defColor = '#ffffff';
  const defBorder = 2;
  
  const mixBlendMode = options.mixBlendMode || 'difference';
  const enableSkew = options.enableSkew ?? false;
  const enableStick = options.enableStick ?? true;
  const stickPadding = options.stickPadding || 10;

  // State
  let currentW = defSize;
  let currentH = defSize;
  let currentRot = 0;
  let currentScaleX = 1;
  let currentScaleY = 1;
  
  let lastTarget: HTMLElement | null = null;
  let stickCache: ReturnType<typeof effects.getStickyDimensions> | null = null;

  return {
    name: 'ring',
    isEnabled: true,
    
    install(app) {
      // Init styles
      const size = resolve(options.size, app.state, defSize);
      const color = resolve(options.color, app.state, defColor);
      const border = resolve(options.borderWidth, app.state, defBorder);

      el = dom.createCircle(size, 'transparent');
      dom.applyStyles(el, {
        borderWidth: `${border}px`,
        borderStyle: 'solid',
        borderColor: color,
        zIndex: Layers.FOLLOWER,
        mixBlendMode: mixBlendMode,
        transition: 'opacity 0.2s ease' // Only opacity is CSS transitioned
      });
      
      app.registerHoverTarget('[data-supermouse-stick]');
      app.registerHoverTarget('[data-supermouse-color]');
      
      app.container.appendChild(el);
    },

    update(app) {
      // 1. Resolve Dynamic Options
      const baseSize = resolve(options.size, app.state, defSize);
      const hoverSize = resolve(options.hoverSize, app.state, defHoverSize);
      let color = resolve(options.color, app.state, defColor);
      const border = resolve(options.borderWidth, app.state, defBorder);

      const target = app.state.hoverTarget;
      let targetW = baseSize;
      let targetH = baseSize;
      let targetRadius = 50;
      let isStuck = false;

      // 2. Logic (Stick vs Hover)
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
        if (lastTarget) { lastTarget = null; stickCache = null; }
        
        if (target && target.hasAttribute('data-supermouse-color')) {
             color = target.getAttribute('data-supermouse-color')!;
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

      // 3. Apply Props
      el.style.borderColor = color;
      el.style.borderWidth = `${border}px`;

      // 4. Animate Geom
      currentW = math.lerp(currentW, targetW, 0.2);
      currentH = math.lerp(currentH, targetH, 0.2);

      el.style.width = `${currentW}px`;
      el.style.height = `${currentH}px`;
      el.style.borderRadius = isStuck ? `${targetRadius}px` : '50%';

      // 5. Position & Skew
      let x, y;
      let targetRot = 0;
      let targetScaleX = 1;
      let targetScaleY = 1;

      if (isStuck && stickCache) {
        x = stickCache.x;
        y = stickCache.y;
        
        // Immediate reset if stuck
        currentRot = 0;
        currentScaleX = math.lerp(currentScaleX, 1, 0.2);
        currentScaleY = math.lerp(currentScaleY, 1, 0.2);
      } else {
        x = app.state.smooth.x;
        y = app.state.smooth.y;

        if (enableSkew && !app.state.reducedMotion) {
          const { velocity } = app.state;
          const skew = effects.getVelocitySkew(velocity.x, velocity.y);
          targetRot = skew.rotation;
          targetScaleX = skew.scaleX;
          targetScaleY = skew.scaleY;
        }
        
        currentRot = math.lerp(currentRot, targetRot, 0.15);
        currentScaleX = math.lerp(currentScaleX, targetScaleX, 0.15);
        currentScaleY = math.lerp(currentScaleY, targetScaleY, 0.15);
      }

      // 6. Ensure Visible
      el.style.opacity = '1';

      dom.setTransform(el, x, y, currentRot, currentScaleX, currentScaleY);
    },

    onDisable() {
      el.style.opacity = '0';
    },
    
    onEnable() {
      el.style.opacity = '1';
    },

    destroy() {
      el.remove();
    }
  };
};