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

  private activeScope: Scope | null = null;

  private nativeTarget: HTMLElement | null = null;
  private currentTarget: HTMLElement | null = null;
  private lastParsedTarget: HTMLElement | null = null;
  private releaseViewport: (() => void) | null = null;

  public hasSeenPointer = false;
  public isEnabled = true;

  private viewportX = 0;
  private viewportY = 0;

  /** Cached matched rules per ancestor. Recomputed only when the hover target changes. */
  private cachedChain: Array<{
    element: HTMLElement;
    matchedRules: Array<{ selector: string; rules: RuleDefinition }>;
  }> = [];

  constructor(
    private state: MouseState,
    private options: SupermouseOptions,
    private onEnableChange: (enabled: boolean) => void,
    private onActiveScopeChange: (scope: Scope | null) => void,
    private resolveScope: (node: Node) => Scope | null
  ) {
    this.dataPrefix = options.dataPrefix ?? "supermouse";
    this.normalizedDataPrefix = this.dataPrefix.toLowerCase();
    this.ignoreAttribute = `data-${this.dataPrefix}-ignore`;

    this.checkDeviceCapability();
    this.checkMotionPreference();
    this.bindEvents();
  }

  setActiveScope(scope: Scope | null): void {
    if (scope === this.activeScope) return;
    this.activeScope = scope;

    this.lastParsedTarget = null;
    this.cachedChain = [];

    this.releaseViewport?.();
    this.releaseViewport =
      scope && scope.container !== document.body ? observe(scope.container) : null;

    if (this.hasSeenPointer) {
      this.applyPointerToState();
      this.state.target.x = this.state.smooth.x = this.state.pointer.x;
      this.state.target.y = this.state.smooth.y = this.state.pointer.y;
    }

    this.onActiveScopeChange(scope);
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
    if (!this.activeScope) return;

    const root = this.activeScope.container;
    const inheritData = this.activeScope.inheritDataAttributes;
    const pre = this.normalizedDataPrefix;
    const ruleEntries = this.activeScope.ruleEntries;

    if (element !== this.lastParsedTarget) {
      this.lastParsedTarget = element;
      this.cachedChain = [];

      let cur: HTMLElement | null = element;
      while (cur) {
        const matchedRules: Array<{ selector: string; rules: RuleDefinition }> = [];
        for (const [selector, rules] of ruleEntries) {
          if (this.matchesSelector(cur, selector)) {
            matchedRules.push({ selector, rules });
          }
        }
        this.cachedChain.push({ element: cur, matchedRules });

        if (!inheritData || cur === root) break;
        const parent: HTMLElement | null = cur.parentElement;
        if (!parent || !root.contains(parent)) break;
        cur = parent;
      }
    }

    const data: Record<string, string | boolean | number> = {};
    for (const { element: el, matchedRules } of this.cachedChain) {
      const level: Record<string, string | boolean | number> = {};

      for (const { rules } of matchedRules) {
        try {
          const resolved = typeof rules === "function" ? rules(el) : rules;
          if (!resolved || typeof resolved !== "object") continue;
          for (const [key, val] of Object.entries(resolved)) {
            level[key] = typeof val === "function" ? val(el) : val;
          }
        } catch (e) {
          console.error(`[Supermouse] Rule threw during evaluation:`, e);
        }
      }

      for (const key in el.dataset) {
        if (!key.toLowerCase().startsWith(pre)) continue;
        const prop = key.slice(pre.length);
        if (!prop) continue;
        const camelProp = prop[0].toLowerCase() + prop.slice(1);
        const val = el.dataset[key];
        level[camelProp] = val == null || val === "" ? true : val;
      }

      for (const [key, val] of Object.entries(level)) {
        if (key in data) continue;
        data[key] = val;
      }
    }

    this.state.interaction = data;
  }

  private matchesSelector(element: HTMLElement, selector: string): boolean {
    try {
      return element.matches(selector);
    } catch {
      // Invalid selector in a rule or cursor policy; ignore it.
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
    const scope = this.resolveScope(target);

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

    if (this.matchesSelector(target, this.activeScope.nativeSelectorString)) {
      this.state.isNative = true;
      this.nativeTarget = target;
      return;
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
      this.cachedChain = [];
    }

    // Pointer left the window entirely. Uses mouseout + null relatedTarget
    // rather than mouseleave; the latter does not fire reliably in Firefox.
    if (!related && this.options.hideOnLeave) {
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
    this.cachedChain = [];
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
  }

  public destroy(): void {
    this.abortController.abort();
    this.releaseViewport?.();
    this.cachedChain = [];
  }
}
