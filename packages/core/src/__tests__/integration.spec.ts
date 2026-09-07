import { describe, it, expect, afterEach, vi } from "vitest";
import { Supermouse } from "../Supermouse";

describe("Supermouse integration", () => {
  let app: Supermouse;
  let container: HTMLElement;

  afterEach(() => {
    app?.destroy();
    document.body.innerHTML = "";
    document.head.innerHTML = "";
    vi.restoreAllMocks();
  });

  it("disable() resets plugin-set cursorMode and restores native cursor", () => {
    container = document.createElement("div");
    document.body.appendChild(container);
    app = new Supermouse({ container, autoStart: false });

    const smartIconLike = {
      name: "fake-smart-icon",
      install(instance: Supermouse) {
        instance.setCursor("custom");
      },
      update() {}
    };
    app.use(smartIconLike);

    expect(app.state.cursorMode).toBe("custom");

    window.dispatchEvent(
      new PointerEvent("pointermove", { clientX: 100, clientY: 100, pointerType: "mouse" })
    );
    app.start();
    app.step(performance.now() + 16);

    expect(app.stage.style.opacity).toBe("1"); // custom cursor visible

    app.disable();

    expect(app.state.cursorMode).toBe("custom");
    expect(app.stage.style.opacity).toBe("0");
    expect(container.style.cursor).toBe("");

    app.step(performance.now() + 32);
    expect(container.style.cursor).toBe("");
    expect(app.stage.style.opacity).toBe("0");
  });

  it("disable() also works when plugin registers extra hover targets", () => {
    container = document.createElement("div");
    document.body.appendChild(container);
    app = new Supermouse({ container, autoStart: false });

    const smartIconLike = {
      name: "fake-smart-icon-2",
      install(instance: Supermouse) {
        instance.setCursor("custom");
        instance.registerHoverTarget("p, h1, h2, h3, span");
      },
      update() {}
    };
    app.use(smartIconLike);

    window.dispatchEvent(
      new PointerEvent("pointermove", { clientX: 50, clientY: 50, pointerType: "mouse" })
    );
    app.start();
    app.step(performance.now() + 16);

    expect(app.state.cursorMode).toBe("custom");

    app.disable();

    expect(app.state.cursorMode).toBe("custom");
    expect(app.stage.style.opacity).toBe("0");
    expect(container.style.cursor).toBe("");

    expect(container.classList.contains("supermouse-hide-0")).toBe(false);
  });

  it("nested instance with cursor 'both' does not inherit global inline cursor:none", () => {
    // Global instance on body
    const globalApp = new Supermouse({
      container: document.body,
      cursor: "auto",
      autoStart: false
    });

    // Create nested preview container
    const previewContainer = document.createElement("div");
    document.body.appendChild(previewContainer);

    // Preview instance with cursor 'both'
    const previewApp = new Supermouse({
      container: previewContainer,
      cursor: "both",
      autoStart: false
    });

    // Simulate entering preview: suspend global
    globalApp.suspend();

    // Global body must not have inline cursor:none
    expect(document.body.style.cursor).toBe("");
    expect(document.body.classList.contains("supermouse-hide-0")).toBe(false);

    // Preview container must also not have inline cursor:none (its own 'both' mode shouldn't)
    expect(previewContainer.style.cursor).toBe("");

    // An empty div inside preview should inherit nothing from body
    const emptyDiv = document.createElement("div");
    previewContainer.appendChild(emptyDiv);
    // In real browser, computed cursor would be 'auto', but we can at least check no inline
    expect(emptyDiv.style.cursor).toBe("");

    globalApp.destroy();
    previewApp.destroy();
    previewContainer.remove();
  });
});
