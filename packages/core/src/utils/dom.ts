/**
 * Applies a dictionary of styles to an HTMLElement.
 */
export function applyStyles(el: HTMLElement, styles: Partial<CSSStyleDeclaration>) {
  Object.assign(el.style, styles);
}

/**
 * Moves an element using transform: translate3d.
 * Automatically handles the -50% centering hack.
 */
export function setTransform(el: HTMLElement, x: number, y: number, scale: number = 1) {
  el.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%) scale(${scale})`;
}

/**
 * Creates a standard circle div optimized for performance.
 */
export function createCircle(size: number, color: string): HTMLDivElement {
  const el = document.createElement('div');
  applyStyles(el, {
    position: 'absolute', // Fixed relative to Container
    top: '0', left: '0',
    width: `${size}px`,
    height: `${size}px`,
    borderRadius: '50%',
    backgroundColor: color,
    pointerEvents: 'none',
    boxSizing: 'border-box', // Safety
    willChange: 'transform' // Performance hint
  });
  return el;
}

/**
 * Creates a generic div for the system.
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