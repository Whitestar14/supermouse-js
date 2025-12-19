
import { type SupermousePlugin, dom, math, effects, Layers, resolve, type ValueOrGetter } from '@supermousejs/core';

export interface RingOptions {
  size?: ValueOrGetter<number>;
  hoverSize?: ValueOrGetter<number>;
  color?: ValueOrGetter<string>;
  borderWidth?: ValueOrGetter<number>;
  mixBlendMode?: string;
  enableSkew?: boolean;
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

  // Smoothing State
  let currentW = defSize;
  let currentH = defSize;
  let currentRot = 0;
  let currentScaleX = 1;
  let currentScaleY = 1;
  let currentRadius = 50;
  
  // Position State
  let lx = 0;
  let ly = 0;
  let hasInit = false;

  return {
    name: 'ring',
    isEnabled: true,
    
    install(app) {
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
        transition: 'opacity 0.2s ease',
        willChange: 'transform, width, height, border-radius'
      });
      
      app.registerHoverTarget('[data-supermouse-color]');
      
      app.container.appendChild(el);
    },

    update(app) {
      const baseSize = resolve(options.size, app.state, defSize);
      const hoverSize = resolve(options.hoverSize, app.state, defHoverSize);
      let color = resolve(options.color, app.state, defColor);
      const border = resolve(options.borderWidth, app.state, defBorder);

      const target = app.state.hoverTarget;

      let targetW = baseSize;
      let targetH = baseSize;
      let targetRadius = 50; 
      let targetRot = 0;
      let targetScaleX = 1;
      let targetScaleY = 1;

      // --- FREE / HOVER STATE ---
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

      const targetX = app.state.smooth.x;
      const targetY = app.state.smooth.y;

      // Calculate Skew
      if (enableSkew && !app.state.reducedMotion) {
        const { velocity } = app.state;
        const skew = effects.getVelocitySkew(velocity.x, velocity.y);
        targetRot = skew.rotation;
        targetScaleX = skew.scaleX;
        targetScaleY = skew.scaleY;
      }

      // 2. Interpolate
      const lerpFactor = 0.15;

      currentW = math.lerp(currentW, targetW, lerpFactor);
      currentH = math.lerp(currentH, targetH, lerpFactor);
      
      const destRadiusPx = targetW / 2;
      currentRadius = math.lerp(currentRadius, destRadiusPx, lerpFactor);

      if (!hasInit) {
        lx = targetX;
        ly = targetY;
        hasInit = true;
      } else {
        lx = math.lerp(lx, targetX, lerpFactor);
        ly = math.lerp(ly, targetY, lerpFactor);
      }

      currentRot = math.lerp(currentRot, targetRot, lerpFactor);
      currentScaleX = math.lerp(currentScaleX, targetScaleX, lerpFactor);
      currentScaleY = math.lerp(currentScaleY, targetScaleY, lerpFactor);

      // 3. Apply
      el.style.width = `${currentW}px`;
      el.style.height = `${currentH}px`;
      el.style.borderColor = color;
      el.style.borderWidth = `${border}px`;
      el.style.borderRadius = `${currentRadius}px`;
      el.style.opacity = '1';

      dom.setTransform(el, lx, ly, currentRot, currentScaleX, currentScaleY);
    },

    onDisable() { el.style.opacity = '0'; },
    onEnable() { el.style.opacity = '1'; },
    destroy() { el.remove(); }
  };
};
