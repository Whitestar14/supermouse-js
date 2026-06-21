declare const __VERSION__: string;

import type { MouseState, SupermouseOptions, SupermousePlugin } from "./types";

function lerp(start: number, end: number, factor: number): number {
  return start + (end - start) * factor;
}

function damp(a: number, b: number, lambda: number, dt: number): number {
  return lerp(a, b, 1 - Math.exp(-lambda * dt));
}

function angle(x: number, y: number): number {
  return Math.atan2(y, x) * (180 / Math.PI);
}

/**
 * Input.ts
 *
 * This class listens to browser events and mutates the shared `MouseState` object.
 *
 * @internal This is an internal system class instantiated by `Supermouse`.
 */
export class Input {
  private mediaQueryList?: MediaQueryList;
  private mediaQueryHandler?: (e: MediaQueryListEvent) => void;
  private motionQuery?: MediaQueryList;

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
    this.checkDeviceCapability();
    this.checkMotionPreference();
    this.bindEvents();
  }

  private abortController = new AbortController();

  /**
   * Automatically disables the custom cursor on devices without fine pointer control.
   */
  private checkDeviceCapability(): void {
    if (!this.options.autoDisableOnMobile) return;

    this.mediaQueryList = window.matchMedia("(pointer: fine)");
    this.updateEnabledState(this.mediaQueryList.matches);

    this.mediaQueryHandler = (e: MediaQueryListEvent) => {
      this.updateEnabledState(e.matches);
    };
    this.mediaQueryList.addEventListener("change", this.mediaQueryHandler, {
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
      this.state.interaction = this.options.resolveInteraction(element);
      return;
    }

    const data: Record<string, string | boolean> = {};

    if (this.options.rules) {
      for (const [selector, rules] of Object.entries(this.options.rules)) {
        if (element.matches(selector)) {
          Object.assign(data, rules);
        }
      }
    }

    const dataset = element.dataset;
    for (const key in dataset) {
      if (key.startsWith("supermouse")) {
        const prop = key.slice(10);
        if (prop) {
          const cleanKey = prop.charAt(0).toLowerCase() + prop.slice(1);
          const val = dataset[key];
          if (val !== undefined) {
            data[cleanKey] = val === "" ? true : val;
          }
        }
      }
    }

    this.state.interaction = data;
  }

  private handleMove(e: PointerEvent): void {
    if (!this.isEnabled) return;

    if (this.options.autoDisableOnMobile && e.pointerType === "touch") return;

    let x = e.clientX;
    let y = e.clientY;

    if (this.options.container && this.options.container !== document.body) {
      const rect = this.options.container.getBoundingClientRect();
      x -= rect.left;
      y -= rect.top;
    }

    this.state.pointer.x = x;
    this.state.pointer.y = y;

    if (!this.state.hasReceivedInput) {
      this.state.hasReceivedInput = true;
      this.state.target.x = this.state.smooth.x = x;
      this.state.target.y = this.state.smooth.y = y;
    }
  }

  private handleDown(): void {
    if (this.isEnabled) this.state.isDown = true;
  }

  private handleUp(): void {
    if (this.isEnabled) this.state.isDown = false;
  }

  private handleMouseOver(e: MouseEvent): void {
    if (!this.isEnabled) return;
    const target = e.target as HTMLElement;

    if (target.closest("[data-supermouse-ignore]")) {
      this.state.isNative = true;
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
      const checkTags = strategy === true || strategy === "auto" || strategy === "tag";
      const checkCSS = strategy === true || strategy === "auto" || strategy === "css";
      let isNative = false;

      if (checkTags) {
        const tag = target.localName;
        if (tag === "input" || tag === "textarea" || tag === "select" || target.isContentEditable) {
          isNative = true;
        }
      }

      if (!isNative && checkCSS) {
        const style = window.getComputedStyle(target).cursor;
        const supermouseAllowed = ["default", "auto", "pointer", "none", "inherit"];
        if (!supermouseAllowed.includes(style)) {
          isNative = true;
        }
      }

      if (isNative) {
        this.state.isNative = true;
      }
    }
  }

  private handleMouseOut(e: MouseEvent): void {
    if (!this.isEnabled) return;
    const target = e.target as HTMLElement;

    if (target === this.state.hoverTarget || target.contains(this.state.hoverTarget)) {
      if (!e.relatedTarget || !this.state.hoverTarget?.contains(e.relatedTarget as Node)) {
        this.state.isHover = false;
        this.state.hoverTarget = null;
        this.state.interaction = {};
      }
    }

    if (this.state.isNative) {
      this.state.isNative = false;
    }
  }

  private handleWindowLeave(): void {
    if (this.options.hideOnLeave) {
      this.state.hasReceivedInput = false;
    }
  }

  public clearHover(): void {
    this.state.isHover = false;
    this.state.hoverTarget = null;
    this.state.isNative = false;
  }

  private bindEvents(): void {
    const { signal } = this.abortController;
    window.addEventListener("pointermove", this.handleMove.bind(this), { passive: true, signal });
    window.addEventListener("pointerdown", this.handleDown.bind(this), { passive: true, signal });
    window.addEventListener("pointerup", this.handleUp.bind(this), { signal });

    document.addEventListener("mouseover", this.handleMouseOver.bind(this), { signal });
    document.addEventListener("mouseout", this.handleMouseOut.bind(this), { signal });
    document.addEventListener("mouseleave", this.handleWindowLeave.bind(this), { signal });
  }

  public destroy(): void {
    this.abortController.abort();
  }
}

