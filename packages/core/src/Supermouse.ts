declare const __VERSION__: string | undefined;
const VERSION: string = typeof __VERSION__ !== "undefined" ? __VERSION__ : "0.0.0";

import type { MouseState, SupermouseInstance, SupermouseOptions, SupermousePlugin } from "./types";

/** Standard linear interpolation between `start` and `end` by `factor` ∈ [0, 1]. */
function lerp(start: number, end: number, factor: number): number {
  return start + (end - start) * factor;
}

/**
 * Framerate-independent exponential smoothing (Freya Holmér's "damp").
 *
 * @param lambda  Response rate. Higher = snappier. ~10 is "instant", ~2 is "floaty".
 * @param dt      Delta time in **seconds** (cap to ~0.1 before passing in).
 */
function damp(a: number, b: number, lambda: number, dt: number): number {
  return lerp(a, b, 1 - Math.exp(-lambda * dt));
}

/**
 * Off-screen park position used before any input arrives, and after the
 * pointer leaves the viewport with `hideOnLeave` enabled. (-100, -100) rather
 * than (0, 0) so elements pinned to the top-left corner don't get a spurious
 * hover on first load.
 */
const OFFSCREEN = { x: -100, y: -100 } as const;

/** HTML tags that always warrant native cursor fallback regardless of computed styles. */
const NATIVE_TAGS = new Set(["input", "textarea", "select"]);

/**
 * Computed `cursor` values treated as "author didn't explicitly choose one."
 * Anything outside this set (e.g. `text`, `not-allowed`, `zoom-in`, `url(...)`)
 * is read as intentional and wins over the custom cursor when `ignoreOnNative`
 * includes a CSS check.
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

/** Default selectors that trigger `state.isHover`. Override with the `hoverSelectors` option. */
export const DEFAULT_HOVER_SELECTORS = [
  "a",
  "button",
  "input",
  "textarea",
  "[data-hover]",
  "[data-cursor]"
];

/**
 * Input.ts
 *
 * Owns all browser-event listening and is the **only** class allowed to write
 * to these `MouseState` fields: `pointer`, `isDown`, `isHover`, `isNative`,
 * `hoverTarget`, `interaction`, `reducedMotion`.
 *
 * @internal Instantiated by `Supermouse`. Not part of the public API.
 */
export class Input {
  private mediaQueryList?: MediaQueryList;
  private motionQuery?: MediaQueryList;
  private dataPrefix: string;
  private normalizedDataPrefix: string;
  private ignoreAttribute: string;
  private abortController = new AbortController();

  /**
   * Opt-in per-element cache of computed `cursor` values.
   * Off by default: a permanent cache goes silently stale when a framework
   * (React/Vue) reuses the same DOM node across renders while toggling a
   * class that changes its cursor. Enable with `cacheCursorStyle: true` only
   * on mostly-static markup. Call `clearStyleCache()` to invalidate manually.
   */
  private cursorStyleCache = new WeakMap<Element, string>();

  /**
   * The element that most recently caused `isNative = true`. Compared against
   * `relatedTarget` in `handleMouseOut` so `isNative` only clears once the
   * pointer actually exits this element — not on every internal bubble.
   */
  private nativeTarget: HTMLElement | null = null;

  /**
   * Flips to `true` on the first real `pointermove`, and is **never** reset
   * by `disable()` or `reset()`. Lets `enable()` snap the cursor to the
   * current position immediately rather than waiting for the next move event.
   */
  public hasSeenPointer: boolean = false;

  /** Master enable switch. See `Supermouse.enable()` / `disable()` / `suspend()`. */
  public isEnabled: boolean = true;

  constructor(
    private state: MouseState,
    private options: SupermouseOptions,
    private getHoverSelector: () => string,
    private onEnableChange: (enabled: boolean) => void
  ) {
    this.dataPrefix = this.options.dataPrefix ?? "supermouse";
    this.normalizedDataPrefix = this.dataPrefix.toLowerCase();
    this.ignoreAttribute = `data-${this.dataPrefix}-ignore`;

    this.checkDeviceCapability();
    this.checkMotionPreference();
    this.bindEvents();
  }

