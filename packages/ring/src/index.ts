import { type SupermousePlugin, dom, math, Layers } from '@supermousejs/core';

export interface RingOptions {
  size?: number;
  hoverSize?: number;
  color?: string;
  borderWidth?: number;
  enableSkew?: boolean;
}

export const Ring = (options: RingOptions = {}): SupermousePlugin => {
  let el: HTMLDivElement;
  
  const baseSize = options.size || 20;
  const hoverSize = options.hoverSize || 40;
  const color = options.color || '#750c7e';
  const borderWidth = options.borderWidth || 2;
  const enableSkew = options.enableSkew || false;

  let currentSize = baseSize;

  return {
    name: 'ring',
    
    install(app) {
      el = dom.createCircle(baseSize, 'transparent');
      dom.applyStyles(el, {
        border: `${borderWidth}px solid ${color}`,
        zIndex: Layers.FOLLOWER,
        transition: 'border-color 0.2s ease' 
      });
      app.container.appendChild(el);
    },

    update(app) {
      // 1. Sizing
      let targetSize = app.state.isHover ? hoverSize : baseSize;
      if (app.state.isDown) targetSize *= 0.8;

      currentSize = math.lerp(currentSize, targetSize, 0.2); 
      
      el.style.width = `${currentSize}px`;
      el.style.height = `${currentSize}px`;

      // 2. Transform & Skew
      const { x, y } = app.state.smooth;
      let scaleX = 1;
      let scaleY = 1;
      let rotation = 0;

      if (enableSkew) {
        const vx = app.state.velocity.x;
        const vy = app.state.velocity.y;
        
        const speed = math.dist(vx, vy);
        
        if (speed > 0.1) {
            rotation = math.angle(vx, vy);
            
            const stretch = math.clamp(speed * 0.005, 0, 0.5); 
            
            scaleX = 1 + stretch;
            scaleY = 1 - stretch * 0.5;
        }
      }

      // Manual transform string is still best for complex compositing
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