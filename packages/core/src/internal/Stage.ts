let stageCount = 0;

export class Stage {
  public readonly element: HTMLDivElement;
  public readonly scopeClass: string;
  public readonly hideClass: string;

  private container: HTMLElement;
  private currentCursorState: "none" | "auto" | null = null;
  private originalContainerPosition = "";
  private originalContainerCursor = "";
  private _visible = true;

  constructor(initialContainer: HTMLElement, zIndex: number) {
    if (!initialContainer || !(initialContainer instanceof HTMLElement)) {
      throw new Error(
        `[Supermouse] Invalid container: ${initialContainer}. Must be an HTMLElement.`
      );
    }
    const isPlaceholder = initialContainer.hasAttribute("data-supermouse-placeholder");
    if (!initialContainer.isConnected && !isPlaceholder) {
      console.warn(
        "[Supermouse] container is not attached to the document — " +
          "stage sizing/positioning will be wrong until it is."
      );
    }

    const id = stageCount++;
    this.scopeClass = `supermouse-scope-${id}`;
    this.hideClass = `supermouse-hide-${id}`;

    this.element = document.createElement("div");
    Object.assign(this.element.style, {
      position: "absolute",
      inset: "0px",
      pointerEvents: "none",
      zIndex: String(zIndex),
      opacity: "1",
      transition: "opacity 0.15s ease"
    });

    this.container = initialContainer;
    this._attach(initialContainer);
  }

  private _attach(container: HTMLElement): void {
    const isBody = container === document.body;
    this.element.style.position = isBody ? "fixed" : "absolute";

    if (!isBody) {
      const computed = window.getComputedStyle(container);
      this.originalContainerPosition = computed.position;
      if (computed.position === "static") container.style.position = "relative";
    } else {
      this.originalContainerPosition = "";
    }

    this.originalContainerCursor = container.style.cursor;
    container.appendChild(this.element);
    container.classList.add("supermouse-scope", this.scopeClass);
  }

  private _detach(): void {
    const c = this.container;
    c.classList.remove("supermouse-scope", this.scopeClass, this.hideClass);
    if (c !== document.body && this.originalContainerPosition === "static") {
      c.style.position = "";
    }
    c.style.cursor = this.originalContainerCursor;
    this.element.remove();
  }

  /**
   * Rebinds this stage to a new container. The previous container is
   * restored to its pre-Supermouse state, and the current cursor
   * suppression is re-applied to the new container.
   */
  public attach(newContainer: HTMLElement): void {
    if (this.container === newContainer) return;
    const prevState = this.currentCursorState;
    this._detach();
    this.container = newContainer;
    this._attach(newContainer);
    this.currentCursorState = null;
    if (prevState) this.setNativeCursor(prevState);
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
    if (visible === this._visible) return;
    this._visible = visible;
    this.element.style.opacity = visible ? "1" : "0";
  }

  public setNativeCursor(type: "none" | "auto"): void {
    if (type === this.currentCursorState) return;
    this.currentCursorState = type;
    this.container.classList.toggle(this.hideClass, type === "none");
  }

  destroy(): void {
    this._detach();
  }
}
