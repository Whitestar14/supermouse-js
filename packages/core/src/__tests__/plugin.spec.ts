import { describe, it, expect, afterEach, vi } from "vitest";
import { Supermouse } from "../Supermouse";

describe("Supermouse plugin system", () => {
  let app: Supermouse;

  afterEach(() => {
    app?.destroy();
    document.body.innerHTML = "";
    document.head.innerHTML = "";
    vi.restoreAllMocks();
  });

  it("registers and looks up plugins by name", () => {
    app = new Supermouse({ autoStart: false });
    const plugin = { name: "test-plugin", install() {}, update() {} };
    app.use(plugin);
    expect(app.getPlugin("test-plugin")).toBe(plugin);
    expect(app.getPlugin("missing-plugin")).toBeUndefined();
  });

  it("calls install hook when plugin is added", () => {
    const install = vi.fn();
    app = new Supermouse({ autoStart: false });
    app.use({ name: "plugin", install });
    expect(install).toHaveBeenCalledWith(app);
  });

  it("prevents duplicate plugin names and logs warning", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    app = new Supermouse({ autoStart: false });
    const plugin = { name: "dupe", update() {} };
    app.use(plugin);
    app.use(plugin);
    expect(warn).toHaveBeenCalled();
    expect(app.plugins?.length).toBe(1); // private, but accessible in test
  });

  it("sorts plugins by priority (lower runs first)", async () => {
    app = new Supermouse({ autoStart: false });
    const order: number[] = [];
    app.use({
      name: "low",
      priority: 10,
      update: () => order.push(10)
    });
    app.use({
      name: "high",
      priority: 1,
      update: () => order.push(1)
    });

    // Manually step once (simulate a frame)
    app.start();
    app.step(performance.now() + 16);
    app.destroy(); // stop the loop

    expect(order).toEqual([1, 10]);
  });

  it("enables and disables plugins via methods", () => {
    app = new Supermouse({ autoStart: false });
    const onEnable = vi.fn();
    const onDisable = vi.fn();
    const plugin = {
      name: "toggle-plugin",
      isEnabled: true,
      onEnable,
      onDisable,
      element: document.createElement("div")
    };
    app.use(plugin);

    app.disablePlugin("toggle-plugin");
    expect(plugin.isEnabled).toBe(false);
    expect(onDisable).toHaveBeenCalledWith(app);
    expect(plugin.element.style.display).toBe("none");

    app.enablePlugin("toggle-plugin");
    expect(plugin.isEnabled).toBe(true);
    expect(onEnable).toHaveBeenCalledWith(app);
    expect(plugin.element.style.display).toBe("");
  });

  it("toggles plugin state", () => {
    app = new Supermouse({ autoStart: false });
    const plugin = { name: "toggle", isEnabled: true };
    app.use(plugin);
    app.togglePlugin("toggle");
    expect(plugin.isEnabled).toBe(false);
    app.togglePlugin("toggle");
    expect(plugin.isEnabled).toBe(true);
  });

  it("disables and cleans up crashed plugins", () => {
    app = new Supermouse({ autoStart: false });
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const plugin = {
      name: "crasher",
      isEnabled: true,
      update: () => {
        throw new Error("boom");
      },
      element: document.createElement("div"),
      onDisable: vi.fn(),
      destroy: vi.fn()
    };
    app.use(plugin);

    app.start();
    app.step(performance.now() + 16);
    app.destroy();

    expect(error).toHaveBeenCalled();
    expect(plugin.isEnabled).toBe(false);
    expect(plugin.onDisable).toHaveBeenCalled();
    expect(plugin.destroy).toHaveBeenCalled();
  });

  it("calls destroy hooks on all plugins when instance is destroyed", () => {
    app = new Supermouse({ autoStart: false });
    const destroy1 = vi.fn();
    const destroy2 = vi.fn();
    app.use({ name: "p1", destroy: destroy1 });
    app.use({ name: "p2", destroy: destroy2 });
    app.destroy();
    expect(destroy1).toHaveBeenCalled();
    expect(destroy2).toHaveBeenCalled();
  });
});
