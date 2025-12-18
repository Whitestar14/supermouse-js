import { MouseState, SupermouseOptions, SupermousePlugin } from './types';
import { Stage } from './systems/Stage';
import { Input } from './systems/Input';
import { lerp } from './utils/math';

export class Supermouse {
  state: MouseState;
  options: SupermouseOptions;
  plugins: Map<string, SupermousePlugin> = new Map();
  
  // Systems
  private stage: Stage;
  private input: Input;
  
  private rafId: number = 0;
  private lastTime: number = 0;
  private isRunning: boolean = false;

  constructor(options: SupermouseOptions = {}) {
    this.options = {
      smoothness: 0.15,
      hoverSelector: 'a, button, input, textarea, [data-hover]',
      enableTouch: false,
      autoDisableOnMobile: true,
      ignoreOnText: true,
      hideCursor: true, 
      ...options
    };

    this.state = {
      client: { x: -100, y: -100 },
      smooth: { x: -100, y: -100 },
      velocity: { x: 0, y: 0 },
      isDown: false,
      isHover: false,
      isText: false,
      hoverTarget: null,
    };

    // Initialize Systems
    this.stage = new Stage(!!this.options.hideCursor);
    
    this.input = new Input(this.state, this.options, (enabled) => {
      if (!enabled) this.resetPosition();
    });

    this.init();
  }

  // Getter so plugins can access app.container
  public get container(): HTMLDivElement {
    return this.stage.element;
  }

  private init() {
    this.startLoop();
  }

  public use(plugin: SupermousePlugin) {
    if (this.plugins.has(plugin.name)) {
      console.warn(`[Supermouse] Plugin "${plugin.name}" already installed.`);
      return this;
    }
    this.plugins.set(plugin.name, plugin);
    plugin.install?.(this);
    return this;
  }

  public enable() { 
    this.input.isEnabled = true;
    this.stage.setNativeCursor('none');
  }

  public disable() { 
    this.input.isEnabled = false;
    this.stage.setNativeCursor('auto');
    this.resetPosition(); 
  }

  private resetPosition() {
    this.state.client = { x: -100, y: -100 };
    this.state.smooth = { x: -100, y: -100 };
    this.state.velocity = { x: 0, y: 0 };
  }

  // --- Game Loop ---

  private startLoop() {
    this.isRunning = true;
    this.lastTime = performance.now();
    this.tick(this.lastTime);
  }

  private tick = (time: number) => {
    if (!this.isRunning) return;

    const deltaTime = time - this.lastTime;
    this.lastTime = time;

    // 1. Manage Visibility based on State
    // If text mode or disabled, hide the stage
    const shouldShowStage = this.input.isEnabled && !this.state.isText;
    this.stage.setVisibility(shouldShowStage);

    // 2. Manage Native Cursor for Text Mode
    if (this.input.isEnabled && this.options.ignoreOnText) {
       // If isText is true, show native cursor. Else hide it (if hideCursor is on)
       if (this.state.isText) {
          this.stage.setNativeCursor('auto');
       } else {
          this.stage.setNativeCursor('none');
       }
    }

    // 3. Physics
    if (this.input.isEnabled) {
      const factor = this.options.smoothness!;
      this.state.smooth.x = lerp(this.state.smooth.x, this.state.client.x, factor);
      this.state.smooth.y = lerp(this.state.smooth.y, this.state.client.y, factor);
      
      this.state.velocity.x = this.state.client.x - this.state.smooth.x;
      this.state.velocity.y = this.state.client.y - this.state.smooth.y;
    } else {
      this.state.smooth.x = -100;
      this.state.smooth.y = -100;
    }

    // 4. Plugins
    this.plugins.forEach((plugin) => {
      plugin.update?.(this, deltaTime);
    });

    this.rafId = requestAnimationFrame(this.tick);
  };

  public destroy() {
    this.isRunning = false;
    cancelAnimationFrame(this.rafId);

    // Delegate destruction to systems
    this.input.destroy();
    this.stage.destroy();

    this.plugins.forEach(p => p.destroy?.(this));
    this.plugins.clear();
  }
}