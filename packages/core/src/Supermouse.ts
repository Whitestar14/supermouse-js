import { MouseState, SupermouseOptions, SupermousePlugin } from './types';

export class Supermouse {
  state: MouseState;
  options: SupermouseOptions;
  plugins: Map<string, SupermousePlugin> = new Map();
  
  private rafId: number = 0;
  private lastTime: number = 0;
  private isRunning: boolean = false;

  constructor(options: SupermouseOptions = {}) {
    this.options = {
      smoothness: 0.15,
      hoverSelector: 'a, button, input, textarea, [data-hover]',
      enableTouch: false,
      ...options
    };

    this.state = {
      client: { x: -100, y: -100 },
      smooth: { x: -100, y: -100 },
      velocity: { x: 0, y: 0 },
      isDown: false,
      isHover: false,
      hoverTarget: null,
    };

    this.init();
  }

  private init() {
    this.bindEvents();
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

  // --- Event Handling ---
  
  private handleMove = (e: MouseEvent | TouchEvent) => {
    if (e instanceof MouseEvent) {
      this.state.client.x = e.clientX;
      this.state.client.y = e.clientY;
    } else if (e.touches?.[0]) {
       // Simple touch support
      this.state.client.x = e.touches[0].clientX;
      this.state.client.y = e.touches[0].clientY;
    }
  };

  private handleDown = () => (this.state.isDown = true);
  private handleUp = () => (this.state.isDown = false);

  private handleHoverCheck = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.matches(this.options.hoverSelector!)) {
      this.state.isHover = true;
      this.state.hoverTarget = target;
    }
  };

  private handleHoverOut = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target === this.state.hoverTarget) {
      this.state.isHover = false;
      this.state.hoverTarget = null;
    }
  };

  private bindEvents() {
    window.addEventListener('mousemove', this.handleMove);
    window.addEventListener('mousedown', this.handleDown);
    window.addEventListener('mouseup', this.handleUp);
    
    // Improved Event Delegation
    document.addEventListener('mouseover', this.handleHoverCheck);
    document.addEventListener('mouseout', this.handleHoverOut);

    if (this.options.enableTouch) {
      window.addEventListener('touchmove', this.handleMove, { passive: true });
      window.addEventListener('touchstart', this.handleDown, { passive: true });
      window.addEventListener('touchend', this.handleUp);
    }
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

    // 1. Math: Linear Interpolation (Lerp)
    // Formula: current + (target - current) * factor
    const factor = this.options.smoothness!;
    
    this.state.smooth.x += (this.state.client.x - this.state.smooth.x) * factor;
    this.state.smooth.y += (this.state.client.y - this.state.smooth.y) * factor;

    // 2. Velocity Calculation
    this.state.velocity.x = this.state.client.x - this.state.smooth.x;
    this.state.velocity.y = this.state.client.y - this.state.smooth.y;

    // 3. Update Plugins
    this.plugins.forEach((plugin) => {
      plugin.update?.(this, deltaTime);
    });

    this.rafId = requestAnimationFrame(this.tick);
  };

  public destroy() {
    this.isRunning = false;
    cancelAnimationFrame(this.rafId);

    window.removeEventListener('mousemove', this.handleMove);
    window.removeEventListener('mousedown', this.handleDown);
    window.removeEventListener('mouseup', this.handleUp);
    document.removeEventListener('mouseover', this.handleHoverCheck);
    document.removeEventListener('mouseout', this.handleHoverOut);
    
    if (this.options.enableTouch) {
      window.removeEventListener('touchmove', this.handleMove);
      window.removeEventListener('touchstart', this.handleDown);
      window.removeEventListener('touchend', this.handleUp);
    }

    this.plugins.forEach(p => p.destroy?.(this));
    this.plugins.clear();
  }
}