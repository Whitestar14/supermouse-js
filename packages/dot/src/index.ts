import type { SupermousePlugin } from '@supermousejs/core';

export interface DotOptions {
  size?: number;
  color?: string;
  zIndex?: string;
}

export const Dot = (options: DotOptions = {}): SupermousePlugin => {
  let element: HTMLDivElement;
  const size = options.size || 8;
  const color = options.color || '#750c7e';

  return {
    name: 'dot',
    
    install(app) {      
      element = document.createElement('div');
      Object.assign(element.style, {
        boxSizing: 'border-box',
        position: 'fixed',
        top: '0', left: '0',
        width: `${size}px`, 
        height: `${size}px`,
        backgroundColor: color,
        borderRadius: '50%',
        pointerEvents: 'none',
        zIndex: options.zIndex || '9999',
        // Center using CSS
        transform: 'translate3d(-100px, -100px, 0) translate(-50%, -50%)',
        willChange: 'transform'
      });
      
      app.container.appendChild(element);
    },
    
    update(app) {
      const { x, y } = app.state.client;
      element.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
    },
    
    destroy() {
      element.remove();
    }
  };
};