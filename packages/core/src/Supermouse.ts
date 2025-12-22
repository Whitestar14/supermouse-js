
import { MouseState, SupermouseOptions, SupermousePlugin } from './types';
import { Stage, Input } from './systems';
import { damp, angle } from './utils';

export const DEFAULT_HOVER_SELECTORS = [
  'a', 'button', 'input', 'textarea', '[data-hover]', '[data-cursor]'
];

/**
 * The core runtime for Supermouse.js.
 * Manages the animation loop, input state, and plugin orchestration.
 */
export class Supermouse {
  /** The current version of Supermouse.js */
  public static readonly version: string = __VERSION__;
  public readonly version: string = __VERSION__;

  state: MouseState;
  options: SupermouseOptions;
  plugins: Map<string, SupermousePlugin> = new Map();
  
  private pluginList: SupermousePlugin[] = [];
  private stage: Stage;
  private input: Input;
  private rafId: number = 0;
  private lastTime: number = 0;
  private isRunning: boolean = false;
  
  private hoverSelectors: Set<string>;

  /**
   * Creates a new Supermouse instance.
   * @param options - Global configuration options.
   */
  constructor(options: SupermouseOptions = {}) {
    this.options = {
      smoothness: 0.15,
      enableTouch: false,
      autoDisableOnMobile: true,
      ignoreOnNative: true,
      hideCursor: true, 
      hideOnLeave: true,
      autoStart: true,
      container: document.body,
      ...options
    };

    // Ensure container is valid (fallback to body if null/undefined passed explicitly)
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
      hoverTarget: null,
      reducedMotion: false,
      hasReceivedInput: false,
      shape: null,
      interaction: {}
    };

    // Initialize Selectors
    if (this.options.hoverSelectors) {
      this.hoverSelectors = new Set(this.options.hoverSelectors);
    } else {
      this.hoverSelectors = new Set(DEFAULT_HOVER_SELECTORS);
    }

    this.stage = new Stage(this.options.container, !!this.options.hideCursor);
    this.hoverSelectors.forEach(s => this.stage.addSelector(s));

    this.input = new Input(
      this.state, 
      this.options,
      () => Array.from(this.hoverSelectors).join(', '), 
      (enabled) => { if (!enabled) this.resetPosition(); }
    );

    if (this.options.plugins) {
      this.options.plugins.forEach(p => this.use(p));
    }

    this.init();
  }

  /**
   * Retrieves a registered plugin by name.
   */
  public getPlugin(name: string) {
    return this.plugins.get(name);
  }

  /**
   * Enables a specific plugin.
   */
  public enablePlugin(name: string) {
    const plugin = this.plugins.get(name);
    if (plugin && plugin.isEnabled === false) {
      plugin.isEnabled = true;
      plugin.onEnable?.(this);
    }
  }

  /**
   * Disables a specific plugin.
   */
  public disablePlugin(name: string) {
    const plugin = this.plugins.get(name);
    if (plugin && plugin.isEnabled !== false) {
      plugin.isEnabled = false;
      plugin.onDisable?.(this);
    }
  }

  /**
   * Toggles the enabled state of a plugin.
   */
  public togglePlugin(name: string) {
    const plugin = this.plugins.get(name);
    if (plugin) {
      if (plugin.isEnabled === false) this.enablePlugin(name);
      else this.disablePlugin(name);
    }
  }

  /**
   * Adds a CSS selector to the list of interactive elements.
   * When hovered, `state.isHover` becomes true and `state.hoverTarget` is set.
   * Also hides the native cursor for these elements if `hideCursor` is true.
   */
  public registerHoverTarget(selector: string) {
    if (!this.hoverSelectors.has(selector)) {
      this.hoverSelectors.add(selector);
      this.stage.addSelector(selector);
    }
  }

  /** The fixed container element where cursor visuals are rendered. */
  public get container(): HTMLDivElement { return this.stage.element; }
  
  private init() { 
    if (this.options.autoStart) {
        this.startLoop(); 
    }
  }

  /** Starts the loop and enables input listeners. */
  public enable() { this.input.isEnabled = true; this.stage.setNativeCursor('none'); }
  
  /** Stops the loop, disables listeners, and resets cursor style. */
  public disable() { this.input.isEnabled = false; this.stage.setNativeCursor('auto'); this.resetPosition(); }

  /**
   * Registers a new plugin.
   * Logic plugins (priority < 0) run before Visual plugins.
   * @param plugin - The plugin object to install.
   */
  public use(plugin: SupermousePlugin) {
    if (this.plugins.has(plugin.name)) {
      console.warn(`[Supermouse] Plugin "${plugin.name}" already installed.`);
      return this;
    }
    
    if (plugin.isEnabled === undefined) {
      plugin.isEnabled = true;
    }

    this.plugins.set(plugin.name, plugin);
    this.updatePluginList();
    
    plugin.install?.(this);
    return this;
  }

  private updatePluginList() {
    this.pluginList = Array.from(this.plugins.values()).sort((a, b) => {
      return (a.priority || 0) - (b.priority || 0);
    });
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
   * Useful when integrating with external game loops (e.g., Three.js, PixiJS).
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
      plugin.onDisable?.(this);
    }
  }

  private tick = (time: number) => {
    // Delta Time in Seconds for Physics
    const dtMs = time - this.lastTime;
    const dt = Math.min(dtMs / 1000, 0.1); // Cap dt at 100ms to prevent huge jumps on lag spikes
    this.lastTime = time;

    const shouldShowStage = this.input.isEnabled && !this.state.isNative && this.state.hasReceivedInput;
    this.stage.setVisibility(shouldShowStage);

    if (this.input.isEnabled && this.options.hideCursor) {
       const shouldHideNative = this.state.hasReceivedInput && !this.state.isNative;
       this.stage.setNativeCursor(shouldHideNative ? 'none' : 'auto');
    }

    if (this.input.isEnabled) {
      this.state.target.x = this.state.pointer.x;
      this.state.target.y = this.state.pointer.y;

      // Plugins: Update Logic & Visuals (Sorted by priority)
      // Wrapped in Error Boundary to prevent core crash
      for (let i = 0; i < this.pluginList.length; i++) {
        this.runPluginSafe(this.pluginList[i], dtMs);
      }

      // Physics: Time-Corrected Damping
      // Convert abstract smoothness (0-1) to damping factor (1-50 approx)
      const userSmooth = this.options.smoothness!;
      // Map 0.15 (floaty) -> ~10, 0.5 (snappy) -> ~25
      const dampFactor = this.state.reducedMotion ? 1000 : (1 / userSmooth) * 2; 

      this.state.smooth.x = damp(this.state.smooth.x, this.state.target.x, dampFactor, dt);
      this.state.smooth.y = damp(this.state.smooth.y, this.state.target.y, dampFactor, dt);
      
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
      
      for (let i = 0; i < this.pluginList.length; i++) {
        this.runPluginSafe(this.pluginList[i], dtMs);
      }
    }

    if (this.options.autoStart && this.isRunning) {
      this.rafId = requestAnimationFrame(this.tick);
    }
  };
  
  /** Cleans up all resources, plugins, and DOM elements. */
  public destroy() {
    this.isRunning = false;
    cancelAnimationFrame(this.rafId);
    this.input.destroy();
    this.stage.destroy();
    this.plugins.forEach(p => p.destroy?.(this));
    this.plugins.clear();
    this.pluginList = [];
  }
}
