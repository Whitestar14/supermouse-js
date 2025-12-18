import type { SupermousePlugin } from '@supermousejs/core';

export interface RingOptions {
  size?: number;
  hoverSize?: number;
  color?: string;
  borderWidth?: number;
}

export const Ring = (options: RingOptions = {}): SupermousePlugin => {
  let el: HTMLDivElement;
  
  const baseSize = options.size || 20;
  const hoverSize = options.hoverSize || 40;
  const clickSize = baseSize * 0.8;
  const color = options.color || '#750c7e';
  const borderWidth = options.borderWidth || 2;

  return {
    name: 'ring',
    
    install(app) {
      el = document.createElement('div');
      Object.assign(el.style, {
        boxSizing: 'border-box',
        position: 'fixed',
        top: '0', left: '0',
        borderRadius: '50%',
        border: `${borderWidth}px solid ${color}`,
        pointerEvents: 'none',
        zIndex: '9998',
        transform: 'translate3d(-100px, -100px, 0) translate(-50%, -50%)', 
        transition: 'width 0.2s, height 0.2s, border-color 0.2s',
        willChange: 'transform, width, height'
      });
      document.body.appendChild(el);
    },

    update(app) {
      // 1. Determine Size
      let size = baseSize;
      if (app.state.isHover) size = hoverSize;
      if (app.state.isDown) size = baseSize * 0.8;

      // 2. Apply Size
      el.style.width = `${size}px`;
      el.style.height = `${size}px`;

      const { x, y } = app.state.smooth;
      el.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
    },

    destroy() {
      el.remove();
    }
  };
};