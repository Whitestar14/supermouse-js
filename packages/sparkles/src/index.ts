import type { SupermousePlugin } from '@supermousejs/core';

export interface SparklesOptions {
  color?: string;
  maxParticles?: number;
  minVelocity?: number;
}

export const Sparkles = (options: SparklesOptions = {}): SupermousePlugin => {
  const color = options.color || '#ff00ff';
  const limit = options.maxParticles || 20;
  const minVelocity = options.minVelocity || 10;
  
  // Storage for particles
  let particles: HTMLDivElement[] = [];
  let tickCount = 0;

  return {
    name: 'sparkles',
    
    update(app) {
      tickCount++;
      // Throttle: Only spawn every 3rd frame
      if (tickCount % 3 !== 0) return;

      // Velocity Check
      const vx = Math.abs(app.state.velocity.x);
      const vy = Math.abs(app.state.velocity.y);
      if ((vx + vy) < minVelocity) return;

      // 1. Create Particle
      const p = document.createElement('div');
      const size = Math.random() * 3 + 2; // Random 2px - 5px
      
      Object.assign(p.style, {
        position: 'fixed',
        left: '0', top: '0',
        width: `${size}px`, height: `${size}px`,
        backgroundColor: color,
        borderRadius: '50%',
        pointerEvents: 'none',
        zIndex: '9997', // Behind ring
        opacity: '1',
        // Note: Duration matches the setTimeout below
        transition: 'transform 0.6s ease-out, opacity 0.6s ease-out', 
        transform: `translate3d(${app.state.client.x}px, ${app.state.client.y}px, 0)`
      });

      app.container.appendChild(p);
      particles.push(p);

      // 2. Animate Out (Next frame)
      requestAnimationFrame(() => {
        const destX = app.state.client.x + (Math.random() - 0.5) * 30;
        const destY = app.state.client.y + (Math.random() - 0.5) * 30;
        
        p.style.transform = `translate3d(${destX}px, ${destY}px, 0) scale(0)`;
        p.style.opacity = '0';
      });

      // 3. Cleanup: Remove from DOM after animation is done (600ms)
      setTimeout(() => {
        if (p.parentNode) p.remove();
        particles = particles.filter(item => item !== p);
      }, 600);

      // 4. Cleanup: Hard limit (if mouse moves too fast)
      if (particles.length > limit) {
        const old = particles.shift();
        old?.remove();
      }
    },

    destroy() {
      particles.forEach(p => p.remove());
      particles = [];
    }
  };
};