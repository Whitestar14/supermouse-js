let stageCount = 0;

export class Stage {
  public readonly element: HTMLDivElement;
  private styleTag: HTMLStyleElement;
  private readonly id: string;
  private readonly scopeClass: string;
  private readonly hideClass: string;

  private currentCursorState: "none" | "auto" | null = null;
  private originalContainerPosition: string = "";
  private originalContainerCursor: string = "";

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
    private zIndex: number = 9999
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

    const instanceId = stageCount++;
    this.id = `supermouse-style-${instanceId}`;
    this.scopeClass = `supermouse-scope-${instanceId}`;
    this.hideClass = `supermouse-hide-${instanceId}`;

    const isBody = container === document.body;
    this.element = document.createElement("div");
    Object.assign(this.element.style, {
      position: isBody ? "fixed" : "absolute",
      inset: "0px",
      pointerEvents: "none",
      zIndex: String(this.zIndex),
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

    this.styleTag = document.createElement("style");
    this.styleTag.id = this.id;
    document.head.appendChild(this.styleTag);

    this.container.classList.add("supermouse-scope", this.scopeClass);
    this.updateCursorCSS();
  }

  public addSelectors(selectors: Iterable<string>): void {
    let changed = false;
    for (const selector of selectors) {
      selector.split(",").forEach((s) => {
        const trimmed = s.trim();
        if (trimmed && !this.selectors.has(trimmed)) {
          this.selectors.add(trimmed);
          changed = true;
        }
      });
    }
    if (changed) this.updateCursorCSS();
  }

  public addSelector(selector: string): void {
    this.addSelectors([selector]);
  }

  public setVisibility(visible: boolean): void {
    this.element.style.opacity = visible ? "1" : "0";
  }

  public setNativeCursor(type: "none" | "auto"): void {
    if (type === this.currentCursorState) return;
    this.currentCursorState = type;
    this.container.classList.toggle(this.hideClass, type === "none");
    this.container.style.cursor = type === "none" ? "none" : this.originalContainerCursor;
  }

  private updateCursorCSS(): void {
    const rawSelectors = Array.from(this.selectors);
    if (rawSelectors.length === 0) {
      this.styleTag.innerText = "";
      return;
    }

    const exclusion = `:not(.${this.scopeClass} .supermouse-scope):not(.${this.scopeClass} .supermouse-scope *)`;
    const scopeRule = (s: string) =>
      `.${this.scopeClass}.${this.hideClass} ${s}${exclusion} { cursor: none !important; }`;

    const scopedRules = rawSelectors.map(scopeRule).join("\n");
    const broadRule = `.${this.scopeClass}.${this.hideClass} *${exclusion} { cursor: none !important; }`;
    const containerRule = `.${this.scopeClass}.${this.hideClass} { cursor: none !important; }`;

    this.styleTag.innerText = `
    ${containerRule}
    ${broadRule}
    ${scopedRules}
    ${scopeRule("label")}
    ${scopeRule("select")}
    ${scopeRule('input[type="range"]::-webkit-slider-thumb')}
    ${scopeRule('input[type="range"]::-moz-range-thumb')}
  `;
  }

  public destroy(): void {
    this.element.remove();
    this.styleTag.remove();
    this.container.style.cursor = this.originalContainerCursor;
    this.container.classList.remove("supermouse-scope", this.scopeClass, this.hideClass);
    if (this.container !== document.body && this.originalContainerPosition === "static") {
      this.container.style.position = "";
    }
  }
}
