import { describe, it, expect, afterEach } from "vitest";
import { Supermouse } from "@supermousejs/core";
import { Sparkles } from "../index";

const move = (x: number, y: number): void => {
  window.dispatchEvent(
    new PointerEvent("pointermove", { clientX: x, clientY: y, pointerType: "mouse" })
  );
};

const hover = (el: Element): void => {
  el.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
};

const lit = (container: HTMLElement): number =>
  Array.from(container.children).filter(
    (child) => parseFloat((child as HTMLElement).style.opacity || "0") > 0
  ).length;

describe("Sparkles scope re-entry", () => {
  let app: Supermouse;

  afterEach(() => {
    app?.destroy();
    document.body.innerHTML = "";
  });

  it("does not spray a trail when the scope re-activates far from the last point", () => {
    const stage = document.createElement("div");
    document.body.appendChild(stage);

    app = new Supermouse({ autoStart: false });
    app.addScope({ name: "stage", container: stage, plugins: [Sparkles({ frequency: 10 })] });

    // Settle at the origin. The first frame after activation only records the
    // starting point, so nothing spawns yet.
    move(0, 0);
    hover(stage);
    app.step(performance.now() + 16);

    // Leave the scope, then re-enter far away. Without an enable-time reset the
    // emitter would measure the jump from (0, 0) and spray a line of particles.
    hover(document.body);
    move(400, 400);
    hover(stage);

    expect(app.state.scope?.name).toBe("stage");
    app.step(performance.now() + 32);

    const container = (app.getPlugin("sparkles") as { element?: HTMLElement } | undefined)
      ?.element as HTMLElement;
    expect(container).toBeDefined();
    expect(lit(container)).toBe(0);

    // Sanity check: a genuine in-scope move still emits, so the zero above is
    // not just a disabled plugin.
    move(430, 400);
    app.step(performance.now() + 48);
    expect(lit(container)).toBeGreaterThan(0);
  });
});
