declare const __VERSION__: string | undefined;
const VERSION: string = typeof __VERSION__ !== "undefined" ? __VERSION__ : "0.0.0";

import type { MouseState, SupermouseOptions, SupermousePlugin } from "./types";

/** Standard linear interpolation between `start` and `end` by `factor` (0–1). */
export function lerp(start: number, end: number, factor: number): number {
  return start + (end - start) * factor;
}

/**
 * Framerate-independent exponential smoothing.
 *
 * A naive `lerp(a, b, someFixedFactor)` applied once per frame produces a
 * result that depends on your frame rate — the same code visibly "catches up"
 * slower on a janky frame than a smooth one. `damp` folds the elapsed time
 * (`dt`) into the interpolation itself so a dropped frame changes how FAR you
 * jump, not how the motion looks. This is the whole reason the cursor doesn't
 * stutter or change apparent speed when the tab is under load.
 *
 * @param lambda Response rate — higher means snappier / less smoothing.
 * @param dt Delta time in seconds.
 */
export function damp(a: number, b: number, lambda: number, dt: number): number {
  return lerp(a, b, 1 - Math.exp(-lambda * dt));
}

/**
 * Position used to park the cursor before any input has been received, or
 * after the pointer leaves the viewport with `hideOnLeave` enabled. Kept off
 * (-100, -100) rather than (0, 0) so it's unambiguously off-canvas even for
 * elements pinned to the top-left corner.
 */
const OFFSCREEN = { x: -100, y: -100 } as const;

/** Tags that are always native/OS-level text input, regardless of any `cursor: none` styling applied to them. */
const NATIVE_TAGS = new Set(["input", "textarea", "select"]);

/**
 * Computed `cursor` values treated as "not an explicit author choice" — i.e.
 * roughly what a plain, unstyled element would report. Anything outside this
 * set (`text`, `not-allowed`, `zoom-in`, a custom `url(...)` cursor, etc.) is
 * read as deliberate author intent and wins over the custom cursor when
 * `ignoreOnNative` includes a CSS check.
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

/** Selectors that count as "hoverable" out of the box if the consumer doesn't supply their own. */
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
 * This class listens to browser events and mutates the shared `MouseState` object.
 *
 * @internal This is an internal system class instantiated by `Supermouse`.
 */
export class Input {
  private mediaQueryList?: MediaQueryList;
  private motionQuery?: MediaQueryList;
  private dataPrefix: string;
  private normalizedDataPrefix: string;
  private ignoreAttribute: string;
  private abortController = new AbortController();

  /**
   * Per-element cache of computed `cursor` values, only populated when
   * `options.cacheCursorStyle` is true. See the doc comment on that option in
   * `types.ts` for why it defaults to off — short version: a permanent cache
   * goes stale the instant a persisted DOM node's cursor style changes
   * without the node itself being replaced, which is routine in React/Vue
   * apps (disabled/loading states toggled via class bindings on a node that
   * reconciliation reuses). `clearStyleCache()` is here for anyone who
   * enables it and needs to manually bust it after such a change.
   */
  private cursorStyleCache = new WeakMap<Element, string>();

  /**
   * The specific element that most recently set `isNative`. Tracked
   * separately from `hoverTarget` so `handleMouseOut` only clears `isNative`
   * once we've actually left THIS element (or a container of it) — not on
   * every unrelated bubbling `mouseout` fired while moving around inside it.
   */
  private nativeTarget: HTMLElement | null = null;

  /**
   * True once at least one real pointer coordinate has ever been recorded —
   * independent of `isEnabled`/`state.hasReceivedInput`, both of which are
   * session-scoped and get hard-reset by `Supermouse.disable()`. This lets
   * `Supermouse.enable()` snap the custom cursor back immediately instead of
   * waiting on the next `pointermove` to do it — see `Supermouse.enable()`.
   */
  public hasSeenPointer: boolean = false;

  /**
   * Master switch for input processing.
   * Toggled by `Supermouse.enable()`/`disable()` or automatically by device capability checks.
   */
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

  /** Drops all cached computed-style lookups. Only relevant when `cacheCursorStyle` is enabled. */
  public clearStyleCache(): void {
    this.cursorStyleCache = new WeakMap();
  }

  /**
   * Automatically disables the custom cursor on devices without fine pointer control.
   * This is the STATIC half of mobile handling — a device-level capability check.
   * The DYNAMIC half lives in `handleMove`, which filters individual touch
   * events by `PointerEvent.pointerType`. They're deliberately independent:
   * a hybrid device (touchscreen laptop) can have `isEnabled === true` from
   * this check while still rejecting individual touch-originated events.
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
   * True when `target` sits outside a scoped instance's container and should
   * be ignored entirely. Instances scoped to `document.body` never ignore
   * anything.
   */
  private isOutsideContainer(target: Node): boolean {
    const { container } = this.options;
    return !!container && container !== document.body && !container.contains(target);
  }

