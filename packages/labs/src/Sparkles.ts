import {
  definePlugin,
  dom,
  math,
  Layers,
  normalize,
  type ValueOrGetter,
} from "@supermousejs/core";

export interface SparklesOptions {
  name?: string;
  isEnabled?: boolean;
  color?: ValueOrGetter<string>;
  /** Number of particles to keep in the pool. Default 30. */
  count?: number;
  /** How fast particles fade out (0.01 - 0.1). Default 0.05. */
  decay?: number;
  /** Pixels of movement required to spawn a particle. Lower = denser trail. Default 10. */
  frequency?: number;
  /** Random position offset for spawning. Default 5. */
  scatter?: number;
}

interface Particle {
  el: HTMLDivElement;
  isActive: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number; // 0.0 to 1.0
  scale: number;
  color: string;
}

export const Sparkles = (options: SparklesOptions = {}) => {
  const poolSize = options.count || 30;
  const decayRate = options.decay || 0.05;
  const frequency = options.frequency || 10;
  const scatter = options.scatter || 5;

  const defColor = "#ff00ff";
  const getColor = normalize(options.color, defColor);

  const pool: Particle[] = [];

  // Track previous position for interpolation
  let lx = 0;
  let ly = 0;
  let hasMoved = false;
  let accumulatedDist = 0;

  const activateParticle = (x: number, y: number, color: string) => {
    const p = pool.find((item) => !item.isActive);
    if (!p) return;

    p.isActive = true;
    p.life = 1.0;

    // Spawn with slight scatter around the calculated point
    p.x = x + math.random(-scatter, scatter);
    p.y = y + math.random(-scatter, scatter);

    // Pure radial burst
    const angle = math.random(0, Math.PI * 2);
    const speed = math.random(0.5, 1.5);
    p.vx = Math.cos(angle) * speed;
    p.vy = Math.sin(angle) * speed;

    p.scale = math.random(0.5, 1.2);
    p.color = color;

    // Apply immediate visual updates
    const size = math.random(2, 5);
    dom.setStyle(p.el, "width", `${size}px`);
    dom.setStyle(p.el, "height", `${size}px`);
    dom.setStyle(p.el, "backgroundColor", color);
    dom.setStyle(p.el, "opacity", "1");
    dom.setTransform(p.el, p.x, p.y, 0, p.scale, p.scale);
  };

  return definePlugin(
    {
      name: options.name || "sparkles",

      install(app) {
        for (let i = 0; i < poolSize; i++) {
          const el = dom.createCircle(0, "transparent");
          dom.applyStyles(el, {
            zIndex: Layers.TRACE,
            opacity: "0",
            willChange: "transform, opacity",
            transition: "none",
          });
          app.container.appendChild(el);
          pool.push({
            el,
            isActive: false,
            x: 0,
            y: 0,
            vx: 0,
            vy: 0,
            life: 0,
            scale: 1,
            color: "",
          });
        }
      },

      update(app) {
        const { x: cx, y: cy } = app.state.pointer;

        // --- 1. SPAWN LOGIC (Interpolated) ---
        if (!hasMoved) {
          lx = cx;
          ly = cy;
          hasMoved = true;
        }

        const dx = cx - lx;
        const dy = cy - ly;
        const dist = Math.hypot(dx, dy);

        accumulatedDist += dist;

        // If we have moved enough to spawn one or more particles
        if (accumulatedDist > frequency) {
          const color = getColor(app.state);

          // How many particles fit in this movement?
          const steps = Math.floor(accumulatedDist / frequency);

          // Interpolate backwards from current position
          for (let i = 0; i < steps; i++) {
            const t = i / steps;
            const spawnX = lx + dx * t;
            const spawnY = ly + dy * t;
            activateParticle(spawnX, spawnY, color);
          }

          accumulatedDist = accumulatedDist % frequency;
        }

        lx = cx;
        ly = cy;

        // --- 2. PHYSICS LOOP ---
        for (let i = 0; i < poolSize; i++) {
          const p = pool[i];
          if (!p.isActive) continue;

          p.x += p.vx;
          p.y += p.vy;
          p.life -= decayRate;

          if (p.life <= 0) {
            p.isActive = false;
            p.el.style.opacity = "0";
          } else {
            p.el.style.opacity = String(p.life);
            const currentScale = p.scale * p.life;
            dom.setTransform(p.el, p.x, p.y, 0, currentScale, currentScale);
          }
        }
      },

      destroy() {
        pool.forEach((p) => p.el.remove());
        pool.length = 0;
      },
    },
    options
  );
};
