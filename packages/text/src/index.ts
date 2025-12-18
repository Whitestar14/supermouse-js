import type { SupermousePlugin } from '@supermousejs/core';

export interface TextOptions {
  color?: string;
  backgroundColor?: string;
}

export const Text = (options: TextOptions = {}): SupermousePlugin => {
  let el: HTMLDivElement;
  let textNode: HTMLSpanElement;

  return {
    name: 'text',

    install(app) {
      el = document.createElement('div');
      textNode = document.createElement('span');
      el.appendChild(textNode);

      Object.assign(el.style, {
        position: 'fixed',
        top: '0', left: '0',
        pointerEvents: 'none',
        zIndex: '10000', // Always on top
        opacity: '0',
        // Center using CSS (Standardized)
        transform: 'translate3d(-100px, -100px, 0) translate(-50%, -50%)',
        transition: 'opacity 0.2s ease', 
        // Typography
        color: options.color || 'white',
        fontSize: '12px',
        fontWeight: 'bold',
        fontFamily: 'sans-serif',
        textTransform: 'uppercase',
        letterSpacing: '1px',
        backgroundColor: options.backgroundColor || 'rgba(0,0,0,0.8)',
        padding: '4px 8px',
        borderRadius: '4px',
        whiteSpace: 'nowrap'
      });
      
      document.body.appendChild(el);
    },

    update(app) {
      const target = app.state.hoverTarget;
      
      // 1. Check for attribute
      const text = target?.getAttribute('data-cursor-text');

      // 2. Show/Hide based on state
      if (app.state.isHover && text) {
        textNode.innerText = text;
        el.style.opacity = '1';
        
        // 3. Position (Offset slightly below cursor so it's readable)
        const { x, y } = app.state.client;
        el.style.transform = `translate3d(${x}px, ${y + 24}px, 0) translate(-50%, -50%)`;
      } else {
        el.style.opacity = '0';
      }
    },

    destroy() {
      el.remove();
    }
  };
};