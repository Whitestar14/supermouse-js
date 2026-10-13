/**
 * A canvas that fills the stage: backed in device pixels, drawn in CSS pixels,
 * and re-measured whenever its parent resizes.
 *
 * Three labs plugins (Calligraphy, ASCII, Fluid) need identical behaviour here,
 * and each one has the same trap: `create()` runs *before* the plugin's element
 * is attached to the stage, so `canvas.parentElement` is still null. Hence the
 * split — `fit()` whenever, `observe()` from `install()` once there is a parent
 * to watch.
 */
export interface Surface {
  readonly canvas: HTMLCanvasElement;
  readonly ctx: CanvasRenderingContext2D;
  /** Size of the drawing area in CSS pixels. */
  width: number;
  height: number;
  /** Measure the parent and re-allocate the backing store. */
  fit(): void;
  /** Start watching the parent for size changes. Call from `install()`. */
  observe(onFit?: () => void): void;
  clear(): void;
  /** Erase a fraction of every existing pixel, for canvases that accumulate. */
  fade(alpha: number): void;
  dispose(): void;
}

export function createSurface(canvas: HTMLCanvasElement): Surface | null {
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  let observer: ResizeObserver | null = null;
  let callback: (() => void) | undefined;

  const surface: Surface = {
    canvas,
    ctx,
    width: 0,
    height: 0,

    fit() {
      const host = canvas.parentElement ?? canvas;
      surface.width = host.clientWidth || window.innerWidth;
      surface.height = host.clientHeight || window.innerHeight;

      // Cap the ratio: these surfaces are filled every frame, and a 3x backing
      // store buys nothing visible on a 2x panel.
      const ratio = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(surface.width * ratio);
      canvas.height = Math.round(surface.height * ratio);
      canvas.style.width = `${surface.width}px`;
      canvas.style.height = `${surface.height}px`;
      // Everything downstream draws in CSS pixels.
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    },

    observe(onFit) {
      callback = onFit;
      if (typeof ResizeObserver === "undefined" || !canvas.parentElement) return;
      observer = new ResizeObserver(() => {
        surface.fit();
        callback?.();
      });
      observer.observe(canvas.parentElement);
    },

    clear() {
      ctx.clearRect(0, 0, surface.width, surface.height);
    },

    fade(alpha) {
      if (alpha <= 0) return;
      // `destination-out` erases by exactly the alpha it paints, which fades
      // accumulated ink to transparent instead of smearing a dark veil over it.
      ctx.save();
      ctx.globalCompositeOperation = "destination-out";
      ctx.fillStyle = `rgba(0, 0, 0, ${Math.min(1, alpha)})`;
      ctx.fillRect(0, 0, surface.width, surface.height);
      ctx.restore();
    },

    dispose() {
      observer?.disconnect();
      observer = null;
      callback = undefined;
      surface.clear();
    }
  };

  return surface;
}
