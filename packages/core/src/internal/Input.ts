import type { MouseState, SupermouseOptions, RuleDefinition } from "../types";
import { OFFSCREEN, NATIVE_TAGS, SUPERMOUSE_CURSORS } from "../constants";

export class Input {
  private mediaQueryList?: MediaQueryList;
  private motionQuery?: MediaQueryList;
  private dataPrefix: string;
  private normalizedDataPrefix: string;
  private ignoreAttribute: string;
  private abortController = new AbortController();
  private nativeTarget: HTMLElement | null = null;
  public hasSeenPointer: boolean = false;
  public isEnabled: boolean = true;

  private containerRect: DOMRect | null = null;
  private resizeObserver?: ResizeObserver;

  /** Cached matched rules for the current interaction element. */
  private matchedRules: Array<{ selector: string; rules: RuleDefinition }> = [];
  private lastParsedTarget: HTMLElement | null = null;

  /** Precomputed list of rule entries for faster iteration. */
  private ruleEntries: Array<[string, RuleDefinition]>;

  /** The actual element currently under the pointer (regardless of hover selectors). */
  private currentTarget: HTMLElement | null = null;

  constructor(
    private state: MouseState,
    private options: SupermouseOptions,
    private getHoverSelector: () => string,
    private onEnableChange: (enabled: boolean) => void
  ) {
    this.dataPrefix = this.options.dataPrefix ?? "supermouse";
    this.normalizedDataPrefix = this.dataPrefix.toLowerCase();
    this.ignoreAttribute = `data-${this.dataPrefix}-ignore`;

    this.ruleEntries = this.options.rules ? Object.entries(this.options.rules) : [];

    this.checkDeviceCapability();
    this.checkMotionPreference();
    this.setupContainerRectTracking();
    this.bindEvents();
  }

  private checkDeviceCapability(): void {
    if (!this.options.autoDisableOnMobile) return;
    this.mediaQueryList = window.matchMedia("(pointer: fine)");
    this.updateEnabledState(this.mediaQueryList.matches);
    this.mediaQueryList.addEventListener("change", (e) => this.updateEnabledState(e.matches), {
      signal: this.abortController.signal
    });
  }

  private checkMotionPreference(): void {
    this.motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    this.state.reducedMotion = this.motionQuery.matches;
    this.motionQuery.addEventListener(
      "change",
      (e) => {
        this.state.reducedMotion = e.matches;
      },
      { signal: this.abortController.signal }
    );
  }

  private updateEnabledState(enabled: boolean): void {
    this.isEnabled = enabled;
    this.onEnableChange(enabled);
  }

  /** Caches container rect; updates on resize/scroll/ResizeObserver. */
  private setupContainerRectTracking(): void {
    const container = this.options.container;
    if (!container || container === document.body) return;

    const updateRect = (): void => {
      this.containerRect = container.getBoundingClientRect();
    };
    updateRect();

    window.addEventListener("resize", updateRect, { signal: this.abortController.signal });
    window.addEventListener("scroll", updateRect, {
      passive: true,
      signal: this.abortController.signal
    });

    if (typeof ResizeObserver !== "undefined") {
      this.resizeObserver = new ResizeObserver(updateRect);
      this.resizeObserver.observe(container);
    }
  }

  public parseDOMInteraction(element: HTMLElement): void {
    if (element !== this.lastParsedTarget) {
      this.lastParsedTarget = element;
      this.matchedRules = [];

      for (const [selector, rules] of this.ruleEntries) {
        if (this.matchesSelector(element, selector)) {
          this.matchedRules.push({ selector, rules });
        }
      }
    }

    const data: Record<string, string | boolean | number> = {};
    for (const { rules } of this.matchedRules) {
      try {
        const resolved = typeof rules === "function" ? rules(element) : rules;
        if (!resolved || typeof resolved !== "object") continue;

        for (const [key, val] of Object.entries(resolved)) {
          data[key] = typeof val === "function" ? val(element) : val;
        }
      } catch (e) {
        console.error(`[Supermouse] Rule threw during evaluation:`, e);
      }
    }

    const pre = this.normalizedDataPrefix;
    for (const key in element.dataset) {
      if (!key.toLowerCase().startsWith(pre)) continue;
      const prop = key.slice(pre.length);
      if (!prop) continue;
      const val = element.dataset[key];
      data[prop[0].toLowerCase() + prop.slice(1)] = val === "" ? true : val!;
    }

    this.state.interaction = data;
  }

  private matchesSelector(element: HTMLElement, selector: string): boolean {
    try {
      if (!/\s/.test(selector.trim())) {
        return element.matches(selector);
      }
    } catch {
      return false;
    }

    const parts = selector.trim().split(/\s+/);
    if (parts.length < 2) return false;

    const self = parts.pop()!;
    const ancestor = parts.join(" ");
    if (!self || !ancestor) return false;

    try {
      return element.matches(self) && !!element.closest(ancestor);
    } catch {
      return false;
    }
  }

