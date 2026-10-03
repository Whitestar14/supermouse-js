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
});
