import { describe, it, expect, afterEach, vi } from "vitest";
import { Supermouse, type SupermousePlugin } from "@supermousejs/core";
import { Glitch, Halftone, Lens, MotionBlur, Ripple, Spotlight } from "../index";

/**
 * jsdom reports every `getBoundingClientRect()` as zeroes, so a scope only
 * counts as "under the pointer" at (0, 0) — that is why activation here moves
 * to the origin and the movement that follows happens after the hover, which
 * is never re-checked on `pointermove`.
 */
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
let clock = 0;

const boot = (...plugins: SupermousePlugin[]): Supermouse => {
  const instance = new Supermouse({ autoStart: false, cursor: "custom" });
  for (const plugin of plugins) instance.use(plugin);

  clock = performance.now();

  // The first move snaps `smooth` onto the pointer, so it produces no velocity.
  // Two more frames of travel are needed before `state.velocity` is meaningful
  // for the plugins whose shape depends on how fast the pointer is moving.
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

const elementOf = (instance: Supermouse, name: string): HTMLElement =>
  (instance.getPlugin(name) as { element?: HTMLElement } | undefined)?.element as HTMLElement;

/** Frames on the fake clock, for effects driven by elapsed time. */
const step = (instance: Supermouse, times: number, dt = 16): void => {
  for (let i = 0; i < times; i++) instance.step((clock += dt));
};

/**
 * A boot on a clock the test owns, for plugins that schedule against wall time
 * rather than against `dtMs` — `performance.now()` moves in microseconds during
 * a test, so a tear scheduled 300ms out would never arrive.
 */
const bootOnClock = (
  ...plugins: SupermousePlugin[]
): { instance: Supermouse; tick: (ms: number) => number } => {
  const instance = new Supermouse({ autoStart: false, cursor: "custom" });
  for (const plugin of plugins) instance.use(plugin);
  app = instance;

  let now = 0;
  vi.spyOn(performance, "now").mockImplementation(() => now);

  move(0, 0);
  hover(document.body);
  instance.step((now += 16));
  move(60, 4);
  instance.step((now += 16));
  move(120, 8);

  return { instance, tick: (ms: number) => (now += ms) };
};

afterEach(() => {
  vi.restoreAllMocks();
  app?.destroy();
  app = undefined;
  document.body.innerHTML = "";
});

describe("labs optics plugins", () => {
  it.each([
    ["glitch", Glitch()],
    ["motion-blur", MotionBlur()],
    ["ripple", Ripple()],
    ["lens", Lens()],
    ["halftone", Halftone()],
    ["spotlight", Spotlight()]
  ])("mounts %s under its own name", (name, plugin) => {
    const instance = boot(plugin as SupermousePlugin);
    expect(instance.getPlugin(name)).toBeDefined();
  });

  it("draws the glitch as an SVG with a live displacement map", () => {
    const instance = boot(Glitch({ intensity: 8 }));
    const el = elementOf(instance, "glitch");

    expect(el.tagName.toLowerCase()).toBe("svg");
    expect(el.querySelectorAll("circle")).toHaveLength(5);

    const displacement = el.querySelector("feDisplacementMap");
    expect(displacement).not.toBeNull();
    expect(Number(displacement?.getAttribute("scale"))).toBeGreaterThan(0);
  });

  it("orients the motion blur along the velocity vector", () => {
    const instance = boot(MotionBlur({ intensity: 1, maxSpread: 20 }));
    const el = elementOf(instance, "motion-blur");

    expect(el.tagName.toLowerCase()).toBe("svg");
    const blur = el.querySelector("feGaussianBlur");
    // `stdDeviation` is two values: an anisotropic kernel is the whole effect.
    expect(blur?.getAttribute("stdDeviation")).toMatch(/^[\d.]+ 0$/);
  });

  it("expands a ripple ring while the button is held", () => {
    const instance = boot(Ripple({ size: 80, interval: 100 }));
    const el = elementOf(instance, "ripple");

    press();
    instance.step((clock += 16));

    const rings = Array.from(el.querySelectorAll("circle")).filter(
      (circle) => Number(circle.getAttribute("r")) > 0
    );
    expect(rings).toHaveLength(1);

    const first = Number(rings[0].getAttribute("r"));
    instance.step((clock += 120));
    expect(Number(rings[0].getAttribute("r"))).toBeGreaterThan(first);
    release();
  });

  it("builds the lens out of a backdrop filter", () => {
    const instance = boot(Lens({ blur: 7, saturation: 2 }));
    const el = elementOf(instance, "lens");

    expect(el.style.backdropFilter).toContain("blur(7px)");
    expect(el.style.backdropFilter).toContain("saturate(2)");
    expect(el.style.boxShadow).toContain("inset");
  });

  it("tiles the halftone disc with a dot gradient", () => {
    const instance = boot(Halftone({ cell: 12, dot: 0.3, react: false }));
    const el = elementOf(instance, "halftone");

    expect(el.style.backgroundImage).toContain("radial-gradient");
    expect(el.style.backgroundSize).toBe("12.00px 12.00px");
    expect(el.style.maskImage).toContain("radial-gradient");
  });

  it("tightens the halftone grid as the pointer accelerates", () => {
    const instance = boot(Halftone({ cell: 12 }));
    const el = elementOf(instance, "halftone");
    const [width, height] = el.style.backgroundSize.split(" ");

    // The grid is square, and a moving pointer loads it: strictly tighter than
    // the resting pitch, never collapsed to nothing.
    expect(width).toBe(height);
    expect(parseFloat(width)).toBeLessThan(12);
    expect(parseFloat(width)).toBeGreaterThan(6);
  });

  it("opens a spotlight disc inside a matched container and takes it away again", () => {
    const surface = document.createElement("div");
    surface.setAttribute("data-supermouse-spotlight", "true");
    document.body.appendChild(surface);

    const instance = boot(Spotlight({ selector: "[data-supermouse-spotlight]" }));
    const reveal = surface.querySelector("div");

    expect(reveal).not.toBeNull();
    expect(reveal?.style.transform).toContain("translate3d");
    expect(surface.style.position).toBe("relative");

    instance.destroy();
    expect(surface.querySelector("div")).toBeNull();
    app = undefined;
  });

  it("never tears the glitch edge at zero chaos", () => {
    const { instance, tick } = bootOnClock(Glitch({ intensity: 10, chaos: 0 }));
    const el = elementOf(instance, "glitch");
    const displacement = el.querySelector("feDisplacementMap");
    const band = el.querySelector("clipPath rect");

    // Sixty 16ms frames is about a second — many burst windows — and `chaos` is
    // the tear rate, so at zero there is nothing for them to cross.
    for (let i = 0; i < 60; i++) instance.step(tick(16));

    // The idle instability is 0.18 × intensity, and the tear band stays shut.
    expect(Number(displacement?.getAttribute("scale"))).toBeCloseTo(1.8, 5);
    expect(band?.getAttribute("height")).toBe("0");
  });

  it("tears the glitch edge once chaos is high", () => {
    const { instance, tick } = bootOnClock(Glitch({ intensity: 10, chaos: 1 }));
    const el = elementOf(instance, "glitch");
    const displacement = el.querySelector("feDisplacementMap");

    let peak = 0;
    for (let i = 0; i < 80; i++) {
      instance.step(tick(16));
      peak = Math.max(peak, Number(displacement?.getAttribute("scale")));
    }

    // A live tear lifts the displacement to 0.9 × intensity.
    expect(peak).toBeCloseTo(9, 5);
  });

  it("rescans for spotlight containers on its interval, not every frame", () => {
    const spy = vi.spyOn(document, "querySelectorAll");
    const selector = "[data-supermouse-spotlight]";

    const instance = boot(Spotlight({ selector, rescan: 400 }));
    for (let i = 0; i < 8; i++) instance.step((clock += 16));

    // One scan, on the first frame. A page with no containers must not turn the
    // interval into a per-frame layout query.
    expect(spy.mock.calls.filter(([arg]) => arg === selector)).toHaveLength(1);
  });

  it("hands back the positioning a spotlight borrows from its container", () => {
    const surface = document.createElement("div");
    surface.setAttribute("data-supermouse-spotlight", "true");
    document.body.appendChild(surface);

    const instance = boot(Spotlight({ selector: "[data-supermouse-spotlight]" }));
    expect(surface.style.position).toBe("relative");

    instance.destroy();
    expect(surface.querySelector("div")).toBeNull();
    // Restoring only what it changed is the same rule the core stage follows.
    expect(surface.style.position).toBe("");
    app = undefined;
  });

  it("steals the oldest ripple rather than swallowing a press", () => {
    const instance = boot(Ripple({ count: 1, size: 60, interval: 40, hold: false }));
    const el = elementOf(instance, "ripple");
    const ring = el.querySelector("circle") as SVGCircleElement;

    press();
    instance.step((clock += 16));
    release();
    for (let i = 0; i < 8; i++) instance.step((clock += 16));

    const grown = Number(ring.getAttribute("r"));
    expect(grown).toBeGreaterThan(1);

    // Press again with the only ring still in flight: the pool has nowhere to
    // put it unless the oldest yields, so the ring restarts rather than the
    // press being dropped.
    press();
    instance.step((clock += 16));
    release();
    expect(Number(ring.getAttribute("r"))).toBeLessThan(grown);
  });

  /**
   * jsdom discards a property it does not implement, and it does not implement
   * the vendor-prefixed spellings — so the prefixed half is checked where it is
   * written, on the style declaration itself.
   */
  const writtenProperties = (): ReturnType<typeof vi.spyOn> =>
    vi.spyOn(Object.getPrototypeOf(document.createElement("div").style), "setProperty");

  it("writes the lens backdrop filter under both spellings", () => {
    const spy = writtenProperties();
    const instance = boot(Lens({ blur: 7 }));
    const el = elementOf(instance, "lens");
    void instance;

    const written = (property: string): string =>
      String(
        spy.mock.calls.find(
          ([name, value]: [string, string]) =>
            name === property && String(value).includes("blur(7px)")
        )?.[1] ?? ""
      );

    expect(el.style.getPropertyValue("backdrop-filter")).toContain("blur(7px)");
    expect(written("backdrop-filter")).not.toBe("");
    expect(written("-webkit-backdrop-filter")).toBe(written("backdrop-filter"));
  });

  it("writes the halftone rim mask under both spellings", () => {
    const spy = writtenProperties();
    const instance = boot(Halftone({ mask: true }));
    const el = elementOf(instance, "halftone");
    void instance;

    const written = (property: string): string =>
      String(
        spy.mock.calls.find(
          ([name, value]: [string, string]) =>
            name === property && String(value).includes("radial-gradient")
        )?.[1] ?? ""
      );

    expect(el.style.getPropertyValue("mask-image")).toContain("radial-gradient");
    expect(written("mask-image")).not.toBe("");
    expect(written("-webkit-mask-image")).toBe(written("mask-image"));
  });
});