let stageCount = 0;

/**
 * Stage.ts
 *
 * This class manages the DOM container for the custom cursor and handles native cursor visibility.
 * It is instantiated by the `Supermouse` class and is not intended for direct use by plugins.
 *
 * @internal
 */
export class Stage {
  /** The container element appended to the document. */
  public readonly element: HTMLDivElement;
  private styleTag: HTMLStyleElement;
  private id: string;
  private scopeClass: string;

  private currentCursorState: "none" | "auto" | "" | null = null;

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
    private hideNativeCursor: boolean
  ) {
    if (!container || !(container instanceof HTMLElement)) {
      throw new Error(`[Supermouse] Invalid container: ${container}. Must be an HTMLElement.`);
    }

    const instanceId = stageCount++;
    this.id = `supermouse-style-${instanceId}`;
    this.scopeClass = `supermouse-scope-${instanceId}`;

    const isBody = container === document.body;

    this.element = document.createElement("div");
    Object.assign(this.element.style, {
      position: isBody ? "fixed" : "absolute",
      top: "0",
      left: "0",
      width: "100%",
      height: "100%",
      pointerEvents: "none",
      zIndex: "9999",
      opacity: "1",
      transition: "opacity 0.15s ease"
    });

    if (!isBody) {
      const computed = window.getComputedStyle(container);
      if (computed.position === "static") {
        container.style.position = "relative";
      }
    }

    container.appendChild(this.element);

    this.styleTag = document.createElement("style");
    this.styleTag.id = this.id;
    document.head.appendChild(this.styleTag);

    this.container.classList.add(this.scopeClass);

    if (this.hideNativeCursor) {
      this.setNativeCursor("none");
    }
  }

  /**
   * Adds a new CSS selector to the Hide Native Cursor list.
   * Called by `Supermouse` (and subsequently plugins) during install to ensure
   * the native cursor is hidden on their specific interactive targets.
   */
  public addSelector(selector: string): void {
    this.selectors.add(selector);
    if (this.hideNativeCursor) {
      this.updateCursorCSS();
    }
  }

  public setVisibility(visible: boolean): void {
    this.element.style.opacity = visible ? "1" : "0";
  }

  /**
   * Toggles the visibility of the native cursor via CSS injection.
   * @param type 'none' to hide, 'auto' to show.
   */
  public setNativeCursor(type: "none" | "auto" | ""): void {
    if (!this.hideNativeCursor && type === "none") return;

    if (type === this.currentCursorState) return;
    this.currentCursorState = type;

    if (type === "none") {
      this.container.style.cursor = "none";
      this.updateCursorCSS();
    } else {
      this.container.style.cursor = "";
      this.styleTag.innerText = "";
    }
  }

  private updateCursorCSS(): void {
    const rawSelectors = Array.from(this.selectors);
    if (rawSelectors.length === 0) {
      this.styleTag.innerText = "";
      return;
    }

    const scopedSelectors = rawSelectors.map((s) => `.${this.scopeClass} ${s}`).join(", ");

    this.styleTag.innerText = `
      ${scopedSelectors} {
        cursor: none !important;
      }
    `;
  }

  public destroy(): void {
    this.element.remove();
    this.styleTag.remove();
    this.container.style.cursor = "";
    this.container.classList.remove(this.scopeClass);
  }
}

const OFFSCREEN = { x: -100, y: -100 } as const;
export const DEFAULT_HOVER_SELECTORS = [
  "a",
  "button",
  "input",
  "textarea",
  "[data-hover]",
  "[data-cursor]"
];

/**
 * Supermouse Runtime Loop
 *
 * This class orchestrates the application state, manages the animation loop,
 * and coordinates data flow between the internal systems, and the plugins.
 *
 * @default
 */
export class Supermouse {
  public static readonly version: string = __VERSION__;
  public readonly version: string = __VERSION__;

  state: MouseState;

  /**
   * Configuration options.
   */
  options: SupermouseOptions;

  private plugins: SupermousePlugin[] = [];
  private stage: Stage;
  private input: Input;

  private rafId: number = 0;
  private lastTime: number = 0;
  private isRunning: boolean = false;

