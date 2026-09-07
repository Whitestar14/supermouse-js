declare const __VERSION__: string | undefined;
const VERSION: string = typeof __VERSION__ !== "undefined" ? __VERSION__ : "0.0.0";

import type { MouseState, SupermouseOptions, SupermousePlugin, RuleDefinition } from "./types";

/** Standard linear interpolation */
function lerp(start: number, end: number, factor: number): number {
  return start + (end - start) * factor;
}

/**
 * Framerate-independent exponential smoothing by Freya Holmér.
 * @param lambda  Response rate.
 * @param dt Delta time in seconds.
 *
 * https://www.youtube.com/watch?v=LSNQuFEDOyQ
 */
function damp(a: number, b: number, lambda: number, dt: number): number {
  return lerp(a, b, 1 - Math.exp(-lambda * dt));
}

/** Off-screen park position before input arrives or after pointer leaves viewport. */
const OFFSCREEN = { x: -100, y: -100 } as const;

/** HTML tags that always warrant native cursor fallback. */
const NATIVE_TAGS = new Set(["input", "textarea", "select"]);

/**
 * Computed `cursor` values treated as "author didn't explicitly choose one."
 * Anything else wins over custom cursor.
 */
const SUPERMOUSE_CURSORS = new Set([
  "default",
  "auto",
  "pointer",
  "none",
  "inherit",
  "grab",
  "grabbing"
]);

/** Default selectors that trigger `state.isHover`. Override with `hoverSelectors`. */
export const DEFAULT_HOVER_SELECTORS = [
  "a",
  "button",
  "input",
  "textarea",
  "[data-hover]",
  "[data-cursor]"
];

