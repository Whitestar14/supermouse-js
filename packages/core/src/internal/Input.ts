import type { MouseState, SupermouseOptions, RuleDefinition } from "../types";
import { OFFSCREEN, SUPERMOUSE_CURSORS } from "../constants";
import type { Scope } from "./Scope";

export class Input {
  private dataPrefix: string;
  private normalizedDataPrefix: string;
  private ignoreAttribute: string;
  private probeAttribute: string;

  private state: MouseState;
  private options: SupermouseOptions;
  private abortController = new AbortController();
  private mediaQueryList?: MediaQueryList;
  private motionQuery?: MediaQueryList;

  private onEnableChange: (enabled: boolean) => void;
  private onActiveScopeChange: (scope: Scope | null) => void;
  private resolveScope: (node: Node) => Scope | null;
  private onHoverSettled: () => void;

  private activeScope: Scope | null = null;
  private nativeTarget: HTMLElement | null = null;
  private currentTarget: HTMLElement | null = null;
  private lastParsedTarget: HTMLElement | null = null;

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
    state: MouseState,
    options: SupermouseOptions,
    onEnableChange: (enabled: boolean) => void,
    onActiveScopeChange: (scope: Scope | null) => void,
    resolveScope: (node: Node) => Scope | null,
    onHoverSettled: () => void
  ) {
    this.state = state;
    this.options = options;
    this.onEnableChange = onEnableChange;
    this.onActiveScopeChange = onActiveScopeChange;
    this.resolveScope = resolveScope;
    this.onHoverSettled = onHoverSettled;

    this.dataPrefix = options.dataPrefix ?? "supermouse";
    this.normalizedDataPrefix = this.dataPrefix
      .replace(/-([a-z])/g, (_, c: string) => c.toUpperCase())
      .toLowerCase();
    this.ignoreAttribute = `data-${this.dataPrefix}-ignore`;
    this.probeAttribute = `data-${this.dataPrefix}-probe`;

    this.checkDeviceCapability();
    this.checkMotionPreference();
    this.bindEvents();
  }

  /**
   * Switches the active scope. Resets the parse cache and re-translates
   * the pointer into the new scope's coordinate frame. Fires the engine's
   * active-scope-change callback before returning.
   */
  public setActiveScope(scope: Scope | null): void {
    if (scope === this.activeScope) return;
    this.activeScope = scope;

    this.lastParsedTarget = null;
    this.cachedChain = [];

    if (this.hasSeenPointer) {
      this.applyPointerToState();
      this.state.target.x = this.state.smooth.x = this.state.pointer.x;
      this.state.target.y = this.state.smooth.y = this.state.pointer.y;
    }

    this.onActiveScopeChange(scope);
  }

  /**
   * Recomputes hover state against the element currently under the pointer.
   *
   * Called by the engine after programmatic scope transitions
   * (`activate`, `deactivate`, `destroy`). The mouseover path handles this
   * itself via `handleMouseOver`, but those transitions don't fire a
   * mouseover, so the state has to be re-settled explicitly.
   *
   * Falls back to `clearHover()` when the pointer coordinates don't
   * resolve to an element — e.g. the pointer has moved outside the
   * viewport but no `mouseout` has fired yet.
   */
  public resettle(): void {
    if (!this.hasSeenPointer) return;
    const el = document.elementFromPoint(this.viewportX, this.viewportY);
    if (el) {
      this.settleHoverState(el as HTMLElement);
    } else {
      this.clearHover();
    }
  }

  /**
   * Parses the matched rules and `data-*` attributes for the given element
   * and its ancestors, merging the results into `state.interaction`.
   *
   * Results are cached per target in `cachedChain`; the walk re-runs only
   * when `element !== lastParsedTarget`.
   */
  public parseDOMInteraction(element: HTMLElement): void {
    if (!this.activeScope) return;

    const root = this.activeScope.stage.containerElement;
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

  /**
   * Whether the given element's bounding rect contains the current
   * pointer position. Returns `false` before any pointer input has been
   * received.
   */
  public isPointerInside(el: HTMLElement): boolean {
    if (!this.hasSeenPointer) return false;
    const r = el.getBoundingClientRect();
    return (
      this.viewportX >= r.left &&
      this.viewportX <= r.right &&
      this.viewportY >= r.top &&
      this.viewportY <= r.bottom
    );
  }

  public clearHover(): void {
    this.state.isHover = false;
    this.state.hoverTarget = null;
    this.state.isNative = false;
    this.nativeTarget = null;
    this.state.interaction = {};
    this.currentTarget = null;
    this.state.pointerTarget = null;
    this.state.authoredCursor = null;
    this.lastParsedTarget = null;
    this.cachedChain = [];
  }

  public getCurrentTarget(): HTMLElement | null {
    return this.currentTarget;
  }

  public destroy(): void {
    this.abortController.abort();
    this.cachedChain = [];
  }

  private handleMove = (e: PointerEvent): void => {
    if (this.shouldIgnorePointerEvent(e)) return;

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

  private handleDown = (e: PointerEvent): void => {
    if (this.shouldIgnorePointerEvent(e)) return;
    if (this.isEnabled) this.state.isDown = true;
  };

  private handleUp = (e: PointerEvent): void => {
    if (this.shouldIgnorePointerEvent(e)) return;
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

    this.settleHoverState(target);
    this.onHoverSettled();
  };

  private handleMouseOut = (e: Event): void => {
    if (!this.isEnabled) return;
    const target = e.target as HTMLElement;
    const related = (e as MouseEvent).relatedTarget as Node | null;

    if (target === this.state.hoverTarget || this.state.hoverTarget?.contains(target)) {
      if (!related || !this.state.hoverTarget?.contains(related)) {
        this.state.isHover = false;
        this.state.hoverTarget = null;
      }
    }

    if (this.nativeTarget && (target === this.nativeTarget || this.nativeTarget.contains(target))) {
      if (!related || !this.nativeTarget.contains(related)) {
        this.state.isNative = false;
        this.nativeTarget = null;
      }
    }

    if (target === this.currentTarget) {
      this.currentTarget = null;
      this.state.pointerTarget = null;
      this.state.authoredCursor = null;
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

  /**
   * Computes hover, native, and interaction state for the given target.
   * Fires on `mouseover` and from `resettle()` after a programmatic scope
   * transition. Everything downstream of this reads the state it writes.
   */
  private settleHoverState(target: HTMLElement): void {
    if (this.state.cursorMode === "auto" && target.closest(`[${this.ignoreAttribute}]`)) {
      this.clearHover();
      this.state.isNative = true;
      this.nativeTarget = target;
      return;
    }

    this.state.isNative = false;
    this.nativeTarget = null;
    this.currentTarget = target;
    this.state.pointerTarget = target;
    const authored = this.resolveAuthoredCursor(target);
    this.state.authoredCursor = authored;
    this.parseDOMInteraction(target);

    const hoverable = target.closest(this.activeScope!.hoverSelectorString);
    if (hoverable) {
      this.state.isHover = true;
      this.state.hoverTarget = hoverable as HTMLElement;
    }

    if (this.state.cursorMode !== "auto") return;

    if (this.matchesSelector(target, this.activeScope!.nativeSelectorString)) {
      this.state.isNative = true;
      this.nativeTarget = target;
      return;
    }

    if (target.isContentEditable || !SUPERMOUSE_CURSORS.has(authored)) {
      this.state.isNative = true;
      this.nativeTarget = target;
    }
  }

  /**
   * Whether a pointer event should be ignored because it originates from
   * a touch on a hybrid device where Supermouse is not enabled for touch
   */
  private shouldIgnorePointerEvent(e: PointerEvent): boolean {
    return (
      this.options.autoDisableOnMobile === true &&
      e.pointerType === "touch" &&
      this.options.enableTouch !== true
    );
  }

  /**
   * Reads the element's authored cursor value without our own suppression
   * interfering.
   *
   * Temporarily marks the element with the probe attribute, which every
   * generated suppression rule excludes via `:not([...])`. Reads the
   * computed cursor, then removes the attribute.
   */
  private resolveAuthoredCursor(target: HTMLElement): string {
    target.setAttribute(this.probeAttribute, "");
    try {
      return window.getComputedStyle(target).cursor;
    } finally {
      target.removeAttribute(this.probeAttribute);
    }
  }

  private matchesSelector(element: HTMLElement, selector: string): boolean {
    try {
      return element.matches(selector);
    } catch {
      // Invalid selector in a rule or cursor policy; ignore it.
      return false;
    }
  }

  /**
   * Writes the pointer position into `state.pointer`, translated from
   * viewport coordinates into the active scope's coordinate frame.
   *
   * For `document.body` the two frames coincide, so the viewport
   * coordinates pass through unchanged. For any other container, the
   * container's bounding rect is subtracted. `getBoundingClientRect`
   * accounts for CSS transforms, so a container mid-animation reads
   * correctly.
   */
  private applyPointerToState(): void {
    const container = this.activeScope?.stage.containerElement ?? document.body;
    if (container === document.body) {
      this.state.pointer.x = this.viewportX;
      this.state.pointer.y = this.viewportY;
      return;
    }
    const r = container.getBoundingClientRect();
    this.state.pointer.x = this.viewportX - r.left;
    this.state.pointer.y = this.viewportY - r.top;
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

  private bindEvents(): void {
    const { signal } = this.abortController;
    window.addEventListener("pointermove", this.handleMove, { passive: true, signal });
    window.addEventListener("pointerdown", this.handleDown, { passive: true, signal });
    window.addEventListener("pointerup", this.handleUp, { signal });
    document.addEventListener("mouseover", this.handleMouseOver, { signal });
    document.addEventListener("mouseout", this.handleMouseOut, { signal });
  }
}
