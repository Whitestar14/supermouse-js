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

  it("disable() preserves plugin-set cursorMode and restores native cursor", () => {
    container = document.createElement("div");
    document.body.appendChild(container);
    app = new Supermouse({ container, autoStart: false });

    app.use({
      name: "fake-smart-icon",
      install(instance: Supermouse) { instance.setCursor("custom"); },
      update() {}
    });

    expect(app.state.cursorMode).toBe("custom");

    window.dispatchEvent(
      new PointerEvent("pointermove", { clientX: 100, clientY: 100, pointerType: "mouse" })
    );
    app.start();
    app.step(performance.now() + 16);
    expect(app.stage.style.opacity).toBe("1");

    app.disable();
    expect(app.state.cursorMode).toBe("custom");
    expect(app.stage.style.opacity).toBe("0");
    expect(container.style.cursor).toBe("auto");

    app.step(performance.now() + 32);
    expect(app.stage.style.opacity).toBe("0");
  });

  it("plugins can register extra hover targets at install time", () => {
    container = document.createElement("div");
    document.body.appendChild(container);
    app = new Supermouse({ container, autoStart: false });

    app.use({
      name: "fake-smart-icon-2",
      install(instance: Supermouse) {
        instance.setCursor("custom");
        instance.registerHoverTarget("p, h1, h2, h3, span");
      },
      update() {}
    });

    // Plugin is installed and its hover selectors are registered.
    expect(app.getPlugin("fake-smart-icon-2")).toBeDefined();
    expect(Array.from(app.hoverSelectors)).toEqual(
      expect.arrayContaining(["p", "h1", "h2", "h3", "span"])
    );
  });

  it("scoped containers do not inherit native cursor:none from a parent scope", () => {
    const globalApp = new Supermouse({ container: document.body, cursor: "auto", autoStart: false });

    const preview = document.createElement("div");
    document.body.appendChild(preview);

    globalApp.addScope({ name: "preview", container: preview, cursor: "both" });

    // Global scope hides native cursor
    globalApp.setCursor("custom");
    globalApp.step(performance.now() + 16);
    expect(document.body.style.cursor).toBe("none");

    // Enter preview scope
    preview.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
    globalApp.step(performance.now() + 16);

    // Preview container sets its own inline cursor to override inherited none.
    expect(preview.style.cursor).toBe("auto");

    globalApp.destroy();
    preview.remove();
  });
});