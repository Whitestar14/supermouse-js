declare const __VERSION__: string | undefined;
const VERSION: string = typeof __VERSION__ !== "undefined" ? __VERSION__ : "0.0.0";

import type { MouseState, SupermouseOptions, SupermousePlugin } from "./types";
import { OFFSCREEN, DEFAULT_HOVER_SELECTORS } from "./constants";
import { Input } from "./internal/Input";
import { Stage } from "./internal/Stage";

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
export { DEFAULT_HOVER_SELECTORS };
