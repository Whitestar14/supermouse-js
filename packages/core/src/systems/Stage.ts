let stageCount = 0;

export class Stage {
  /** The container element appended to the document. */
  public readonly element: HTMLDivElement;
  private styleTag: HTMLStyleElement;
  private id: string;
  private scopeClass: string;

  private currentCursorState: "none" | "auto" | "" | null = null;

  private selectors: Set<string> = new Set([
    "a",
    "button",
    "input",
    "textarea",
    "select",
    '[role="button"]',
    "[tabindex]"
  ]);

  constructor(
    private container: HTMLElement = document.body,
    private hideNativeCursor: boolean
  ) {
    if (!container || !(container instanceof HTMLElement)) {
      throw new Error(`[Supermouse] Invalid container: ${container}. Must be an HTMLElement.`);
    }

    const instanceId = stageCount++;
    this.id = `supermouse-style-${instanceId}`;
    this.scopeClass = `supermouse-scope-${instanceId}`;

    const isBody = container === document.body;

    this.element = document.createElement("div");
    Object.assign(this.element.style, {
      position: isBody ? "fixed" : "absolute",
      top: "0",
      left: "0",
      width: "100%",
      height: "100%",
      pointerEvents: "none",
      zIndex: "9999",
      opacity: "1",
      transition: "opacity 0.15s ease"
    });

    if (!isBody) {
      const computed = window.getComputedStyle(container);
      if (computed.position === "static") {
        container.style.position = "relative";
      }
    }

    container.appendChild(this.element);

    this.styleTag = document.createElement("style");
    this.styleTag.id = this.id;
    document.head.appendChild(this.styleTag);

    this.container.classList.add(this.scopeClass);

    if (this.hideNativeCursor) {
      this.setNativeCursor("none");
    }
  }

  /**
   * Adds a new CSS selector to the Hide Native Cursor list.
   * Called by `Supermouse` (and subsequently plugins) during install to ensure
   * the native cursor is hidden on their specific interactive targets.
   */
  public addSelector(selector: string) {
    this.selectors.add(selector);
    if (this.hideNativeCursor) {
      this.updateCursorCSS();
    }
  }

  public setVisibility(visible: boolean) {
    this.element.style.opacity = visible ? "1" : "0";
  }

  /**
   * Toggles the visibility of the native cursor via CSS injection.
   * @param type 'none' to hide, 'auto' to show.
   */
  public setNativeCursor(type: "none" | "auto" | "") {
    if (!this.hideNativeCursor && type === "none") return;

    if (type === this.currentCursorState) return;
    this.currentCursorState = type;

    if (type === "none") {
      this.container.style.cursor = "none";
      this.updateCursorCSS();
    } else {
      this.container.style.cursor = "";
      this.styleTag.innerText = "";
    }
  }

  private updateCursorCSS() {
    const rawSelectors = Array.from(this.selectors);
    if (rawSelectors.length === 0) {
      this.styleTag.innerText = "";
      return;
    }

    const scopedSelectors = rawSelectors.map((s) => `.${this.scopeClass} ${s}`).join(", ");

    this.styleTag.innerText = `
      ${scopedSelectors} {
        cursor: none !important;
      }
    `;
  }

  public destroy() {
    this.element.remove();
    this.styleTag.remove();
    this.container.style.cursor = "";
    this.container.classList.remove(this.scopeClass);
  }
}
