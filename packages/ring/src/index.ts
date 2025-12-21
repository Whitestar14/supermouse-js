
import { definePlugin, dom, math, effects, Layers, normalize, type ValueOrGetter } from '@supermousejs/core';

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

  // Normalized Getters
  const getSize = normalize(options.size, defSize);
  const getHoverSize = normalize(options.hoverSize, defHoverSize);
  const getColor = normalize(options.color, defColor);
  const getFill = normalize(options.fill, defFill);
  const getBorder = normalize(options.borderWidth, defBorder);

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
      const el = dom.createCircle(getSize(app.state), getFill(app.state));
      if (options.className) el.classList.add(...options.className.split(' '));
      
      dom.applyStyles(el, {
        borderWidth: `${getBorder(app.state)}px`,
        borderStyle: 'solid',
        borderColor: getColor(app.state),
        zIndex: Layers.FOLLOWER,
        mixBlendMode: mixBlendMode,
        transition: 'opacity 0.2s ease'
      });
      
      app.registerHoverTarget('[data-supermouse-stick]');
      return el;
    },

    styles: {
      fill: 'backgroundColor'
    },

    update: (app, el) => {
      const baseSize = getSize(app.state);
      const hoverSize = getHoverSize(app.state);
      const border = getBorder(app.state);
      let color = getColor(app.state);

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

      dom.setStyle(el, 'borderColor', color);
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
