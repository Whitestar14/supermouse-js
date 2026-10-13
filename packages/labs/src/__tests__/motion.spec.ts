import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
import { Supermouse, type MouseState, type SupermousePlugin } from "@supermousejs/core";
import { Blob, Fluid, Pendulum, Spring } from "../index";

/**
 * The fluid is the only plugin here that draws, and jsdom has no 2-D canvas, so
 * its calls are recorded instead. `putImageData` snapshots the buffer: the
 * plugin goes on mutating that same array for the rest of the session, and the
 * assertions are about what was handed to the renderer.
 */
class FakeContext {
  calls: Record<string, number> = {};
  frames: Array<{ data: Uint8ClampedArray; width: number; height: number }> = [];
  draws: Array<{ source: { width: number; height: number }; args: number[] }> = [];

  imageSmoothingEnabled = false;
  imageSmoothingQuality = "low";

  private record(name: string): void {
    this.calls[name] = (this.calls[name] ?? 0) + 1;
  }

  createImageData(width: number, height: number): ImageData {
    return {
      data: new Uint8ClampedArray(width * height * 4),
      width,
      height
    } as unknown as ImageData;
  }

  putImageData(image: ImageData): void {
    this.record("putImageData");
    this.frames.push({
      data: new Uint8ClampedArray(image.data),
      width: image.width,
      height: image.height
    });
  }

  drawImage(source: { width: number; height: number }, ...args: number[]): void {
    this.record("drawImage");
    this.draws.push({ source, args });
  }

  setTransform(): void {
    this.record("setTransform");
  }
  clearRect(): void {
    this.record("clearRect");
  }
}

const move = (x: number, y: number): void => {
  window.dispatchEvent(
    new PointerEvent("pointermove", { clientX: x, clientY: y, pointerType: "mouse" })
  );
};

const hover = (el: Element): void => {
  el.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
};

const press = (): void => {
  window.dispatchEvent(
    new PointerEvent("pointerdown", { button: 0, buttons: 1, pointerType: "mouse" })
  );
};

const release = (): void => {
  window.dispatchEvent(
    new PointerEvent("pointerup", { button: 0, buttons: 0, pointerType: "mouse" })
  );
};

let app: Supermouse | undefined;
let fake: FakeContext;
let clock = 0;

const boot = (...plugins: SupermousePlugin[]): Supermouse => {
  const instance = new Supermouse({ autoStart: false, cursor: "custom" });
  for (const plugin of plugins) instance.use(plugin);

  clock = performance.now();
  move(0, 0);
  hover(document.body);
  instance.step((clock += 16));
  move(6, 4);
  instance.step((clock += 16));
  move(9, 7);
  instance.step((clock += 16));

  app = instance;
  return instance;
};

const step = (instance: Supermouse, times: number, dt = 16): void => {
  for (let i = 0; i < times; i++) instance.step((clock += dt));
};

const elementOf = (instance: Supermouse, name: string): HTMLElement =>
  (instance.getPlugin(name) as { element?: HTMLElement } | undefined)?.element as HTMLElement;

/** The `translate3d(x, y, 0)` half of an inline transform. */
const placed = (el: HTMLElement): { x: number; y: number } => {
  const match = /translate3d\((-?[\d.]+)px, (-?[\d.]+)px/.exec(el.style.transform);
  return match ? { x: Number(match[1]), y: Number(match[2]) } : { x: NaN, y: NaN };
};

/** Where a mote sits on the orbit, in degrees, read off its own placement. */
const bearing = (el: HTMLElement, state: MouseState): number => {
  const { x, y } = placed(el);
  return (Math.atan2(y - state.smooth.y, x - state.smooth.x) * 180) / Math.PI;
};

/** Signed bearing change, so a mote crossing ±180° does not read as a reversal. */
const spinDelta = (from: number, to: number): number => ((((to - from) % 360) + 540) % 360) - 180;

/** Alpha-weighted centre of mass of a rendered fluid frame. */
const centroid = (frame: {
  data: Uint8ClampedArray;
  width: number;
}): { x: number; total: number } => {
  let total = 0;
  let weighted = 0;
  for (let i = 0; i < frame.data.length; i += 4) {
    const alpha = frame.data[i + 3];
    if (alpha === 0) continue;
    total += alpha;
    weighted += ((i / 4) % frame.width) * alpha;
  }
  return { x: total ? weighted / total : NaN, total };
};

beforeEach(() => {
  fake = new FakeContext();
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
    fake as unknown as CanvasRenderingContext2D
  );
});

afterEach(() => {
  vi.restoreAllMocks();
  app?.destroy();
  app = undefined;
  document.body.innerHTML = "";
});

