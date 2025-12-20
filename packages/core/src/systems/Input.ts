import { MouseState, SupermouseOptions } from '../types';

/**
 * Handles input events (mouse/touch) and manages the `isNative`/`isHover` state logic.
 * Also handles mobile/touch disabling and reduced-motion preferences.
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

  // --- Handlers ---
 private handleMove = (e: MouseEvent | TouchEvent) => {
    if (!this.isEnabled) return;
    if (e instanceof MouseEvent) {
      this.state.pointer.x = e.clientX;
      this.state.pointer.y = e.clientY;
    } else if (e.touches?.[0]) {
      this.state.pointer.x = e.touches[0].clientX;
      this.state.pointer.y = e.touches[0].clientY;
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
       }
    }

    if (this.state.isNative) {
      this.state.isNative = false;
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
