import { describe, it, expect, afterEach, vi } from "vitest";
import { Supermouse } from "../Supermouse";

describe("Lazy selector-based scopes", () => {
  let app: Supermouse;

  afterEach(() => {
    app?.destroy();
    document.body.innerHTML = "";
    document.head.innerHTML = "";
    vi.restoreAllMocks();
  });

  it("resolves a scope when its selector is matched on hover", () => {
    app = new Supermouse({ autoStart: false });

    const handle = app.addScope({ name: "modal", container: "#modal" });
    expect(handle.resolved).toBe(false);
    expect(handle.container).toBeNull();

    const modal = document.createElement("div");
    modal.id = "modal";
    document.body.appendChild(modal);

    modal.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));

    expect(handle.resolved).toBe(true);
    expect(handle.container).toBe(modal);
    expect(app.state.scope?.container).toBe(modal);
  });

  it("stays dormant when no element matches", () => {
    app = new Supermouse({ autoStart: false });
    const handle = app.addScope({ name: "modal", container: "#modal" });

    const aside = document.createElement("div");
    document.body.appendChild(aside);
    aside.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));

    expect(handle.resolved).toBe(false);
    expect(app.state.scope?.container).toBe(document.body);
  });

  it("re-resolves when the container unmounts and a fresh match appears", () => {
    app = new Supermouse({ autoStart: false });
    const handle = app.addScope({ name: "modal", container: "#modal" });

    const first = document.createElement("div");
    first.id = "modal";
    document.body.appendChild(first);
    first.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
    expect(handle.container).toBe(first);

    first.remove();

    const second = document.createElement("div");
    second.id = "modal";
    document.body.appendChild(second);
    second.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));

    expect(handle.container).toBe(second);
  });

  it("installs plugins before the container resolves", () => {
    app = new Supermouse({ autoStart: false });
    const install = vi.fn();

    app.addScope({
      name: "modal",
      container: "#modal",
      plugins: [{ name: "p", install }]
    });

    expect(install).toHaveBeenCalledTimes(1);

    const modal = document.createElement("div");
    modal.id = "modal";
    document.body.appendChild(modal);
    modal.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));

    expect(app.getPlugin("p")).toBeDefined();
  });

  it("eager scopes still work unchanged", () => {
    app = new Supermouse({ autoStart: false });
    const sidebar = document.createElement("div");
    document.body.appendChild(sidebar);

    const handle = app.addScope({ name: "sidebar", container: sidebar });
    expect(handle.resolved).toBe(true);
    expect(handle.container).toBe(sidebar);

    sidebar.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
    expect(app.state.scope?.container).toBe(sidebar);
  });
});
