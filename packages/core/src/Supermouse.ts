import { MouseState, SupermouseOptions, SupermousePlugin } from './types';

export class Supermouse {
  state: MouseState;
  options: SupermouseOptions;
  plugins: Map<string, SupermousePlugin> = new Map();
  
  private rafId: number = 0;
  private lastTime: number = 0;
  private isRunning: boolean = false;
  
  // Logic control
  private isEnabled: boolean = true;
  private mediaQueryList?: MediaQueryList;
  private mediaQueryHandler?: (e: MediaQueryListEvent) => void;

  constructor(options: SupermouseOptions = {}) {
    this.options = {
      smoothness: 0.15,
      hoverSelector: 'a, button, input, textarea, [data-hover]',
      enableTouch: false,
      autoDisableOnMobile: true,
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

    // Check device capabilities before starting
    this.checkDeviceCapability();
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

  /**
   * Automatically disables the cursor logic if the device
   * does not support a "fine" pointer (like a mouse/trackpad).
   */
  private checkDeviceCapability() {
    if (!this.options.autoDisableOnMobile) return;

    // 'pointer: fine' is the standard way to detect mouse/trackpad availability
    this.mediaQueryList = window.matchMedia('(pointer: fine)');
    
    // Set initial state
    this.isEnabled = this.mediaQueryList.matches;

    // Define handler for dynamic changes (e.g. plugging in a mouse)
    this.mediaQueryHandler = (e: MediaQueryListEvent) => {
      this.isEnabled = e.matches;
      if (!this.isEnabled) {
        // Reset position off-screen immediately on disable
        this.resetPosition();
      }
    };

    // Listen for changes
    this.mediaQueryList.addEventListener('change', this.mediaQueryHandler);
  }

  public enable() {
    this.isEnabled = true;
  }

  public disable() {
    this.isEnabled = false;
    this.resetPosition();
  }

  private resetPosition() {
    this.state.client = { x: -100, y: -100 };
    this.state.smooth = { x: -100, y: -100 };
    this.state.velocity = { x: 0, y: 0 };
  }

  // --- Event Handling ---
  
  private handleMove = (e: MouseEvent | TouchEvent) => {
    if (!this.isEnabled) return;

    if (e instanceof MouseEvent) {
      this.state.client.x = e.clientX;
      this.state.client.y = e.clientY;
    } else if (e.touches?.[0]) {
      this.state.client.x = e.touches[0].clientX;
      this.state.client.y = e.touches[0].clientY;
    }
  };

  private handleDown = () => { if (this.isEnabled) this.state.isDown = true; };
  private handleUp = () => { if (this.isEnabled) this.state.isDown = false; };

  private handleHoverCheck = (e: MouseEvent) => {
    if (!this.isEnabled) return;
    const target = e.target as HTMLElement;
    if (target.matches(this.options.hoverSelector!)) {
      this.state.isHover = true;
      this.state.hoverTarget = target;
    }
  };

  private handleHoverOut = (e: MouseEvent) => {
    if (!this.isEnabled) return;
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

    if (this.isEnabled) {
      // 1. Math: Linear Interpolation (Lerp)
      const factor = this.options.smoothness!;
      
      this.state.smooth.x += (this.state.client.x - this.state.smooth.x) * factor;
      this.state.smooth.y += (this.state.client.y - this.state.smooth.y) * factor;

      // 2. Velocity Calculation
      this.state.velocity.x = this.state.client.x - this.state.smooth.x;
      this.state.velocity.y = this.state.client.y - this.state.smooth.y;
    } else {
      // If disabled, enforce off-screen coordinates so plugins hide elements
      this.state.smooth.x = -100;
      this.state.smooth.y = -100;
      this.state.client.x = -100;
      this.state.client.y = -100;
    }

    // 3. Update Plugins
    // We run plugins even if disabled so they can update their DOM to the off-screen coords
    this.plugins.forEach((plugin) => {
      plugin.update?.(this, deltaTime);
    });

    this.rafId = requestAnimationFrame(this.tick);
  };

  public destroy() {
    this.isRunning = false;
    cancelAnimationFrame(this.rafId);

    // Cleanup Media Query
    if (this.mediaQueryList && this.mediaQueryHandler) {
      this.mediaQueryList.removeEventListener('change', this.mediaQueryHandler);
    }

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