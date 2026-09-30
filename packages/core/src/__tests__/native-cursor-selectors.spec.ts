import { describe, it, expect, afterEach, beforeEach } from "vitest";
import { Supermouse } from "../Supermouse";
import { DEFAULT_NATIVE_CURSOR_SELECTORS } from "../constants";
import { hover } from "./helpers";

describe("Native cursor selectors", () => {
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

  it("custom native selector triggers fallback in auto mode", () => {
    app = new Supermouse({
      container,
      autoStart: false,
      cursor: "auto",
      nativeCursorSelectors: [".fallback"]
    });
    const el = document.createElement("div");
    el.className = "fallback";
    container.appendChild(el);
    hover(el);
    expect(app.state.isNative).toBe(true);
  });

  it("native selectors do not appear in the generated stylesheet", () => {
    app = new Supermouse({
      container,
      autoStart: false,
      nativeCursorSelectors: [".fallback"]
    });
    const css = Array.from(document.querySelectorAll("style[id^='supermouse-styles-']"))
      .map((t) => t.textContent)
      .join("\n");
    expect(css).not.toContain(".fallback");
  });

  it("default natives are select and [contenteditable]", () => {
    expect(DEFAULT_NATIVE_CURSOR_SELECTORS).toEqual([
      "select",
      "[contenteditable]",
      "input",
      "textarea"
    ]);
  });

  it("select triggers fallback via the default native list", () => {
    app = new Supermouse({ container, autoStart: false, cursor: "auto" });
    const el = document.createElement("select");
    container.appendChild(el);
    hover(el);
    expect(app.state.isNative).toBe(true);
  });

  it("[contenteditable] triggers fallback via the default native list", () => {
    app = new Supermouse({ container, autoStart: false, cursor: "auto" });
    const el = document.createElement("div");
    el.setAttribute("contenteditable", "true");
    container.appendChild(el);
    hover(el);
    expect(app.state.isNative).toBe(true);
  });

  it("per-scope nativeCursorSelectors override the top-level default", () => {
    app = new Supermouse({
      container,
      autoStart: false,
      nativeCursorSelectors: []
    });
    const sidebar = document.createElement("div");
    document.body.appendChild(sidebar);
    app.addScope({
      container: sidebar,
      nativeCursorSelectors: [".custom"]
    });
    const el = document.createElement("div");
    el.className = "custom";
    sidebar.appendChild(el);
    hover(el);
    expect(app.state.isNative).toBe(true);
  });
});
