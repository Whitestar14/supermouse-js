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
    name: 'builtin-dot',
    
    install(app) {
      document.body.style.cursor = 'none';
      
      element = document.createElement('div');
      Object.assign(element.style, {
        position: 'fixed',
        top: '0', left: '0',
        width: `${size}px`, height: `${size}px`,
        backgroundColor: color,
        borderRadius: '50%',
        pointerEvents: 'none',
        zIndex: options.zIndex || '9999',
        transform: 'translate3d(-100px, -100px, 0)',
        willChange: 'transform'
      });
      document.body.appendChild(element);
    },
    
    update(app) {
      // Follow RAW client position
      const { x, y } = app.state.client;
      const offset = size / 2;
      element.style.transform = `translate3d(${x - offset}px, ${y - offset}px, 0)`;
    },
    
    destroy() {
      document.body.style.cursor = '';
      element.remove();
    }
  };
};