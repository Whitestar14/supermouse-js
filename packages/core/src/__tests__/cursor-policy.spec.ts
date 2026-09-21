import { describe, it, expect, afterEach, beforeEach } from "vitest";
import { Supermouse } from "../Supermouse";

describe("Cursor policy", () => {
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
  });

  function hover(el: HTMLElement) {
    el.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
  }

  it("custom native selector triggers fallback in auto mode", () => {
    app = new Supermouse({
      container,
      autoStart: false,
      cursor: "auto",
      cursorPolicy: { native: [".fallback"], hide: [] }
    });
    const el = document.createElement("div");
    el.className = "fallback";
    container.appendChild(el);
    hover(el);
    expect(app.state.isNative).toBe(true);
  });

  it("native selector not in hide emits no CSS rule", () => {
    app = new Supermouse({
      container,
      autoStart: false,
      cursorPolicy: { native: [".fallback"], hide: [] }
    });
    const css = Array.from(document.querySelectorAll("style[id^='supermouse-styles-']"))
      .map((t) => t.textContent)
      .join("\n");
    expect(css).not.toContain(".fallback");
  });

  it("hide-only selector suppresses without triggering fallback", () => {
    app = new Supermouse({
      container,
      autoStart: false,
      cursor: "auto",
      cursorPolicy: { native: [], hide: [".suppress"] }
    });
    const el = document.createElement("div");
    el.className = "suppress";
    container.appendChild(el);
    hover(el);
    expect(app.state.isNative).toBe(false);

    const css = Array.from(document.querySelectorAll("style[id^='supermouse-styles-']"))
      .map((t) => t.textContent)
      .join("\n");
    expect(css).toContain(".suppress");
  });

  it("default policy puts label and select in the hide list", () => {
    app = new Supermouse({ container, autoStart: false });
    const css = Array.from(document.querySelectorAll("style[id^='supermouse-styles-']"))
      .map((t) => t.textContent)
      .join("\n");
    expect(css).toMatch(/\blabel\b/);
    expect(css).toMatch(/\bselect\b/);
  });

  it("[contenteditable] triggers native fallback", () => {
    app = new Supermouse({ container, autoStart: false, cursor: "auto" });
    const el = document.createElement("div");
    el.setAttribute("contenteditable", "true");
    container.appendChild(el);
    hover(el);
    expect(app.state.isNative).toBe(true);
  });

  it("per-scope cursorPolicy overrides the top-level default", () => {
    app = new Supermouse({ container, autoStart: false, cursorPolicy: { native: [], hide: [] } });
    const sidebar = document.createElement("div");
    document.body.appendChild(sidebar);
    app.addScope({
      container: sidebar,
      cursorPolicy: { native: [".custom"], hide: [] }
    });
    const el = document.createElement("div");
    el.className = "custom";
    sidebar.appendChild(el);
    hover(el);
    expect(app.state.isNative).toBe(true);
  });
});
