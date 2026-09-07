import { createActor, css } from "@supermousejs/utils";

/** credits to Ksenia Kondrashova for the original inspiration:
 * https://codepen.io/ksenia-k/pen/rNoBgbV
 * */
export const CalligraphyPlugin = (options: any = {}) => {
  let canvas: HTMLCanvasElement | null = null;
  let ctx: CanvasRenderingContext2D | null = null;
  let trail: { x: number; y: number; dx: number; dy: number }[] = [];
  let active = false;
  let resizeObserver: ResizeObserver | null = null;

  // Last valid pointer position (for offscreen and ignored areas)
  let lastPointerX = window.innerWidth / 2;
  let lastPointerY = window.innerHeight / 2;
  let mouseMoved = false;

  const params = {
    points: options.points || 40,
    widthFactor: options.widthFactor || 0.3,
    spring: options.spring || 0.4,
    friction: options.friction || 0.5,
    color: options.color || "#f59e0b"
  };

  const resize = () => {
    if (!canvas) return;
    canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
    canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
  };

  return {
    name: "calligraphy",
    priority: 10,

    install(app: any) {
      canvas = createActor("canvas") as HTMLCanvasElement;
      ctx = canvas.getContext("2d");

      // Append to container, NOT stage, so it persists independently of stage visibility
      css(canvas, {
        position: "absolute",
        top: "0",
        left: "0",
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 99
      });

      for (let i = 0; i < params.points; i++) {
        trail.push({ x: lastPointerX, y: lastPointerY, dx: 0, dy: 0 });
      }

      app.container.appendChild(canvas);
      resize();

      if (typeof ResizeObserver !== "undefined") {
        resizeObserver = new ResizeObserver(resize);
        resizeObserver.observe(app.container);
      } else {
        window.addEventListener("resize", resize);
      }

      active = true;
      mouseMoved = false;
    },

    onEnable() {
      active = true;
      if (canvas) canvas.style.display = "block";
    },

    onDisable() {
      active = false;
      if (canvas) canvas.style.display = "none";
    },

    update(app: any) {
      if (!active || !ctx || !canvas || !app.isEnabled) return;

      if (!app.state.isNative && app.state.hasReceivedInput) {
        lastPointerX = app.state.smooth.x;
        lastPointerY = app.state.smooth.y;
        mouseMoved = true;
      }

      if (!mouseMoved) {
        const t = performance.now();
        const w = canvas.width;
        const h = canvas.height;
        lastPointerX = (0.5 + 0.3 * Math.cos(0.002 * t) * Math.sin(0.005 * t)) * w;
        lastPointerY = (0.5 + 0.2 * Math.cos(0.005 * t) + 0.1 * Math.cos(0.01 * t)) * h;
      }

      const pointer = { x: lastPointerX, y: lastPointerY };

      // Physics update
      for (let i = 0; i < trail.length; i++) {
        const p = trail[i];
        const prev = i === 0 ? pointer : trail[i - 1];
        const spring = i === 0 ? 0.4 * params.spring : params.spring;
        p.dx += (prev.x - p.x) * spring;
        p.dy += (prev.y - p.y) * spring;
        p.dx *= params.friction;
        p.dy *= params.friction;
        p.x += p.dx;
        p.y += p.dy;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.lineCap = "round";
      ctx.strokeStyle = params.color;
      ctx.beginPath();
      ctx.moveTo(trail[0].x, trail[0].y);

      for (let i = 1; i < trail.length - 1; i++) {
        const xc = 0.5 * (trail[i].x + trail[i + 1].x);
        const yc = 0.5 * (trail[i].y + trail[i + 1].y);
        ctx.quadraticCurveTo(trail[i].x, trail[i].y, xc, yc);
        ctx.lineWidth = params.widthFactor * (params.points - i);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(xc, yc);
      }

      ctx.lineTo(trail[trail.length - 1].x, trail[trail.length - 1].y);
      ctx.stroke();
    },

    destroy() {
      if (resizeObserver) resizeObserver.disconnect();
      else window.removeEventListener("resize", resize);
      canvas?.remove();
      canvas = null;
      ctx = null;
      trail = [];
    }
  };
};
