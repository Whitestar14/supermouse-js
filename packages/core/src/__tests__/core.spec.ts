import { describe, it, expect, afterEach, vi } from "vitest";
import { Supermouse } from "../Supermouse";
import { DEFAULT_HOVER_SELECTORS } from "../Supermouse";

describe("Supermouse core", () => {
  let app: Supermouse;

  afterEach(() => {
    app?.destroy();
    document.body.innerHTML = "";
    document.head.innerHTML = "";
    vi.restoreAllMocks();
  });

  it("registers and looks up plugins by name", () => {
    const app = new Supermouse();

    const plugin = {
      name: "test-plugin",
      install() {},
      update() {}
    };

    app.use(plugin);

    expect(app.getPlugin("test-plugin")).toBe(plugin);
    expect(app.getPlugin("missing-plugin")).toBeUndefined();
  });

  it("applies default options", () => {
    app = new Supermouse({ autoStart: false });
    expect(app.options.smoothness).toBe(0.15);
    expect(app.options.enableTouch).toBe(false);
    expect(app.options.autoDisableOnMobile).toBe(true);
    expect(app.options.cursor).toBe("auto");
    expect(app.options.hideOnLeave).toBe(true);
    expect(app.options.autoStart).toBe(false);
    expect(app.options.container).toBe(document.body);
    expect(app.options.dataPrefix).toBe("supermouse");
    expect(app.options.zIndex).toBe(9999);
    expect((app.options as any).ignoreOnNative).toBeUndefined();
  });

  it("merges user options over defaults", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);

    app = new Supermouse({
      smoothness: 0.3,
      enableTouch: true,
      autoDisableOnMobile: false,
      cursor: "custom",
      hideOnLeave: false,
      autoStart: false,
      container,
      dataPrefix: "custom",
      zIndex: 1234
    });

    expect(app.options.smoothness).toBe(0.3);
    expect(app.options.enableTouch).toBe(true);
    expect(app.options.autoDisableOnMobile).toBe(false);
    expect(app.options.cursor).toBe("custom");
    expect(app.options.hideOnLeave).toBe(false);
    expect(app.options.autoStart).toBe(false);
    expect(app.options.container).toBe(container);
    expect(app.options.dataPrefix).toBe("custom");
    expect(app.options.zIndex).toBe(1234);
  });

  it("initializes state with correct shape", () => {
    app = new Supermouse({ autoStart: false });
    const { state } = app;
    expect(state.pointer).toEqual({ x: -100, y: -100 });
    expect(state.target).toEqual({ x: -100, y: -100 });
    expect(state.smooth).toEqual({ x: -100, y: -100 });
    expect(state.velocity).toEqual({ x: 0, y: 0 });
    expect(state.displacement).toEqual({ x: 0, y: 0 });
    expect(state.angle).toBe(0);
    expect(state.isDown).toBe(false);
    expect(state.isHover).toBe(false);
    expect(state.isNative).toBe(false);
    expect(state.cursorMode).toBe("auto");
    expect(state.hoverTarget).toBeNull();
    expect(state.reducedMotion).toBe(false);
    expect(state.hasReceivedInput).toBe(false);
    expect(state.shape).toBeNull();
    expect(state.interaction).toEqual({});
  });

  it("appends stage element to container (default body)", () => {
    app = new Supermouse({ autoStart: false });
    const stage = app.stage;
    expect(stage).toBeInstanceOf(HTMLDivElement);
    expect(document.body.contains(stage)).toBe(true);
  });

  it("appends stage element to custom container", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    app = new Supermouse({ container, autoStart: false });
    expect(container.contains(app.stage)).toBe(true);
  });

  it("exposes version", () => {
    app = new Supermouse({ autoStart: false });
    expect(app.version).toBeDefined();
    expect(typeof app.version).toBe("string");
  });

  it("sets default hover selectors", () => {
    app = new Supermouse({ autoStart: false });
    const selectors = Array.from((app as any).hoverSelectors);
    expect(selectors).toEqual(expect.arrayContaining(DEFAULT_HOVER_SELECTORS));
  });

  it("overrides hover selectors if provided", () => {
    app = new Supermouse({
      autoStart: false,
      hoverSelectors: [".my-custom-hover", "a"]
    });
    const selectors = Array.from((app as any).hoverSelectors);
    expect(selectors).toEqual([".my-custom-hover", "a"]);
  });

  it("auto-starts the loop if autoStart is true", () => {
    const spy = vi.spyOn(Supermouse.prototype as any, "startLoop");
    app = new Supermouse({ autoStart: true });
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it("setCursor updates cursorMode", () => {
    app = new Supermouse({ autoStart: false });
    app.setCursor("native");
    expect(app.state.cursorMode).toBe("native");
    app.setCursor("custom");
    expect(app.state.cursorMode).toBe("custom");
    app.setCursor("auto");
    expect(app.state.cursorMode).toBe("auto");
  });

  it("cursor option sets initial cursorMode", () => {
    app = new Supermouse({ autoStart: false, cursor: "native" });
    expect(app.state.cursorMode).toBe("native");
  });

  it("reads data attributes into interaction on hover", () => {
    app = new Supermouse({ autoStart: false });
    const div = document.createElement("div");
    div.setAttribute("data-supermouse-test", "hello");
    div.setAttribute("data-supermouse-flag", "");
    div.setAttribute("data-cursor", "");
    document.body.appendChild(div);

    div.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));

    expect(app.state.isHover).toBe(true);
    expect(app.state.hoverTarget).toBe(div);
    expect(app.state.interaction).toEqual({ test: "hello", flag: true });
  });

  it("evaluates rules on hover", () => {
    app = new Supermouse({
      autoStart: false,
      rules: {
        "[data-cursor]": { custom: "rule-value" }
      }
    });
    const div = document.createElement("div");
    div.setAttribute("data-cursor", "");
    document.body.appendChild(div);

    div.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));

    expect(app.state.interaction).toEqual({ custom: "rule-value" });
  });

  it("caches selector matching for rules", () => {
    app = new Supermouse({
      autoStart: false,
      rules: {
        "[data-cursor]": { test: "value" }
      }
    });
    const div = document.createElement("div");
    div.setAttribute("data-cursor", "");
    document.body.appendChild(div);
    div.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));

    const input = (app as any).input;
    const spy = vi.spyOn(input, "matchesSelector");

    // Same element again – selector matching should be cached
    input.parseDOMInteraction(div);
    expect(spy).not.toHaveBeenCalled();

    // Different element – should trigger selector matching
    const div2 = document.createElement("div");
    div2.setAttribute("data-cursor", "");
    document.body.appendChild(div2);
    input.parseDOMInteraction(div2);
    expect(spy).toHaveBeenCalled();
  });

  it("re-enable restores original cursor mode after disable", () => {
    app = new Supermouse({ cursor: "custom", autoStart: false });
    expect(app.state.cursorMode).toBe("custom");

    app.disable();
    expect(app.state.cursorMode).toBe("custom");

    app.enable();
    expect(app.state.cursorMode).toBe("custom");
  });

  it("suspend/resume does not change cursor mode", () => {
    app = new Supermouse({ cursor: "custom", autoStart: false });
    app.start();
    app.suspend();
    expect(app.state.cursorMode).toBe("custom");
    app.resume();
    expect(app.state.cursorMode).toBe("custom");
  });

  it("hideOnLeave resets pointer and hasReceivedInput", () => {
    app = new Supermouse({ hideOnLeave: true, autoStart: false });
    window.dispatchEvent(
      new PointerEvent("pointermove", { clientX: 50, clientY: 60, pointerType: "mouse" })
    );
    expect(app.state.hasReceivedInput).toBe(true);

    document.dispatchEvent(new MouseEvent("mouseout", { relatedTarget: null }));
    expect(app.state.hasReceivedInput).toBe(false);
    expect(app.state.pointer).toEqual({ x: -100, y: -100 });
  });

  it("scoped instances maintain independent cursor modes", () => {
    const container1 = document.createElement("div");
    const container2 = document.createElement("div");
    document.body.appendChild(container1);
    document.body.appendChild(container2);

    const app1 = new Supermouse({ container: container1, cursor: "custom", autoStart: false });
    const app2 = new Supermouse({ container: container2, cursor: "native", autoStart: false });

    expect(app1.state.cursorMode).toBe("custom");
    expect(app2.state.cursorMode).toBe("native");

    app1.disable();
    expect(app1.state.cursorMode).toBe("custom");
    expect(app2.state.cursorMode).toBe("native"); // unaffected

    app1.destroy();
    app2.destroy();
    container1.remove();
    container2.remove();
  });

  it("matches simple selectors directly", () => {
    app = new Supermouse({
      autoStart: false,
      rules: {
        ".simple": { test: "ok" }
      }
    });
    const div = document.createElement("div");
    div.className = "simple";
    document.body.appendChild(div);
    div.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
    expect(app.state.interaction).toEqual({ test: "ok" });
  });

  it("matches complex selectors with ancestor", () => {
    app = new Supermouse({
      autoStart: false,
      rules: {
        ".ancestor .descendant": { custom: "value" }
      }
    });
    const ancestor = document.createElement("div");
    ancestor.className = "ancestor";
    const child = document.createElement("span");
    child.className = "descendant";
    ancestor.appendChild(child);
    document.body.appendChild(ancestor);

    child.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
    expect(app.state.interaction).toEqual({ custom: "value" });
  });
});
