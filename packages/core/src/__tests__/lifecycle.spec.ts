import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
import { Supermouse } from "../Supermouse";

describe("Supermouse lifecycle", () => {
  let app: Supermouse;
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    app?.destroy();
    document.body.innerHTML = "";
    document.head.innerHTML = "";
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  function movePointer(x: number, y: number) {
    window.dispatchEvent(
      new PointerEvent("pointermove", {
        clientX: x,
        clientY: y,
        pointerType: "mouse",
        bubbles: true
      })
    );
  }

  const hasClassPrefix = (el: HTMLElement, prefix: string) =>
    Array.from(el.classList).some((c) => c.startsWith(prefix));

  it("auto-starts the loop when autoStart is true", () => {
    const startLoopSpy = vi.spyOn(Supermouse.prototype as any, "startLoop");
    app = new Supermouse({ autoStart: true, container });
    expect(startLoopSpy).toHaveBeenCalledTimes(1);
  });

  it("does not auto-start when autoStart is false", () => {
    const startLoopSpy = vi.spyOn(Supermouse.prototype as any, "startLoop");
    app = new Supermouse({ autoStart: false, container });
    expect(startLoopSpy).not.toHaveBeenCalled();
  });

  it("start() starts the loop and is idempotent", () => {
    app = new Supermouse({ autoStart: false, container });
    const rafSpy = vi.spyOn(window, "requestAnimationFrame").mockReturnValue(1);
    app.start();
    expect(rafSpy).toHaveBeenCalledTimes(1);
    app.start();
    expect(rafSpy).toHaveBeenCalledTimes(1);
  });

  it("disable() disables input, restores native cursor, and resets physics", () => {
    app = new Supermouse({ autoStart: false, container });
    movePointer(50, 60);
    app.start();

    app.disable();

    expect(app.input.isEnabled).toBe(false);
    expect(container.style.cursor).toBe(""); // original (empty)
    expect(app.state.target).toEqual({ x: -100, y: -100 });
    expect(app.state.smooth).toEqual({ x: -100, y: -100 });
    expect(app.state.velocity).toEqual({ x: 0, y: 0 });
    expect(app.state.displacement).toEqual({ x: 0, y: 0 });
    expect(app.state.hasReceivedInput).toBe(false);
  });

  it("enable() re-enables input, snaps to current pointer, and hides native cursor", () => {
    app = new Supermouse({ autoStart: false, container });
    movePointer(200, 250);
    app.start();
    app.disable();
    app.enable();

    expect(app.input.isEnabled).toBe(true);
    expect(app.state.hasReceivedInput).toBe(true);
    expect(app.state.target).toEqual({ x: 200, y: 250 });
    expect(app.state.smooth).toEqual({ x: 200, y: 250 });

    expect(hasClassPrefix(container, "supermouse-hide-")).toBe(true);
    expect(container.style.cursor).toBe("none");
  });

  it("suspend() disables input, clears hover, hides stage", () => {
    app = new Supermouse({ autoStart: false, container });
    // Simulate hovering an element
    const link = document.createElement("a");
    container.appendChild(link);
    link.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
    expect(app.state.isHover).toBe(true);

    app.start();
    app.suspend();

    expect(app.input.isEnabled).toBe(false);
    expect(app.state.isHover).toBe(false);
    expect(app.state.hoverTarget).toBeNull();
    expect(app.state.interaction).toEqual({});
    expect(app.stage.style.opacity).toBe("0");
  });

  it("resume() re-enables input, snaps physics, and shows stage", () => {
    app = new Supermouse({ autoStart: false, container });
    movePointer(300, 400);
    app.start();
    app.suspend();

    const updateSpy = vi.fn();
    app.use({ name: "test", update: updateSpy });
    app.resume();

    expect(app.input.isEnabled).toBe(true);
    expect(app.state.target).toEqual({ x: 300, y: 400 });
    expect(app.state.smooth).toEqual({ x: 300, y: 400 });
    expect(app.stage.style.opacity).toBe("1");
    expect(updateSpy).toHaveBeenCalledWith(app, 0);
  });

  it("manual step advances physics and updates velocity/displacement", () => {
    app = new Supermouse({ autoStart: false, container });
    app.input.isEnabled = true;
    app.state.hasReceivedInput = true;
    app.state.pointer = { x: 100, y: 100 };
    app.state.target = { x: 100, y: 100 };
    app.state.smooth = { x: 0, y: 0 };
    app.start();

    const now = performance.now() + 16;
    app.step(now);

    expect(app.state.smooth.x).toBeGreaterThan(0);
    expect(app.state.smooth.x).toBeLessThan(100);
    expect(app.state.velocity.x).not.toBe(0);
    expect(app.state.displacement.x).toBeCloseTo(100 - app.state.smooth.x);
    expect(app.state.displacement.y).toBeCloseTo(100 - app.state.smooth.y);
  });

  it("pauses loop on document hidden and resumes on visible", () => {
    app = new Supermouse({ autoStart: false, container });
    const cancelSpy = vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => {});
    const rafSpy = vi.spyOn(window, "requestAnimationFrame").mockReturnValue(1);
    app.start();

    Object.defineProperty(document, "hidden", { value: true, configurable: true });
    Object.defineProperty(document, "visibilityState", { value: "hidden", configurable: true });
    document.dispatchEvent(new Event("visibilitychange"));

    expect(cancelSpy).toHaveBeenCalled();

    Object.defineProperty(document, "hidden", { value: false, configurable: true });
    Object.defineProperty(document, "visibilityState", { value: "visible", configurable: true });
    document.dispatchEvent(new Event("visibilitychange"));

    expect(rafSpy).toHaveBeenCalledTimes(2); // initial + resume
  });

  it("destroy() stops loop, removes event listeners, stage, and plugins", () => {
    const destroyPluginSpy = vi.fn();

    app = new Supermouse({ autoStart: false, container });
    const stageEl = app.stage;
    const styleTag = document.querySelector('style[id^="supermouse-style-"]');
    app.use({ name: "plugin", destroy: destroyPluginSpy });

    app.destroy();

    expect(app.isRunning).toBe(false);
    expect(document.body.contains(stageEl)).toBe(false);
    expect(document.head.contains(styleTag)).toBe(false);
    expect(destroyPluginSpy).toHaveBeenCalled();
    expect(container.style.cursor).toBe("");
    expect(container.classList.contains("supermouse-scope")).toBe(false);
  });

  it("disable() hides the custom cursor stage", () => {
    app = new Supermouse({ autoStart: false });
    // Simulate pointer presence
    window.dispatchEvent(
      new PointerEvent("pointermove", { clientX: 100, clientY: 100, pointerType: "mouse" })
    );
    expect(app.stage.style.opacity).toBe("1");

    app.disable();

    expect(app.stage.style.opacity).toBe("0");
    expect(container.style.cursor).toBe("");
  });

  it("disable() preserves cursorMode", () => {
    app = new Supermouse({ autoStart: false });
    app.setCursor("custom");
    app.disable();
    expect(app.state.cursorMode).toBe("custom");
  });
});