  /**
   * Reads an element's computed `cursor`, going through `cursorStyleCache`
   * only if `cacheCursorStyle` is enabled.
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
   * Pointer position is tracked globally and continuously — even while
   * disabled — so that re-enabling (or `unfreeze()`) always has a fresh
   * coordinate to snap to instead of a stale one. What's gated on `isEnabled`
   * is *advancing the runtime state* (`hasReceivedInput`, the initial snap):
   * a disabled instance keeps its finger on the pulse without acting on it.
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

    const selector = this.getHoverSelector();
    const hoverable = target.closest(selector);

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

      if (!isNative && checkCSS) {
        if (!SUPERMOUSE_CURSORS.has(this.resolveComputedCursor(target))) {
          isNative = true;
        }
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

  public clearHover(): void {
    this.state.isHover = false;
    this.state.hoverTarget = null;
    this.state.isNative = false;
    this.nativeTarget = null;
    this.state.interaction = {};
  }

  private bindEvents(): void {
    const { signal } = this.abortController;

    // Pointer events are global — coordinates must track everywhere.
    window.addEventListener("pointermove", this.handleMove, { passive: true, signal });
    window.addEventListener("pointerdown", this.handleDown, { passive: true, signal });
    window.addEventListener("pointerup", this.handleUp, { signal });

    // Hover events are territorial — only care about elements within our container.
    const isBody = !this.options.container || this.options.container === document.body;
    const hoverTarget = isBody ? document : this.options.container!;

    hoverTarget.addEventListener("mouseover", this.handleMouseOver, { signal });
    hoverTarget.addEventListener("mouseout", this.handleMouseOut, { signal });
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
 * This class manages the DOM container for the custom cursor and toggles
 * native cursor visibility by injecting a scoped `<style>` rule (rather than
 * setting inline `cursor` styles on every matched element one by one, which
 * would fight author stylesheets on specificity and be slower to update in
 * bulk). Instantiated by `Supermouse`; not intended for direct use by plugins.
 *
 * The rule text is a STATIC function of `selectors` alone — it's rewritten
 * only when `addSelector()` changes that set (rare, typically just plugin
 * install time), never on every show/hide toggle. Showing/hiding the native
 * cursor is a `classList.toggle()` of `hideClass` on the container, which is
 * what actually flips the rule on and off. Previously the whole stylesheet
 * string was rebuilt (or blanked) on every single toggle, which is on the
 * hot path (`Supermouse.tick()` calls `setNativeCursor` every frame the
 * cursor state might have changed) — a class toggle is a lot cheaper than a
 * string rebuild + `.innerText =` write, which itself forces a style recalc.
 *
 * @internal
 */
export class Stage {
  /** The container element appended to the document. */
  public readonly element: HTMLDivElement;
  private styleTag: HTMLStyleElement;
  private id: string;
  private scopeClass: string;
  private hideClass: string;

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
    private hideNativeCursor: boolean,
    private zIndex: number = 9999
  ) {
    if (!container || !(container instanceof HTMLElement)) {
      throw new Error(`[Supermouse] Invalid container: ${container}. Must be an HTMLElement.`);
    }
    if (!container.isConnected) {
      console.warn(
        "[Supermouse] container is not attached to the document yet — stage sizing/positioning " +
          "will be wrong until it is."
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
      if (computed.position === "static") {
        container.style.position = "relative";
      }
    }

    this.originalContainerCursor = container.style.cursor;

    container.appendChild(this.element);

    this.styleTag = document.createElement("style");
    this.styleTag.id = this.id;
    document.head.appendChild(this.styleTag);

    this.container.classList.add(this.scopeClass);
    this.updateCursorCSS();

    if (this.hideNativeCursor) {
      this.setNativeCursor("none");
    }
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

  /** Rebuilds the (static) scoped CSS rule from the current `selectors` set. Only called when that set changes. */
  private updateCursorCSS(): void {
    const rawSelectors = Array.from(this.selectors);
    if (rawSelectors.length === 0) {
      this.styleTag.innerText = "";
      return;
    }

    const scopedSelectors = rawSelectors
      .map((s) => `.${this.scopeClass}.${this.hideClass} ${s}`)
      .join(", ");

    this.styleTag.innerText = `${scopedSelectors} { cursor: none !important; }`;
  }

  public destroy(): void {
    this.element.remove();
    this.styleTag.remove();

    this.container.style.cursor = this.originalContainerCursor;
    this.container.classList.remove(this.scopeClass, this.hideClass);

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
export class Supermouse {
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

  /**
   * Retrieves a registered plugin instance by its unique name.
   */
  public getPlugin(name: string): SupermousePlugin | undefined {
    return this.plugins.find((p) => p.name === name);
  }

  /**
   * Returns whether the cursor system is currently enabled (processing input).
   */
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
   * Disables a specific plugin by name.
   * Triggers the `onDisable` lifecycle hook.
   */
  public disablePlugin(name: string): void {
    const plugin = this.getPlugin(name);
    if (plugin && plugin.isEnabled !== false) {
      plugin.isEnabled = false;
      if (plugin.element) plugin.element.style.display = "none";
      plugin.onDisable?.(this);
    }
  }

  /**
   * Toggles the enabled state of a plugin.
   */
  public togglePlugin(name: string): void {
    const plugin = this.getPlugin(name);
    if (!plugin) return;
    if (plugin.isEnabled === false) this.enablePlugin(name);
    else this.disablePlugin(name);
  }

  public registerHoverTarget(selector: string): void {
    if (!this.hoverSelectors.has(selector)) {
      this.hoverSelectors.add(selector);
      this.stage.addSelector(selector);
    }
  }

  /**
   * The fixed container element where plugins should append their DOM nodes.
   */
  public get container(): HTMLDivElement {
    return this.stage.element;
  }

  /**
   * Sets the native cursor visibility.
   *
   * @param mode
   */
  public setNativeCursor(mode: "hide" | "show" | "auto"): void {
    this.state.forcedCursor = mode === "auto" ? null : mode === "hide" ? "none" : "auto";
  }

  private init(): void {
    if (this.options.autoStart) {
      this.startLoop();
    }
  }

  /**
   * Re-enables input processing and hides the native cursor again.
   */
  public enable(): void {
    this.input.isEnabled = true;
    this.stage.setNativeCursor("none");

    if (this.input.hasSeenPointer) {
      this.state.target.x = this.state.smooth.x = this.state.pointer.x;
      this.state.target.y = this.state.smooth.y = this.state.pointer.y;
      this.state.velocity.x = 0;
      this.state.velocity.y = 0;
      this.state.hasReceivedInput = true;
    }
  }

  /**
   * Disables input processing and shows the native cursor.
   */
  public disable(): void {
    this.input.isEnabled = false;
    this.stage.setNativeCursor("auto");
    this.reset(true);
  }

  /**
   * Pauses input and hides the stage without touching native cursor CSS.
   * Use when another instance takes over rendering in a sub-region.
   */
  public freeze(): void {
    this.input.isEnabled = false;
    this.input.clearHover();
    this.stage.setVisibility(false);
  }

  /**
   * Resumes input and shows the stage.
   * Snaps the smoothed position to the live pointer to prevent catch-up sweeps.
   */
  public unfreeze(): void {
    this.input.isEnabled = true;

    if (this.state.hasReceivedInput) {
      // Snap physics to live coordinate so the cursor doesn't sweep from a stale position.
      this.state.target.x = this.state.pointer.x;
      this.state.target.y = this.state.pointer.y;
      this.state.smooth.x = this.state.pointer.x;
      this.state.smooth.y = this.state.pointer.y;
      this.state.velocity.x = 0;
      this.state.velocity.y = 0;
    }
    // Force one plugin update so elements are current before the stage becomes visible.
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
   * Resets the mouse state. Soft resets by default
   *
   * @param hard - resets interaction and shape variables
   */
  private reset(hard = false): void {
    // NOTE: state.pointer is intentionally NOT reset here.
    // It tracks the live mouse coordinate continuously (even while disabled)
    // so that enable() can snap the cursor back to the correct position
    // immediately, rather than waiting for the next pointermove and flying
    // in from OFFSCREEN. handleWindowLeave() still clears pointer when
    // the mouse genuinely exits the viewport.
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

    // Don't kick off rAF into a backgrounded tab — bindVisibilityHandling()
    // will start it the moment the tab becomes visible instead.
    if (document.hidden) return;

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
    return this.input.isEnabled && !this.state.isNative && this.state.hasReceivedInput;
  }

  /** Whether the native OS cursor should be shown or hidden this frame. */
  private resolveNativeCursorState(): "none" | "auto" {
    if (this.state.forcedCursor !== null) return this.state.forcedCursor;
    const showNative = this.state.isNative || !this.state.hasReceivedInput;
    return showNative ? "auto" : "none";
  }

  /**
   * Runs on every animation frame.
   */
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

    if (this.isRunning) {
      this.rafId = requestAnimationFrame(this.tick);
    }
  };

  /**
   * Performance handler that pauses the rAF loop while
   * the tab is hidden/backgrounded and resumes it on return. `start()`/`destroy()`
   * still behave as documented.
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
