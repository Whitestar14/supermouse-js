import type { ValueOrGetter, SupermouseInstance, SupermousePlugin } from "@supermousejs/core";
import {
  definePlugin,
  normalize,
  css,
  setTransform,
  createActor,
  createCircle,
  math,
  Layers
} from "@supermousejs/utils";

export interface SparklesOptions {
  name?: string;
  isEnabled?: boolean;
  color?: ValueOrGetter<string>;
  /** Number of particles in the pool. Default 30. */
  count?: number;
  /** How fast particles fade out (0–1 per second). Default 2.5 (matches old 0.05 per frame at 50fps). */
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
  life: number;
  scale: number;
  color: string;
}

export const Sparkles = (options: SparklesOptions = {}): SupermousePlugin => {
  const poolSize = options.count ?? 30;
  const decayPerSecond = options.decay ?? 2.5;
  const frequency = options.frequency ?? 10;
  const scatter = options.scatter ?? 5;
  const getColor = normalize(options.color, "#ff00ff");

  const pool: Particle[] = [];

  let lx = 0;
  let ly = 0;
  let hasMoved = false;
  let accumulatedDist = 0;

  const activateParticle = (x: number, y: number, color: string): void => {
    const p = pool.find((item) => !item.isActive);
    if (!p) return;

    p.isActive = true;
    p.life = 1.0;
    p.x = x + math.random(-scatter, scatter);
    p.y = y + math.random(-scatter, scatter);

    const angle = math.random(0, Math.PI * 2);
    const speed = math.random(0.5, 1.5);
    p.vx = Math.cos(angle) * speed;
    p.vy = Math.sin(angle) * speed;
    p.scale = math.random(0.5, 1.2);
    p.color = color;

    const size = math.random(2, 5);
    css(p.el, {
      width: `${size}px`,
      height: `${size}px`,
      backgroundColor: color,
      opacity: "1"
    });

    setTransform(p.el, p.x, p.y, 0, p.scale, p.scale);
  };

  return definePlugin<HTMLDivElement>(
    {
      name: options.name ?? "sparkles",

      create: () => {
        const container = createActor("div") as HTMLDivElement;
        css(container, { zIndex: Layers.TRACE });

        for (let i = 0; i < poolSize; i++) {
          const el = createCircle(0, "transparent");
          css(el, {
            opacity: "0",
            willChange: "transform, opacity"
          });
          container.appendChild(el);

          pool.push({
            el,
            isActive: false,
            x: 0,
            y: 0,
            vx: 0,
            vy: 0,
            life: 0,
            scale: 1,
            color: ""
          });
        }

        return container;
      },

      update: (app: SupermouseInstance, _, dtMs: number) => {
        const dt = dtMs / 1000;
        const { x: cx, y: cy } = app.state.pointer;

        if (!hasMoved) {
          lx = cx;
          ly = cy;
          hasMoved = true;
        }

        const dx = cx - lx;
        const dy = cy - ly;
        const dist = Math.hypot(dx, dy);
        accumulatedDist += dist;

        if (accumulatedDist > frequency) {
          const color = getColor(app.state);
          const steps = Math.floor(accumulatedDist / frequency);

          for (let i = 0; i < steps; i++) {
            const t = i / steps;
            activateParticle(lx + dx * t, ly + dy * t, color);
          }

          accumulatedDist = accumulatedDist % frequency;
        }

        lx = cx;
        ly = cy;

        for (let i = 0; i < poolSize; i++) {
          const p = pool[i];
          if (!p.isActive) continue;

          p.x += p.vx * dt * 60;
          p.y += p.vy * dt * 60;
          p.life -= decayPerSecond * dt;

          if (p.life <= 0) {
            p.isActive = false;
            css(p.el, { opacity: "0" });
          } else {
            const currentScale = p.scale * p.life;
            css(p.el, { opacity: String(p.life) });
            setTransform(p.el, p.x, p.y, 0, currentScale, currentScale);
          }
        }
      },

      destroy: () => {
        pool.length = 0;
      }
    },
    options
  );
};
