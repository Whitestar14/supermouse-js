/**
 * Injects global CSS styles into the document head safely.
 * Checks for existing IDs to prevent duplication during SPA routing or HMR.
 *
 * @param id A unique identifier for this style block
 * @param css A string of CSS rules to inject.
 */
export const injectStyles = (id: string, css: string) => {
  if (typeof document === "undefined") return;
  if (document.getElementById(id)) return;

  const style = document.createElement("style");
  style.id = id;
  style.innerHTML = css;
  document.head.appendChild(style);
};

// WeakMap to store previous styles for elements to prevent DOM thrashing
const styleCache = new WeakMap<HTMLElement, Record<string, string | number>>();

/**
 * Smart Style Setter (Batch).
 * Only writes to the DOM if the value has actually changed.
 * @param el The element to style
 * @param styles An object of CSS properties and values
 */
export function applyStyles(
  el: HTMLElement,
  styles: Partial<CSSStyleDeclaration>
) {
  if (typeof document === "undefined" || !el) return;

  let cache = styleCache.get(el);
  if (!cache) {
    cache = {};
    styleCache.set(el, cache);
  }

  for (const prop in styles) {
    const value = (styles as any)[prop];
    if (cache[prop] !== value) {
      (el.style as any)[prop] = value;
      cache[prop] = value;
    }
  }
}

/**
 * Smart Style Setter (Single).
 * Proxies to applyStyles for consistency.
 * @param el The element to style
 * @param property The CSS property to set
 * @param value The value to set for the property
 */
export function setStyle(
  el: HTMLElement,
  property: keyof CSSStyleDeclaration,
  value: string | number
) {
  applyStyles(el, { [property]: value } as any);
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
 * @param skewX Skew X (deg) - Default 0
 * @param skewY Skew Y (deg) - Default 0
 */
export function setTransform(
  el: HTMLElement,
  x: number,
  y: number,
  rotation: number = 0,
  scaleX: number = 1,
  scaleY: number = 1,
  skewX: number = 0,
  skewY: number = 0
) {
  const transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%) rotate(${rotation}deg) skew(${skewX}deg, ${skewY}deg) scale(${scaleX}, ${scaleY})`;

  setStyle(el, "transform", transform);
}

/**
 * Calculates the bounding rectangle of an element relative to a container.
 */
export function projectRect(
  element: HTMLElement,
  container: HTMLElement = document.body
): DOMRect {
  const rect = element.getBoundingClientRect();

  if (container !== document.body) {
    const containerRect = container.getBoundingClientRect();
    const x = rect.left - containerRect.left;
    const y = rect.top - containerRect.top;

    return new DOMRect(x, y, rect.width, rect.height);
  }

  return rect;
}

/**
 * Creates a standard Supermouse actor element with optimal performance settings.
 * Includes absolute positioning, pointer-events: none, and will-change: transform.
 *
 * @param tagName The HTML tag to create (default: 'div')
 */
export function createActor(tagName: string = "div"): HTMLElement {
  const el = document.createElement(tagName);
  applyStyles(el, {
    position: "absolute",
    top: "0",
    left: "0",
    pointerEvents: "none",
    boxSizing: "border-box",
    display: "block",
    willChange: "transform",
  });
  return el;
}

/**
 * Creates a circular HTML div using the standard actor base.
 */
export function createCircle(size: number, color: string): HTMLDivElement {
  const el = createActor("div") as HTMLDivElement;
  applyStyles(el, {
    width: `${size}px`,
    height: `${size}px`,
    borderRadius: "50%",
    backgroundColor: color,
  });
  return el;
}

/**
 * Legacy alias for createActor.
 * @deprecated Use createActor() instead.
 */
export function createDiv(): HTMLDivElement {
  return createActor("div") as HTMLDivElement;
}
