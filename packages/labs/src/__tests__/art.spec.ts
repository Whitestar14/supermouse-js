import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
import { Supermouse, type SupermousePlugin } from "@supermousejs/core";
import { ASCII, Calligraphy, Grain, Pixel, Reflection } from "../index";

/**
 * jsdom has no 2-D canvas without the native `canvas` package, so the drawing
 * calls are recorded instead. That turns out to be the useful thing anyway: it
 * pins the parts worth pinning — how many curve segments a frame strokes, that
 * sprites are not repainted when nothing changed, that the fade is a
 * `destination-out` wipe — without a pixel buffer.
 */
class FakeContext {
  calls: Record<string, number> = {};
  texts: string[] = [];
  wipes: string[] = [];

  fillStyle = "";
  strokeStyle = "";
  lineWidth = 0;
  font = "";
  textAlign = "";
  textBaseline = "";
  globalCompositeOperation = "source-over";

  private record(name: string): void {
    this.calls[name] = (this.calls[name] ?? 0) + 1;
  }

  save(): void {
    this.record("save");
  }
  restore(): void {
    this.record("restore");
  }
  translate(): void {
    this.record("translate");
  }
  rotate(): void {
    this.record("rotate");
  }
  setTransform(): void {
    this.record("setTransform");
  }
  clearRect(): void {
    this.record("clearRect");
  }
  fillRect(): void {
    this.record("fillRect");
    this.wipes.push(`${this.globalCompositeOperation}:${this.fillStyle}`);
  }
  beginPath(): void {
    this.record("beginPath");
  }
  moveTo(): void {
    this.record("moveTo");
  }
  lineTo(): void {
    this.record("lineTo");
  }
  quadraticCurveTo(): void {
    this.record("quadraticCurveTo");
  }
  stroke(): void {
    this.record("stroke");
  }
  fillText(text: string): void {
    this.record("fillText");
    this.texts.push(text);
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

let app: Supermouse | undefined;
let fake: FakeContext;
let clock = 0;

/** Origin activation, then two frames of travel so velocity is meaningful. */
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

describe("labs art plugins", () => {
  it("draws the calligraphy ribbon as a tapered quadratic chain", () => {
    const instance = boot(Calligraphy({ points: 40 }));
    const canvas = elementOf(instance, "calligraphy");

    expect(canvas.tagName.toLowerCase()).toBe("canvas");
    expect(fake.calls.setTransform).toBeGreaterThan(0);
    expect(fake.calls.stroke).toBeGreaterThan(0);

    // One curve segment per interior link, every frame, since a stroke is the
    // only thing that renders here.
    expect(fake.calls.quadraticCurveTo % 38).toBe(0);
  });

  it("keeps a dormant signature running before the pointer has moved", () => {
    const instance = new Supermouse({ autoStart: false, cursor: "custom" });
    app = instance;
    instance.use(Calligraphy({ points: 12, idle: true }));

    clock = performance.now();
    step(instance, 3);

    expect(fake.calls.quadraticCurveTo).toBeGreaterThan(0);
  });

  it("does not repaint a pixel sprite until its palette or art changes", () => {
    const instance = boot(Pixel({ sprite: "arrow" }));
    const canvas = elementOf(instance, "pixel");

    expect(canvas.getAttribute("width")).toBe("8");
    expect(canvas.getAttribute("height")).toBe("8");
    expect(getComputedStyle(canvas).imageRendering).toBe("pixelated");

    const first = fake.calls.fillRect;
    // The arrow bitmap has exactly 25 set pixels.
    expect(first).toBe(25);

    step(instance, 5);
    expect(fake.calls.fillRect).toBe(25);
  });

  it("stamps characters from the set and evaporates them with a destination-out wipe", () => {
    const instance = boot(ASCII({ charset: "0123456789", spacing: 1 }));
    step(instance, 4);

    expect(fake.texts.length).toBeGreaterThan(0);
    expect(fake.texts.every((glyph) => "0123456789".includes(glyph))).toBe(true);

    const wipe = fake.wipes.find((entry) => entry.startsWith("destination-out"));
    expect(wipe).toBeDefined();
    expect(wipe).toMatch(/^destination-out:rgba\(0, 0, 0, [\d.]+\)$/);
  });

  it("maps the grain field through a colour matrix and advances its seed", () => {
    // `react` off, because exposing by speed deliberately detunes the field.
    const instance = boot(Grain({ grain: 0.5, flicker: 8, react: false }));
    const el = elementOf(instance, "grain");

    const turbulence = el.querySelector("feTurbulence");
    const matrix = el.querySelector("feColorMatrix");
    expect(Number(turbulence?.getAttribute("baseFrequency"))).toBeCloseTo(0.5, 5);
    expect(turbulence?.getAttribute("type")).toBe("fractalNoise");

    // RGB rows are constant (the tint), alpha comes from the noise.
    expect(matrix?.getAttribute("values")).toMatch(/^0 0 0 0 [\d.]+ {2}/);

    const seed = turbulence?.getAttribute("seed");
    step(instance, 12, 20);
    expect(turbulence?.getAttribute("seed")).not.toBe(seed);
  });

  it("mirrors the cursor across the vertical axis, and draws that axis", () => {
    const instance = boot(Reflection({ axis: "x", lines: true }));
    const el = elementOf(instance, "reflection");
    const children = Array.from(el.children) as HTMLElement[];

    move(300, 200);
    step(instance, 4);

    expect(children[0].style.display).toBe("block");
    // jsdom keeps the authored transform as a string, so the scale is read off
    // it directly: the x axis is negated, the y axis is left alone.
    expect(children[0].style.transform).toContain("scale(-1, 1)");
    // Only the first ghost is used by a single-axis mirror.
    expect(children[1].style.display).toBe("none");
    expect(children[2].style.display).toBe("none");

    // …and the mirror itself: the vertical hairline, the horizontal one off.
    expect(children[3].style.display).toBe("block");
    expect(children[4].style.display).toBe("none");
  });

  it("mirrors across the horizontal axis instead when asked", () => {
    const instance = boot(Reflection({ axis: "y", lines: true }));
    const el = elementOf(instance, "reflection");
    const children = Array.from(el.children) as HTMLElement[];

    move(300, 200);
    step(instance, 4);

    expect(children[0].style.display).toBe("block");
    expect(children[0].style.transform).toContain("scale(1, -1)");

    expect(children[3].style.display).toBe("none");
    expect(children[4].style.display).toBe("block");
    expect(children[4].style.width).toBe(`${window.innerWidth}px`);
  });

  it("mirrors about the stage rather than the window", () => {
    const instance = boot(Reflection({ axis: "x", lines: true }));
    const el = elementOf(instance, "reflection");
    const stage = el.parentElement as HTMLElement;

    // jsdom reports every element as zero-sized, so the stage is given a box of
    // its own and the plugin is asked to re-measure.
    Object.defineProperty(stage, "clientWidth", { value: 800, configurable: true });
    Object.defineProperty(stage, "clientHeight", { value: 400, configurable: true });
    window.dispatchEvent(new Event("resize"));

    move(300, 200);
    step(instance, 8);
    // Park the pointer where the cursor already is, so the easing cannot move
    // `smooth` between the frame the ghost was placed on and this read.
    move(instance.state.smooth.x, instance.state.smooth.y);
    step(instance, 1);

    const children = Array.from(el.children) as HTMLElement[];
    // The hairline spans the stage, not the viewport — and the mirror is the
    // reflection of the pointer about that same rectangle.
    expect(children[3].style.height).toBe("400px");
    expect(children[3].style.transform).toContain("400px");

    const ghostX = Number(/translate3d\(([\d.]+)px/.exec(children[0].style.transform)?.[1]);
    expect(ghostX + instance.state.smooth.x).toBeCloseTo(800, 4);
  });

  it("keeps a mirrored sprite centred on the pointer", () => {
    const instance = boot(Pixel({ cell: 8, flip: true }));
    const canvas = elementOf(instance, "pixel");

    // Travel left, so the sprite turns to face the way it is going.
    move(-40, 7);
    step(instance, 3);

    expect(canvas.style.transform).toContain("scale(-1, 1)");
    // The order matters, and not the way it looks: a canvas is a CSS box, so
    // the declared list is re-anchored about `transform-origin: 50% 50%`. The
    // `translate(-50%, -50%)` is composed *before* the scale, which leaves the
    // declared shift cancelling the origin shift exactly — the flip then happens
    // about the element's own centre. Moving the shift to the inner side is the
    // tempting "fix" and it is wrong: it displaces a flipped actor by one full
    // size. This assertion exists to stop that change being made.
    expect(canvas.style.transform.indexOf("translate(-50%, -50%)")).toBeLessThan(
      canvas.style.transform.indexOf("scale(")
    );
  });

  it("rounds a fractional cell so the sprite lands on whole pixels", () => {
    const instance = boot(Pixel({ cell: () => 8.6 }));
    const canvas = elementOf(instance, "pixel");

    expect(canvas.style.width).toBe("72px");
  });

  it("erases the ribbon while the native pointer is showing", () => {
    const instance = boot(Calligraphy({ points: 12 }));
    const cleared = fake.calls.clearRect;
    const curves = fake.calls.quadraticCurveTo;

    instance.state.isNative = true;
    step(instance, 2);

    expect(fake.calls.clearRect).toBeGreaterThan(cleared);
    expect(fake.calls.quadraticCurveTo).toBe(curves);
  });
});
