import { MouseState, SupermouseOptions, SupermousePlugin } from './types';

export class Supermouse {
  state: MouseState;
  options: SupermouseOptions;
  plugins: Map<string, SupermousePlugin> = new Map();
  
  public readonly container: HTMLDivElement;
  
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

    // 1. Create the Stage Container
    this.container = document.createElement('div');
    Object.assign(this.container.style, {
      position: 'fixed',
      top: '0', left: '0', width: '100%', height: '100%',
      pointerEvents: 'none',
      zIndex: '9999',
      opacity: '1',
      transition: 'opacity 0.15s ease'
    });
    
    if (this.options.hideCursor) {
      document.body.style.cursor = 'none';
    }
    
    document.body.appendChild(this.container);

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

    this.mediaQueryList = window.matchMedia('(pointer: fine)');
    this.isEnabled = this.mediaQueryList.matches;

    this.mediaQueryHandler = (e: MediaQueryListEvent) => {
      this.isEnabled = e.matches;
      if (!this.isEnabled) this.resetPosition();
    };

    this.mediaQueryList.addEventListener('change', this.mediaQueryHandler);
  }

  public enable() { this.isEnabled = true; }
  public disable() { this.isEnabled = false; this.resetPosition(); }

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

  private handleMouseOver = (e: MouseEvent) => {
    if (!this.isEnabled) return;
    const target = e.target as HTMLElement;

    // 1. Check Interactive Hover
    if (target.matches(this.options.hoverSelector!)) {
      this.state.isHover = true;
      this.state.hoverTarget = target;
    }

    // 2. Check Text Mode (for selection)
    if (this.options.ignoreOnText) {
      const isInput = target.matches('input, textarea, [contenteditable]');
      const style = window.getComputedStyle(target).cursor;
      
      if (isInput || style === 'text' || style === 'vertical-text') {
        this.state.isText = true;
        document.body.style.cursor = 'auto';
      }
    }
  };

  private handleMouseOut = (e: MouseEvent) => {
    if (!this.isEnabled) return;
    const target = e.target as HTMLElement;

    // 1. Clear Hover
    if (target === this.state.hoverTarget) {
      this.state.isHover = false;
      this.state.hoverTarget = null;
    }

    // 2. Clear Text Mode
    if (this.state.isText) {
      this.state.isText = false;
      if (this.options.hideCursor) {
      document.body.style.cursor = 'none'; // Hide native cursor again
      }
    }
  };

  private bindEvents() {
    window.addEventListener('mousemove', this.handleMove);
    window.addEventListener('mousedown', this.handleDown);
    window.addEventListener('mouseup', this.handleUp);
    
    // Consolidated handlers
    document.addEventListener('mouseover', this.handleMouseOver);
    document.addEventListener('mouseout', this.handleMouseOut);

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

    // 1. Global Admin Control (Visibility)
    // If text mode or disabled, HIDE EVERYTHING via the container.
    const shouldVisible = this.isEnabled && !this.state.isText;
    this.container.style.opacity = shouldVisible ? '1' : '0';

    if (this.isEnabled) {
      // 2. Physics
      const factor = this.options.smoothness!;
      
      this.state.smooth.x += (this.state.client.x - this.state.smooth.x) * factor;
      this.state.smooth.y += (this.state.client.y - this.state.smooth.y) * factor;

      this.state.velocity.x = this.state.client.x - this.state.smooth.x;
      this.state.velocity.y = this.state.client.y - this.state.smooth.y;
    } else {
      this.state.smooth.x = -100;
      this.state.smooth.y = -100;
      this.state.client.x = -100;
      this.state.client.y = -100;
    }

    // 3. Update Plugins
    this.plugins.forEach((plugin) => {
      plugin.update?.(this, deltaTime);
    });

    this.rafId = requestAnimationFrame(this.tick);
  };

  public destroy() {
    this.isRunning = false;
    cancelAnimationFrame(this.rafId);

    if (this.mediaQueryList && this.mediaQueryHandler) {
      this.mediaQueryList.removeEventListener('change', this.mediaQueryHandler);
    }

    window.removeEventListener('mousemove', this.handleMove);
    window.removeEventListener('mousedown', this.handleDown);
    window.removeEventListener('mouseup', this.handleUp);
    document.removeEventListener('mouseover', this.handleMouseOver);
    document.removeEventListener('mouseout', this.handleMouseOut);
    
    if (this.options.enableTouch) {
      window.removeEventListener('touchmove', this.handleMove);
      window.removeEventListener('touchstart', this.handleDown);
      window.removeEventListener('touchend', this.handleUp);
    }

    // Cleanup DOM
    document.body.style.cursor = ''; 
    this.container.remove();

    this.plugins.forEach(p => p.destroy?.(this));
    this.plugins.clear();
  }
}