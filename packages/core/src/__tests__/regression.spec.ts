import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
import { Supermouse } from "../Supermouse";

describe("Canonical behavior contracts", () => {
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
    vi.restoreAllMocks();
  });

  function move(x: number, y: number) {
    window.dispatchEvent(
      new PointerEvent("pointermove", {
        clientX: x,
        clientY: y,
        pointerType: "mouse"
      })
    );
  }

  function hover(el: HTMLElement) {
    el.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
  }

  // ────────────────────────────────────────────────────────────────
  // Update loop ordering
  //
  // Per-frame pipeline:
  //   1. Parse interaction for the current target
  //   2. Update stage visibility and native cursor state
  //   3. Reset base target to pointer
  //   4. Run plugins in priority order
  //      — logic (priority < 0) may rewrite target
  //      — visual (priority >= 0) read smooth
  //   5. Clean up crashed plugins
  //   6. Damp smooth toward target
  //   7. Derive velocity, displacement, angle
  //
  // Steps 3 and 4 must run in that order. Swapping them clobbers
  // logic plugins like Magnetic and Stick.
  // ────────────────────────────────────────────────────────────────

  describe("Update loop ordering", () => {
    it("base target is set from pointer before plugins run", () => {
      app = new Supermouse({ container, autoStart: false });
      (app as any).input.isEnabled = true;

      let observed: { x: number; y: number } | null = null;
      app.use({
        name: "observer",
        priority: -100,
        update(instance) {
          observed = { x: instance.state.target.x, y: instance.state.target.y };
        }
      });

      app.state.pointer.x = 42;
      app.state.pointer.y = 99;
      app.state.hasReceivedInput = true;
      app.step(performance.now() + 16);

      expect(observed).toEqual({ x: 42, y: 99 });
    });

    it("logic plugins can override target and physics follows it", () => {
      app = new Supermouse({ container, autoStart: false });
      (app as any).input.isEnabled = true;

      app.use({
        name: "pin",
        priority: -10,
        update(instance) {
          instance.state.target.x = 500;
          instance.state.target.y = 500;
        }
      });

      app.state.pointer.x = 100;
      app.state.pointer.y = 100;
      app.state.smooth.x = 0;
      app.state.smooth.y = 0;
      app.state.target.x = 0;
      app.state.target.y = 0;
      app.state.hasReceivedInput = true;
      app.step(performance.now() + 16);

      // The plugin's write survived the frame — target is 500, not 100.
      expect(app.state.target).toEqual({ x: 500, y: 500 });

      // Smooth moved substantially toward 500. If the plugin write had been
      // clobbered, smooth would have moved toward 100 instead, landing at
      // ~73.6 for the same dt. Anything above 200 proves the override took
      // effect.
      expect(app.state.smooth.x).toBeGreaterThan(200);
      expect(app.state.smooth.x).toBeLessThan(500);

      // Displacement invariant still holds.
      expect(app.state.displacement.x).toBeCloseTo(app.state.target.x - app.state.smooth.x);
      expect(app.state.displacement.y).toBeCloseTo(app.state.target.y - app.state.smooth.y);
    });

    it("visual plugins read smooth before this frame's damping", () => {
      app = new Supermouse({ container, autoStart: false });
      (app as any).input.isEnabled = true;

      let seen: number | null = null;
      app.use({
        name: "visual",
        priority: 10,
        update(instance) {
          seen = instance.state.smooth.x;
        }
      });

      app.state.smooth.x = 0;
      app.state.target.x = 1000;
      app.state.hasReceivedInput = true;
      app.step(performance.now() + 16);

      // Plugins run before physics in the pipeline, so smooth is still
      // the pre-damping value.
      expect(seen).toBe(0);
    });

    it("plugin update receives delta time in milliseconds", () => {
      app = new Supermouse({ container, autoStart: false });
      (app as any).input.isEnabled = true;

      const received: number[] = [];
      app.use({
        name: "p",
        update(_instance, dt) {
          received.push(dt);
        }
      });

      app.step(1000);
      app.step(1016);

      expect(received[1]).toBe(16);
    });

    it("plugins run in priority order, ties broken by install order", () => {
      app = new Supermouse({ container, autoStart: false });
      (app as any).input.isEnabled = true;

      const order: string[] = [];
      const rec = (name: string) => () => order.push(name);
      app.use({ name: "c", priority: 10, update: rec("c") });
      app.use({ name: "a", priority: -10, update: rec("a") });
      app.use({ name: "b", priority: -10, update: rec("b") });
      app.use({ name: "d", priority: 10, update: rec("d") });

      app.step(performance.now() + 16);

      expect(order).toEqual(["a", "b", "c", "d"]);
    });
  });

  // ────────────────────────────────────────────────────────────────
  // State field semantics
  // ────────────────────────────────────────────────────────────────

  describe("State field semantics", () => {
    it("initial state parks pointer, target, smooth offscreen", () => {
      app = new Supermouse({ container, autoStart: false });
      expect(app.state.pointer).toEqual({ x: -100, y: -100 });
      expect(app.state.target).toEqual({ x: -100, y: -100 });
      expect(app.state.smooth).toEqual({ x: -100, y: -100 });
      expect(app.state.hasReceivedInput).toBe(false);
    });

    it("first pointer move snaps target and smooth to pointer (no sweep)", () => {
      app = new Supermouse({ container, autoStart: false });
      move(250, 250);

      expect(app.state.pointer).toEqual({ x: 250, y: 250 });
      expect(app.state.target).toEqual({ x: 250, y: 250 });
      expect(app.state.smooth).toEqual({ x: 250, y: 250 });
      expect(app.state.hasReceivedInput).toBe(true);
    });

    it("displacement is always target minus smooth", () => {
      app = new Supermouse({ container, autoStart: false });
      (app as any).input.isEnabled = true;

      app.state.target = { x: 100, y: 50 };
      app.state.smooth = { x: 60, y: 20 };
      app.state.pointer = { x: 100, y: 50 };
      app.state.hasReceivedInput = true;
      app.step(performance.now() + 16);

      expect(app.state.displacement.x).toBeCloseTo(app.state.target.x - app.state.smooth.x);
      expect(app.state.displacement.y).toBeCloseTo(app.state.target.y - app.state.smooth.y);
    });
  });

  // ────────────────────────────────────────────────────────────────
  // Hover contract
  // ────────────────────────────────────────────────────────────────

  describe("Hover contract", () => {
    it("hoverTarget is the closest ancestor matching a hover selector", () => {
      app = new Supermouse({ container, autoStart: false });
      const link = document.createElement("a");
      const inner = document.createElement("span");
      link.appendChild(inner);
      container.appendChild(link);

      hover(inner);

      expect(app.state.hoverTarget).toBe(link);
      expect(app.state.isHover).toBe(true);
    });

    it("isHover is false when nothing matches", () => {
      app = new Supermouse({ container, autoStart: false });
      const div = document.createElement("div");
      container.appendChild(div);

      hover(div);

      expect(app.state.isHover).toBe(false);
      expect(app.state.hoverTarget).toBeNull();
    });

    it("empty data attributes become true; non-empty become strings", () => {
      app = new Supermouse({ container, autoStart: false });
      const div = document.createElement("div");
      div.setAttribute("data-cursor", "");
      div.setAttribute("data-supermouse-flag", "");
      div.setAttribute("data-supermouse-label", "hello");
      container.appendChild(div);

      hover(div);

      expect(app.state.interaction.flag).toBe(true);
      expect(app.state.interaction.label).toBe("hello");
    });

    it("rules produce interaction data", () => {
      app = new Supermouse({
        container,
        autoStart: false,
        rules: { ".btn": { kind: "action" } }
      });
      const btn = document.createElement("button");
      btn.className = "btn";
      container.appendChild(btn);

      hover(btn);

      expect(app.state.interaction.kind).toBe("action");
    });

    it("mouseout clears isHover and hoverTarget", () => {
      app = new Supermouse({ container, autoStart: false });
      const link = document.createElement("a");
      container.appendChild(link);

      hover(link);
      expect(app.state.isHover).toBe(true);

      link.dispatchEvent(
        new MouseEvent("mouseout", {
          bubbles: true,
          relatedTarget: document.body
        })
      );

      expect(app.state.isHover).toBe(false);
      expect(app.state.hoverTarget).toBeNull();
    });
  });

  // ────────────────────────────────────────────────────────────────
  // Cursor modes
  // ────────────────────────────────────────────────────────────────

  describe("Cursor modes", () => {
    it("auto mode: native over inputs, custom elsewhere", () => {
      app = new Supermouse({ container, autoStart: false, cursor: "auto" });

      const input = document.createElement("input");
      container.appendChild(input);
      hover(input);
      expect(app.state.isNative).toBe(true);

      const div = document.createElement("div");
      container.appendChild(div);
      hover(div);
      expect(app.state.isNative).toBe(false);
    });

    it("custom mode ignores native detection", () => {
      app = new Supermouse({ container, autoStart: false, cursor: "custom" });
      const input = document.createElement("input");
      container.appendChild(input);

      hover(input);

      expect(app.state.isNative).toBe(false);
      expect(app.state.cursorMode).toBe("custom");
    });

    it("native mode reports cursorMode", () => {
      app = new Supermouse({ container, autoStart: false, cursor: "native" });
      expect(app.state.cursorMode).toBe("native");
    });

    it("setCursor updates cursorMode at runtime", () => {
      app = new Supermouse({ container, autoStart: false });
      expect(app.state.cursorMode).toBe("auto");
      app.setCursor("custom");
      expect(app.state.cursorMode).toBe("custom");
    });

    it("data-supermouse-ignore forces native in auto mode", () => {
      app = new Supermouse({ container, autoStart: false, cursor: "auto" });
      const ignored = document.createElement("div");
      ignored.setAttribute("data-supermouse-ignore", "");
      container.appendChild(ignored);

      hover(ignored);

      expect(app.state.isNative).toBe(true);
      expect(app.state.isHover).toBe(false);
    });
  });

  // ────────────────────────────────────────────────────────────────
  // enable / disable / reset
  // ────────────────────────────────────────────────────────────────

  describe("enable / disable / reset", () => {
    it("enable() snaps target and smooth to last pointer position", () => {
      app = new Supermouse({ container, autoStart: false });
      move(300, 400);
      app.disable();
      app.enable();

      expect(app.state.target).toEqual({ x: 300, y: 400 });
      expect(app.state.smooth).toEqual({ x: 300, y: 400 });
      expect(app.isEnabled).toBe(true);
    });

    it("disable() stops input but keeps state", () => {
      app = new Supermouse({ container, autoStart: false });
      move(100, 100);
      app.step(performance.now() + 16);
      const targetBefore = { ...app.state.target };
      const smoothBefore = { ...app.state.smooth };

      app.disable();

      expect(app.isEnabled).toBe(false);
      expect(app.state.target).toEqual(targetBefore);
      expect(app.state.smooth).toEqual(smoothBefore);
    });

    it("disable({ reset: true }) clears physics state", () => {
      app = new Supermouse({ container, autoStart: false });
      move(100, 100);
      app.step(performance.now() + 16);

      app.disable({ reset: true });

      expect(app.state.target).toEqual({ x: -100, y: -100 });
      expect(app.state.smooth).toEqual({ x: -100, y: -100 });
      expect(app.state.hasReceivedInput).toBe(false);
    });

    it("reset() clears physics and interaction, leaves input alone", () => {
      app = new Supermouse({ container, autoStart: false });
      move(100, 100);
      app.step(performance.now() + 16);

      app.reset();

      expect(app.isEnabled).toBe(true);
      expect(app.state.target).toEqual({ x: -100, y: -100 });
      expect(app.state.hasReceivedInput).toBe(false);
      expect(app.state.interaction).toEqual({});
    });
  });

  // ────────────────────────────────────────────────────────────────
  // hideOnLeave
  // ────────────────────────────────────────────────────────────────

  describe("hideOnLeave", () => {
    it("mouseout with null relatedTarget resets pointer and flag", () => {
      app = new Supermouse({ container, autoStart: false, hideOnLeave: true });
      move(100, 100);
      expect(app.state.hasReceivedInput).toBe(true);

      document.dispatchEvent(new MouseEvent("mouseout", { relatedTarget: null }));

      expect(app.state.hasReceivedInput).toBe(false);
      expect(app.state.pointer).toEqual({ x: -100, y: -100 });
    });

    it("does not fire when hideOnLeave: false", () => {
      app = new Supermouse({ container, autoStart: false, hideOnLeave: false });
      move(100, 100);

      document.dispatchEvent(new MouseEvent("mouseout", { relatedTarget: null }));

      expect(app.state.hasReceivedInput).toBe(true);
      expect(app.state.pointer).toEqual({ x: 100, y: 100 });
    });
  });

  // ────────────────────────────────────────────────────────────────
  // Container translation
  // ────────────────────────────────────────────────────────────────

  describe("Container translation", () => {
    it("body container: pointer stays in viewport coordinates", () => {
      app = new Supermouse({ autoStart: false });
      window.dispatchEvent(
        new PointerEvent("pointermove", {
          clientX: 500,
          clientY: 400,
          pointerType: "mouse"
        })
      );
      expect(app.state.pointer).toEqual({ x: 500, y: 400 });
    });

    it("custom container: pointer translates to container-local coordinates", () => {
      const custom = document.createElement("div");
      document.body.appendChild(custom);
      vi.spyOn(custom, "getBoundingClientRect").mockReturnValue({
        left: 200,
        top: 300,
        width: 500,
        height: 500,
        right: 700,
        bottom: 800,
        x: 200,
        y: 300,
        toJSON: () => {}
      } as DOMRect);

      app = new Supermouse({ container: custom, autoStart: false });
      window.dispatchEvent(
        new PointerEvent("pointermove", {
          clientX: 250,
          clientY: 350,
          pointerType: "mouse"
        })
      );

      expect(app.state.pointer).toEqual({ x: 50, y: 50 });
    });
  });

  // ────────────────────────────────────────────────────────────────
  // Stage
  // ────────────────────────────────────────────────────────────────

  describe("Stage", () => {
    it("body container: fixed positioning, appended to body", () => {
      app = new Supermouse({ autoStart: false });
      expect(app.stage.style.position).toBe("fixed");
      expect(document.body.contains(app.stage)).toBe(true);
    });

    it("custom container: absolute positioning inside the container", () => {
      app = new Supermouse({ container, autoStart: false });
      expect(app.stage.style.position).toBe("absolute");
      expect(container.contains(app.stage)).toBe(true);
    });

    it("container is marked with a scope class", () => {
      app = new Supermouse({ container, autoStart: false });
      expect(container.classList.contains("supermouse-scope")).toBe(true);
      const hasScopeClass = Array.from(container.classList).some((c) =>
        c.startsWith("supermouse-scope-")
      );
      expect(hasScopeClass).toBe(true);
    });

    it("destroy removes stage and scope classes", () => {
      app = new Supermouse({ container, autoStart: false });
      const stageEl = app.stage;
      app.destroy();

      expect(document.body.contains(stageEl)).toBe(false);
      expect(container.classList.contains("supermouse-scope")).toBe(false);
    });
  });
});
