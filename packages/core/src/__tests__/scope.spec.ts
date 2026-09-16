import { describe, it, expect, afterEach, vi } from "vitest";
import { Supermouse } from "../Supermouse";

describe("Scope API", () => {
  let app: Supermouse;

  afterEach(() => {
    app?.destroy();
    document.body.innerHTML = "";
    document.head.innerHTML = "";
    vi.restoreAllMocks();
  });

  it("addScope returns a handle with the expected shape", () => {
    app = new Supermouse({ autoStart: false });
    const sidebar = document.createElement("div");
    document.body.appendChild(sidebar);

    const handle = app.addScope({ name: "sidebar", container: sidebar });

    expect(handle.name).toBe("sidebar");
    expect(handle.container).toBe(sidebar);
    expect(typeof handle.remove).toBe("function");
    expect(typeof handle.setCursor).toBe("function");
  });

  it("scopes passed to the constructor are registered", () => {
    const sidebar = document.createElement("div");
    document.body.appendChild(sidebar);

    app = new Supermouse({
      autoStart: false,
      scopes: [{ name: "sidebar", container: sidebar, cursor: "native" }]
    });

    sidebar.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
    app.step(performance.now() + 16);
    expect(app.state.cursorMode).toBe("native");
  });

  it("handle.setCursor updates the scope's cursor mode", () => {
    app = new Supermouse({ autoStart: false });
    const panel = document.createElement("div");
    document.body.appendChild(panel);

    const handle = app.addScope({ name: "panel", container: panel, cursor: "auto" });

    panel.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
    app.step(performance.now() + 16);
    expect(app.state.cursorMode).toBe("auto");

    handle.setCursor("native");
    expect(app.state.cursorMode).toBe("native");
  });

  it("scope deactivates its plugins when the pointer leaves the scope", () => {
    app = new Supermouse({ autoStart: false });
    const panel = document.createElement("div");
    document.body.appendChild(panel);

    const enabled = vi.fn();
    const disabled = vi.fn();
    app.addScope({
      name: "panel",
      container: panel,
      plugins: [{ name: "p", onEnable: enabled, onDisable: disabled }]
    });

    panel.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
    expect(enabled).toHaveBeenCalledTimes(1);

    document.body.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
    expect(disabled).toHaveBeenCalledTimes(1);
  });
});