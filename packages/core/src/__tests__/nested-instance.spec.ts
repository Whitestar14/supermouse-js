import { describe, it, expect, afterEach } from "vitest";
import { Supermouse } from "../Supermouse";

describe("Nested scope handling", () => {
  let app: Supermouse;

  afterEach(() => {
    app?.destroy();
    document.body.innerHTML = "";
    document.head.innerHTML = "";
  });

  it("nested scope with cursor 'both' shows native cursor over its container", () => {
    app = new Supermouse({ container: document.body, cursor: "auto", autoStart: false });

    const preview = document.createElement("div");
    document.body.appendChild(preview);

    app.addScope({ name: "preview", container: preview, cursor: "both" });

    // Force the outer scope to hide the native cursor.
    app.setCursor("custom");
    app.step(performance.now() + 16);
    expect(document.body.style.cursor).toBe("none");

    // Enter preview scope.
    preview.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
    app.step(performance.now() + 16);

    // Preview scope in "both" mode sets its own cursor to "auto",
    // overriding the inherited "none".
    expect(preview.style.cursor).toBe("auto");
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