  /** Invalidates the computed-cursor cache. Only useful when `cacheCursorStyle` is enabled. */
  public clearStyleCache(): void {
    this.cursorStyleCache = new WeakMap();
  }

  /**
   * Static device capability check via `(pointer: fine)`.
   * This is the coarse/device-level gate; individual touch events are still
   * filtered per-event in `handleMove` via `pointerType`. The two are
   * intentionally independent so hybrid devices (touchscreen laptops) work correctly.
   */
  private checkDeviceCapability(): void {
    if (!this.options.autoDisableOnMobile) return;
    this.mediaQueryList = window.matchMedia("(pointer: fine)");
    this.updateEnabledState(this.mediaQueryList.matches);
    this.mediaQueryList.addEventListener("change", (e) => this.updateEnabledState(e.matches), {
      signal: this.abortController.signal
    });
  }

  /**
   * Checks for `prefers-reduced-motion`.
   * If true, the core physics engine will switch to instant snapping (high damping) to avoid motion sickness.
   */
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

  /**
   * Populates `state.interaction` from `options.rules` (selector to object map)
   * merged with `data-{prefix}-*` attributes on the element (attributes win).
   *
   */
  private parseDOMInteraction(element: HTMLElement): void {
    if (this.options.resolveInteraction) {
      this.state.interaction = this.options.resolveInteraction(element) || {};
      return;
    }
    const data: Record<string, string | boolean> = {};
    if (this.options.rules) {
      for (const [sel, rules] of Object.entries(this.options.rules)) {
        if (element.matches(sel)) Object.assign(data, rules);
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
   * Returns true when `target` is outside this instance's scoped container.
   * Body-scoped instances never ignore anything while cross-instance territory
   * is handled in `handleMouseOver` via the `.supermouse-scope` class check.
   */
  private isOutsideContainer(target: Node): boolean {
    const { container } = this.options;
    return !!container && container !== document.body && !container.contains(target);
  }

  /**
   * Reads computed `cursor` style, optionally through the opt-in per-element cache.
   */
  private resolveComputedCursor(target: HTMLElement): string {
    if (!this.options.cacheCursorStyle) {
      return window.getComputedStyle(target).cursor;
    }
    let cursorStyle = this.cursorStyleCache.get(target);
    if (cursorStyle === undefined) {
      cursorStyle = window.getComputedStyle(target).cursor;
      this.cursorStyleCache.set(target, cursorStyle);
    }
    return cursorStyle;
  }

  /**
   * Tracks raw pointer coordinates **even while disabled** so `enable()` can
   * snap immediately. Only `hasReceivedInput` and the initial snap are gated
   * on `isEnabled`.
   */
  private handleMove = (e: PointerEvent): void => {
    if (this.options.autoDisableOnMobile && e.pointerType === "touch" && !this.options.enableTouch)
      return;

    let x = e.clientX;
    let y = e.clientY;

    if (this.options.container && this.options.container !== document.body) {
      const rect = this.options.container.getBoundingClientRect();
      x -= rect.left;
      y -= rect.top;
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

    if (target.closest(`[${this.ignoreAttribute}]`)) {
      this.state.isNative = true;
      this.nativeTarget = target;
      return;
    }

    const hoverable = target.closest(this.getHoverSelector());
    if (hoverable) {
      this.state.isHover = true;
      this.state.hoverTarget = hoverable as HTMLElement;
      this.parseDOMInteraction(this.state.hoverTarget);
    }

    const strategy = this.options.ignoreOnNative;
    if (strategy) {
      const checkTags = strategy === "auto" || strategy === "tag";
      const checkCSS = strategy === "auto" || strategy === "css";
      let isNative = false;

      if (checkTags && (NATIVE_TAGS.has(target.localName) || target.isContentEditable)) {
        isNative = true;
      }
      if (!isNative && checkCSS && !SUPERMOUSE_CURSORS.has(this.resolveComputedCursor(target))) {
        isNative = true;
      }
      if (isNative) {
        this.state.isNative = true;
        this.nativeTarget = target;
      }
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
        this.state.interaction = {};
      }
    }

    // Only clear isNative once we've genuinely left the element that set it,
    // not on every child-boundary bubble during internal mouse movement.
    if (this.nativeTarget && (target === this.nativeTarget || target.contains(this.nativeTarget))) {
      if (!related || !this.nativeTarget.contains(related)) {
        this.state.isNative = false;
        this.nativeTarget = null;
      }
    }
  };

  private handleWindowLeave = (): void => {
    if (this.options.hideOnLeave) {
      this.state.hasReceivedInput = false;
      this.state.pointer = { ...OFFSCREEN };
    }
  };

  /** Resets all hover-derived state. Called by `suspend()` and exposed for edge cases. */
  public clearHover(): void {
    this.state.isHover = false;
    this.state.hoverTarget = null;
    this.state.isNative = false;
    this.nativeTarget = null;
    this.state.interaction = {};
  }

  private bindEvents(): void {
    const { signal } = this.abortController;
    // Pointer events on `window` — coordinates must be tracked globally.
    window.addEventListener("pointermove", this.handleMove, { passive: true, signal });
    window.addEventListener("pointerdown", this.handleDown, { passive: true, signal });
    window.addEventListener("pointerup", this.handleUp, { signal });

    // Hover events scoped to the container (document for body-scoped instances).
    const isBody = !this.options.container || this.options.container === document.body;
    const hoverRoot = isBody ? document : this.options.container!;
    hoverRoot.addEventListener("mouseover", this.handleMouseOver, { signal });
    hoverRoot.addEventListener("mouseout", this.handleMouseOut, { signal });
    document.addEventListener("mouseleave", this.handleWindowLeave, { signal });
  }

  public destroy(): void {
    this.abortController.abort();
  }
}

let stageCount = 0;

/**
 * Stage.ts
 *
 * Owns the DOM container plugins render into and manages native-cursor
 * suppression via an injected `<style>` tag.
 *
 * The stylesheet is rebuilt only when `selectors` changes (at plugin install
 * time, not per frame). Toggling cursor visibility is a cheap `classList.toggle`
 * on the container rather than a string rewrite.
 *
 * The `:not(.scopeClass .supermouse-scope):not(.scopeClass .supermouse-scope *)`
 * exclusion in each rule stops the outer instance's `cursor: none !important`
 * from leaking into a nested instance's container. Any element that lives
 * inside a nested `.supermouse-scope` is excluded from the outer rule; the
 * inner instance's own stylesheet picks up from there.
 *
 * @internal Instantiated by `Supermouse`. Not part of the public API.
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

  /**
   * Selectors needing an explicit `cursor: none !important` rule. A
   * container-level `cursor: none` can't override UA-stylesheet values
   * (e.g. `cursor: pointer` on `<a>`, `cursor: text` on inputs) via
   * inheritance alone, therefore these selectors get their own rules.
   */
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
    private hideNativeCursor: boolean,
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

    if (this.hideNativeCursor) this.setNativeCursor("none");
  }

  /**
   * Adds a new CSS selector to the `selectors` set.
   * Called by `Supermouse` and subsequently plugins during install to ensure
   * the native cursor is hidden on their specific interactive targets.
   */
  public addSelector(selector: string): void {
    this.selectors.add(selector);
    this.updateCursorCSS();
  }

  public setVisibility(visible: boolean): void {
    this.element.style.opacity = visible ? "1" : "0";
  }

  /**
   * Toggles the visibility of the native cursor.
   * @param type 'none' to hide, 'auto' to show.
   */
  public setNativeCursor(type: "none" | "auto"): void {
    if (!this.hideNativeCursor && type === "none") return;
    if (type === this.currentCursorState) return;
    this.currentCursorState = type;
    this.container.classList.toggle(this.hideClass, type === "none");
    this.container.style.cursor = type === "none" ? "none" : "";
  }

  /**
   * Rebuilds the injected stylesheet from the current `selectors` set.
   * Called only when `selectors` changes, never per frame.
   */
  private updateCursorCSS(): void {
    const rawSelectors = Array.from(this.selectors);
    if (rawSelectors.length === 0) {
      this.styleTag.innerText = "";
      return;
    }

    const exclusion = `:not(.${this.scopeClass} .supermouse-scope):not(.${this.scopeClass} .supermouse-scope *)`;
    const scopedRules = rawSelectors
      .map(
        (s) => `.${this.scopeClass}.${this.hideClass} ${s}${exclusion} { cursor: none !important; }`
      )
      .join("\n");

    this.styleTag.innerText = `
      ${scopedRules}
      .${this.scopeClass}.${this.hideClass} label${exclusion}                                     { cursor: none !important; }
      .${this.scopeClass}.${this.hideClass} select${exclusion}                                    { cursor: none !important; }
      .${this.scopeClass}.${this.hideClass} input[type="range"]${exclusion}::-webkit-slider-thumb { cursor: none !important; }
      .${this.scopeClass}.${this.hideClass} input[type="range"]${exclusion}::-moz-range-thumb     { cursor: none !important; }
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
      | "ignoreOnNative"
      | "hideCursor"
      | "hideOnLeave"
      | "autoStart"
      | "container"
      | "dataPrefix"
      | "zIndex"
      | "cacheCursorStyle"
    >
  >;

/**
 * Supermouse Runtime Loop
 *
 * This class orchestrates the application state, manages the animation loop,
 * and coordinates data flow between the internal systems, and the plugins. Read
 * the [docs](https://supermouse.js.org/docs/api/) to find more on the plugin state contract
 *
 * @default
 */
export class Supermouse implements SupermouseInstance {
  public static readonly version: string = VERSION;
  public readonly version: string = VERSION;

  state: MouseState;

  /** Configuration options, fully resolved with defaults applied. */
  options: ResolvedOptions;

  private plugins: SupermousePlugin[] = [];
  private stage: Stage;
  private input: Input;

  private rafId: number = 0;
  private lastTime: number = 0;
  private isRunning: boolean = false;
  private isSuspended: boolean = false;
  private visibilityAbortController = new AbortController();

  private hoverSelectors: Set<string>;
  private crashedPlugins: SupermousePlugin[] = [];

  /**
   * Creates a new Supermouse instance.
   *
   * @param options - Global configuration options.
   * @throws Will throw if running in a non-browser environment (window/document undefined).
   */
  constructor(options: SupermouseOptions = {}) {
    this.options = {
      smoothness: 0.15,
      enableTouch: false,
      autoDisableOnMobile: true,
      ignoreOnNative: "auto",
      hideCursor: true,
      hideOnLeave: true,
      autoStart: true,
      container: document.body,
      dataPrefix: "supermouse",
      zIndex: 9999,
      cacheCursorStyle: false,
      ...options
    } as ResolvedOptions;

    this.state = {
      pointer: { ...OFFSCREEN },
      target: { ...OFFSCREEN },
      smooth: { ...OFFSCREEN },
      velocity: { x: 0, y: 0 },
      angle: 0,
      isDown: false,
      isHover: false,
      isNative: false,
      forcedCursor: null,
      hoverTarget: null,
      reducedMotion: false,
      hasReceivedInput: false,
      shape: null,
      interaction: {}
    };

    this.hoverSelectors = new Set(this.options.hoverSelectors ?? DEFAULT_HOVER_SELECTORS);

    this.stage = new Stage(this.options.container, !!this.options.hideCursor, this.options.zIndex);
    this.hoverSelectors.forEach((s) => this.stage.addSelector(s));

    this.input = new Input(
      this.state,
      this.options,
      () => Array.from(this.hoverSelectors).join(", "),
      (enabled) => {
        if (!enabled) this.reset(true);
      }
    );

    this.options.plugins?.forEach((p) => this.use(p));
    this.bindVisibilityHandling();
    this.init();
  }

  /** Look up a registered plugin by name.
   * Returns `undefined` if not found. */
  public getPlugin(name: string): SupermousePlugin | undefined {
    return this.plugins.find((p) => p.name === name);
  }

  /** Whether the instance is not disabled/frozen and is processing input. */
  public get isEnabled(): boolean {
    return this.input.isEnabled;
  }

  /**
   * Enables a specific plugin by name.
   * Triggers the `onEnable` lifecycle hook of the plugin.
   */
  public enablePlugin(name: string): void {
    const plugin = this.getPlugin(name);
    if (plugin && plugin.isEnabled === false) {
      plugin.isEnabled = true;
      if (plugin.element) plugin.element.style.display = "";
      plugin.onEnable?.(this);
    }
  }

  /**
   * Disables a specific plugin by name and hides the element.
   * Triggers the `onDisable` lifecycle hook.
   */
  public disablePlugin(name: string): void {
    const plugin = this.getPlugin(name);
    if (plugin && plugin.isEnabled !== false) {
      plugin.isEnabled = false;
      try {
        plugin.onDisable?.(this);
      } finally {
        if (plugin.element) plugin.element.style.display = "none";
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

  /**
   * Adds a selector to hover-detection and the Stage's cursor-suppression
   * stylesheet. Triggers a CSS rebuild that calls during setup, not per frame.
   */
  public registerHoverTarget(selector: string): void {
    if (!this.hoverSelectors.has(selector)) {
      this.hoverSelectors.add(selector);
      this.stage.addSelector(selector);
    }
  }

  /** The DOM container plugins should append their visual elements into. */
  public get container(): HTMLDivElement {
    return this.stage.element;
  }

  /**
   * Overrides the auto-detected native cursor state.
   * - `"hide"` - always show the custom cursor.
   * - `"show"` - always show the native cursor (hides the custom stage).
   * - `"auto"` - let the engine decide based on `isNative` / `hasReceivedInput`.
   */
  public setNativeCursor(mode: "hide" | "show" | "auto"): void {
    this.state.forcedCursor = mode === "auto" ? null : mode === "hide" ? "none" : "auto";
  }

  private init(): void {
    if (this.options.autoStart) this.startLoop();
  }

  /**
   * Re-enables input processing. Snaps physics to the current pointer
   * position if it's been seen before (no sweep from off-screen).
   * Respects any active `forcedCursor` set via `setNativeCursor()`.
   */
  public enable(): void {
    this.input.isEnabled = true;
    if (this.options.hideCursor) {
      this.stage.setNativeCursor(this.resolveNativeCursorState());
    }
    if (this.input.hasSeenPointer) {
      this.state.target.x = this.state.smooth.x = this.state.pointer.x;
      this.state.target.y = this.state.smooth.y = this.state.pointer.y;
      this.state.velocity.x = 0;
      this.state.velocity.y = 0;
      this.state.hasReceivedInput = true;
    }
  }

  /** Disables input processing, restores the native cursor, and hard-resets physics. */
  public disable(): void {
    this.input.isEnabled = false;
    if (this.options.hideCursor) this.stage.setNativeCursor("auto");
    this.reset(true);
  }

  /**
   * Temporarily yields to a scoped instance. Hides this stage and fully
   * releases the native cursor so the inner instance's `ignoreOnNative` logic
   * is unobstructed. No-op if the instance is already disabled via `disable()`, which preserves
   * the user's explicit disabled state across an enter/leave cycle.
   */
  public suspend(): void {
    if (!this.input.isEnabled) return;
    this.isSuspended = true;
    this.input.isEnabled = false;
    this.input.clearHover();
    this.stage.setVisibility(false);
  }

  /**
   * Resumes from `suspend()`, snapping physics to the live pointer.
   * No-op if the instance wasn't suspended to guard against mismatched calls.
   */
  public resume(): void {
    if (!this.isSuspended) return;
    this.isSuspended = false;
    this.input.isEnabled = true;

    if (this.state.hasReceivedInput) {
      this.state.target.x = this.state.smooth.x = this.state.pointer.x;
      this.state.target.y = this.state.smooth.y = this.state.pointer.y;
      this.state.velocity.x = 0;
      this.state.velocity.y = 0;
    }
    // Force a plugin update before revealing the stage so elements are current, not stale from the last pre-suspended frame.
    for (let i = this.plugins.length - 1; i >= 0; i--) {
      this.runPluginSafe(this.plugins[i], 0);
    }
    this.stage.setVisibility(true);
  }

  /**
   * Registers a new plugin.
   *
   * @param plugin - The plugin object to install.
   */
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

  /**
   * Resets physics vectors to the off-screen park position. Does not reset
   * `state.pointer` as it must keep track of the live coordinate even while
   * disabled so `enable()` can snap without waiting for the next move event.
   *
   * @param hard  Also clears `hasReceivedInput`, `shape`, and `interaction`.
   */
  private reset(hard = false): void {
    this.state.target = { ...OFFSCREEN };
    this.state.smooth = { ...OFFSCREEN };
    this.state.velocity = { x: 0, y: 0 };
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
    if (document.hidden) return; // bindVisibilityHandling() resumes on tab focus
    this.lastTime = performance.now();
    this.tick(this.lastTime);
  }

  /**
   * Starts the animation loop. This is automatically called if `autoStart` is true.
   * Plugins can call this method to resume the loop if it has been stopped.
   */
  public start(): void {
    this.startLoop();
  }

  /**
   * Manually steps the animation loop.
   *
   * @param time Current timestamp in milliseconds.
   */
  public step(time: number): void {
    this.tick(time);
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

  /**
   * Removes plugins that threw during `update()` this frame. Lifecycle order
   * pauses first (`onDisable`), tears down (`destroy`), then DOM cleanup (`element.remove()`).
   */
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

  /** Whether the custom cursor stage should be visible this frame. */
  private resolveStageVisibility(): boolean {
    if (this.state.forcedCursor === "auto") return false;
    return this.input.isEnabled && !this.state.isNative && this.state.hasReceivedInput;
  }

  /** Whether the OS cursor should be visible or suppressed this frame. */
  private resolveNativeCursorState(): "none" | "auto" {
    if (this.state.forcedCursor !== null) return this.state.forcedCursor;
    return this.state.isNative || !this.state.hasReceivedInput ? "auto" : "none";
  }

  private tick = (time: number): void => {
    const dtMs = time - this.lastTime;
    const dt = Math.min(dtMs / 1000, 0.1);
    this.lastTime = time;

    if (this.state.hoverTarget && !this.state.hoverTarget.isConnected) {
      this.input.clearHover();
    }

    this.stage.setVisibility(this.resolveStageVisibility());
    if (this.input.isEnabled && this.options.hideCursor) {
      this.stage.setNativeCursor(this.resolveNativeCursorState());
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
      this.state.smooth.x = damp(this.state.smooth.x, this.state.target.x, factor, dt);
      this.state.smooth.y = damp(this.state.smooth.y, this.state.target.y, factor, dt);

      this.state.velocity.x = this.state.target.x - this.state.smooth.x;
      this.state.velocity.y = this.state.target.y - this.state.smooth.y;
      const { x: vx, y: vy } = this.state.velocity;
      if (Math.abs(vx) > 0.1 || Math.abs(vy) > 0.1) {
        this.state.angle = Math.atan2(vy, vx) * (180 / Math.PI);
      }
    }

    if (this.isRunning) this.rafId = requestAnimationFrame(this.tick);
  };

  /**
   * Pauses the rAF loop while the tab is hidden, resumes on focus.
   */
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

  /**
   * Destroys the instance.
   */
  public destroy(): void {
    this.isRunning = false;
    cancelAnimationFrame(this.rafId);
    this.visibilityAbortController.abort();
    this.input.destroy();
    this.stage.destroy();
    this.plugins.forEach((p) => p.destroy?.(this));
    this.plugins = [];
  }
}
