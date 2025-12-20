import { definePlugin, dom, math, effects, Layers, resolve, type ValueOrGetter } from '@supermousejs/core';

export interface RingOptions {
  name?: string;
  isEnabled?: boolean;
  size?: ValueOrGetter<number>;
  hoverSize?: ValueOrGetter<number>;
  color?: ValueOrGetter<string>;
  fill?: ValueOrGetter<string>;
  borderWidth?: ValueOrGetter<number>;
  mixBlendMode?: string;
  enableSkew?: boolean;
  enableStick?: boolean;
  stickPadding?: number;
  className?: string;
}

export const Ring = (options: RingOptions = {}) => {
  const defSize = 20;
  const defHoverSize = 40;
  const defColor = '#ffffff';
  const defFill = 'transparent';
  const defBorder = 2;
  
  const mixBlendMode = options.mixBlendMode || 'difference';
  const enableSkew = options.enableSkew ?? false;
  const enableStick = options.enableStick ?? true;
  const stickPadding = options.stickPadding || 10;

  let currentW = defSize;
  let currentH = defSize;
  let currentRot = 0;
  let currentScaleX = 1;
  let currentScaleY = 1;
  
  let lastTarget: HTMLElement | null = null;
  let stickCache: ReturnType<typeof effects.getStickyDimensions> | null = null;

  return definePlugin<HTMLDivElement, RingOptions>({
    name: 'ring',
    selector: '[data-supermouse-color]',

    create: (app) => {
      const size = resolve(options.size, app.state, defSize);
      const color = resolve(options.color, app.state, defColor);
      const fill = resolve(options.fill, app.state, defFill);
      const border = resolve(options.borderWidth, app.state, defBorder);

      const el = dom.createCircle(size, fill);
      if (options.className) el.classList.add(...options.className.split(' '));
      
      dom.applyStyles(el, {
        borderWidth: `${border}px`,
        borderStyle: 'solid',
        borderColor: color,
        zIndex: Layers.FOLLOWER,
        mixBlendMode: mixBlendMode,
        transition: 'opacity 0.2s ease'
      });
      
      app.registerHoverTarget('[data-supermouse-stick]');
      return el;
    },

    styles: {
      color: 'borderColor',
      fill: 'backgroundColor'
    },

    update: (app, el) => {
      const baseSize = resolve(options.size, app.state, defSize);
      const hoverSize = resolve(options.hoverSize, app.state, defHoverSize);
      const border = resolve(options.borderWidth, app.state, defBorder);

      const target = app.state.hoverTarget;
      let targetW = baseSize;
      let targetH = baseSize;
      let targetRadius = 50;
      let isStuck = false;

      // Stick Logic
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
        
        // Attribute Override
        if (target && target.hasAttribute('data-supermouse-color')) {
             const override = target.getAttribute('data-supermouse-color')!;
             dom.setStyle(el, 'borderColor', override);
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

      dom.setStyle(el, 'borderWidth', `${border}px`);

      // Animate Geometry
      currentW = math.lerp(currentW, targetW, 0.2);
      currentH = math.lerp(currentH, targetH, 0.2);

      dom.setStyle(el, 'width', `${currentW}px`);
      dom.setStyle(el, 'height', `${currentH}px`);
      dom.setStyle(el, 'borderRadius', isStuck ? `${targetRadius}px` : '50%');

      // Position & Skew
      let x, y;
      let targetRot = 0;
      let targetScaleX = 1;
      let targetScaleY = 1;

      if (isStuck && stickCache) {
        x = stickCache.x;
        y = stickCache.y;
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

      dom.setTransform(el, x, y, currentRot, currentScaleX, currentScaleY);
    }
  }, options);
};