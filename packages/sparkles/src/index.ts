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
  
  const particles: HTMLDivElement[] = [];
  let tickCount = 0;

  return {
    name: 'sparkles',
    
    // No install needed (we create elements dynamically)

    update(app) {
      // 1. Throttling (Don't spawn every frame, maybe every 3rd frame)
      tickCount++;
      if (tickCount % 3 !== 0) return;

      // 2. Velocity Check (Only sparkle when moving fast)
      const vx = Math.abs(app.state.velocity.x);
      const vy = Math.abs(app.state.velocity.y);
      if ((vx + vy) < minVelocity) return;

      // 3. Create Particle
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
        transition: 'transform 0.6s ease-out, opacity 0.6s ease-out', // Fade out anim
        // Start at current raw mouse position
        transform: `translate3d(${app.state.client.x}px, ${app.state.client.y}px, 0)`
      });

      document.body.appendChild(p);
      particles.push(p);

      // 4. Animate Out (Next frame to allow CSS transition to trigger)
      requestAnimationFrame(() => {
        // Drift randomly
        const destX = app.state.client.x + (Math.random() - 0.5) * 30;
        const destY = app.state.client.y + (Math.random() - 0.5) * 30;
        
        p.style.transform = `translate3d(${destX}px, ${destY}px, 0) scale(0)`;
        p.style.opacity = '0';
      });

      // 5. Cleanup Old Particles
      if (particles.length > limit) {
        const old = particles.shift();
        old?.remove();
      }
    },

    destroy() {
      particles.forEach(p => p.remove());
    }
  };
};