import { describe, it, expect, afterEach, vi } from "vitest";
import { Supermouse } from "../Supermouse";

describe("Scope runtime API", () => {
  let app: Supermouse;

  afterEach(() => {
    app?.destroy();
    document.body.innerHTML = "";
    document.head.innerHTML = "";
    vi.restoreAllMocks();
  });

  it("per-scope rules apply only to their scope", () => {
    const primary = document.createElement("div");
    const secondary = document.createElement("div");
    document.body.append(primary, secondary);

    app = new Supermouse({
      container: primary,
      autoStart: false,
      rules: { ".primary-rule": { kind: "primary" } }
    });

    app.addScope({
      container: secondary,
      rules: { ".secondary-rule": { kind: "secondary" } }
    });

    // Inside primary scope, primary rule matches.
    const el = document.createElement("div");
    el.className = "primary-rule";
    el.setAttribute("data-cursor", "");
    primary.appendChild(el);
    el.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
    expect(app.state.interaction.kind).toBe("primary");

    // Inside secondary scope, primary rule does NOT match.
    const el2 = document.createElement("div");
    el2.className = "primary-rule";
    el2.setAttribute("data-cursor", "");
    secondary.appendChild(el2);
    el2.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
    expect(app.state.interaction.kind).toBeUndefined();

    // But secondary's own rule does.
    const el3 = document.createElement("div");
    el3.className = "secondary-rule";
    el3.setAttribute("data-cursor", "");
    secondary.appendChild(el3);
    el3.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
    expect(app.state.interaction.kind).toBe("secondary");
  });

  it("scope without rules inherits primary's", () => {
    const primary = document.createElement("div");
    const secondary = document.createElement("div");
    document.body.append(primary, secondary);

    app = new Supermouse({
      container: primary,
      autoStart: false,
      rules: { ".shared": { kind: "shared" } }
    });
    app.addScope({ container: secondary });

    const el = document.createElement("div");
    el.className = "shared";
    el.setAttribute("data-cursor", "");
    secondary.appendChild(el);
    el.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
    expect(app.state.interaction.kind).toBe("shared");
  });

  it("state.scope reflects the active scope", () => {
    const primary = document.createElement("div");
    const modal = document.createElement("div");
    document.body.append(primary, modal);

    app = new Supermouse({ container: primary, autoStart: false });
    const handle = app.addScope({ name: "modal", container: modal });

    expect(app.state.scope).toEqual({ name: undefined, container: primary });

    modal.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
    expect(app.state.scope).toEqual({ name: "modal", container: modal });

    expect(handle.name).toBe("modal");
  });

  it("getScope returns the handle by name", () => {
    app = new Supermouse({ autoStart: false });
    const sidebar = document.createElement("div");
    document.body.appendChild(sidebar);

    const handle = app.addScope({ name: "sidebar", container: sidebar });

    expect(app.getScope("sidebar")).toBe(handle);
    expect(app.getScope("missing")).toBeUndefined();
  });

  it("handle.use installs a plugin into the scope", () => {
    app = new Supermouse({ autoStart: false });
    const panel = document.createElement("div");
    document.body.appendChild(panel);

    const installed = vi.fn();
    const handle = app.addScope({ name: "panel", container: panel });

    handle.use({ name: "p", install: installed });

    expect(installed).toHaveBeenCalledWith(app);
    expect(handle.getPlugin("p")).toBeDefined();
    expect(app.getPlugin("p")).toBeDefined();
  });

  it("handle.removePlugin tears down the plugin", () => {
    app = new Supermouse({ autoStart: false });
    const panel = document.createElement("div");
    document.body.appendChild(panel);

    const destroyed = vi.fn();
    const handle = app.addScope({ name: "panel", container: panel });
    handle.use({ name: "p", destroy: destroyed });

    handle.removePlugin("p");

    expect(destroyed).toHaveBeenCalledWith(app);
    expect(handle.getPlugin("p")).toBeUndefined();
  });

  it("handle.disable yields the scope and activates an ancestor", () => {
    const primary = document.createElement("div");
    const modal = document.createElement("div");
    document.body.append(primary, modal);

    app = new Supermouse({ container: primary, autoStart: false });
    const handle = app.addScope({ name: "modal", container: modal });

    modal.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
    expect(app.state.scope?.name).toBe("modal");

    handle.deactivate();
    expect(handle.active).toBe(false);
    expect(app.state.scope?.container).toBe(primary);

    handle.activate();
    expect(handle.active).toBe(true);
  });

  it("disabled scopes are skipped when resolving the active scope", () => {
    const primary = document.createElement("div");
    const modal = document.createElement("div");
    document.body.append(primary, modal);

    app = new Supermouse({ container: primary, autoStart: false });
    const handle = app.addScope({ name: "modal", container: modal });
    handle.deactivate();

    modal.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
    // Modal is disabled; walk continues up to the primary.
    expect(app.state.scope?.container).toBe(primary);
  });

  it("warns when two scopes share a container", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    app = new Supermouse({ autoStart: false });
    const shared = document.createElement("div");
    document.body.appendChild(shared);

    app.addScope({ name: "first", container: shared });
    app.addScope({ name: "second", container: shared });

    expect(warn).toHaveBeenCalledWith(expect.stringContaining("already registered"));
  });

  it("two instances do not destroy each other's stylesheets", () => {
    const app2 = new Supermouse({ autoStart: false });
    app = new Supermouse({ autoStart: false });

    const tagCount = () => document.querySelectorAll('style[id^="supermouse-styles-"]').length;
    expect(tagCount()).toBe(2);

    app.destroy();
    expect(tagCount()).toBe(1);

    app2.destroy();
    expect(tagCount()).toBe(0);
  });

  it("plugin isEnabled survives a scope round-trip", () => {
    const primary = document.createElement("div");
    const nested = document.createElement("div");
    document.body.append(primary, nested);

    app = new Supermouse({ container: primary, autoStart: false });
    app.addScope({ name: "nested", container: nested });

    const p = { name: "p", isEnabled: false };
    app.use(p);

    // Enter nested, return to primary.
    nested.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
    primary.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));

    // User intent (disabled) is preserved.
    expect(p.isEnabled).toBe(false);
  });

  it("plugin lifecycle hooks still fire on scope transitions", () => {
    const primary = document.createElement("div");
    const nested = document.createElement("div");
    document.body.append(primary, nested);

    app = new Supermouse({ container: primary, autoStart: false });
    app.addScope({ name: "nested", container: nested });

    const onEnable = vi.fn();
    const onDisable = vi.fn();
    const element = document.createElement("div");
    app.use({ name: "p", isEnabled: true, element, onEnable, onDisable });

    nested.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
    expect(onDisable).toHaveBeenCalledTimes(1);
    expect(element.style.display).toBe("none");

    primary.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
    expect(onEnable).toHaveBeenCalledTimes(1);
    expect(element.style.display).toBe("");
  });

  it("enablePlugin on an inactive scope does not show the element", () => {
    const primary = document.createElement("div");
    const nested = document.createElement("div");
    document.body.append(primary, nested);

    app = new Supermouse({ container: primary, autoStart: false });
    const handle = app.addScope({ name: "nested", container: nested });

    const element = document.createElement("div");
    const onEnable = vi.fn();
    handle.use({ name: "p", isEnabled: false, element, onEnable });

    app.enablePlugin("p");

    expect(element.style.display).toBe("none");
    expect(onEnable).not.toHaveBeenCalled();

    nested.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));

    expect(element.style.display).toBe("");
    expect(onEnable).toHaveBeenCalledTimes(1);
  });
});
