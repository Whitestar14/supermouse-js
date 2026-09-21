import { describe, it, expect, afterEach, vi } from "vitest";
import { Supermouse } from "../Supermouse";
import { Stage } from "../internal/Stage";

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

  it("re-resolves to a new element after the old container detaches", () => {
    app = new Supermouse({ autoStart: false });
    const handle = app.addScope({ name: "modal", container: "#modal" });

    const first = document.createElement("div");
    first.id = "modal";
    document.body.appendChild(first);
    first.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
    expect(handle.container).toBe(first);

    // Detach without replacing. The scope should not match anything.
    first.remove();

    const other = document.createElement("div");
    document.body.appendChild(other);
    other.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
    expect(app.state.scope?.container).toBe(document.body);

    // New element with the same selector. Should rebind.
    const second = document.createElement("div");
    second.id = "modal";
    document.body.appendChild(second);
    second.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
    expect(handle.container).toBe(second);
  });

  it("inner scope wins over outer scope at different depths", () => {
    app = new Supermouse({ autoStart: false });

    const outer = document.createElement("div");
    outer.id = "outer";
    const inner = document.createElement("div");
    inner.id = "inner";
    outer.appendChild(inner);
    document.body.appendChild(outer);

    app.addScope({ name: "outer", container: "#outer", cursor: "native" });
    app.addScope({ name: "inner", container: "#inner", cursor: "custom" });

    inner.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
    expect(app.state.scope?.name).toBe("inner");

    outer.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
    expect(app.state.scope?.name).toBe("outer");
  });

  it("attach restores the old container's state", () => {
    const a = document.createElement("div");
    const b = document.createElement("div");
    a.style.cursor = "crosshair";
    a.style.position = "static";
    document.body.append(a, b);

    const stage = new Stage(a, 9999);
    expect(a.style.cursor).toBe("crosshair");
    expect(a.style.position).toBe("relative");
    expect(a.classList.contains(stage.scopeClass)).toBe(true);

    stage.attach(b);

    expect(a.style.cursor).toBe("crosshair");
    expect(a.style.position).toBe("");
    expect(a.classList.contains(stage.scopeClass)).toBe(false);
    expect(a.classList.contains(stage.hideClass)).toBe(false);
  });

  it("attach re-applies the current cursor state to the new container", () => {
    const a = document.createElement("div");
    const b = document.createElement("div");
    document.body.append(a, b);

    const stage = new Stage(a, 9999);
    stage.setNativeCursor("none");
    stage.attach(b);

    // The hide class follows the stage to the new container.
    expect(b.classList.contains(stage.hideClass)).toBe(true);
    expect(a.classList.contains(stage.hideClass)).toBe(false);
  });
});
