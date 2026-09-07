import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
import { Stage } from "../Supermouse";

describe("Supermouse Stage", () => {
  let container: HTMLElement;
  let stage: Stage;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    stage?.destroy();
    document.body.innerHTML = "";
    document.head.innerHTML = "";
    vi.restoreAllMocks();
  });

  const getStyleTag = () =>
    document.querySelector('style[id^="supermouse-style-"]') as HTMLStyleElement | null;

  const hasClassPrefix = (el: HTMLElement, prefix: string) =>
    Array.from(el.classList).some((c) => c.startsWith(prefix));

  describe("Element creation & positioning", () => {
    it("creates stage element with default styles", () => {
      stage = new Stage(container, 9999);
      const el = stage.element;
      expect(el).toBeInstanceOf(HTMLDivElement);
      expect(el.style.position).toBe("absolute");
      expect(el.style.inset).toBe("0px");
      expect(el.style.pointerEvents).toBe("none");
      expect(el.style.zIndex).toBe("9999");
      expect(el.style.opacity).toBe("1");
      expect(el.style.transition).toBe("opacity 0.15s ease");
      expect(container.contains(el)).toBe(true);
    });

    it("uses fixed positioning when container is body", () => {
      stage = new Stage(document.body, 9999);
      expect(stage.element.style.position).toBe("fixed");
    });

    it("throws if container is not an HTMLElement", () => {
      expect(() => new Stage(null as any, 9999)).toThrowError(
        "[Supermouse] Invalid container: null. Must be an HTMLElement."
      );
    });

    it("warns if container is not connected", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      const detached = document.createElement("div");
      new Stage(detached, 9999).destroy();
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining("container is not attached to the document")
      );
    });
  });

  describe("Stylesheet & selectors", () => {
    it("injects style tag with cursor suppression rules on creation", () => {
      stage = new Stage(container, 9999);
      const styleTag = getStyleTag();
      expect(styleTag).toBeInstanceOf(HTMLStyleElement);
      expect(styleTag!.parentNode).toBe(document.head);
      expect(styleTag!.innerText).toContain("cursor: none !important");
    });

    it("adds supermouse scope classes to container", () => {
      stage = new Stage(container, 9999);
      expect(container.classList.contains("supermouse-scope")).toBe(true);
      expect(hasClassPrefix(container, "supermouse-scope-")).toBe(true);
    });

    it("addSelector updates the stylesheet", () => {
      stage = new Stage(container, 9999);
      const styleTag = getStyleTag()!;
      const before = styleTag.innerText;

      stage.addSelector(".my-selector");
      const after = styleTag.innerText;

      expect(before).not.toBe(after);
      expect(after).toContain(".my-selector");
    });

    it("addSelectors batch updates stylesheet only once", () => {
      stage = new Stage(container, 9999);
      const styleTag = getStyleTag()!;
      const originalInnerText = styleTag.innerText;

      stage.addSelectors([".a", ".b", ".c"]);
      const finalInnerText = styleTag.innerText;

      expect(originalInnerText).not.toBe(finalInnerText);
      expect(finalInnerText).toContain(".a");
      expect(finalInnerText).toContain(".b");
      expect(finalInnerText).toContain(".c");
    });

    it("scopes all hover selectors correctly, splitting comma groups", () => {
      const container = document.createElement("div");
      document.body.appendChild(container);
      const stage = new Stage(container, 9999);

      stage.addSelector("p, span, h1, h2");

      const styleTag = document.querySelector("style[id^='supermouse-style-']")!;
      const styleText = styleTag.innerText;

      const scopeClass = Array.from(container.classList).find((c) =>
        c.startsWith("supermouse-scope-")
      );
      const hideClass = `supermouse-hide-${scopeClass!.split("-").pop()}`;

      expect(styleText).toContain(`.${scopeClass}.${hideClass} p`);
      expect(styleText).toContain(`.${scopeClass}.${hideClass} span`);
      expect(styleText).toContain(`.${scopeClass}.${hideClass} h1`);
      expect(styleText).toContain(`.${scopeClass}.${hideClass} h2`);

      expect(styleText).not.toMatch(/(^|,)\s*span\s*{/);
      expect(styleText).not.toMatch(/(^|,)\s*h1\s*{/);

      stage.destroy();
      container.remove();
    });
  });

  describe("Native cursor suppression", () => {
    it("setNativeCursor toggles hide class and inline cursor style", () => {
      stage = new Stage(container, 9999);
      stage.setNativeCursor("none");
      expect(container.style.cursor).toBe("none");
      expect(hasClassPrefix(container, "supermouse-hide-")).toBe(true);

      stage.setNativeCursor("auto");
      expect(container.style.cursor).toBe("");
      expect(hasClassPrefix(container, "supermouse-hide-")).toBe(false);
    });

    it("restores original container cursor when showing native", () => {
      container.style.cursor = "pointer";
      stage = new Stage(container, 9999);
      stage.setNativeCursor("none");
      expect(container.style.cursor).toBe("none"); // suppressed
      expect(hasClassPrefix(container, "supermouse-hide-")).toBe(true);

      stage.setNativeCursor("auto");
      expect(container.style.cursor).toBe("pointer"); // restored
      expect(hasClassPrefix(container, "supermouse-hide-")).toBe(false);
    });

    it("keeps original container cursor even if empty", () => {
      container.style.cursor = "";
      stage = new Stage(container, 9999);
      stage.setNativeCursor("auto");
      expect(container.style.cursor).toBe("");
    });
  });

  describe("Visibility & layout", () => {
    it("setVisibility toggles opacity", () => {
      stage = new Stage(container, 9999);
      stage.setVisibility(false);
      expect(stage.element.style.opacity).toBe("0");
      stage.setVisibility(true);
      expect(stage.element.style.opacity).toBe("1");
    });

    it("sets container position to relative if static", () => {
      container.style.position = "static";
      stage = new Stage(container, 9999);
      expect(container.style.position).toBe("relative");
      stage.destroy();
      expect(container.style.position).toBe("");
    });

    it("does not modify container position if already non-static", () => {
      container.style.position = "absolute";
      stage = new Stage(container, 9999);
      expect(container.style.position).toBe("absolute");
      stage.destroy();
      expect(container.style.position).toBe("absolute");
    });

    it("does not modify position if container is body", () => {
      stage = new Stage(document.body, 9999);
      expect(document.body.style.position).toBe("");
      stage.destroy();
    });
  });

  describe("Cleanup", () => {
    it("destroy removes stage element, style tag, and classes", () => {
      stage = new Stage(container, 9999);
      const el = stage.element;
      const styleTag = getStyleTag()!;
      expect(document.body.contains(el)).toBe(true);
      expect(document.head.contains(styleTag)).toBe(true);

      stage.destroy();

      expect(document.body.contains(el)).toBe(false);
      expect(document.head.contains(styleTag)).toBe(false);
      expect(container.classList.contains("supermouse-scope")).toBe(false);
      expect(hasClassPrefix(container, "supermouse-scope-")).toBe(false);
      expect(hasClassPrefix(container, "supermouse-hide-")).toBe(false);
      expect(container.style.cursor).toBe("");
    });

    it("destroy restores original container cursor", () => {
      container.style.cursor = "crosshair";
      stage = new Stage(container, 9999);
      stage.destroy();
      expect(container.style.cursor).toBe("crosshair");
    });

    it("creates unique style IDs for multiple instances", () => {
      const stage1 = new Stage(container, 9999);
      const stage2Container = document.createElement("div");
      document.body.appendChild(stage2Container);
      const stage2 = new Stage(stage2Container, 9999);

      const styleTags = document.querySelectorAll('style[id^="supermouse-style-"]');
      expect(styleTags.length).toBe(2);
      const ids = Array.from(styleTags).map((tag) => tag.id);
      expect(ids[0]).not.toBe(ids[1]);

      stage1.destroy();
      stage2.destroy();
      stage2Container.remove();
    });
  });
});
