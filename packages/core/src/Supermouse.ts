import { MouseState, SupermouseOptions, SupermousePlugin } from './types';
import { Stage } from './systems/Stage';
import { Input } from './systems/Input';
import { lerp } from './utils/math';
import pkg from '../package.json';

export class Supermouse {
  public readonly version: string = pkg.version;

  state: MouseState;
  options: SupermouseOptions;
  plugins: Map<string, SupermousePlugin> = new Map();
  
  private stage: Stage;
  private input: Input;
  private rafId: number = 0;
  private lastTime: number = 0;
  private isRunning: boolean = false;
  
  private hoverSelectors: Set<string> = new Set([
    'a', 'button', 'input', 'textarea', '[data-hover]'
  ]);

  constructor(options: SupermouseOptions = {}) {
    this.options = {
      smoothness: 0.15,
      enableTouch: false,
      autoDisableOnMobile: true,
      ignoreOnNative: true,
      hideCursor: true, 
      ...options
    };

    this.state = {
      pointer: { x: -100, y: -100 },
      target: { x: -100, y: -100 },
      smooth: { x: -100, y: -100 },
      velocity: { x: 0, y: 0 },
      isDown: false,
      isHover: false,
      isNative: false,
      hoverTarget: null,
      reducedMotion: false
    };

    this.stage = new Stage(!!this.options.hideCursor);
    
    this.hoverSelectors.forEach(s => this.stage.addSelector(s));

    this.input = new Input(
      this.state, 
      this.options,
      () => Array.from(this.hoverSelectors).join(', '), 
      (enabled) => { if (!enabled) this.resetPosition(); }
    );

    this.init();
  }

  public registerHoverTarget(selector: string) {
    if (!this.hoverSelectors.has(selector)) {
      this.hoverSelectors.add(selector);
      this.stage.addSelector(selector);
    }
  }

  public get container(): HTMLDivElement { return this.stage.element; }
  private init() { this.startLoop(); }
  public enable() { this.input.isEnabled = true; this.stage.setNativeCursor('none'); }
  public disable() { this.input.isEnabled = false; this.stage.setNativeCursor('auto'); this.resetPosition(); }

  public use(plugin: SupermousePlugin) {
    if (this.plugins.has(plugin.name)) {
      console.warn(`[Supermouse] Plugin "${plugin.name}" already installed.`);
      return this;
    }
    this.plugins.set(plugin.name, plugin);
    plugin.install?.(this);
    return this;
  }

  private resetPosition() {
    const off = { x: -100, y: -100 };
    this.state.pointer = { ...off };
    this.state.target = { ...off };
    this.state.smooth = { ...off };
    this.state.velocity = { x: 0, y: 0 };
  }

  private startLoop() {
    this.isRunning = true;
    this.lastTime = performance.now();
    this.tick(this.lastTime);
  }

  private tick = (time: number) => {
    if (!this.isRunning) return;

    const deltaTime = time - this.lastTime;
    this.lastTime = time;

    const shouldShowStage = this.input.isEnabled && !this.state.isNative;
    this.stage.setVisibility(shouldShowStage);

    if (this.input.isEnabled && this.options.ignoreOnNative) {
       this.stage.setNativeCursor(this.state.isNative ? 'auto' : 'none');
    }

    if (this.input.isEnabled) {
      this.state.target.x = this.state.pointer.x;
      this.state.target.y = this.state.pointer.y;

      this.plugins.forEach((plugin) => {
        plugin.update?.(this, deltaTime);
      });

      const factor = this.state.reducedMotion ? 1 : this.options.smoothness!;
      this.state.smooth.x = lerp(this.state.smooth.x, this.state.target.x, factor);
      this.state.smooth.y = lerp(this.state.smooth.y, this.state.target.y, factor);
      
      this.state.velocity.x = this.state.target.x - this.state.smooth.x;
      this.state.velocity.y = this.state.target.y - this.state.smooth.y;

    } else {
      this.state.smooth.x = -100;
      this.state.smooth.y = -100;
      this.state.pointer.x = -100;
      this.state.pointer.y = -100;
      
      this.plugins.forEach((plugin) => {
        plugin.update?.(this, deltaTime);
      });
    }

    this.rafId = requestAnimationFrame(this.tick);
  };
  
  public destroy() {
    this.isRunning = false;
    cancelAnimationFrame(this.rafId);
    this.input.destroy();
    this.stage.destroy();
    this.plugins.forEach(p => p.destroy?.(this));
    this.plugins.clear();
  }
}