export class Stage {
  public readonly element: HTMLDivElement;

  constructor(private hideNativeCursor: boolean) {
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

    if (this.hideNativeCursor) {
      document.body.style.cursor = 'none';
    }
  }

  public setVisibility(visible: boolean) {
    this.element.style.opacity = visible ? '1' : '0';
  }

  public setNativeCursor(type: 'none' | 'auto' | '') {
    if (this.hideNativeCursor || type === '') {
      document.body.style.cursor = type;
    }
  }

  public destroy() {
    this.element.remove();
    document.body.style.cursor = '';
  }
}