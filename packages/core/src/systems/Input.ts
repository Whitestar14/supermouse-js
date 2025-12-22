
import { MouseState, SupermouseOptions, InteractionState } from '../types';

/**
 * Handles input events (mouse/touch) and manages the `isNative`/`isHover` state logic.
 */
export class Input {
  private mediaQueryList?: MediaQueryList;
  private mediaQueryHandler?: (e: MediaQueryListEvent) => void;
  private motionQuery?: MediaQueryList;
  public isEnabled: boolean = true;

  // Performance: Cache parsed interaction data to avoid constant regex/JSON parsing on hover
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

  private checkDeviceCapability() {
    if (!this.options.autoDisableOnMobile) return;

    this.mediaQueryList = window.matchMedia('(pointer: fine)');
    this.updateEnabledState(this.mediaQueryList.matches);

    this.mediaQueryHandler = (e: MediaQueryListEvent) => {
      this.updateEnabledState(e.matches);
    };
    this.mediaQueryList.addEventListener('change', this.mediaQueryHandler);
  }

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
   * Extract interaction state from the element.
   * Scrapes `data-supermouse-*` attributes and checks semantic rules.
   * Uses WeakMap caching for performance.
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

    const jsonAttr = element.getAttribute('data-cursor');
    if (jsonAttr) {
      try {
        const parsed = JSON.parse(jsonAttr);
        Object.assign(data, parsed);
      } catch (e) {
        console.warn(`[Supermouse] Invalid JSON in data-cursor:`, jsonAttr);
      }
    }

    if (element.hasAttributes()) {
      for (const attr of element.attributes) {
        if (attr.name.startsWith('data-supermouse-')) {
          const key = attr.name.slice(16); 
          const camelKey = key.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
          
          data[camelKey] = attr.value === '' ? true : attr.value;
        }
      }
    }

    // 5. Cache and Set
    this.interactionCache.set(element, data);
    this.state.interaction = data;
  }

  // --- Handlers ---
  private handleMove = (e: MouseEvent | TouchEvent) => {
    if (!this.isEnabled) return;
    let clientX = 0;
    let clientY = 0;

    if (e instanceof MouseEvent) {
      clientX = e.clientX;
      clientY = e.clientY;
    } else if (e.touches?.[0]) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      return;
    }

    let x = clientX;
    let y = clientY;

    // Handle Custom Container Coordinates
    if (this.options.container && this.options.container !== document.body) {
      const rect = this.options.container.getBoundingClientRect();
      x = clientX - rect.left;
      y = clientY - rect.top;
    }

    this.state.pointer.x = x;
    this.state.pointer.y = y;

    // Invisible Until Active Strategy:
    if (!this.state.hasReceivedInput) {
      this.state.hasReceivedInput = true;
      this.state.target.x = x;
      this.state.target.y = y;
      this.state.smooth.x = x;
      this.state.smooth.y = y;
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

    // 2. Semantic Native Cursor Check (Auto-detection)
    if (this.options.ignoreOnNative) {
      const style = window.getComputedStyle(target).cursor;
      const supermouseAllowed = ['default', 'auto', 'pointer', 'none', 'inherit'];
      const isFormElement = target.matches('input, textarea, select, [contenteditable]');

      if (isFormElement || !supermouseAllowed.includes(style)) {
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
          this.state.interaction = {}; // Clear interaction data
       }
    }

    if (this.state.isNative) {
      this.state.isNative = false;
    }

    if (this.options.hideOnLeave && e.relatedTarget === null) {
      this.state.hasReceivedInput = false;
    }
  };

  private bindEvents() {
    window.addEventListener('mousemove', this.handleMove);
    window.addEventListener('mousedown', this.handleDown);
    window.addEventListener('mouseup', this.handleUp);
    document.addEventListener('mouseover', this.handleMouseOver);
    document.addEventListener('mouseout', this.handleMouseOut);

    if (this.options.enableTouch) {
      window.addEventListener('touchmove', this.handleMove, { passive: true });
      window.addEventListener('touchstart', this.handleDown, { passive: true });
      window.addEventListener('touchend', this.handleUp);
    }
  }

  public destroy() {
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
  }
}
