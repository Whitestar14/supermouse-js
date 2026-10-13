import { describe, it, expect, afterEach, beforeEach } from "vitest";
import { Supermouse } from "../Supermouse";
import { hasHideClass, movePointer } from "./helpers";

describe("Cursor state applies synchronously on hover and mode changes", () => {
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
  });

  it("applies cursor suppression on the same task as mouseover", () => {
    app = new Supermouse({ container, autoStart: false, cursor: "auto" });
    movePointer(100, 100);

    const div = document.createElement("div");
    container.appendChild(div);
    div.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));

    // No rAF step. The class should already be toggled.
    expect(hasHideClass(container)).toBe(true);
  });

  it("setCursor applies synchronously without waiting for rAF", () => {
    app = new Supermouse({ container, autoStart: false, cursor: "auto" });
    movePointer(100, 100);

    const div = document.createElement("div");
    container.appendChild(div);
    div.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
    expect(hasHideClass(container)).toBe(true);

    app.setCursor("native");

    // No rAF step. The class should be off.
    expect(hasHideClass(container)).toBe(false);
  });

  it("setCursor applies synchronously on the active scope", () => {
    app = new Supermouse({ container, autoStart: false, cursor: "auto" });
    movePointer(100, 100);

    const div = document.createElement("div");
    container.appendChild(div);
    div.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));

    app.setCursor("native");
    expect(hasHideClass(container)).toBe(false);
  });

  it("deactivate applies the new active scope synchronously", () => {
    const primary = document.createElement("div");
    const nested = document.createElement("div");
    document.body.append(primary, nested);

    app = new Supermouse({ container: primary, autoStart: false, cursor: "custom" });
    const handle = app.addScope({ name: "nested", container: nested, cursor: "native" });

    movePointer(100, 100);

    nested.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
    expect(app.state.scope?.name).toBe("nested");
    expect(hasHideClass(nested)).toBe(false);
    expect(hasHideClass(primary)).toBe(false);

    handle.deactivate();

    // Synchronously, without rAF:
    expect(app.state.scope?.container).toBe(primary);
    expect(hasHideClass(primary)).toBe(true);
  });

  it("setCursor('native' and 'both') releases suppression on scopes the pointer has left", () => {
    const primary = document.createElement("div");
    const nested = document.createElement("div");
    document.body.append(primary, nested);

    app = new Supermouse({ container: primary, autoStart: false, cursor: "auto" });
    app.addScope({ name: "nested", container: nested, cursor: "auto" });

    movePointer(100, 100);

    nested.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
    expect(hasHideClass(nested)).toBe(true);

    // Leave the nested scope; its class is retained on purpose.
    const page = document.createElement("div");
    primary.appendChild(page);
    page.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
    expect(hasHideClass(nested)).toBe(true);

    app.setCursor("native");

    // The engine is no longer hiding the OS pointer anywhere, so nothing may
    // keep the native cursor suppressed.
    expect(app.state.cursorMode).toBe("native");
    expect(hasHideClass(primary)).toBe(false);
    expect(hasHideClass(nested)).toBe(false);

    // Same for `both`, which also draws the stage.
    app.setCursor("auto");
    nested.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
    expect(hasHideClass(nested)).toBe(true);

    page.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
    app.setCursor("both");

    expect(hasHideClass(primary)).toBe(false);
    expect(hasHideClass(nested)).toBe(false);
    expect(app.stage.style.opacity).toBe("1");
  });

  it("deactivating a scope releases its suppression under a native ambient cursor", () => {
    const primary = document.createElement("div");
    const nested = document.createElement("div");
    document.body.append(primary, nested);

    app = new Supermouse({ container: primary, autoStart: false, cursor: "native" });
    const handle = app.addScope({ name: "nested", container: nested, cursor: "custom" });

    movePointer(100, 100);

    nested.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
    expect(hasHideClass(nested)).toBe(true);

    handle.deactivate();

    // Nothing draws a custom cursor over the region any more, and an inactive
    // scope is never resolved again — the class has to go now.
    expect(hasHideClass(nested)).toBe(false);
    expect(hasHideClass(primary)).toBe(false);
  });

  it("disable() releases suppression on scopes the pointer has left", () => {
    const primary = document.createElement("div");
    const nested = document.createElement("div");
    document.body.append(primary, nested);

    app = new Supermouse({ container: primary, autoStart: false, cursor: "auto" });
    app.addScope({ name: "nested", container: nested, cursor: "auto" });

    movePointer(100, 100);

    nested.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
    expect(hasHideClass(nested)).toBe(true);

    // Leave the nested scope. Its suppression is left in place on purpose, so
    // re-entering it is flash-free — but it must not outlive the engine.
    const page = document.createElement("div");
    primary.appendChild(page);
    page.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
    expect(hasHideClass(nested)).toBe(true);

    app.disable();

    expect(hasHideClass(nested)).toBe(false);
    expect(hasHideClass(primary)).toBe(false);
  });

  it("auto-disabling for a coarse pointer releases suppression on every scope", () => {
    const original = window.matchMedia;
    const changes: Array<(event: { matches: boolean }) => void> = [];

    window.matchMedia = ((query: string) => {
      if (query !== "(pointer: fine)") return original(query);
      return {
        matches: true,
        media: query,
        addEventListener: (_type: string, handler: (e: { matches: boolean }) => void) => {
          changes.push(handler);
        },
        removeEventListener: () => {},
        dispatchEvent: () => false
      } as unknown as MediaQueryList;
    }) as typeof window.matchMedia;

    try {
      const primary = document.createElement("div");
      const nested = document.createElement("div");
      document.body.append(primary, nested);

      app = new Supermouse({ container: primary, autoStart: false, cursor: "auto" });
      app.addScope({ name: "nested", container: nested, cursor: "auto" });

      movePointer(100, 100);

      nested.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
      const page = document.createElement("div");
      primary.appendChild(page);
      page.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
      expect(hasHideClass(nested)).toBe(true);

      changes[0]?.({ matches: false });

      expect(app.isEnabled).toBe(false);
      expect(hasHideClass(nested)).toBe(false);
      expect(hasHideClass(primary)).toBe(false);
    } finally {
      window.matchMedia = original;
    }
  });
});
