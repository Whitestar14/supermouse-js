import { dom } from "@supermousejs/utils";

/** credits to Ksenia Kondrashova for the original inspiration:
 * https://codepen.io/ksenia-k/pen/rNoBgbV
 * */
export const CalligraphyPlugin = (options: any = {}) => {
  let canvas: HTMLCanvasElement | null = null;
  let ctx: CanvasRenderingContext2D | null = null;
  let trail: { x: number; y: number; dx: number; dy: number }[] = [];
  let active = false;

  const params = {
    points: options.points || 25,
    width: options.width || 0.4,
    spring: options.spring || 0.4,
    friction: options.friction || 0.5,
    color: options.color || "#f59e0b"
  };

  const resize = () => {
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };

  return {
    name: "calligraphy",
    priority: 10,

    install(app: any) {
      canvas = dom.createActor("canvas") as HTMLCanvasElement;
      ctx = canvas.getContext("2d");

      // Pre-allocate trail objects to avoid GC thrashing in update loop
      for (let i = 0; i < params.points; i++) {
        trail.push({
          x: app.state.smooth.x,
          y: app.state.smooth.y,
          dx: 0,
          dy: 0
        });
      }

      app.container.appendChild(canvas);
      resize();
      window.addEventListener("resize", resize);
      active = true;
    },

    // Handle visibility toggling without destroying the element
    onEnable() {
      active = true;
      if (canvas) canvas.style.display = "block";
    },

    onDisable() {
      active = false;
      if (canvas) canvas.style.display = "none";
    },

    update(app: any) {
      if (!active || !ctx || !canvas) return;

      // Clear frame
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const target = app.state.smooth;

      // Physics Update
      for (let i = 0; i < trail.length; i++) {
        const p = trail[i];
        const prev = i === 0 ? target : trail[i - 1];
        const springForce = i === 0 ? 0.4 * params.spring : params.spring;

        p.dx += (prev.x - p.x) * springForce;
        p.dy += (prev.y - p.y) * springForce;
        p.dx *= params.friction;
        p.dy *= params.friction;
        p.x += p.dx;
        p.y += p.dy;
      }

      // Render Trail
      ctx.lineCap = "round";
      ctx.strokeStyle = params.color;
      ctx.beginPath();
      ctx.moveTo(trail[0].x, trail[0].y);

      for (let i = 1; i < trail.length - 1; i++) {
        const xc = 0.5 * (trail[i].x + trail[i + 1].x);
        const yc = 0.5 * (trail[i].y + trail[i + 1].y);
        ctx.quadraticCurveTo(trail[i].x, trail[i].y, xc, yc);

        // Batch strokes by segments or update width
        ctx.lineWidth = params.width * (params.points - i);
        ctx.stroke();
        // Start next segment
        ctx.beginPath();
        ctx.moveTo(xc, yc);
      }

      ctx.lineTo(trail[trail.length - 1].x, trail[trail.length - 1].y);
      ctx.stroke();
    },

    destroy() {
      window.removeEventListener("resize", resize);
      canvas?.remove();
      canvas = null;
      ctx = null;
      trail = [];
    }
  };
};
