type SVGAttrs = Record<string, string | number | boolean>;

/** Create any SVG element by tag name with attributes. */
export function createSVGElement<K extends keyof SVGElementTagNameMap>(
  tag: K,
  attrs: SVGAttrs = {}
): SVGElementTagNameMap[K] {
  const el = document.createElementNS("http://www.w3.org/2000/svg", tag);
  for (const [key, value] of Object.entries(attrs)) {
    el.setAttribute(key, String(value));
  }
  return el;
}

/** Set multiple attributes on an SVG element. */
export function setSVGAttrs(el: SVGElement, attrs: SVGAttrs): void {
  for (const [key, value] of Object.entries(attrs)) {
    el.setAttribute(key, String(value));
  }
}

/** Create a `<g>` group. */
export function group(attrs: SVGAttrs = {}): SVGGElement {
  return createSVGElement("g", attrs);
}

/** Create a `<circle>`. */
export function circle(attrs: SVGAttrs = {}): SVGCircleElement {
  return createSVGElement("circle", attrs);
}

/** Create a `<rect>`. */
export function rect(attrs: SVGAttrs = {}): SVGRectElement {
  return createSVGElement("rect", attrs);
}

/** Create a `<path>` with optional `d` attribute. */
export function path(d?: string, attrs: SVGAttrs = {}): SVGPathElement {
  const el = createSVGElement("path", attrs);
  if (d !== undefined) el.setAttribute("d", d);
  return el;
}

/** Create a `<text>` element. */
export function text(attrs: SVGAttrs = {}, content?: string): SVGTextElement {
  const el = createSVGElement("text", attrs);
  if (content !== undefined) el.textContent = content;
  return el;
}

/** Create a `<textPath>` with proper `href` and `xlink:href`. */
export function textPath(href: string, attrs: SVGAttrs = {}): SVGTextPathElement {
  const el = createSVGElement("textPath", { ...attrs, href });
  el.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", href);
  return el;
}

/** Create a `<filter>` with region attributes and children. */
export function filter(
  id: string,
  attrs: SVGAttrs = {},
  children: SVGElement[] = []
): SVGFilterElement {
  const el = createSVGElement("filter", { id, ...attrs });
  children.forEach((child) => el.appendChild(child));
  return el;
}

/** Create a `<feGaussianBlur>` primitive. */
export function gaussianBlur(
  stdDeviation: string | number = 0,
  attrs: SVGAttrs = {}
): SVGFEGaussianBlurElement {
  return createSVGElement("feGaussianBlur", {
    stdDeviation: String(stdDeviation),
    ...attrs
  });
}

/** Create a `<feTurbulence>` primitive. */
export function turbulence(
  baseFrequency: string | number = 0.1,
  attrs: SVGAttrs = {}
): SVGFETurbulenceElement {
  return createSVGElement("feTurbulence", {
    baseFrequency: String(baseFrequency),
    ...attrs
  });
}

/** Create a `<feMergeNode>` primitive. */
export function mergeNode(inAttr?: string): SVGFEMergeNodeElement {
  return createSVGElement("feMergeNode", inAttr ? { in: inAttr } : {});
}

/** Create a `<feMerge>` container with merge node children. */
export function merge(nodes: SVGFEMergeNodeElement[] = []): SVGFEMergeElement {
  const el = createSVGElement("feMerge");
  nodes.forEach((node) => el.appendChild(node));
  return el;
}