describe("labs motion plugins", () => {
  it.each([
    ["blob", Blob()],
    ["spring", Spring()],
    ["pendulum", Pendulum()],
    ["fluid", Fluid()]
  ])("mounts %s under its own name", (name, plugin) => {
    const instance = boot(plugin as SupermousePlugin);
    expect(instance.getPlugin(name)).toBeDefined();
  });

  it("closes the blob's outline into one curve through its points", () => {
    const instance = boot(Blob({ points: 10, wobble: 0 }));
    const path = elementOf(instance, "blob").querySelector("path");
    const d = path?.getAttribute("d") ?? "";

    expect(d.startsWith("M ")).toBe(true);
    expect(d.endsWith(" Z")).toBe(true);
    // Catmull-Rom through ten points is ten cubic segments.
    expect(d.match(/ C /g) ?? []).toHaveLength(10);
  });

  it("rings the blob outward after a press", () => {
    const instance = boot(Blob({ size: 80, spring: 0.3, wobble: 0 }));
    const path = elementOf(instance, "blob").querySelector("path") as SVGPathElement;

    const radius = (): number => {
      const match = /^M (-?[\d.]+) (-?[\d.]+)/.exec(path.getAttribute("d") ?? "");
      // The box is 320 wide, so the centre of the outline is at 160.
      return match ? Math.hypot(Number(match[1]) - 160, Number(match[2]) - 160) : NaN;
    };

    const before = radius();
    press();
    instance.step((clock += 16));
    release();

    // Every point takes the impulse at once, so the body swells before the
    // springs pull it back — a strike, not a scale.
    expect(radius()).toBeGreaterThan(before);
  });

  it("lags the pointer and arrives with more than it needs when underdamped", () => {
    const instance = boot(Spring({ frequency: 3, damping: 0.3, showTarget: true }));
    const body = elementOf(instance, "spring").children[1] as HTMLElement;

    move(300, 200);
    instance.step((clock += 16));

    // Behind the jump, and already moving: a spring, not a snap.
    const lagged = placed(body).x;
    expect(lagged).toBeLessThan(300);
    expect(lagged).toBeGreaterThan(9);

    let peak = lagged;
    for (let i = 0; i < 90; i++) {
      instance.step((clock += 16));
      peak = Math.max(peak, placed(body).x);
    }
    // Underdamped, so it overshoots the target it is chasing.
    expect(peak).toBeGreaterThan(300);
  });

  it("stays stable at a stiffness one step could not integrate", () => {
    const instance = boot(Spring({ frequency: 10, damping: 1 }));
    const body = elementOf(instance, "spring").children[1] as HTMLElement;

    move(200, 120);
    step(instance, 120);

    const { x } = placed(body);
    expect(Number.isFinite(x)).toBe(true);
    // Critically damped: it has arrived, rather than ringing around the target.
    expect(Math.abs(x - 200)).toBeLessThan(2);
  });

  it("keeps the pendulum's bob on its rod, then swings it to rest", () => {
    const instance = boot(Pendulum({ rod: 100, drag: 0.94, entrance: 0.6 }));
    const el = elementOf(instance, "pendulum");
    const rod = el.querySelector("line") as SVGLineElement;
    const bob = el.querySelectorAll("circle")[1] as SVGCircleElement;

    // The rod is a constraint, not a spring: the ends never move apart.
    for (let i = 0; i < 40; i++) {
      instance.step((clock += 16));
      const span = Math.hypot(
        Number(rod.getAttribute("x1")) - Number(rod.getAttribute("x2")),
        Number(rod.getAttribute("y1")) - Number(rod.getAttribute("y2"))
      );
      expect(span).toBeCloseTo(100, 0);
    }

    // ...and it is a pendulum, so it ends up hanging under the hinge.
    step(instance, 600);
    expect(Number(bob.getAttribute("cx"))).toBeCloseTo(Number(rod.getAttribute("x1")), 0);
    expect(Number(bob.getAttribute("cy"))).toBeGreaterThan(Number(rod.getAttribute("y1")));
  });

  it("carries the fluid's dye along after the pointer has stopped", () => {
    const instance = boot(
      Fluid({ resolution: 64, ink: 0.8, fade: 0, drag: 0.1, force: 2, swirl: 0, iterations: 8 })
    );

    for (let i = 0; i < 24; i++) {
      move(120 + i * 16, 120);
      instance.step((clock += 16));
    }

    // Park the pointer, so every later pixel moved because the field moved it.
    move(instance.state.smooth.x, instance.state.smooth.y);
    instance.step((clock += 16));
    const parked = fake.frames[fake.frames.length - 1];
    const before = centroid(parked);

    step(instance, 12);
    const after = centroid(fake.frames[fake.frames.length - 1]);

    expect(before.total).toBeGreaterThan(0);
    expect(after.total).toBeGreaterThan(0);
    // Advection, not injection: the dye is still travelling to the right.
    expect(after.x).toBeGreaterThan(before.x);
  });

  it("renders the fluid by upscaling the grid, and follows the resolution", () => {
    let resolution = 64;
    const instance = boot(Fluid({ resolution: () => resolution }));
    step(instance, 6);

    const first = fake.draws[fake.draws.length - 1];
    expect(first.source.width).toBe(64);
    expect(fake.imageSmoothingEnabled).toBe(true);
    // The destination is the stage, so the grid is stretched to the frame.
    expect(first.args[6]).toBe(window.innerWidth);

    // The grid is reallocated when the option moves, without thrashing on every
    // frame while a slider is being dragged.
    resolution = 96;
    step(instance, 3);
    expect(fake.draws[fake.draws.length - 1].source.width).toBe(96);
  });

  it("erases the fluid when the native pointer takes over", () => {
    const instance = boot(Fluid({ resolution: 48 }));
    step(instance, 4);

    const cleared = fake.calls.clearRect;
    const drawn = fake.calls.putImageData;
    instance.state.isNative = true;
    step(instance, 2);

    expect(fake.calls.clearRect).toBeGreaterThan(cleared);
    // Nothing new is solved or painted while the native cursor owns the screen.
    expect(fake.calls.putImageData).toBe(drawn);
  });
});
