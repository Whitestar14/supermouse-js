import { type SupermousePlugin, dom, math, Layers, Easings } from '@supermousejs/core';

export interface ImageOptions {
  className?: string;
  offset?: [number, number];
  duration?: number;
  smoothness?: number;
}

export const Image = (options: ImageOptions = {}): SupermousePlugin => {
  let container: HTMLDivElement;
  let img: HTMLImageElement;
  
  const className = options.className || 'supermouse-image';
  const [offX, offY] = options.offset || [0, 30];
  const duration = options.duration || 200;
  const smoothness = options.smoothness || 1;

  let lastSrc: string | null = null;
  let isVisible = false;
  let lx = 0;
  let ly = 0;

  return {
    name: 'image',
    isEnabled: true,

    install(app) {
      container = dom.createDiv();
      container.classList.add(className);
      
      img = document.createElement('img');
      dom.applyStyles(img, {
        width: '100%', height: '100%', objectFit: 'cover', display: 'block'
      });
      container.appendChild(img);

      dom.applyStyles(container, {
        zIndex: Layers.OVERLAY,
        opacity: '0',
        overflow: 'hidden',
        transition: `opacity ${duration}ms ${Easings.SMOOTH}`,
        width: '150px', height: 'auto',
        willChange: 'transform, opacity' 
      });

      dom.setTransform(container, -100, -100);

      app.registerHoverTarget('[data-supermouse-img]');      
      app.container.appendChild(container);
    },

    update(app) {
      const target = app.state.hoverTarget;
      const src = target?.getAttribute('data-supermouse-img');

      if (app.state.isHover && src) {
        if (src !== lastSrc) {
          img.src = src;
          lastSrc = src;
        }
        
        container.style.opacity = '1';
        
        const targetX = app.state.pointer.x + offX;
        const targetY = app.state.pointer.y + offY;

        if (!isVisible) {
          lx = targetX;
          ly = targetY;
          isVisible = true;
        } else {
          lx = math.lerp(lx, targetX, smoothness);
          ly = math.lerp(ly, targetY, smoothness);
        }
        
        dom.setTransform(container, lx, ly);

      } else {
        container.style.opacity = '0';
        isVisible = false;
      }
    },

    onDisable() { container.style.opacity = '0'; },
    onEnable() { /* Update loop will handle */ },
    destroy() { container.remove(); }
  };
};