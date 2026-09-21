import { describe, it, expect, afterEach, vi } from "vitest";
import { Supermouse } from "../Supermouse";

describe("Supermouse cursor modes", () => {
  let app: Supermouse;
  let container: HTMLElement;

  afterEach(() => {
    app?.destroy();
    document.body.innerHTML = "";
    document.head.innerHTML = "";
    vi.restoreAllMocks();
  });

  const hasHide = (el: HTMLElement) =>
    Array.from(el.classList).some((c) => c.startsWith("supermouse-hide-"));

  function createApp(cursor: "auto" | "custom" | "native" | "both") {
    container = document.createElement("div");
    document.body.appendChild(container);
    app = new Supermouse({ container, cursor, autoStart: false });
  }

  function hoverElement(el: HTMLElement) {
    el.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
    app.step(performance.now() + 16);
  }

  function movePointer(x: number, y: number) {
    window.dispatchEvent(
      new PointerEvent("pointermove", { clientX: x, clientY: y, pointerType: "mouse" })
    );
  }

  it("auto mode marks native inputs as isNative and hides custom stage", () => {
    createApp("auto");
    const input = document.createElement("input");
    container.appendChild(input);
    movePointer(50, 50);
    hoverElement(input);

    expect(app.state.isNative).toBe(true);
    expect(app.stage.style.opacity).toBe("0");
    expect(hasHide(container)).toBe(false);
  });

  it("custom mode ignores native detection and shows custom cursor over inputs", () => {
    createApp("custom");
    const input = document.createElement("input");
    container.appendChild(input);
    movePointer(50, 50);
    hoverElement(input);

    expect(app.state.isNative).toBe(false);
    expect(app.stage.style.opacity).toBe("1");
    expect(hasHide(container)).toBe(true);
  });

  it("both mode shows custom cursor and keeps native cursor visible over inputs", () => {
    createApp("both");
    const input = document.createElement("input");
    container.appendChild(input);
    movePointer(50, 50);
    hoverElement(input);

    expect(app.state.isNative).toBe(false);
    expect(app.stage.style.opacity).toBe("1");
    expect(hasHide(container)).toBe(false);
  });

  it("native mode hides custom stage and keeps native cursor over inputs", () => {
    createApp("native");
    const input = document.createElement("input");
    container.appendChild(input);
    movePointer(50, 50);
    hoverElement(input);

    expect(app.state.isNative).toBe(false);
    expect(app.stage.style.opacity).toBe("0");
    expect(hasHide(container)).toBe(false);
  });

  it("auto mode respects data-supermouse-ignore attribute (still native)", () => {
    createApp("auto");
    const div = document.createElement("div");
    div.setAttribute("data-supermouse-ignore", "");
    container.appendChild(div);
    movePointer(50, 50);
    hoverElement(div);

    expect(app.state.isNative).toBe(true);
  });

  it("custom mode ignores data-supermouse-ignore and keeps custom", () => {
    createApp("custom");
    const div = document.createElement("div");
    div.setAttribute("data-supermouse-ignore", "");
    container.appendChild(div);
    movePointer(50, 50);
    hoverElement(div);

    expect(app.state.isNative).toBe(false);
    expect(app.stage.style.opacity).toBe("1");
    expect(hasHide(container)).toBe(true);
  });
});