  private hoverSelectors: Set<string>;

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
      ...options
    };

    if (!this.options.container) {
      this.options.container = document.body;
    }

    this.state = {
      pointer: { x: -100, y: -100 },
      target: { x: -100, y: -100 },
      smooth: { x: -100, y: -100 },
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

    if (this.options.hoverSelectors) {
      this.hoverSelectors = new Set(this.options.hoverSelectors);
    } else {
      this.hoverSelectors = new Set(DEFAULT_HOVER_SELECTORS);
    }

    this.stage = new Stage(this.options.container, !!this.options.hideCursor);
    this.hoverSelectors.forEach((s) => this.stage.addSelector(s));

    this.input = new Input(
      this.state,
      this.options,
      () => Array.from(this.hoverSelectors).join(", "),
      (enabled) => {
        if (!enabled) this.resetPosition();
      }
    );

    if (this.options.plugins) {
      this.options.plugins.forEach((p) => this.use(p));
    }

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
      plugin.onDisable?.(this);
    }
  }

  /**
   * Toggles the enabled state of a plugin.
   */
  public togglePlugin(name: string): void {
    const plugin = this.getPlugin(name);
    if (plugin) {
      if (plugin.isEnabled === false) this.enablePlugin(name);
      else this.disablePlugin(name);
    }
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
   * Manually override the native cursor visibility.
   *
   * @param type 'auto' (Show Native), 'none' (Hide Native), or null (Resume Auto-detection)
   */
  public setCursor(type: "auto" | "none" | null): void {
    this.state.forcedCursor = type;
  }

  private init(): void {
    if (this.options.autoStart) {
      this.startLoop();
    }
  }

  public enable(): void {
    this.input.isEnabled = true;
    this.stage.setNativeCursor("none");
  }
  public disable(): void {
    this.input.isEnabled = false;
    this.stage.setNativeCursor("auto");
    this.resetPosition();
  }

  /**
   * Registers a new plugin.
   *
   * @param plugin - The plugin object to install.
   */
  public use(plugin: SupermousePlugin): this {
    if (this.plugins.find((p) => p.name === plugin.name)) {
      console.warn(`[Supermouse] Plugin "${plugin.name}" already installed.`);
      return this;
    }

    if (plugin.isEnabled === undefined) {
      plugin.isEnabled = true;
    }

    this.plugins.push(plugin);
    this.plugins.sort((a, b) => (a.priority || 0) - (b.priority || 0));

    plugin.install?.(this);
    return this;
  }

  private resetCoords(): void {
    this.state.pointer = { ...OFFSCREEN };
    this.state.target = { ...OFFSCREEN };
    this.state.smooth = { ...OFFSCREEN };
    this.state.velocity = { x: 0, y: 0 };
    this.state.angle = 0;
  }

  private resetPosition(): void {
    this.resetCoords();
    this.state.hasReceivedInput = false;
    this.state.shape = null;
    this.state.interaction = {};
  }

  private startLoop(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    this.tick(this.lastTime);
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
      try {
        plugin.onDisable?.(this);
      } catch (err) {
        console.error(`[Supermouse] Failed to execute onDisable for plugin '${plugin.name}'.`, err);
      }
    }
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

    const shouldShowStage =
      this.input.isEnabled && !this.state.isNative && this.state.hasReceivedInput;
    this.stage.setVisibility(shouldShowStage);

    if (this.input.isEnabled && this.options.hideCursor) {
      let targetState: "none" | "auto" = "auto";
      if (this.state.forcedCursor !== null) {
        targetState = this.state.forcedCursor;
      } else {
        const showNative = this.state.isNative || !this.state.hasReceivedInput;
        targetState = showNative ? "auto" : "none";
      }
      this.stage.setNativeCursor(targetState);
    }

    if (this.input.isEnabled) {
      this.state.target.x = this.state.pointer.x;
      this.state.target.y = this.state.pointer.y;
    } else {
      this.resetCoords();
    }

    for (let i = 0; i < this.plugins.length; i++) {
      this.runPluginSafe(this.plugins[i], dtMs);
    }

    if (this.input.isEnabled) {
      const factor = this.state.reducedMotion ? 1000 : (1 / this.options.smoothness!) * 2;

      this.state.smooth.x = damp(this.state.smooth.x, this.state.target.x, factor, dt);
      this.state.smooth.y = damp(this.state.smooth.y, this.state.target.y, factor, dt);

      const vx = this.state.target.x - this.state.smooth.x;
      const vy = this.state.target.y - this.state.smooth.y;
      this.state.velocity.x = vx;
      this.state.velocity.y = vy;

      if (Math.abs(vx) > 0.1 || Math.abs(vy) > 0.1) {
        this.state.angle = angle(vx, vy);
      }
    }

    if (this.options.autoStart && this.isRunning) {
      this.rafId = requestAnimationFrame(this.tick);
    }
  };

  /**
   * Destroys the instance.
   */
  public destroy(): void {
    this.isRunning = false;
    cancelAnimationFrame(this.rafId);
    this.input.destroy();
    this.stage.destroy();
    this.plugins.forEach((p) => p.destroy?.(this));
    this.plugins = [];
  }
}
