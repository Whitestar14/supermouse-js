import type { SupermousePlugin } from '@supermousejs/core';

export const Sparkles = (options: { color?: string, maxParticles?: number } = {}): SupermousePlugin => {
  const color = options.color || '#ff00ff';
  const limit = options.maxParticles || 20;
  
  // Storage for particles
  const particles: HTMLDivElement[] = [];
  let tickCount = 0;

  return {
    name: 'sparkles',
    
    // No install needed (we create elements on the fly)

    update(app) {
      // 1. Limit creation rate (every 3rd frame) to prevent DOM overload
      tickCount++;
      if (tickCount % 3 !== 0) return;

      // 2. Only create sparkles if moving fast enough
      const vel = Math.abs(app.state.velocity.x) + Math.abs(app.state.velocity.y);
      if (vel < 2) return;

      // 3. Create Particle
      const p = document.createElement('div');
      const size = Math.random() * 4 + 2; // Random size 2px-6px
      
      Object.assign(p.style, {
        position: 'fixed',
        left: '0', top: '0',
        width: `${size}px`, height: `${size}px`,
        backgroundColor: color,
        borderRadius: '50%',
        pointerEvents: 'none',
        zIndex: '9997', // Behind ring
        opacity: '1',
        transition: 'transform 0.5s, opacity 0.5s', // Fade out anim
        // Start at current mouse pos
        transform: `translate3d(${app.state.client.x}px, ${app.state.client.y}px, 0)`
      });

      document.body.appendChild(p);
      particles.push(p);

      // 4. Animate Out (Next frame)
      requestAnimationFrame(() => {
        // Random drift direction
        const destX = app.state.client.x + (Math.random() - 0.5) * 20;
        const destY = app.state.client.y + (Math.random() - 0.5) * 20;
        
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