let stageCount = 0;

/**
 * Manages the fixed DOM container for cursor elements and handles global CSS injection 
 * for hiding the native cursor.
 */
export class Stage {
  public readonly element: HTMLDivElement;
  private styleTag: HTMLStyleElement;
  private id: string;

  private selectors: Set<string> = new Set([
    'html', 'body', 'a', 'button', 'input[type="submit"]', 
    'input[type="image"]', 'label[for]', 'select',
    'textarea', '[role="button"]', '[tabindex]'
  ]);

  constructor(private hideNativeCursor: boolean) {
    this.id = `supermouse-style-${stageCount++}`;

    // 1. Create Container
    this.element = document.createElement('div');
    Object.assign(this.element.style, {
      position: 'fixed',
      top: '0', left: '0', width: '100%', height: '100%',
      pointerEvents: 'none',
      zIndex: '9999',
      opacity: '1',
      transition: 'opacity 0.15s ease'
    });
    document.body.appendChild(this.element);

    // 2. Create Dynamic Style Tag
    this.styleTag = document.createElement('style');
    this.styleTag.id = this.id;
    document.head.appendChild(this.styleTag);

    if (this.hideNativeCursor) {
      this.updateCursorCSS();
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
    // If global hiding is disabled, do nothing
    if (!this.hideNativeCursor && type === 'none') return;

    if (type === 'none') {
      this.updateCursorCSS();
    } else {
      this.styleTag.innerText = '';
    }
  }

  private updateCursorCSS() {
    const selectorString = Array.from(this.selectors).join(', ');
    this.styleTag.innerText = `
      ${selectorString} {
        cursor: none !important;
      }
    `;
  }

  public destroy() {
    this.element.remove();
    this.styleTag.remove();
    // Only reset body cursor if we were the ones hiding it? 
    // For now, safe to reset to empty (default).
    document.body.style.cursor = '';
  }
}
