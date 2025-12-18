import type { SupermousePlugin } from '@supermousejs/core';

export interface RingOptions {
  size?: number;
  hoverSize?: number;
  color?: string;
  borderWidth?: number;
}

export const Ring = (options: RingOptions = {}): SupermousePlugin => {
  let element: HTMLDivElement;
  
  const baseSize = options.size || 20;
  const hoverSize = options.hoverSize || 40;
  const color = options.color || '#750c7e';
  const borderWidth = options.borderWidth || 2;

  return {
    name: 'ring',
    
    install(app) {
      element = document.createElement('div');
      Object.assign(element.style, {
        boxSizing: 'border-box',
        position: 'fixed',
        top: '0', left: '0',
        borderRadius: '50%',
        border: `${borderWidth}px solid ${color}`,
        pointerEvents: 'none',
        zIndex: '9998',
        // Start offscreen
        transform: 'translate3d(-100px, -100px, 0) translate(-50%, -50%)', 
        transition: 'width 0.2s, height 0.2s, border-color 0.2s',
        willChange: 'transform, width, height'
      });
      
      app.container.appendChild(element);
    },

    update(app) {
      // 1. Calculate Size
      let targetSize = app.state.isHover ? hoverSize : baseSize;

      // Shrink on click (relative to current state)
      if (app.state.isDown) {
        targetSize *= 0.8; 
      }

      // 2. Apply Size
      element.style.width = `${targetSize}px`;
      element.style.height = `${targetSize}px`;

      // 3. Move (Use Smooth coordinates)
      const { x, y } = app.state.smooth;
      element.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
    },

    destroy() {
      element.remove();
    }
  };
};