
let stageCount = 0;

/**
 * Manages the fixed DOM container for cursor elements and handles global CSS injection 
 * for hiding the native cursor.
 */
export class Stage {
  public readonly element: HTMLDivElement;
  private styleTag: HTMLStyleElement;
  private id: string;
  private scopeClass: string;

  // Defaults for CSS hiding. We must override user-agent styles on these elements
  // to prevent the native cursor from popping through.
  private selectors: Set<string> = new Set([
    'a', 'button', 'input', 'textarea', 'select', 
    '[role="button"]', '[tabindex]'
  ]);

  constructor(private container: HTMLElement = document.body, private hideNativeCursor: boolean) {
    if (!container || !(container instanceof HTMLElement)) {
      throw new Error(`[Supermouse] Invalid container: ${container}. Must be an HTMLElement.`);
    }

    const instanceId = stageCount++;
    this.id = `supermouse-style-${instanceId}`;
    this.scopeClass = `supermouse-scope-${instanceId}`;
    
    const isBody = container === document.body;

    // 1. Create Container
    this.element = document.createElement('div');
    Object.assign(this.element.style, {
      position: isBody ? 'fixed' : 'absolute',
      top: '0', left: '0', width: '100%', height: '100%',
      pointerEvents: 'none',
      zIndex: '9999',
      opacity: '1',
      transition: 'opacity 0.15s ease'
    });
    
    // Ensure parent is relative if we are using absolute positioning
    if (!isBody) {
        const computed = window.getComputedStyle(container);
        if (computed.position === 'static') {
            container.style.position = 'relative';
        }
    }
    
    container.appendChild(this.element);

    // 2. Create Dynamic Style Tag
    this.styleTag = document.createElement('style');
    this.styleTag.id = this.id;
    document.head.appendChild(this.styleTag);

    // 3. Apply Scope Class to Container
    // This allows us to target CSS purely within this container (or body)
    this.container.classList.add(this.scopeClass);

    // 4. Apply Initial Cursor State
    if (this.hideNativeCursor) {
      this.setNativeCursor('none');
    }
  }

  /**
   * Adds a new CSS selector to the "Hide Native Cursor" list.
   * Called by plugins during install to ensure the native cursor is hidden on their interactive targets.
   */
  public addSelector(selector: string) {
    this.selectors.add(selector);
    if (this.hideNativeCursor) {
      this.updateCursorCSS();
    }
  }

  public setVisibility(visible: boolean) {
    this.element.style.opacity = visible ? '1' : '0';
  }

  /**
   * Toggles the visibility of the native cursor via CSS.
   * @param type 'none' to hide, 'auto' to show.
   */
  public setNativeCursor(type: 'none' | 'auto' | '') {
    // If global hiding is disabled, do nothing (unless specifically forcing auto)
    if (!this.hideNativeCursor && type === 'none') return;

    if (type === 'none') {
      // 1. Hide on container directly (covers background)
      this.container.style.cursor = 'none';
      // 2. Hide on interactive elements (overrides UA stylesheet)
      this.updateCursorCSS();
    } else {
      this.container.style.cursor = '';
      this.styleTag.innerText = '';
    }
  }

  private updateCursorCSS() {
    const rawSelectors = Array.from(this.selectors);
    if (rawSelectors.length === 0) {
      this.styleTag.innerText = '';
      return;
    }
    
    // Scoped Selector Logic:
    // We prepend the scope class to every selector to ensure we don't bleed into
    // other parts of the page if the user is using a specific container.
    // e.g. .supermouse-scope-0 a, .supermouse-scope-0 button { ... }
    const scopedSelectors = rawSelectors.map(s => `.${this.scopeClass} ${s}`).join(', ');

    this.styleTag.innerText = `
      ${scopedSelectors} {
        cursor: none !important;
      }
    `;
  }

  public destroy() {
    this.element.remove();
    this.styleTag.remove();
    this.container.style.cursor = '';
    this.container.classList.remove(this.scopeClass);
  }
}
