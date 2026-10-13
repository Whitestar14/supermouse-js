import type { SupermouseInstance, SupermousePlugin, ValueOrGetter } from "@supermousejs/core";
import { definePlugin, normalizeAll, css, clamp, Layers } from "@supermousejs/utils";
import { createSurface, type Surface } from "./internal/surface";

export interface FluidOptions {
  name?: string;
  isEnabled?: boolean;
  /** Simulation width in cells. The height follows the stage's aspect ratio. */
  resolution?: ValueOrGetter<number>;
  color?: ValueOrGetter<string>;
  /**
   * Multiplier on the injected force. `1` makes the fluid travel exactly as fast
   * as the hand; above that it leads, below it drags behind.
   */
  force?: ValueOrGetter<number>;
  /** Rotational share of the injected force, so the dye curls as it is pushed. */
  swirl?: ValueOrGetter<number>;
  /** Dye lost per second. */
  fade?: ValueOrGetter<number>;
  /** Velocity lost per second. */
  drag?: ValueOrGetter<number>;
  /** Pressure-solve iterations. More is a calmer, more liquid field. */
  iterations?: ValueOrGetter<number>;
  /** Dye laid down per 60Hz frame at the pointer. */
  ink?: ValueOrGetter<number>;
  blend?: string;
  zIndex?: string;
}

/** `#abc` / `#aabbcc` → an 8-bit triplet. */
function channels(color: string): [number, number, number] {
  const hex = color.replace("#", "").trim();
  const full =
    hex.length === 3
      ? hex
          .split("")
          .map((c) => c + c)
          .join("")
      : hex.padEnd(6, "0").slice(0, 6);
  return [
    parseInt(full.slice(0, 2), 16) || 0,
    parseInt(full.slice(2, 4), 16) || 0,
    parseInt(full.slice(4, 6), 16) || 0
  ];
}

/**
 * A fluid, solved. The pointer pushes a velocity field around a coarse grid,
 * dye is carried by that field, and both are advected — each cell samples
 * wherever the flow was one step *back* along its own velocity, which is the
 * semi-Lagrangian trick that makes the whole thing stable at any time step.
 *
 * Two details are what separate this from a trail of smudges. The velocity
 * field is projected (a Jacobi solve of the pressure Poisson equation) so it
 * stops compressing into itself and swirls instead; and the render is an
 * upscaled image of the grid, so the bilinear filter does the blurring for
 * free — a 96-cell-wide field stretched over a screen is the smoke, and there
 * is no per-pixel pass anywhere.
 *
 * This is the one plugin here that paints the whole stage rather than a bounded
 * actor. That is the point of it, and `fade` is the control that keeps it from
 * filling with ink forever.
 */
