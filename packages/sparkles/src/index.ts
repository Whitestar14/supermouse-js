import { type SupermousePlugin, dom, math, Layers, Easings, resolve, type ValueOrGetter } from '@supermousejs/core';

export interface SparklesOptions {
  color?: ValueOrGetter<string>;
  maxParticles?: number;
  minVelocity?: number;
}

export const Sparkles = (options: SparklesOptions = {}): SupermousePlugin => {
  const defColor = '#ff00ff';
  const limit = options.maxParticles || 20;
  const minVelocity = options.minVelocity || 10;
  
  let particles: HTMLDivElement[] = [];
  let tickCount = 0;

  return {
    name: 'sparkles',
    isEnabled: true,
    
    update(app) {
      tickCount++;
      if (tickCount % 3 !== 0) return;

      const vx = Math.abs(app.state.velocity.x);
      const vy = Math.abs(app.state.velocity.y);
      if ((vx + vy) < minVelocity) return;

      // Resolve Color dynamically
      const color = resolve(options.color, app.state, defColor);
      const size = math.random(2, 5);

      const p = dom.createCircle(size, color);
      
      dom.applyStyles(p, {
        zIndex: Layers.TRACE,
        transition: `transform 0.6s ${Easings.SMOOTH}, opacity 0.6s ${Easings.SMOOTH}`
      });
      
      const startX = app.state.pointer.x;
      const startY = app.state.pointer.y;
      dom.setTransform(p, startX, startY);

      app.container.appendChild(p);
      particles.push(p);

      requestAnimationFrame(() => {
        const destX = startX + math.random(-15, 15);
        const destY = startY + math.random(-15, 15);
        dom.setTransform(p, destX, destY, 0, 0, 0);
        p.style.opacity = '0';
      });

      setTimeout(() => {
        if (p.parentNode) p.remove();
        particles = particles.filter(item => item !== p);
      }, 600);

      if (particles.length > limit) {
        const old = particles.shift();
        old?.remove();
      }
    },

    onDisable() {
      particles.forEach(p => p.remove());
      particles = [];
    },

    destroy() {
      particles.forEach(p => p.remove());
      particles = [];
    }
  };
};