
import { MouseState, SupermouseOptions, InteractionState } from '../types';

/**
 * The Sensor / State Writer.
 * 
 * This class listens to browser events (pointermove, pointerdown, hover) and mutates the shared `MouseState` object.
 * It acts as the "Producer" of data for the Supermouse system.
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

  /**
   * Performance Optimization:
   * We cache the resolved InteractionState for every element we encounter in a WeakMap.
   */
  private interactionCache = new WeakMap<HTMLElement, InteractionState>();

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

  /**
   * Automatically disables the custom cursor on devices without fine pointer control (e.g. phones/tablets).
   * Relies on `matchMedia('(pointer: fine)')`.
   */
  private checkDeviceCapability() {
    if (!this.options.autoDisableOnMobile) return;

    this.mediaQueryList = window.matchMedia('(pointer: fine)');
    this.updateEnabledState(this.mediaQueryList.matches);

    this.mediaQueryHandler = (e: MediaQueryListEvent) => {
      this.updateEnabledState(e.matches);
    };
    this.mediaQueryList.addEventListener('change', this.mediaQueryHandler);
  }

  /**
   * Checks for `prefers-reduced-motion`.
   * If true, the core physics engine will switch to instant snapping (high damping) to avoid motion sickness.
   */
  private checkMotionPreference() {
   this.motionQuery = window.matchMedia('(prefer-reduced-motion: reduce)');
   this.state.reducedMotion = this.motionQuery.matches;
   
   this.motionQuery.addEventListener('change',  e => {
     this.state.reducedMotion = e.matches;
   });
  }
  
  private updateEnabledState(enabled: boolean) {
    this.isEnabled = enabled;
    this.onEnableChange(enabled);
  }

  // --- Interaction Parsing ---

  /**
   * Scrapes the DOM element for metadata to populate `state.interaction`.
   * 
   * **Strategy:**
   * 1. Check WeakMap cache.
   * 2. Apply config-based `rules`.
   * 3. Scrape `dataset` (supermouse*).
   * 4. Cache result.
   */
  private parseDOMInteraction(element: HTMLElement) {
    // 0. Custom Strategy override
    if (this.options.resolveInteraction) {
      this.state.interaction = this.options.resolveInteraction(element);
      return;
    }

    // 1. Check Cache
    if (this.interactionCache.has(element)) {
      this.state.interaction = this.interactionCache.get(element)!;
      return;
    }

    const data: Record<string, any> = {};

    // 2. Semantic Rules (Config-based)
    if (this.options.rules) {
      for (const [selector, rules] of Object.entries(this.options.rules)) {
        if (element.matches(selector)) {
          Object.assign(data, rules);
        }
      }
    }

    // 3. Dataset Scraping (Fast Native)
    // Converts data-supermouse-my-val -> myVal
    const dataset = element.dataset;
    for (const key in dataset) {
      if (key.startsWith('supermouse')) {
        // 'supermouseColor' -> 'color'
        // 'supermouseStick' -> 'stick'
        const prop = key.slice(10);
        if (prop) {
          const cleanKey = prop.charAt(0).toLowerCase() + prop.slice(1);
          const val = dataset[key];
          // Treat empty string (bool attribute) as true
          data[cleanKey] = val === '' ? true : val;
        }
      }
    }

    // 4. Cache and Set
    this.interactionCache.set(element, data);
    this.state.interaction = data;
  }

  // --- Handlers ---
  
  // Unified Pointer Event Handler
  private handleMove = (e: PointerEvent) => {
    if (!this.isEnabled) return;
    
    // Ignore non-mouse inputs if not on touch device (e.g. pen hovering but not touching)
    // unless we strictly want to track everything. PointerType check is robust.
    if (this.options.autoDisableOnMobile && e.pointerType === 'touch') return;

    let x = e.clientX;
    let y = e.clientY;

    // Handle Custom Container Coordinates
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
  };

  private handleDown = () => { if (this.isEnabled) this.state.isDown = true; };
  private handleUp = () => { if (this.isEnabled) this.state.isDown = false; };

  private handleMouseOver = (e: MouseEvent) => {
    if (!this.isEnabled) return;
    const target = e.target as HTMLElement;

    // 0. THE VETO: Explicit Ignore
    if (target.closest('[data-supermouse-ignore]')) {
      this.state.isNative = true;
      return;
    }

    // 1. Dynamic Hover Check
    const selector = this.getHoverSelector();
    const hoverable = target.closest(selector);

    if (hoverable) {
      this.state.isHover = true;
      this.state.hoverTarget = hoverable as HTMLElement;
      this.parseDOMInteraction(this.state.hoverTarget);
    }

    // 2. Semantic Native Cursor Check (Configurable Strategy)
    const strategy = this.options.ignoreOnNative;
    
    if (strategy) {
      const checkTags = strategy === true || strategy === 'auto' || strategy === 'tag';
      const checkCSS = strategy === true || strategy === 'auto' || strategy === 'css';
      let isNative = false;

      // A. Tag Check (Fast, O(1))
      if (checkTags) {
        // Check localName for speed (always lowercase)
        const tag = target.localName;
        if (tag === 'input' || tag === 'textarea' || tag === 'select' || target.isContentEditable) {
          isNative = true;
        }
      }

      // B. CSS Check (Slow, causes Layout Reflow)
      // Only run if not already detected and strategy allows it.
      if (!isNative && checkCSS) {
        const style = window.getComputedStyle(target).cursor;
        const supermouseAllowed = ['default', 'auto', 'pointer', 'none', 'inherit'];
        if (!supermouseAllowed.includes(style)) {
          isNative = true;
        }
      }

      if (isNative) {
        this.state.isNative = true;
      }
    }
  };

  private handleMouseOut = (e: MouseEvent) => {
    if (!this.isEnabled) return;
    const target = e.target as HTMLElement;

    if (target === this.state.hoverTarget || target.contains(this.state.hoverTarget)) {
       if (!e.relatedTarget || !(this.state.hoverTarget?.contains(e.relatedTarget as Node))) {
          this.state.isHover = false;
          this.state.hoverTarget = null;
          this.state.interaction = {}; 
       }
    }

    if (this.state.isNative) {
      this.state.isNative = false;
    }
  };

  private handleWindowLeave = () => {
    if (this.options.hideOnLeave) {
      this.state.hasReceivedInput = false;
    }
  };

  private bindEvents() {
    window.addEventListener('pointermove', this.handleMove, { passive: true });
    window.addEventListener('pointerdown', this.handleDown, { passive: true });
    window.addEventListener('pointerup', this.handleUp);
    
    document.addEventListener('mouseover', this.handleMouseOver);
    document.addEventListener('mouseout', this.handleMouseOut);
    document.addEventListener('mouseleave', this.handleWindowLeave);
  }

  public destroy() {
    if (this.mediaQueryList && this.mediaQueryHandler) {
      this.mediaQueryList.removeEventListener('change', this.mediaQueryHandler);
    }
    window.removeEventListener('pointermove', this.handleMove);
    window.removeEventListener('pointerdown', this.handleDown);
    window.removeEventListener('pointerup', this.handleUp);
    
    document.removeEventListener('mouseover', this.handleMouseOver);
    document.removeEventListener('mouseout', this.handleMouseOut);
    document.removeEventListener('mouseleave', this.handleWindowLeave);
  }
}
