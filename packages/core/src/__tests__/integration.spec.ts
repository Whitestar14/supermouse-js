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
      install(instance: Supermouse) {
        instance.setCursor("custom");
      },
      update() {}
    });

    expect(app.state.cursorMode).toBe("custom");

    window.dispatchEvent(
      new PointerEvent("pointermove", { clientX: 100, clientY: 100, pointerType: "mouse" })
    );
    app.start();
    app.step(performance.now() + 16);
    expect(app.stage.style.opacity).toBe("1");
    expect(Array.from(container.classList).some((c) => c.startsWith("supermouse-hide-"))).toBe(
      true
    );

    app.disable();
    expect(app.state.cursorMode).toBe("custom");
    expect(app.stage.style.opacity).toBe("0");
    expect(Array.from(container.classList).some((c) => c.startsWith("supermouse-hide-"))).toBe(
      false
    );

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
    expect(Array.from((app as any)._scopes[0].hoverSelectors)).toEqual(
      expect.arrayContaining(["p", "h1", "h2", "h3", "span"])
    );
  });

  it("scoped containers get their own hide class, independent of the outer scope", () => {
    const globalApp = new Supermouse({
      container: document.body,
      cursor: "auto",
      autoStart: false
    });

    const preview = document.createElement("div");
    document.body.appendChild(preview);

    const handle = globalApp.addScope({
      name: "preview",
      container: preview,
      cursor: "both"
    });

    // Global scope is custom; body has the hide class.
    globalApp.setCursor("custom");
    globalApp.step(performance.now() + 16);
    expect(Array.from(document.body.classList).some((c) => c.startsWith("supermouse-hide-"))).toBe(
      true
    );

    // Enter preview scope.
    preview.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
    globalApp.step(performance.now() + 16);

    // Preview scope in "both" mode has no hide class of its own. The
    // engine-level `:where()` rule handles the cascade override in real
    // browsers; jsdom can only observe the class toggle.
    expect(handle.container).toBe(preview);
    expect(globalApp.state.cursorMode).toBe("both");
    expect(Array.from(preview.classList).some((c) => c.startsWith("supermouse-hide-"))).toBe(false);

    globalApp.destroy();
    preview.remove();
  });
});
