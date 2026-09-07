import { describe, it, expect, afterEach, vi } from "vitest";
import { Supermouse } from "../Supermouse";

describe("Suspend/Resume cursor state", () => {
  let app: Supermouse;
  let container: HTMLElement;

  const hasClassPrefix = (el: HTMLElement, prefix: string) =>
    Array.from(el.classList).some((c) => c.startsWith(prefix));

  afterEach(() => {
    app?.destroy();
    document.body.innerHTML = "";
    document.head.innerHTML = "";
    vi.restoreAllMocks();
  });

  function createApp(cursor: "auto" | "custom" | "native" | "both" = "auto") {
    container = document.createElement("div");
    document.body.appendChild(container);
    app = new Supermouse({ container, cursor, autoStart: false });
    window.dispatchEvent(
      new PointerEvent("pointermove", { clientX: 100, clientY: 100, pointerType: "mouse" })
    );
    app.start();
    app.step(performance.now() + 16);
  }

  it("resume() restores native cursor suppression synchronously", () => {
    createApp("auto");
    expect(hasClassPrefix(container, "supermouse-hide-")).toBe(true);
    app.suspend();
    expect(app.stage.style.opacity).toBe("0");
    expect(hasClassPrefix(container, "supermouse-hide-")).toBe(true);

    app.resume();
    // Immediately after resume, hide class should still be present (native cursor hidden)
    expect(hasClassPrefix(container, "supermouse-hide-")).toBe(true);
    expect(container.style.cursor).toBe("none");
  });

  it("suspend() hides stage but preserves native cursor suppression state", () => {
    createApp("auto");
    expect(hasClassPrefix(container, "supermouse-hide-")).toBe(true);

    app.suspend();
    expect(app.stage.style.opacity).toBe("0");
    expect(hasClassPrefix(container, "supermouse-hide-")).toBe(true);
  });
});