/**
 * Owns all browser-event listening and is the only class allowed to write
 * to these `MouseState` fields: `pointer`, `isDown`, `isHover`, `isNative`,
 * `hoverTarget`, `interaction`, `reducedMotion`.
 *
 * @internal Instantiated by `Supermouse`.
 */
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

  /**
   * Evaluates rules against the given element.
   * Selector matching is cached per element; only function values re-evaluated each frame.
   */
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

  /**
   * Optimized selector matching:
   * - For simple selectors (no spaces), just call `element.matches`.
   * - For complex selectors with descendant combinators, fallback to splitting.
   */
  private matchesSelector(element: HTMLElement, selector: string): boolean {
    try {
      // Fast path: simple selector
      if (!/\s/.test(selector.trim())) {
        return element.matches(selector);
      }
    } catch {
      // If matches fails, fall through to ancestor-based matching
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

    // Built-in native detection: tags + CSS
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

    // Clear current target when pointer leaves it
    if (target === this.currentTarget) {
      this.currentTarget = null;
      this.lastParsedTarget = null;
      this.matchedRules = [];
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

  /** Returns the raw element currently under the pointer. */
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
    document.addEventListener("mouseleave", this.handleWindowLeave, { signal });
  }

  public destroy(): void {
    this.abortController.abort();
    this.resizeObserver?.disconnect();
  }
}

let stageCount = 0;

/**
 * Owns the stage container and manages native-cursor suppression via injected styles.
 * The stylesheet is rebuilt only when selectors change, not per frame.
 *
 * @internal Instantiated by `Supermouse`.
 */
export class Stage {
  public readonly element: HTMLDivElement;
  private styleTag: HTMLStyleElement;
  private readonly id: string;
  private readonly scopeClass: string;
  private readonly hideClass: string;

  private currentCursorState: "none" | "auto" | null = null;
  private originalContainerPosition: string = "";
  private originalContainerCursor: string = "";

  /** Selectors that need explicit `cursor: none !important` to override UA styles. */
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

  /** Batch add selectors. Comma‑separated groups are split and scoped individually. */
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

  /** Add a single selector (or comma‑separated group). */
  public addSelector(selector: string): void {
    this.addSelectors([selector]);
  }

  public setVisibility(visible: boolean): void {
    this.element.style.opacity = visible ? "1" : "0";
  }

  /** Toggle native cursor visibility. */
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

/**
 * The subset of `SupermouseOptions` guaranteed to have a concrete value once
 * the constructor has merged user input over the defaults.
 */
type ResolvedOptions = SupermouseOptions &
  Required<
    Pick<
      SupermouseOptions,
      | "smoothness"
      | "enableTouch"
      | "autoDisableOnMobile"
      | "cursor"
      | "hideOnLeave"
      | "autoStart"
      | "container"
      | "dataPrefix"
      | "zIndex"
    >
  >;

/**
 * Orchestrates state, animation loop, and plugin lifecycle.
 */
export class Supermouse {
  public static readonly version: string = VERSION;
  public readonly version: string = VERSION;

  state: MouseState;

  /** Configuration options, fully resolved with defaults applied. */
  options: ResolvedOptions;

  private plugins: SupermousePlugin[] = [];
  private _stage: Stage;
  private input: Input;

  private rafId: number = 0;
  private lastTime: number = 0;
  private isRunning: boolean = false;
  private isSuspended: boolean = false;
  private visibilityAbortController = new AbortController();

  private hoverSelectors: Set<string>;
  private hoverSelectorString: string;
  private crashedPlugins: SupermousePlugin[] = [];

  constructor(options: SupermouseOptions = {}) {
    this.options = {
      smoothness: 0.15,
      enableTouch: false,
      autoDisableOnMobile: true,
      cursor: "auto",
      hideOnLeave: true,
      autoStart: true,
      container: document.body,
      dataPrefix: "supermouse",
      zIndex: 9999,
      ...options
    } as ResolvedOptions;

    this.state = {
      pointer: { ...OFFSCREEN },
      target: { ...OFFSCREEN },
      smooth: { ...OFFSCREEN },
      velocity: { x: 0, y: 0 },
      displacement: { x: 0, y: 0 },
      angle: 0,
      isDown: false,
      isHover: false,
      isNative: false,
      cursorMode: this.options.cursor,
      hoverTarget: null,
      reducedMotion: false,
      hasReceivedInput: false,
      shape: null,
      interaction: {}
    };

    this.hoverSelectors = new Set(this.options.hoverSelectors ?? DEFAULT_HOVER_SELECTORS);
    this.hoverSelectorString = Array.from(this.hoverSelectors).join(", ");

    this._stage = new Stage(this.options.container, this.options.zIndex);
    this._stage.addSelectors(this.hoverSelectors);

    this.input = new Input(
      this.state,
      this.options,
      () => this.hoverSelectorString,
      (enabled) => {
        if (!enabled) this.reset(true);
      }
    );

    this.options.plugins?.forEach((p) => this.use(p));
    this.bindVisibilityHandling();
    this.init();
  }

  /** Look up a registered plugin by name. */
  public getPlugin(name: string): SupermousePlugin | undefined {
    return this.plugins.find((p) => p.name === name);
  }

  /** Whether the instance is not disabled/suspended and is processing input. */
  public get isEnabled(): boolean {
    return this.input.isEnabled;
  }

  /** Enable a plugin by name. */
  public enablePlugin(name: string): void {
    const plugin = this.getPlugin(name);
    if (plugin && plugin.isEnabled === false) {
      plugin.isEnabled = true;
      if (plugin.element) plugin.element.style.display = "";
      plugin.onEnable?.(this);
    }
  }

  /** Disable a plugin by name and hide its element. */
  public disablePlugin(name: string): void {
    const plugin = this.getPlugin(name);
    if (plugin && plugin.isEnabled !== false) {
      plugin.isEnabled = false;

      const finishDisable = () => {
        if (plugin.element) plugin.element.style.display = "none";
        plugin.onDisable?.(this);
      };

      const result = plugin.onBeforeDisable?.(this);
      if (result && typeof result.then === "function") {
        void Promise.resolve(result)
          .then(finishDisable)
          .catch((err) => {
            console.error(`[Supermouse] Plugin '${plugin.name}' onBeforeDisable threw:`, err);
            finishDisable();
          });
      } else {
        finishDisable();
      }
    }
  }

  /** Toggle a plugin's enabled state by name. */
  public togglePlugin(name: string): void {
    const plugin = this.getPlugin(name);
    if (!plugin) return;
    if (plugin.isEnabled === false) this.enablePlugin(name);
    else this.disablePlugin(name);
  }

  /** Add a selector to hover detection and cursor suppression. */
  public registerHoverTarget(selector: string): void {
    if (!this.hoverSelectors.has(selector)) {
      this.hoverSelectors.add(selector);
      this.hoverSelectorString = Array.from(this.hoverSelectors).join(", ");
      this._stage.addSelector(selector);
    }
  }

  /** The DOM element the instance is scoped to. */
  public get container(): HTMLElement {
    return this.options.container;
  }

  /** The stage element that plugins append their visuals into. */
  public get stage(): HTMLDivElement {
    return this._stage.element;
  }

  /** Set the current cursor mode. */
  public setCursor(mode: "auto" | "custom" | "native" | "both"): void {
    this.state.cursorMode = mode;
  }

  private init(): void {
    if (this.options.autoStart) this.startLoop();
  }

  /** Re‑enable input processing and re‑apply cursor state. */
  public enable(): void {
    this.input.isEnabled = true;

    if (this.input.hasSeenPointer) {
      this.state.target.x = this.state.smooth.x = this.state.pointer.x;
      this.state.target.y = this.state.smooth.y = this.state.pointer.y;
      this.resetMotion();
      this.state.hasReceivedInput = true;
    }

    this._stage.setNativeCursor(this.resolveCursorState());
  }

  /** Disable input processing and restore native cursor. */
  public disable(): void {
    this.input.isEnabled = false;
    this._stage.setNativeCursor("auto");
    this._stage.setVisibility(false);
    this.reset(true);
  }

  /** Temporarily yield to a scoped instance. */
  public suspend(): void {
    if (!this.input.isEnabled) return;
    this.isSuspended = true;
    this.input.isEnabled = false;
    this.input.clearHover();
    /** Current limitations with multi-scoped containers identified.
     * setting native cursor here suppresses cursor css so aggressively
     * that cursor: "both" will not work on scoped instances.
     * proposed fix by v2.5+ */
    // this._stage.setNativeCursor("auto");
    this._stage.setVisibility(false);
  }

  /** Resume from `suspend()`. */
  public resume(): void {
    if (!this.isSuspended) return;
    this.isSuspended = false;
    this.input.isEnabled = true;

    if (this.state.hasReceivedInput) {
      this.state.target.x = this.state.smooth.x = this.state.pointer.x;
      this.state.target.y = this.state.smooth.y = this.state.pointer.y;
      this.resetMotion();
    }
    // Update plugins before showing stage to avoid stale visuals.
    for (let i = this.plugins.length - 1; i >= 0; i--) {
      this.runPluginSafe(this.plugins[i], 0);
    }
    this._stage.setVisibility(true);
  }

  /** Register a new plugin. */
  public use(plugin: SupermousePlugin): this {
    if (this.plugins.some((p) => p.name === plugin.name)) {
      console.warn(`[Supermouse] Plugin "${plugin.name}" already installed.`);
      return this;
    }
    plugin.isEnabled ??= true;
    try {
      plugin.install?.(this);
    } catch (e) {
      console.error(`[Supermouse] Failed to install plugin '${plugin.name}'.`, e);
      return this;
    }
    this.plugins.push(plugin);
    this.plugins.sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0));
    return this;
  }

  /** Reset physics; optionally clear all input state. */
  private reset(hard = false): void {
    this.state.target = { ...OFFSCREEN };
    this.state.smooth = { ...OFFSCREEN };
    this.resetMotion();
    this.state.angle = 0;
    if (hard) {
      this.state.hasReceivedInput = false;
      this.state.shape = null;
      this.state.interaction = {};
    }
  }

  private startLoop(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    if (document.hidden) return;
    this.lastTime = performance.now();
    this.rafId = requestAnimationFrame(this.tick);
  }

  /** Start the animation loop. */
  public start(): void {
    this.startLoop();
  }

  /** Manually step the animation loop. */
  public step(time: number): void {
    this.update(time);
  }

  private runPluginSafe(plugin: SupermousePlugin, deltaTime: number): void {
    if (plugin.isEnabled === false) return;
    try {
      plugin.update?.(this, deltaTime);
    } catch (e) {
      console.error(`[Supermouse] Plugin '${plugin.name}' crashed and has been disabled.`, e);
      plugin.isEnabled = false;
      this.crashedPlugins.push(plugin);
    }
  }

  private cleanupCrashedPlugins(): void {
    if (this.crashedPlugins.length === 0) return;
    for (const plugin of this.crashedPlugins) {
      const index = this.plugins.indexOf(plugin);
      if (index > -1) this.plugins.splice(index, 1);
      try {
        plugin.onDisable?.(this);
        plugin.destroy?.(this);
      } catch (err) {
        console.error(`[Supermouse] Failed to cleanup crashed plugin '${plugin.name}'.`, err);
      }
      plugin.element?.remove();
    }
    this.crashedPlugins = [];
  }

  private resolveStageVisibility(): boolean {
    if (this.state.cursorMode === "native") return false;
    if (this.state.cursorMode === "both")
      return this.input.isEnabled && this.state.hasReceivedInput;
    if (this.state.cursorMode === "custom")
      return this.input.isEnabled && this.state.hasReceivedInput;

    return this.input.isEnabled && !this.state.isNative && this.state.hasReceivedInput;
  }

  private resolveCursorState(): "none" | "auto" {
    if (!this.input.isEnabled) return "auto";

    if (this.state.cursorMode === "both") return "auto";
    if (this.state.cursorMode === "native") return "auto";
    if (this.state.cursorMode === "custom") return "none";
    return this.state.isNative || !this.state.hasReceivedInput ? "auto" : "none";
  }

  private resetMotion(): void {
    this.state.velocity = { x: 0, y: 0 };
    this.state.displacement = { x: 0, y: 0 };
  }

  private update(time: number): void {
    const dtMs = time - this.lastTime;
    const dt = Math.min(dtMs / 1000, 0.1);
    this.lastTime = time;

    const currentTarget = this.input.getCurrentTarget();
    if (currentTarget && !currentTarget.isConnected) {
      this.input.clearHover();
    } else if (currentTarget) {
      this.input.parseDOMInteraction(currentTarget);
    }

    this._stage.setVisibility(this.resolveStageVisibility());
    if (this.input.isEnabled) {
      this._stage.setNativeCursor(this.resolveCursorState());
    }

    if (this.input.isEnabled && this.state.hasReceivedInput) {
      this.state.target.x = this.state.pointer.x;
      this.state.target.y = this.state.pointer.y;
    }

    for (let i = 0; i < this.plugins.length; i++) {
      this.runPluginSafe(this.plugins[i], dtMs);
    }
    this.cleanupCrashedPlugins();

    if (this.input.isEnabled) {
      const factor = this.state.reducedMotion ? 1000 : (1 / this.options.smoothness) * 2;

      const previousX = this.state.smooth.x;
      const previousY = this.state.smooth.y;

      this.state.smooth.x = damp(this.state.smooth.x, this.state.target.x, factor, dt);
      this.state.smooth.y = damp(this.state.smooth.y, this.state.target.y, factor, dt);

      this.state.displacement.x = this.state.target.x - this.state.smooth.x;
      this.state.displacement.y = this.state.target.y - this.state.smooth.y;

      if (dt > 0) {
        this.state.velocity.x = (this.state.smooth.x - previousX) / dt;
        this.state.velocity.y = (this.state.smooth.y - previousY) / dt;
      } else {
        this.state.velocity.x = 0;
        this.state.velocity.y = 0;
      }

      const { x: vx, y: vy } = this.state.velocity;
      if (Math.abs(vx) > 0.1 || Math.abs(vy) > 0.1) {
        this.state.angle = Math.atan2(vy, vx) * (180 / Math.PI);
      }
    }
  }

  private tick = (time: number): void => {
    this.update(time);
    if (this.isRunning) {
      this.rafId = requestAnimationFrame(this.tick);
    }
  };

  /** Pause rAF loop when tab hidden; resume on visible. */
  private bindVisibilityHandling(): void {
    document.addEventListener(
      "visibilitychange",
      () => {
        if (!this.isRunning) return;
        if (document.hidden) {
          cancelAnimationFrame(this.rafId);
        } else {
          this.lastTime = performance.now();
          this.rafId = requestAnimationFrame(this.tick);
        }
      },
      { signal: this.visibilityAbortController.signal }
    );
  }

  /** Destroy the instance, freeing all resources. */
  public destroy(): void {
    this.isRunning = false;
    cancelAnimationFrame(this.rafId);
    this.visibilityAbortController.abort();
    this.input.destroy();
    this._stage.destroy();
    this.plugins.forEach((p) => p.destroy?.(this));
    this.plugins = [];
  }
}

export type SupermouseInstance = Supermouse;
