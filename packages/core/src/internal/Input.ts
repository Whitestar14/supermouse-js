import type { MouseState, SupermouseOptions, RuleDefinition } from "../types";
import { OFFSCREEN, SUPERMOUSE_CURSORS } from "../constants";
import { observe, toLocal } from "./ViewportManager";
import type { Scope } from "./Scope";

export class Input {
  private abortController = new AbortController();
  private mediaQueryList?: MediaQueryList;
  private motionQuery?: MediaQueryList;

  private dataPrefix: string;
  private normalizedDataPrefix: string;
  private ignoreAttribute: string;

  private scopes: Scope[] = [];
  private activeScope: Scope | null = null;
  private scopeByContainer = new Map<HTMLElement, Scope>();

  private nativeTarget: HTMLElement | null = null;
  private currentTarget: HTMLElement | null = null;
  private lastParsedTarget: HTMLElement | null = null;
  private matchedRules: Array<{ selector: string; rules: RuleDefinition }> = [];
  private ruleEntries: Array<[string, RuleDefinition]>;
  private releaseViewport: (() => void) | null = null;

  public hasSeenPointer = false;
  public isEnabled = true;

  private viewportX = 0;
  private viewportY = 0;

  constructor(
    private state: MouseState,
    private options: SupermouseOptions,
    private onEnableChange: (enabled: boolean) => void,
    private onActiveScopeChange: (scope: Scope | null) => void
  ) {
    this.dataPrefix = options.dataPrefix ?? "supermouse";
    this.normalizedDataPrefix = this.dataPrefix.toLowerCase();
    this.ignoreAttribute = `data-${this.dataPrefix}-ignore`;
    this.ruleEntries = options.rules ? Object.entries(options.rules) : [];

    this.checkDeviceCapability();
    this.checkMotionPreference();
    this.bindEvents();
  }

  setScopes(scopes: Scope[]): void {
    this.scopes = scopes;
    this.scopeByContainer.clear();
    for (const scope of scopes) this.scopeByContainer.set(scope.container, scope);
  }

  setActiveScope(scope: Scope | null): void {
    if (scope === this.activeScope) return;
    this.activeScope = scope;

    this.releaseViewport?.();
    this.releaseViewport =
      scope && scope.container !== document.body ? observe(scope.container) : null;

    this.applyPointerToState();

    // Snap physics to the new coordinate frame without animation.
    this.state.target.x = this.state.smooth.x = this.state.pointer.x;
    this.state.target.y = this.state.smooth.y = this.state.pointer.y;

    this.onActiveScopeChange(scope);
  }

  private findScope(target: Node): Scope | null {
    let cur = target as HTMLElement | null;
    while (cur) {
      const scope = this.scopeByContainer.get(cur);
      if (scope) return scope;
      cur = cur.parentElement;
    }
    return null;
  }

  private applyPointerToState(): void {
    const container = this.activeScope?.container ?? document.body;
    const local = toLocal(container, this.viewportX, this.viewportY);
    this.state.pointer.x = local.x;
    this.state.pointer.y = local.y;
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
      if (!/\s/.test(selector.trim())) return element.matches(selector);
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

  private resolveComputedCursor(target: HTMLElement): string {
    return window.getComputedStyle(target).cursor;
  }

  private handleMove = (e: PointerEvent): void => {
    if (this.options.autoDisableOnMobile && e.pointerType === "touch" && !this.options.enableTouch)
      return;

    this.viewportX = e.clientX;
    this.viewportY = e.clientY;
    this.hasSeenPointer = true;
    this.applyPointerToState();

    if (!this.isEnabled) return;

    if (!this.state.hasReceivedInput) {
      this.state.hasReceivedInput = true;
      this.state.target.x = this.state.smooth.x = this.state.pointer.x;
      this.state.target.y = this.state.smooth.y = this.state.pointer.y;
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
    const scope = this.findScope(target);

    if (scope && scope !== this.activeScope) {
      this.setActiveScope(scope);
    }

    if (!this.activeScope) return;

    if (this.state.cursorMode === "auto" && target.closest(`[${this.ignoreAttribute}]`)) {
      this.clearHover();
      this.state.isNative = true;
      this.nativeTarget = target;
      return;
    }

    this.state.isNative = false;
    this.nativeTarget = null;
    this.currentTarget = target;
    this.parseDOMInteraction(target);

    const hoverable = target.closest(this.activeScope.hoverSelectorString);
    if (hoverable) {
      this.state.isHover = true;
      this.state.hoverTarget = hoverable as HTMLElement;
    }

    if (this.state.cursorMode !== "auto") return;

    for (const sel of this.activeScope.nativeSelectors) {
      try {
        if (target.matches(sel)) {
          this.state.isNative = true;
          this.nativeTarget = target;
          return;
        }
      } catch {}
    }

    if (target.isContentEditable || !SUPERMOUSE_CURSORS.has(this.resolveComputedCursor(target))) {
      this.state.isNative = true;
      this.nativeTarget = target;
    }
  };

  private handleMouseOut = (e: Event): void => {
    if (!this.isEnabled) return;
    const target = e.target as HTMLElement;
    const related = (e as MouseEvent).relatedTarget as Node | null;

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
    document.addEventListener("mouseover", this.handleMouseOver, { signal });
    document.addEventListener("mouseout", this.handleMouseOut, { signal });
    document.addEventListener("mouseout", this.handleDocumentMouseOut, { signal });
  }

  public destroy(): void {
    this.abortController.abort();
    this.releaseViewport?.();
  }
}
