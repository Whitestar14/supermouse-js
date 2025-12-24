declare const __VERSION__: string;

import { MouseState, SupermouseOptions, SupermousePlugin } from './types';
import { Stage, Input } from './systems';
import { damp, angle } from './utils/math';

export const DEFAULT_HOVER_SELECTORS = [
  'a', 'button', 'input', 'textarea', '[data-hover]', '[data-cursor]'
];

/**
 * The Central Conductor & Runtime Loop of Supermouse.
 * 
 * This class orchestrates the application state, manages the animation loop (`requestAnimationFrame`),
 * and coordinates data flow between the Input system, the Stage system, and the Plugins.
 * 
 * ## Architecture
 * 1. **Input System**: Captures raw events and writes to `state.pointer`.
 * 2. **Logic Plugins**: (Priority < 0) Read `pointer`, modify `state.target` (e.g. Magnetic, Stick).
 * 3. **Physics**: Core interpolates `state.smooth` towards `state.target`.
 * 4. **Visual Plugins**: (Priority >= 0) Read `state.smooth`, update DOM transforms.
 * 
 * @example
 * ```ts
 * const app = new Supermouse({ smoothness: 0.15 });
 * app.use(Dot({ color: 'red' }));
 * ```
 */
export class Supermouse {
  /** The current version of Supermouse.js */
  public static readonly version: string = __VERSION__;
  public readonly version: string = __VERSION__;

  /**
   * The Single Source of Truth.
   * 
   * This object is shared by reference. `Input` writes to it; `Supermouse` physics reads/writes to it;
   * Plugins read/write to it.
   */
  state: MouseState;

  /**
   * Configuration options.
   */
  options: SupermouseOptions;

  /**
   * Registry of active plugins.
   * @internal Use `use()`, `enablePlugin()`, or `disablePlugin()` to interact with this.
   */
  private plugins: SupermousePlugin[] = [];
  
  /**
   * The Stage System responsible for the DOM container and CSS injection.
   * @internal
   */
  private stage: Stage;

  /**
   * The Input System responsible for event listeners.
   * @internal
   */
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
      ignoreOnNative: 'auto',
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
      forcedCursor: null,
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

    // Pass state by reference to Input. Input will mutate this state directly.
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
   * Retrieves a registered plugin instance by its unique name.
   */
  public getPlugin(name: string) {
    return this.plugins.find(p => p.name === name);
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

  /**
   * Registers a CSS selector as an "Interactive Target".
   * 
   * When the mouse hovers over an element matching this selector:
   * 1. `state.isHover` becomes `true`.
   * 2. `state.hoverTarget` is set to the element.
   * 3. The `Stage` system injects CSS to hide the native cursor for this element (if `hideCursor: true`).
   * 
   * @param selector - A valid CSS selector string (e.g., `.my-button`, `[data-trigger]`).
   */
  public registerHoverTarget(selector: string) {
    if (!this.hoverSelectors.has(selector)) {
      this.hoverSelectors.add(selector);
      this.stage.addSelector(selector);
    }
  }

  /** 
   * The fixed container element where plugins should append their DOM nodes.
   */
  public get container(): HTMLDivElement { return this.stage.element; }
  
  /**
   * Manually override the native cursor visibility.
   * Useful for drag-and-drop operations, modals, or special UI states.
   * 
   * @param type 'auto' (Show Native), 'none' (Hide Native), or null (Resume Auto-detection)
   */
  public setCursor(type: 'auto' | 'none' | null) {
    this.state.forcedCursor = type;
  }

  private init() { 
    if (this.options.autoStart) {
        this.startLoop(); 
    }
  }

  /** 
   * Starts the update loop and enables input listeners.
   * Hides the native cursor if configured.
   */
  public enable() { this.input.isEnabled = true; this.stage.setNativeCursor('none'); }
  
  /** 
   * Stops the update loop, disables listeners, and restores the native cursor. 
   * Resets internal state positions to off-screen.
   */
  public disable() { this.input.isEnabled = false; this.stage.setNativeCursor('auto'); this.resetPosition(); }

  /**
   * Registers a new plugin.
   * 
   * @remarks
   * Plugins are sorted by `priority` immediately after registration.
   * - **Negative Priority (< 0)**: Logic plugins (run before physics).
   * - **Positive Priority (>= 0)**: Visual plugins (run after physics).
   * 
   * @param plugin - The plugin object to install.
   */
  public use(plugin: SupermousePlugin) {
    if (this.plugins.find(p => p.name === plugin.name)) {
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
   * Useful when integrating with external game loops (e.g., Three.js, PixiJS) where
   * you want to disable the internal RAF and drive `Supermouse` from your own ticker.
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
      plugin.onDisable?.(this);
    }
  }

  /**
   * The Heartbeat.
   * Runs on every animation frame.
   */
  private tick = (time: number) => {
    // 1. Calculate Delta Time (in seconds)
    // We cap dt at 0.1s (100ms) to prevent massive jumps if the tab is inactive for a while.
    const dtMs = time - this.lastTime;
    const dt = Math.min(dtMs / 1000, 0.1); 
    this.lastTime = time;

    // 2. Visibility Logic
    // Stage is visible only if input is active, it's not a native-cursor override situation,
    // and we have actually received mouse coordinates.
    const shouldShowStage = this.input.isEnabled && !this.state.isNative && this.state.hasReceivedInput;
    this.stage.setVisibility(shouldShowStage);

    // 3. Native Cursor Hiding Logic
    if (this.input.isEnabled && this.options.hideCursor) {
       let targetState: 'none' | 'auto' = 'auto';

       // PRIORITY 1: Manual Override (User/Plugin says so)
       if (this.state.forcedCursor !== null) {
         targetState = this.state.forcedCursor;
       } 
       // PRIORITY 2: Auto-Detection (Default behavior)
       else {
         // Show native if we are in a "Native Zone" (Input) OR if we haven't moved mouse yet
         const showNative = this.state.isNative || !this.state.hasReceivedInput;
         targetState = showNative ? 'auto' : 'none';
       }

       this.stage.setNativeCursor(targetState);
    }

    if (this.input.isEnabled) {
      // 4. Sync Target
      // By default, target = raw pointer. Logic plugins may override this in the next step.
      this.state.target.x = this.state.pointer.x;
      this.state.target.y = this.state.pointer.y;

      // 5. Run Plugins
      // This iterates through the priority-sorted list.
      // - Logic Plugins (Magnetic) run first and modify this.state.target
      // - Visual Plugins (Dot, Ring) run last and read this.state.smooth
      for (let i = 0; i < this.plugins.length; i++) {
        this.runPluginSafe(this.plugins[i], dtMs);
      }

      // 6. Physics Integration (Damping)
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

      // Only update angle if moving significantly (prevents jitter at rest)
      if (Math.abs(vx) > 0.1 || Math.abs(vy) > 0.1) {
        this.state.angle = angle(vx, vy);
      }

    } else {
      // Inactive State: Force positions off-screen
      this.state.smooth.x = -100;
      this.state.smooth.y = -100;
      this.state.pointer.x = -100;
      this.state.pointer.y = -100;
      this.state.velocity.x = 0;
      this.state.velocity.y = 0;
      
      // Still run plugins (e.g. for exit animations)
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
   * Stops the loop, removes all DOM elements, removes all event listeners, and calls destroy on all plugins.
   */
  public destroy() {
    this.isRunning = false;
    cancelAnimationFrame(this.rafId);
    this.input.destroy();
    this.stage.destroy();
    this.plugins.forEach(p => p.destroy?.(this));
    this.plugins = [];
  }
}
