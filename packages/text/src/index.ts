import { type SupermousePlugin, dom, Layers, Easings } from '@supermousejs/core';

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
      el = dom.createDiv();
      textNode = document.createElement('span');
      el.appendChild(textNode);

      dom.applyStyles(el, {
        zIndex: Layers.OVERLAY,
        opacity: '0',
        transition: `opacity 0.2s ${Easings.SMOOTH}`,
        
        // Typography
        color: options.color || 'white',
        backgroundColor: options.backgroundColor || 'rgba(0,0,0,0.8)',
        fontSize: '12px',
        fontWeight: 'bold',
        fontFamily: 'sans-serif',
        textTransform: 'uppercase',
        letterSpacing: '1px',
        padding: '4px 8px',
        borderRadius: '4px',
        whiteSpace: 'nowrap'
      });
      
      // Initialize off-screen
      dom.setTransform(el, -100, -100);
      
      app.container.appendChild(el);
    },

    update(app) {
      const target = app.state.hoverTarget;
      const text = target?.getAttribute('data-cursor-text');

      if (app.state.isHover && text) {
        textNode.innerText = text;
        el.style.opacity = '1';
        
        const { x, y } = app.state.target;
        dom.setTransform(el, x, y + 24);
      } else {
        el.style.opacity = '0';
      }
    },

    destroy() {
      el.remove();
    }
  };
};