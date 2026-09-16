import { describe, it, expect, afterEach, vi } from "vitest";
import { Supermouse } from "../Supermouse";

describe("Interaction ancestor inheritance", () => {
  let app: Supermouse;

  afterEach(() => {
    app?.destroy();
    document.body.innerHTML = "";
    document.head.innerHTML = "";
    vi.restoreAllMocks();
  });

  it("inherits data attributes from ancestors", () => {
    app = new Supermouse({ autoStart: false });
    const link = document.createElement("a");
    link.setAttribute("data-supermouse-text", "Hello");
    link.setAttribute("data-cursor", "");
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    link.appendChild(svg);
    document.body.appendChild(link);

    svg.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));

    expect(app.state.hoverTarget).toBe(link);
    expect(app.state.interaction.text).toBe("Hello");
  });

  it("closest ancestor wins on key collision", () => {
    app = new Supermouse({ autoStart: false });
    const outer = document.createElement("div");
    outer.setAttribute("data-supermouse-text", "outer");
    outer.setAttribute("data-cursor", "");
    const inner = document.createElement("a");
    inner.setAttribute("data-supermouse-text", "inner");
    outer.appendChild(inner);
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    inner.appendChild(svg);
    document.body.appendChild(outer);

    svg.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));

    expect(app.state.interaction.text).toBe("inner");
  });

  it("rules match ancestors of the hovered element", () => {
    app = new Supermouse({
      autoStart: false,
      rules: { a: { custom: "rule-value" } }
    });
    const link = document.createElement("a");
    link.setAttribute("data-cursor", "");
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    link.appendChild(svg);
    document.body.appendChild(link);

    svg.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));

    expect(app.state.interaction.custom).toBe("rule-value");
  });

it("rule functions receive the matched ancestor element", () => {
  const link = document.createElement("a");
  link.setAttribute("data-cursor", "");
  link.setAttribute("data-target-id", "abc");
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  link.appendChild(svg);
  document.body.appendChild(link);

  let received: HTMLElement | null = null;
  app = new Supermouse({
    autoStart: false,
    rules: {
      a: {
        text: (el) => {
          received = el;
          return el.getAttribute("data-target-id") ?? "";
        }
      }
    }
  });

  svg.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));

  expect(received).toBe(link);
  expect(app.state.interaction.text).toBe("abc");
});

  it("inheritDataAttributes: false disables ancestor walk", () => {
    app = new Supermouse({ autoStart: false, inheritDataAttributes: false });
    const link = document.createElement("a");
    link.setAttribute("data-supermouse-text", "Hello");
    link.setAttribute("data-cursor", "");
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    link.appendChild(svg);
    document.body.appendChild(link);

    svg.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));

    expect(app.state.interaction.text).toBeUndefined();
  });

  it("walk stops at the scope container root", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    // Attribute on an element OUTSIDE the scope container.
    document.body.setAttribute("data-supermouse-text", "outside");

    app = new Supermouse({ container, autoStart: false });

    const inner = document.createElement("div");
    inner.setAttribute("data-cursor", "");
    container.appendChild(inner);

    inner.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));

    // Attribute on body (outside the scope's container) must not cascade.
    expect(app.state.interaction.text).toBeUndefined();
  });
});