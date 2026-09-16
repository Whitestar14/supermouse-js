let stageCount = 0;

export class Stage {
  public readonly element: HTMLDivElement;
  public readonly scopeClass: string;
  public readonly hideClass: string;

  private currentCursorState: "none" | "auto" | null = null;
  private originalContainerPosition = "";
  private originalContainerCursor = "";

  constructor(
    private container: HTMLElement,
    private zIndex: number
  ) {
    if (!container || !(container instanceof HTMLElement)) {
      throw new Error(`[Supermouse] Invalid container: ${container}. Must be an HTMLElement.`);
    }
    if (!container.isConnected) {
      console.warn(
        "[Supermouse] container is not attached to the document — " +
          "stage sizing/positioning will be wrong until it is."
      );
    }

    const id = stageCount++;
    this.scopeClass = `supermouse-scope-${id}`;
    this.hideClass = `supermouse-hide-${id}`;

    const isBody = container === document.body;
    this.element = document.createElement("div");
    Object.assign(this.element.style, {
      position: isBody ? "fixed" : "absolute",
      inset: "0px",
      pointerEvents: "none",
      zIndex: String(zIndex),
      opacity: "1",
      transition: "opacity 0.15s ease"
    });

    if (!isBody) {
      const computed = window.getComputedStyle(container);
      this.originalContainerPosition = computed.position;
      if (computed.position === "static") container.style.position = "relative";
    }

    this.originalContainerCursor = container.style.cursor;
    container.appendChild(this.element);
    container.classList.add("supermouse-scope", this.scopeClass);
  }

  get containerElement(): HTMLElement {
    return this.container;
  }

  /** Full selector prefix: `.supermouse-scope-N.supermouse-hide-N`. */
  getRulePrefix(): string {
    return `.${this.scopeClass}.${this.hideClass}`;
  }

  /** CSS `:not()` chain that prevents the rules from leaking into nested scopes. */
  getExclusion(): string {
    return `:not(.${this.scopeClass} .supermouse-scope):not(.${this.scopeClass} .supermouse-scope *)`;
  }

  setVisibility(visible: boolean): void {
    this.element.style.opacity = visible ? "1" : "0";
  }

  setNativeCursor(type: "none" | "auto"): void {
    if (type === this.currentCursorState) return;
    this.currentCursorState = type;
    this.container.classList.toggle(this.hideClass, type === "none");
    this.container.style.cursor = type === "none" ? "none" : this.originalContainerCursor;
  }

  destroy(): void {
    this.element.remove();
    this.container.style.cursor = this.originalContainerCursor;
    this.container.classList.remove("supermouse-scope", this.scopeClass, this.hideClass);
    if (this.container !== document.body && this.originalContainerPosition === "static") {
      this.container.style.position = "";
    }
  }
}
