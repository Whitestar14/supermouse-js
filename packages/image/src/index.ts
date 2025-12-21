
import { definePlugin, dom, math, Layers, Easings } from '@supermousejs/core';

export interface ImageOptions {
  name?: string;
  isEnabled?: boolean;
  className?: string;
  offset?: [number, number];
  duration?: number;
  smoothness?: number;
}

export const Image = (options: ImageOptions = {}) => {
  const className = options.className || 'supermouse-image';
  const [offX, offY] = options.offset || [0, 30];
  const duration = options.duration || 200;
  const smoothness = options.smoothness || 1;

  let img: HTMLImageElement;
  let lastSrc: string | null = null;
  let isVisible = false;
  let lx = 0;
  let ly = 0;

  return definePlugin<HTMLDivElement, ImageOptions>({
    name: 'image',
    selector: '[data-supermouse-img]',

    create: (app) => {
      const container = dom.createActor('div') as HTMLDivElement;
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
        width: '150px', height: 'auto'
      });

      dom.setTransform(container, -100, -100);
      return container;
    },

    update: (app, container) => {
      // Use parsed interaction data
      const src = app.state.interaction.img;

      if (app.state.isHover && src) {
        if (src !== lastSrc) {
          img.src = src;
          lastSrc = src;
        }
        
        dom.setStyle(container, 'opacity', '1');
        
        const targetX = app.state.pointer.x + offX;
        const targetY = app.state.pointer.y + offY;

        // Reset position on first appearance to prevent flying in
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
        dom.setStyle(container, 'opacity', '0');
        isVisible = false;
      }
    }
  }, options);
};