  private isOutsideContainer(target: Node): boolean {
    const { container } = this.options;
    return !!container && container !== document.body && !container.contains(target);
  }

  private resolveComputedCursor(target: HTMLElement): string {
    return window.getComputedStyle(target).cursor;
  }

  private handleMove = (e: PointerEvent): void => {
    if (this.options.autoDisableOnMobile && e.pointerType === "touch" && !this.options.enableTouch)
      return;

    let x = e.clientX;
    let y = e.clientY;

    const container = this.options.container;
    if (container && this.containerRect && container !== document.body) {
      x -= this.containerRect.left;
      y -= this.containerRect.top;
    }

    this.state.pointer.x = x;
    this.state.pointer.y = y;
    this.hasSeenPointer = true;

    if (!this.isEnabled) return;

    if (!this.state.hasReceivedInput) {
      this.state.hasReceivedInput = true;
      this.state.target.x = this.state.smooth.x = x;
      this.state.target.y = this.state.smooth.y = y;
    }
  };

  private handleDown = (): void => {
    if (this.isEnabled) this.state.isDown = true;
  };

  private handleUp = (): void => {
    if (this.isEnabled) this.state.isDown = false;
  };

  private handleMouseOver = (e: Event): void => {
    if (!this.isEnabled) return;
    const target = e.target as HTMLElement;

    if (this.isOutsideContainer(target)) return;

    if (this.state.cursorMode === "auto" && target.closest(`[${this.ignoreAttribute}]`)) {
      this.state.isHover = false;
      this.state.hoverTarget = null;
      this.state.interaction = {};
      this.currentTarget = null;
      this.lastParsedTarget = null;
      this.matchedRules = [];

      this.state.isNative = true;
      this.nativeTarget = target;
      return;
    }

    this.state.isNative = false;
    this.nativeTarget = null;

    this.currentTarget = target;
    this.parseDOMInteraction(target);

    if (this.state.cursorMode !== "auto") {
      const hoverable = target.closest(this.getHoverSelector());
      if (hoverable) {
        this.state.isHover = true;
        this.state.hoverTarget = hoverable as HTMLElement;
      }
      return;
    }

    const hoverable = target.closest(this.getHoverSelector());
    if (hoverable) {
      this.state.isHover = true;
      this.state.hoverTarget = hoverable as HTMLElement;
    }

    const checkTags = NATIVE_TAGS.has(target.localName) || target.isContentEditable;
    const checkCSS = !SUPERMOUSE_CURSORS.has(this.resolveComputedCursor(target));
    if (checkTags || checkCSS) {
      this.state.isNative = true;
      this.nativeTarget = target;
    }
  };

  private handleMouseOut = (e: Event): void => {
    if (!this.isEnabled) return;
    const target = e.target as HTMLElement;
    const related = (e as MouseEvent).relatedTarget as Node | null;

    if (this.isOutsideContainer(target)) return;

    if (target === this.state.hoverTarget || target.contains(this.state.hoverTarget)) {
      if (!related || !this.state.hoverTarget?.contains(related)) {
        this.state.isHover = false;
        this.state.hoverTarget = null;
      }
    }

    if (this.nativeTarget && (target === this.nativeTarget || target.contains(this.nativeTarget))) {
      if (!related || !this.nativeTarget.contains(related)) {
        this.state.isNative = false;
        this.nativeTarget = null;
      }
    }

    if (target === this.currentTarget) {
      this.currentTarget = null;
      this.lastParsedTarget = null;
      this.matchedRules = [];
    }
  };

  private handleDocumentMouseOut = (e: MouseEvent): void => {
    if (!this.isEnabled) return;
    if (e.relatedTarget === null && this.options.hideOnLeave) {
      this.handleWindowLeave();
    }
  };

  private handleWindowLeave = (): void => {
    if (this.options.hideOnLeave) {
      this.state.hasReceivedInput = false;
      this.state.pointer = { ...OFFSCREEN };
    }
  };

  public clearHover(): void {
    this.state.isHover = false;
    this.state.hoverTarget = null;
    this.state.isNative = false;
    this.nativeTarget = null;
    this.state.interaction = {};
    this.currentTarget = null;
    this.lastParsedTarget = null;
    this.matchedRules = [];
  }

  public getCurrentTarget(): HTMLElement | null {
    return this.currentTarget;
  }

  private bindEvents(): void {
    const { signal } = this.abortController;
    window.addEventListener("pointermove", this.handleMove, { passive: true, signal });
    window.addEventListener("pointerdown", this.handleDown, { passive: true, signal });
    window.addEventListener("pointerup", this.handleUp, { signal });

    const isBody = !this.options.container || this.options.container === document.body;
    const hoverRoot = isBody ? document : this.options.container!;
    hoverRoot.addEventListener("mouseover", this.handleMouseOver, { signal });
    hoverRoot.addEventListener("mouseout", this.handleMouseOut, { signal });

    document.addEventListener("mouseout", this.handleDocumentMouseOut, { signal });
  }

  public destroy(): void {
    this.abortController.abort();
    this.resizeObserver?.disconnect();
  }
}
