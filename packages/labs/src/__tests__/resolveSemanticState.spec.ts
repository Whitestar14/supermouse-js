import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { resolveSemanticState } from "../resolveSemanticState";

describe("resolveSemanticState", () => {
  let host: HTMLElement;

  beforeEach(() => {
    host = document.createElement("div");
    document.body.appendChild(host);
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("returns 'text' for a bare <p>", () => {
    const p = document.createElement("p");
    host.appendChild(p);
    expect(resolveSemanticState(p, { text: "x" }, null)).toBe("text");
  });

  it("returns 'text' for an <em> inside a <p>", () => {
    const p = document.createElement("p");
    const em = document.createElement("em");
    p.appendChild(em);
    host.appendChild(p);
    expect(resolveSemanticState(em, { text: "x" }, null)).toBe("text");
  });

  it("returns 'pointer' for an <a>", () => {
    const a = document.createElement("a");
    host.appendChild(a);
    expect(resolveSemanticState(a, { pointer: "x" }, null)).toBe("pointer");
  });

  it("returns 'pointer' for a <span> inside an <a>", () => {
    const a = document.createElement("a");
    const span = document.createElement("span");
    a.appendChild(span);
    host.appendChild(a);
    expect(resolveSemanticState(span, { pointer: "x" }, null)).toBe("pointer");
  });

  it("returns 'text' for a text input", () => {
    const input = document.createElement("input");
    input.type = "text";
    host.appendChild(input);
    expect(resolveSemanticState(input, { text: "x" }, null)).toBe("text");
  });

  it("returns 'pointer' for a button input", () => {
    const input = document.createElement("input");
    input.type = "button";
    host.appendChild(input);
    expect(resolveSemanticState(input, { pointer: "x" }, null)).toBe("pointer");
  });

  it("returns 'text' for contenteditable", () => {
    const div = document.createElement("div");
    div.setAttribute("contenteditable", "true");
    host.appendChild(div);
    expect(resolveSemanticState(div, { text: "x" }, null)).toBe("text");
  });

  it("returns 'text' for contenteditable via ancestor", () => {
    const wrapper = document.createElement("div");
    wrapper.setAttribute("contenteditable", "true");
    const inner = document.createElement("span");
    wrapper.appendChild(inner);
    host.appendChild(wrapper);
    expect(resolveSemanticState(inner, { text: "x" }, null)).toBe("text");
  });

  it("falls back to authored cursor 'text'", () => {
    const div = document.createElement("div");
    host.appendChild(div);
    expect(resolveSemanticState(div, { text: "x" }, "text")).toBe("text");
  });

  it("falls back to authored cursor 'grab'", () => {
    const div = document.createElement("div");
    host.appendChild(div);
    expect(resolveSemanticState(div, { grab: "x" }, "grab")).toBe("grab");
  });

  it("returns null when nothing matches", () => {
    const div = document.createElement("div");
    host.appendChild(div);
    expect(resolveSemanticState(div, {}, null)).toBeNull();
  });

  it("does not use 'grab' when the icon map lacks it", () => {
    const div = document.createElement("div");
    host.appendChild(div);
    expect(resolveSemanticState(div, { text: "x" }, "grab")).toBeNull();
  });

  it("does not use 'text' when the icon map lacks it", () => {
    const p = document.createElement("p");
    host.appendChild(p);
    expect(resolveSemanticState(p, { pointer: "x" }, "text")).toBeNull();
  });

  it("prefers tag heuristics over authored cursor", () => {
    // A link has both "pointer" from its tag and would match the authored
    // cursor if it were something else. The tag should win.
    const a = document.createElement("a");
    host.appendChild(a);
    expect(resolveSemanticState(a, { pointer: "x", text: "y" }, "text")).toBe("pointer");
  });
});
