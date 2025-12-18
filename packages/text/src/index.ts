import type { SupermousePlugin } from '@supermousejs/core';

export const Text = (): SupermousePlugin => {
  let el: HTMLDivElement;
  let textNode: HTMLSpanElement;

  return {
    name: 'text-label',

    install() {
      el = document.createElement('div');
      textNode = document.createElement('span');
      el.appendChild(textNode);

      Object.assign(el.style, {
        position: 'fixed',
        top: '0', left: '0',
        pointerEvents: 'none',
        zIndex: '10000',
        opacity: '0',
        transform: 'translate3d(-100px, -100px, 0) translate(-50%, -50%)',
        transition: 'opacity 0.2s, transform 0.1s', // Smooth fade
        // Typography
        color: 'white',
        fontSize: '12px',
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: '1px',
        backgroundColor: 'rgba(0,0,0,0.8)',
        padding: '4px 8px',
        borderRadius: '4px',
        whiteSpace: 'nowrap'
      });
      
      document.body.appendChild(el);
    },

    update(app) {
      const target = app.state.hoverTarget;
      
      // Check if the hovered element has specific text
      const text = target?.getAttribute('data-cursor-text');

      if (app.state.isHover && text) {
        textNode.innerText = text;
        el.style.opacity = '1';
        
        // Offset it slightly below the cursor so it doesn't overlap the Ring
        const { x, y } = app.state.client;
        el.style.transform = `translate3d(${x}px, ${y + 20}px, 0) translate(-50%, -50%)`;
      } else {
        el.style.opacity = '0';
      }
    },

    destroy() {
      el.remove();
    }
  };
};