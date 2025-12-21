
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
  /** @deprecated Use @supermousejs/stick plugin instead. */
  enableStick?: boolean;
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

  const getSize = normalize(options.size, defSize);
  const getHoverSize = normalize(options.hoverSize, defHoverSize);
  const getColor = normalize(options.color, defColor);
  const getFill = normalize(options.fill, defFill);
  const getBorder = normalize(options.borderWidth, defBorder);

  let currentW = defSize;
  let currentH = defSize;
  
  // NEW: Track Rotation instead of Skew
  let currentRot = 0;
  let currentScaleX = 1;
  let currentScaleY = 1;

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
        transition: 'opacity 0.2s ease, border-radius 0.2s ease'
      });
      
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
      const shape = app.state.shape; // Sticky State
      
      let targetW = baseSize;
      let targetH = baseSize;
      
      // --- GEOMETRY ---
      
      if (shape) {
        targetW = shape.width;
        targetH = shape.height;
        dom.setStyle(el, 'borderRadius', `${shape.borderRadius}px`);
      } else {
        dom.setStyle(el, 'borderRadius', '50%');

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

      currentW = math.lerp(currentW, targetW, 0.2);
      currentH = math.lerp(currentH, targetH, 0.2);

      dom.setStyle(el, 'width', `${currentW}px`);
      dom.setStyle(el, 'height', `${currentH}px`);

      // --- POSITION & DISTORTION ---
      
      const x = app.state.smooth.x;
      const y = app.state.smooth.y;
      
      let targetRot = 0;
      let targetScaleX = 1;
      let targetScaleY = 1;

      if (shape) {
        // Stuck: Reset transform immediately for clean morph
        targetRot = 0;
        targetScaleX = 1;
        targetScaleY = 1;
        
        currentRot = 0; 
      } 
      else if (enableSkew && !app.state.reducedMotion) {
        // Moving Freely: Apply Distortion
        const { velocity } = app.state;
        const distortion = effects.getVelocityDistortion(velocity.x, velocity.y);
        
        targetRot = distortion.rotation;
        targetScaleX = distortion.scaleX;
        targetScaleY = distortion.scaleY;
      }

      // Smooth Interpolation for Transform
      // (Except rotation if stuck, handled above)
      if (!shape) {
        currentRot = math.lerp(currentRot, targetRot, 0.15);
      }
      
      currentScaleX = math.lerp(currentScaleX, targetScaleX, 0.15);
      currentScaleY = math.lerp(currentScaleY, targetScaleY, 0.15);

      // Render
      dom.setTransform(el, x, y, currentRot, currentScaleX, currentScaleY);
    }
  }, options);
};
