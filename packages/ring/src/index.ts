import { type SupermousePlugin, dom, Layers, Easings } from '@supermousejs/core';

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
  const color = options.color || '#750c7e';
  const borderWidth = options.borderWidth || 2;

  return {
    name: 'ring',
    
    install(app) {
      el = dom.createCircle(baseSize, 'transparent');
      
      dom.applyStyles(el, {
        border: `${borderWidth}px solid ${color}`,
        zIndex: Layers.FOLLOWER,
        transition: `width 0.2s ${Easings.EASE_OUT_EXPO}, height 0.2s ${Easings.EASE_OUT_EXPO}`
      });
      
      app.container.appendChild(el);
    },

    update(app) {
      let targetSize = app.state.isHover ? hoverSize : baseSize;
      if (app.state.isDown) targetSize *= 0.8;

      el.style.width = `${targetSize}px`;
      el.style.height = `${targetSize}px`;

      const { x, y } = app.state.smooth;
      dom.setTransform(el, x, y);
    },

    destroy() {
      el.remove();
    }
  };
};