import { describe, it, expect, afterEach, vi } from "vitest";
import { Supermouse } from "../Supermouse";
import type { SupermousePlugin } from "../types";
import { hover, movePointer } from "./helpers";

/**
 * Known bug — see `docs/known-bugs.md`.
 *
 * `Input.setActiveScope` re-translates the pointer into the incoming scope's
 * coordinate frame *before* notifying the engine, so an outgoing scope's
 * `onBeforeDisable` runs against coordinates that have already shifted by the
 * container offset. Exit animations that read `state.smooth` therefore start
 * from the wrong point and jump on the way out.
 *
 * The test is kept as executable documentation of the intended behaviour: it
 * is skipped rather than deleted so the fix has something to turn back on.
 */
describe("scope hand-off coordinate frame", () => {
  let app: Supermouse;

  afterEach(() => {
    app?.destroy();
    document.body.innerHTML = "";
  });

  it.skip("runs an outgoing plugin's beforeDisable in the outgoing frame", () => {
    const stage = document.createElement("div");
    document.body.appendChild(stage);

    // The stage sits well away from the page origin, so the two coordinate
    // frames differ by a large, easy-to-assert offset.
    vi.spyOn(stage, "getBoundingClientRect").mockReturnValue({
      left: 300,
      top: 600,
      right: 700,
      bottom: 900,
      width: 400,
      height: 300,
      x: 300,
      y: 600,
      toJSON: () => ({})
    } as DOMRect);

    let captured: { x: number; y: number } | null = null;
    const probe: SupermousePlugin = {
      name: "probe",
      onBeforeDisable: (instance) => {
        captured = { x: instance.state.smooth.x, y: instance.state.smooth.y };
      }
    };

    app = new Supermouse({ autoStart: false });
    app.addScope({ name: "stage", container: stage, plugins: [probe] });

    // Enter the stage: `state.smooth` is now expressed in the stage's frame.
    movePointer(500, 800);
    hover(stage);

    expect(app.state.scope?.name).toBe("stage");
    expect(app.state.smooth.x).toBeCloseTo(200);
    expect(app.state.smooth.y).toBeCloseTo(200);

    // Leave for the page frame. The probe must observe the point it was last
    // drawn at, not the pointer translated into the incoming frame.
    movePointer(50, 50);
    hover(document.body);

    expect(captured).not.toBeNull();
    const seen = captured as unknown as { x: number; y: number };
    expect(seen.x).toBeCloseTo(200);
    expect(seen.y).toBeCloseTo(200);
  });
});
