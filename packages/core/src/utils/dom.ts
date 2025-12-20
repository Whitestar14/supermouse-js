/**
 * Applies a dictionary of styles to an HTMLElement.
 */
export function applyStyles(el: HTMLElement, styles: Partial<CSSStyleDeclaration>) {
  Object.assign(el.style, styles);
}

/**
 * Universal Transform Setter.
 * Handles centering (-50%) automatically.
 * 
 * @param el The element
 * @param x X Position (px)
 * @param y Y Position (px)
 * @param rotation Rotation (deg) - Default 0
 * @param scaleX Scale X - Default 1
 * @param scaleY Scale Y - Default 1
 */
export function setTransform(
  el: HTMLElement, 
  x: number, 
  y: number, 
  rotation: number = 0, 
  scaleX: number = 1, 
  scaleY: number = 1
) {
  el.style.transform = `
    translate3d(${x}px, ${y}px, 0) 
    translate(-50%, -50%) 
    rotate(${rotation}deg) 
    scale(${scaleX}, ${scaleY})
  `;
}

/**
 * Creates a circular HTML div with absolute positioning.
 */
export function createCircle(size: number, color: string): HTMLDivElement {
  const el = document.createElement('div');
  applyStyles(el, {
    position: 'absolute',
    top: '0', left: '0',
    width: `${size}px`,
    height: `${size}px`,
    borderRadius: '50%',
    backgroundColor: color,
    pointerEvents: 'none',
    boxSizing: 'border-box',
    willChange: 'transform'
  });
  return el;
}

/**
 * Creates a basic HTML div container for absolute positioning.
 */
export function createDiv(): HTMLDivElement {
  const el = document.createElement('div');
  applyStyles(el, {
    position: 'absolute',
    top: '0', left: '0',
    pointerEvents: 'none',
    boxSizing: 'border-box'
  });
  return el;
}
