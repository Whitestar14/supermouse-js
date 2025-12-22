
import { MouseState, SupermouseOptions } from '../types';

/**
 * Handles input events (mouse/touch) and manages the `isNative`/`isHover` state logic.
 * Also handles mobile/touch disabling, reduced-motion preferences, and attribute parsing.
 */
export class Input {
  private mediaQueryList?: MediaQueryList;
  private mediaQueryHandler?: (e: MediaQueryListEvent) => void;
  private motionQuery?: MediaQueryList;
  public isEnabled: boolean = true;

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
   * extracting data-cursor-* attributes into state.interaction.
   * This is a convenience for DOM-based cursors. 
   * Logic plugins (e.g. Physics) might write to interaction directly.
   */
  private parseDOMInteraction(element: HTMLElement) {
    const data: Record<string, any> = {};

    // 1. JSON Configuration (data-cursor='{"color":"red"}')
    const jsonAttr = element.getAttribute('data-cursor');
    if (jsonAttr) {
      try {
        const parsed = JSON.parse(jsonAttr);
        Object.assign(data, parsed);
      } catch (e) {
        console.warn(`[Supermouse] Invalid JSON in data-cursor:`, jsonAttr);
      }
    }

    // 2. Legacy/Individual Attributes (data-supermouse-color="red")
    // Iterate attributes to find matches dynamically
    if (element.hasAttributes()) {
      for (const attr of element.attributes) {
        if (attr.name.startsWith('data-supermouse-')) {
          // Remove prefix
          const key = attr.name.slice(16); 
          // Convert kebab-case to camelCase (e.g. text-color -> textColor)
          const camelKey = key.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
          
          // If empty string (boolean attribute), treat as true
          data[camelKey] = attr.value === '' ? true : attr.value;
        }
      }
    }

    // Update state
    this.state.interaction = data;
  }

  // --- Handlers ---
 private handleMove = (e: MouseEvent | TouchEvent) => {
    if (!this.isEnabled) return;
    let x = 0;
    let y = 0;

    if (e instanceof MouseEvent) {
      x = e.clientX;
      y = e.clientY;
    } else if (e.touches?.[0]) {
      x = e.touches[0].clientX;
      y = e.touches[0].clientY;
    }

    this.state.pointer.x = x;
    this.state.pointer.y = y;

    // Invisible Until Active Strategy:
    // If this is the first input (or re-entry), snap everything to the exact position
    // to prevent the cursor from "flying in" from 0,0 or -100,-100.
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
    // If the target (or any parent) has the ignore attribute, force Native Mode.
    if (target.closest('[data-supermouse-ignore]')) {
      this.state.isNative = true;
      return; // Stop processing hover effects
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

    // Window Exit Detection:
    // If relatedTarget is null, the mouse has likely left the viewport window.
    // If configured to hide on leave, we disable hasReceivedInput.
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
