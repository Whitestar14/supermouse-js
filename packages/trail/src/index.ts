import type { ValueOrGetter } from '@supermousejs/core';
import { definePlugin, normalize, dom, Layers } from '@supermousejs/utils';

export interface TrailOptions {
  name?: string;
  isEnabled?: boolean;
  length?: number;
  size?: ValueOrGetter<number>;
  color?: ValueOrGetter<string>;
}

export const Trail = (options: TrailOptions = {}) => {
  const length = options.length || 10;
  const getSize = normalize(options.size, 6);
  const getColor = normalize(options.color, '#ff00ff');
  
  const segments: HTMLDivElement[] = [];
  const history: { x: number, y: number }[] = [];

  return definePlugin<HTMLDivElement, TrailOptions>({
    name: options.name || 'trail',
    
    create: (app) => {
      const container = dom.createActor('div') as HTMLDivElement;
      container.style.zIndex = Layers.TRACE;
      
      for(let i=0; i<length; i++) {
        const d = dom.createCircle(0, '#000');
        d.style.position = 'absolute';
        d.style.opacity = String(1 - (i / length));
        container.appendChild(d);
        segments.push(d);
        history.push({ x: -100, y: -100 });
      }
      return container;
    },

    update: (app) => {
      const { x, y } = app.state.smooth;
      
      // Shift history
      history.pop();
      history.unshift({ x, y });
      
      const baseSize = getSize(app.state);
      const color = getColor(app.state);

      segments.forEach((seg, i) => {
        const pos = history[i];
        const scale = 1 - (i / length);
        const size = baseSize * scale;
        
        dom.setStyle(seg, 'width', `${size}px`);
        dom.setStyle(seg, 'height', `${size}px`);
        dom.setStyle(seg, 'backgroundColor', color);
        
        dom.setTransform(seg, pos.x, pos.y);
      });
    }
  }, options);
};