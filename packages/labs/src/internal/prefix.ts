const written = new WeakMap<HTMLElement | SVGElement, Record<string, string>>();

/**
 * Writes a CSS property that some engines only accept under `-webkit-`, in both
 * spellings, and only when the value actually changed.
 *
 * `css()` camel-cases its keys, which is why this cannot go through it: passing
 * `webkitMaskImage` produces the property name `webkit-mask-image`, and no
 * engine recognises that — a vendor prefix needs its own leading hyphen. The
 * property is therefore named in its standard kebab form here, and the prefixed
 * twin is derived from it.
 */
export function cssWithWebkit(el: HTMLElement | SVGElement, property: string, value: string): void {
  let seen = written.get(el);
  if (!seen) {
    seen = {};
    written.set(el, seen);
  }
  if (seen[property] === value) return;

  seen[property] = value;
  el.style.setProperty(property, value);
  el.style.setProperty(`-webkit-${property}`, value);
}
