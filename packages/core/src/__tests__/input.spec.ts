import { describe, it, expect, afterEach, vi, beforeEach } from "vitest";
import { Supermouse } from "../Supermouse";

describe("Supermouse input handling", () => {
  let app: Supermouse;
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    // Ensure the container is not body for relative coordinate tests
    app = new Supermouse({ container, autoStart: false });
  });

  afterEach(() => {
    app?.destroy();
    document.body.innerHTML = "";
    document.head.innerHTML = "";
    vi.restoreAllMocks();
  });

  function dispatchPointerMove(x: number, y: number, pointerType = "mouse") {
    const event = new PointerEvent("pointermove", {
      clientX: x,
      clientY: y,
      pointerType,
      bubbles: true
    });
    window.dispatchEvent(event);
  }

  function dispatchPointerDown() {
    window.dispatchEvent(new PointerEvent("pointerdown", { pointerType: "mouse", bubbles: true }));
  }

  function dispatchPointerUp() {
    window.dispatchEvent(new PointerEvent("pointerup", { pointerType: "mouse", bubbles: true }));
  }

  function dispatchMouseOver(target: HTMLElement) {
    target.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
  }

  function dispatchMouseOut(target: HTMLElement, relatedTarget?: Node) {
    const event = new MouseEvent("mouseout", {
      bubbles: true,
      relatedTarget: relatedTarget ?? null
    });
    target.dispatchEvent(event);
  }

  it("updates pointer and sets hasReceivedInput on first move", () => {
    dispatchPointerMove(100, 150);
    expect(app.state.pointer).toEqual({ x: 100, y: 150 });
    expect(app.state.hasReceivedInput).toBe(true);
  });

  it("continues updating pointer on subsequent moves", () => {
    dispatchPointerMove(100, 150);
    dispatchPointerMove(200, 250);
    expect(app.state.pointer).toEqual({ x: 200, y: 250 });
  });

  it("ignores touch events when autoDisableOnMobile is true and enableTouch is false", () => {
    // Simulate a coarse pointer device by mocking matchMedia
    vi.spyOn(window, "matchMedia").mockImplementation(
      (query) =>
        ({
          matches: query === "(pointer: fine)" ? false : false,
          media: query,
          onchange: null,
          addListener: () => {},
          removeListener: () => {},
          addEventListener: () => {},
          removeEventListener: () => {},
          dispatchEvent: () => false
        }) as MediaQueryList
    );

    // Recreate app with the mock (need to destroy previous)
    app.destroy();
    app = new Supermouse({ container, autoStart: false });

    dispatchPointerMove(50, 60, "touch");
    // Touch should be ignored, so pointer remains offscreen
    expect(app.state.pointer).toEqual({ x: -100, y: -100 });
    expect(app.state.hasReceivedInput).toBe(false);
  });

  it("sets isDown on pointerdown and clears on pointerup", () => {
    dispatchPointerDown();
    expect(app.state.isDown).toBe(true);
    dispatchPointerUp();
    expect(app.state.isDown).toBe(false);
  });

  it("detects hover on registered selector and parses data attributes", () => {
    const link = document.createElement("a");
    link.setAttribute("data-supermouse-text", "Hello");
    link.setAttribute("data-supermouse-icon", "pointer");
    link.setAttribute("data-supermouse-magnetic", ""); // empty becomes true
    container.appendChild(link);

    dispatchMouseOver(link);

    expect(app.state.isHover).toBe(true);
    expect(app.state.hoverTarget).toBe(link);
    expect(app.state.interaction).toEqual({
      text: "Hello",
      icon: "pointer",
      magnetic: true
    });
  });

  it("clears hover state on mouseout", () => {
    const link = document.createElement("a");
    container.appendChild(link);

    dispatchMouseOver(link);
    expect(app.state.isHover).toBe(true);

    dispatchMouseOut(link);
    expect(app.state.isHover).toBe(false);
    expect(app.state.hoverTarget).toBeNull();
    expect(app.state.interaction).toEqual({});
  });

  it("sets isNative for input elements when ignoreOnNative is auto", () => {
    const input = document.createElement("input");
    container.appendChild(input);

    dispatchMouseOver(input);

    expect(app.state.isNative).toBe(true);
  });

  it("sets isNative for elements with custom CSS cursor", () => {
    const div = document.createElement("div");
    div.style.cursor = "text"; // not in SUPERMOUSE_CURSORS
    container.appendChild(div);

    dispatchMouseOver(div);

    expect(app.state.isNative).toBe(true);
  });

  it("does not set isNative for elements with default cursor", () => {
    const div = document.createElement("div");
    // default cursor is auto/default, which is in SUPERMOUSE_CURSORS
    container.appendChild(div);

    dispatchMouseOver(div);

    expect(app.state.isNative).toBe(false);
  });

  it("sets isNative when element has ignore attribute", () => {
    const div = document.createElement("div");
    div.setAttribute("data-supermouse-ignore", "");
    container.appendChild(div);

    dispatchMouseOver(div);

    expect(app.state.isNative).toBe(true);
  });

  it("does not set isHover when element does not match hover selector", () => {
    const span = document.createElement("span");
    container.appendChild(span);

    dispatchMouseOver(span);

    expect(app.state.isHover).toBe(false);
    expect(app.state.hoverTarget).toBeNull();
  });

  it("resets pointer to offscreen on document mouseleave when hideOnLeave is true", () => {
    dispatchPointerMove(100, 100);
    expect(app.state.pointer).toEqual({ x: 100, y: 100 });

    const leaveEvent = new MouseEvent("mouseleave", { bubbles: false });
    document.dispatchEvent(leaveEvent);

    expect(app.state.hasReceivedInput).toBe(false);
    expect(app.state.pointer).toEqual({ x: -100, y: -100 });
  });

  it("does not reset pointer on mouseleave if hideOnLeave is false", () => {
    app.destroy();
    app = new Supermouse({ container, autoStart: false, hideOnLeave: false });

    dispatchPointerMove(100, 100);
    const leaveEvent = new MouseEvent("mouseleave", { bubbles: false });
    document.dispatchEvent(leaveEvent);

    expect(app.state.hasReceivedInput).toBe(true);
    expect(app.state.pointer).toEqual({ x: 100, y: 100 });
  });

  it("makes coordinates relative to container", () => {
    const rect = {
      left: 200,
      top: 300,
      right: 500,
      bottom: 600,
      width: 300,
      height: 300,
      x: 200,
      y: 300,
      toJSON: () => {}
    };
    vi.spyOn(container, "getBoundingClientRect").mockReturnValue(rect as DOMRect);

    window.dispatchEvent(new Event("resize"));

    dispatchPointerMove(250, 350);

    expect(app.state.pointer).toEqual({ x: 50, y: 50 });
  });

  it("ignores all custom behavior inside data-supermouse-ignore area", () => {
    app = new Supermouse({ container, autoStart: false });

    // Create ignored wrapper
    const ignored = document.createElement("div");
    ignored.setAttribute("data-supermouse-ignore", "");
    const innerButton = document.createElement("button");
    innerButton.setAttribute("data-supermouse-text", "Hello");
    ignored.appendChild(innerButton);
    container.appendChild(ignored);

    // Spy on parseDOMInteraction to ensure it's not called
    const input = (app as any).input;
    const parseSpy = vi.spyOn(input, "parseDOMInteraction");

    // Hover the inner button (inside ignored area)
    innerButton.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));

    // Expect no interaction parsing
    expect(parseSpy).not.toHaveBeenCalled();
    // Native cursor shown
    expect(app.state.isNative).toBe(true);
    // Hover state cleared
    expect(app.state.isHover).toBe(false);
    expect(app.state.hoverTarget).toBeNull();
    // Interaction data empty
    expect(app.state.interaction).toEqual({});

    // Now move to a normal element outside ignored area
    const normalButton = document.createElement("button");
    container.appendChild(normalButton);
    normalButton.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));

    // Normal behavior should resume
    expect(app.state.isNative).toBe(false);
    expect(app.state.isHover).toBe(true);
    expect(app.state.hoverTarget).toBe(normalButton);
    // Interaction parsing should happen again
    expect(parseSpy).toHaveBeenCalled();
  });
});
