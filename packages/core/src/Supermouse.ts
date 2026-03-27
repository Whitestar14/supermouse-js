declare const __VERSION__: string;

import type { MouseState, SupermouseOptions, SupermousePlugin } from "./types";
import { Stage, Input } from "./systems";
import { damp, angle } from "./utils/math";

export const DEFAULT_HOVER_SELECTORS = [
  "a",
  "button",
  "input",
  "textarea",
  "[data-hover]",
  "[data-cursor]"
];

/**
 * Runtime Loop of Supermouse.
 *
 * This class orchestrates the application state, manages the animation loop (`requestAnimationFrame`),
 * and coordinates data flow between the Input system, the Stage system, and the Plugins.
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
  public getPlugin(name: string) {
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
  public enablePlugin(name: string) {
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
  public disablePlugin(name: string) {
    const plugin = this.getPlugin(name);
    if (plugin && plugin.isEnabled !== false) {
      plugin.isEnabled = false;
      plugin.onDisable?.(this);
    }
  }

  /**
   * Toggles the enabled state of a plugin.
   */
  public togglePlugin(name: string) {
    const plugin = this.getPlugin(name);
    if (plugin) {
      if (plugin.isEnabled === false) this.enablePlugin(name);
      else this.disablePlugin(name);
    }
  }

  public registerHoverTarget(selector: string) {
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
  public setCursor(type: "auto" | "none" | null) {
    this.state.forcedCursor = type;
  }

  private init() {
    if (this.options.autoStart) {
      this.startLoop();
    }
  }

  public enable() {
    this.input.isEnabled = true;
    this.stage.setNativeCursor("none");
  }
  public disable() {
    this.input.isEnabled = false;
    this.stage.setNativeCursor("auto");
    this.resetPosition();
  }

  /**
   * Registers a new plugin.
   *
   * @param plugin - The plugin object to install.
   */
  public use(plugin: SupermousePlugin) {
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

  private resetPosition() {
    const off = { x: -100, y: -100 };
    this.state.pointer = { ...off };
    this.state.target = { ...off };
    this.state.smooth = { ...off };
    this.state.velocity = { x: 0, y: 0 };
    this.state.angle = 0;
    this.state.hasReceivedInput = false;
    this.state.shape = null;
    this.state.interaction = {};
  }

  private startLoop() {
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
  public step(time: number) {
    this.tick(time);
  }

  private runPluginSafe(plugin: SupermousePlugin, deltaTime: number) {
    if (plugin.isEnabled === false) return;
    try {
      plugin.update?.(this, deltaTime);
    } catch (e) {
      console.error(`[Supermouse] Plugin '${plugin.name}' crashed and has been disabled.`, e);
      plugin.isEnabled = false;
      try {
        plugin.onDisable?.(this);
      } catch (err) {}
    }
  }

  /**
   * Runs on every animation frame.
   */
  private tick = (time: number) => {
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

      for (let i = 0; i < this.plugins.length; i++) {
        this.runPluginSafe(this.plugins[i], dtMs);
      }

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
    } else {
      this.state.smooth.x = -100;
      this.state.smooth.y = -100;
      this.state.pointer.x = -100;
      this.state.pointer.y = -100;
      this.state.velocity.x = 0;
      this.state.velocity.y = 0;

      for (let i = 0; i < this.plugins.length; i++) {
        this.runPluginSafe(this.plugins[i], dtMs);
      }
    }

    if (this.options.autoStart && this.isRunning) {
      this.rafId = requestAnimationFrame(this.tick);
    }
  };

  /**
   * Destroys the instance.
   */
  public destroy() {
    this.isRunning = false;
    cancelAnimationFrame(this.rafId);
    this.input.destroy();
    this.stage.destroy();
    this.plugins.forEach((p) => p.destroy?.(this));
    this.plugins = [];
  }
}
