import { describe, it, expect, afterEach } from "vitest";
import { Supermouse } from "../Supermouse";

describe("Nested scope handling", () => {
  let app: Supermouse;

  afterEach(() => {
    app?.destroy();
    document.body.innerHTML = "";
    document.head.innerHTML = "";
  });

  const hasHide = (el: HTMLElement) =>
    Array.from(el.classList).some((c) => c.startsWith("supermouse-hide-"));

  it("nested scope with cursor 'both' has no hide class of its own", () => {
    app = new Supermouse({ container: document.body, cursor: "auto", autoStart: false });

    const preview = document.createElement("div");
    document.body.appendChild(preview);

    app.addScope({ name: "preview", container: preview, cursor: "both" });

    app.setCursor("custom");
    app.step(performance.now() + 16);
    expect(hasHide(document.body)).toBe(true);

    preview.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
    app.step(performance.now() + 16);

    // The preview scope is in "both" mode; it does not suppress.
    // The cascade that lets the native cursor through is verified in
    // the browser spike, not here.
    expect(hasHide(preview)).toBe(false);
    expect(app.state.cursorMode).toBe("both");
  });

  it("removing a scope restores the primary scope as active", () => {
    app = new Supermouse({ container: document.body, cursor: "auto", autoStart: false });

    const panel = document.createElement("div");
    document.body.appendChild(panel);

    const handle = app.addScope({ name: "panel", container: panel, cursor: "native" });

    panel.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
    app.step(performance.now() + 16);
    expect(app.state.cursorMode).toBe("native");

    handle.destroy();
    panel.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
    app.step(performance.now() + 16);
    expect(app.state.cursorMode).toBe("auto");
  });
});
