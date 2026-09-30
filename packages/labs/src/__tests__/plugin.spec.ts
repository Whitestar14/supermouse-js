import { describe, it, expect, afterEach } from "vitest";
import { Supermouse } from "@supermousejs/core";
import { SmartIcon } from "../index";

describe("SmartIcon plugin", () => {
  let app: Supermouse;

  afterEach(() => {
    app?.destroy();
    document.body.innerHTML = "";
    document.head.innerHTML = "";
  });

  it("mounts without error", () => {
    app = new Supermouse({ autoStart: false });
    app.use(SmartIcon({ icons: { default: "<svg/>" } }));
    expect(app.getPlugin("smart-icon")).toBeDefined();
  });

  it("does not register hover selectors on the scope", () => {
    app = new Supermouse({ autoStart: false });
    app.use(SmartIcon({ icons: { default: "<svg/>", text: "<svg/>" } }));

    const p = document.createElement("p");
    document.body.appendChild(p);
    p.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));

    // The old sweep registered p, span, h1-h6 as hover selectors, which
    // set state.isHover and state.hoverTarget on the primary scope. With
    // the sweep gone, pointerTarget populates but hover does not.
    expect(app.state.pointerTarget).toBe(p);
    expect(app.state.isHover).toBe(false);
    expect(app.state.hoverTarget).toBeNull();
  });

  it("reads authored cursor for non-tag elements", () => {
    app = new Supermouse({ autoStart: false });
    app.use(SmartIcon({ icons: { default: "<svg/>", grab: "<svg/>" } }));

    const handle = document.createElement("div");
    handle.style.cursor = "grab";
    document.body.appendChild(handle);
    handle.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));

    expect(app.state.authoredCursor).toBe("grab");
    expect(app.state.pointerTarget).toBe(handle);
  });
});
