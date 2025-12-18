import { MouseState, SupermouseOptions } from '../types';

export class Input {
  private mediaQueryList?: MediaQueryList;
  private mediaQueryHandler?: (e: MediaQueryListEvent) => void;
  public isEnabled: boolean = true;

  constructor(
    private state: MouseState,
    private options: SupermouseOptions,
    private onEnableChange: (enabled: boolean) => void
  ) {
    this.checkDeviceCapability();
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

    // Hover Check
    if (target.matches(this.options.hoverSelector!)) {
      this.state.isHover = true;
      this.state.hoverTarget = target;
    }

    // Text Mode Check
    if (this.options.ignoreOnText) {
      const isInput = target.matches('input, textarea, [contenteditable]');
      const style = window.getComputedStyle(target).cursor;
      
      if (isInput || style === 'text' || style === 'vertical-text') {
        this.state.isText = true;
      }
    }
  };

  private handleMouseOut = (e: MouseEvent) => {
    if (!this.isEnabled) return;
    const target = e.target as HTMLElement;

    if (target === this.state.hoverTarget) {
      this.state.isHover = false;
      this.state.hoverTarget = null;
    }

    if (this.state.isText) {
      this.state.isText = false;
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