export const Fluid = (options: FluidOptions = {}): SupermousePlugin => {
  const cfg = normalizeAll(options, {
    resolution: 96,
    color: "#f59e0b",
    force: 1.1,
    swirl: 0.35,
    fade: 0.55,
    drag: 1.4,
    iterations: 12,
    ink: 0.28
  });

  let surface: Surface | null = null;
  let grid: HTMLCanvasElement | null = null;
  let gctx: CanvasRenderingContext2D | null = null;
  let image: ImageData | null = null;

  let cols = 0;
  let rows = 0;
  let cells = 0;

  /** Velocity in cells per second, and the scratch copy it is advected into. */
  let u = new Float32Array(0);
  let v = new Float32Array(0);
  let nu = new Float32Array(0);
  let nv = new Float32Array(0);
  /** Dye, and the scratch copy it is advected into. */
  let dye = new Float32Array(0);
  let ndye = new Float32Array(0);
  /** Pressure and its right-hand side, for the projection. */
  let pressure = new Float32Array(0);
  let divergence = new Float32Array(0);

  let lastX: number | null = null;
  let lastY = 0;

  const allocate = (width: number, height: number, resolution: number): void => {
    const nextCols = clamp(Math.round(resolution), 24, 256);
    const nextRows = clamp(Math.round(nextCols * (height / Math.max(1, width))), 16, 256);

    cols = nextCols;
    rows = nextRows;
    cells = cols * rows;

    u = new Float32Array(cells);
    v = new Float32Array(cells);
    nu = new Float32Array(cells);
    nv = new Float32Array(cells);
    dye = new Float32Array(cells);
    ndye = new Float32Array(cells);
    pressure = new Float32Array(cells);
    divergence = new Float32Array(cells);

    grid = document.createElement("canvas");
    grid.width = cols;
    grid.height = rows;
    gctx = grid.getContext("2d");
    image = gctx ? gctx.createImageData(cols, rows) : null;
    lastX = null;
  };

  /** Bilinear sample of a scalar field, for the semi-Lagrangian backtrace. */
  const sample = (field: Float32Array, x: number, y: number): number => {
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const x1 = Math.min(cols - 1, x0 + 1);
    const y1 = Math.min(rows - 1, y0 + 1);
    const fx = x - x0;
    const fy = y - y0;
    const a = field[x0 + y0 * cols] * (1 - fx) + field[x1 + y0 * cols] * fx;
    const b = field[x0 + y1 * cols] * (1 - fx) + field[x1 + y1 * cols] * fx;
    return a * (1 - fy) + b * fy;
  };

  const splat = (cx: number, cy: number, fx: number, fy: number, ink: number): void => {
    const x0 = Math.max(1, Math.floor(cx));
    const y0 = Math.max(1, Math.floor(cy));

    for (let y = y0 - 1; y <= y0 + 1; y++) {
      for (let x = x0 - 1; x <= x0 + 1; x++) {
        if (x < 1 || y < 1 || x >= cols - 1 || y >= rows - 1) continue;
        const i = x + y * cols;
        // A 3x3 kernel, falling off from the centre, so the injection is a
        // fingertip rather than a single hard cell.
        const falloff = x === x0 && y === y0 ? 1 : 0.45;
        u[i] += fx * falloff;
        v[i] += fy * falloff;
        dye[i] = Math.min(4, dye[i] + ink * falloff);
      }
    }
  };

  return definePlugin<HTMLCanvasElement>(
    {
      name: options.name ?? "fluid",

      create: () => {
        const canvas = document.createElement("canvas");
        surface = createSurface(canvas);
        css(canvas, {
          position: "absolute",
          top: "0",
          left: "0",
          display: "block",
          pointerEvents: "none",
          zIndex: options.zIndex ?? Layers.TRACE,
          mixBlendMode: options.blend ?? "screen"
        });
        return canvas;
      },

      install: () => {
        if (!surface) return;
        surface.fit();
        // The observer only has to re-measure: the grid is rebuilt from the new
        // size on the next frame, in `update`.
        surface.observe();
      },

      onEnable: () => {
        if (!surface) return;
        surface.fit();
        lastX = null;
        if (image) {
          image.data.fill(0);
        }
        dye.fill(0);
        u.fill(0);
        v.fill(0);
        surface.clear();
      },

      update: (app: SupermouseInstance, el: HTMLCanvasElement, dtMs: number) => {
        if (!surface) return;

        const state = app.state;
        const width = surface.width;
        const height = surface.height;
        if (width <= 0 || height <= 0) return;

        // Quantised to 8-cell steps: `resolution` is a live option, and the grid
        // is reallocated when it moves, so a slider drag should not be able to
        // allocate on every frame.
        const resolution = clamp(Math.round(cfg.resolution(state) / 8) * 8, 24, 256);
        const wantedRows = clamp(Math.round(resolution * (height / Math.max(1, width))), 16, 256);
        if (cols !== resolution || rows !== wantedRows) {
          // Before anything reads the buffers: on the first frame the grid, the
          // context and the image all come from here.
          allocate(width, height, resolution);
        }
        if (!gctx || !image) return;

        // The native pointer is showing, so nothing is driving the fluid. The
        // field is left alone but the canvas is not: ink with no owner on screen
        // is just dirt, and it would reappear when the custom cursor came back.
        if (state.isNative) {
          lastX = null;
          surface.clear();
          return;
        }
        if (!state.hasReceivedInput) {
          css(el, { opacity: "0" });
          return;
        }
        css(el, { opacity: "1" });

        const dt = clamp(dtMs / 1000, 0, 1 / 30);
        if (dt <= 0) return;

        const { ctx } = surface;
        const force = cfg.force(state);
        const ink = cfg.ink(state);
        const swirl = cfg.swirl(state);
        const iterations = clamp(Math.round(cfg.iterations(state)), 0, 40);

        // The pointer's own motion, measured rather than read off `state`, and
        // converted into cells: the simulation has no idea what a pixel is.
        if (lastX !== null) {
          const cvx = ((state.smooth.x - lastX) / dt) * (cols / width);
          const cvy = ((state.smooth.y - lastY) / dt) * (rows / height);

          const gx = (state.smooth.x / width) * cols;
          const gy = (state.smooth.y / height) * rows;
          // Swirl is the injected force turned a quarter turn, so pushing the
          // pointer through the field curls the ink instead of shoving it.
          const fx = cvx * force;
          const fy = cvy * force;
          splat(gx, gy, fx - cvy * force * swirl, fy + cvx * force * swirl, ink * dt * 60);
        }
        lastX = state.smooth.x;
        lastY = state.smooth.y;

        // 1. Advect the velocity field: every cell asks where its own parcel of
        //    fluid was one step ago, and takes that value.
        for (let y = 1; y < rows - 1; y++) {
          for (let x = 1; x < cols - 1; x++) {
            const i = x + y * cols;
            const bx = clamp(x - u[i] * dt, 0.5, cols - 1.5);
            const by = clamp(y - v[i] * dt, 0.5, rows - 1.5);
            nu[i] = sample(u, bx, by);
            nv[i] = sample(v, bx, by);
          }
        }

        const keep = Math.max(0, 1 - cfg.drag(state) * dt);
        for (let i = 0; i < cells; i++) {
          u[i] = nu[i] * keep;
          v[i] = nv[i] * keep;
        }

        // 2. Project: subtract the divergent part of the field, or the flow keeps
        //    folding into itself and the dye reads as a smear rather than a swirl.
        if (iterations > 0) {
          for (let y = 1; y < rows - 1; y++) {
            for (let x = 1; x < cols - 1; x++) {
              const i = x + y * cols;
              divergence[i] = -0.5 * (u[i + 1] - u[i - 1] + v[i + cols] - v[i - cols]);
              pressure[i] = 0;
            }
          }
          for (let k = 0; k < iterations; k++) {
            for (let y = 1; y < rows - 1; y++) {
              for (let x = 1; x < cols - 1; x++) {
                const i = x + y * cols;
                pressure[i] =
                  (divergence[i] +
                    pressure[i - 1] +
                    pressure[i + 1] +
                    pressure[i - cols] +
                    pressure[i + cols]) /
                  4;
              }
            }
          }
          for (let y = 1; y < rows - 1; y++) {
            for (let x = 1; x < cols - 1; x++) {
              const i = x + y * cols;
              u[i] -= 0.5 * (pressure[i + 1] - pressure[i - 1]);
              v[i] -= 0.5 * (pressure[i + cols] - pressure[i - cols]);
            }
          }
        }

        // 3. Carry the dye along that field, then let it evaporate.
        for (let y = 1; y < rows - 1; y++) {
          for (let x = 1; x < cols - 1; x++) {
            const i = x + y * cols;
            const bx = clamp(x - u[i] * dt, 0.5, cols - 1.5);
            const by = clamp(y - v[i] * dt, 0.5, rows - 1.5);
            ndye[i] = sample(dye, bx, by);
          }
        }

        const decay = Math.max(0, 1 - cfg.fade(state) * dt);
        const [r, g, b] = channels(cfg.color(state));
        const pixels = image.data;
        for (let i = 0; i < cells; i++) {
          const value = ndye[i] * decay;
          dye[i] = value < 0.002 ? 0 : value;
          // Exponential saturation: thin dye stays translucent, thick dye stops
          // at the colour instead of blowing out to white.
          const alpha = 255 * (1 - Math.exp(-dye[i] * 1.5));
          const p = i * 4;
          pixels[p] = r;
          pixels[p + 1] = g;
          pixels[p + 2] = b;
          pixels[p + 3] = alpha;
        }

        gctx.putImageData(image, 0, 0);

        // 4. The upscale is the blur. No per-pixel work happens anywhere else.
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(grid as HTMLCanvasElement, 0, 0, cols, rows, 0, 0, width, height);

        void el;
      },

      cleanup: () => {
        surface?.dispose();
        surface = null;
        grid = null;
        gctx = null;
        image = null;
      }
    },
    options
  );
};
