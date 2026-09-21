import type { Supermouse } from "../Supermouse";

/** True if the element carries any class starting with the given prefix. */
export function hasClassPrefix(el: Element, prefix: string): boolean {
  return Array.from(el.classList).some((c) => c.startsWith(prefix));
}

/** True if the element is currently suppressing the native cursor. */
export function hasHideClass(el: Element): boolean {
  return hasClassPrefix(el, "supermouse-hide-");
}

/** True if the element is registered as a Supermouse scope container. */
export function hasScopeClass(el: Element): boolean {
  return hasClassPrefix(el, "supermouse-scope-");
}

/** Dispatches a synthetic pointermove event on window. */
export function movePointer(
  x: number,
  y: number,
  pointerType: "mouse" | "touch" | "pen" = "mouse"
): void {
  window.dispatchEvent(new PointerEvent("pointermove", { clientX: x, clientY: y, pointerType }));
}

/** Dispatches a synthetic mouseover event on the element. */
export function hover(el: Element): void {
  el.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
}

/** Dispatches a synthetic mouseout event on the element. */
export function unhover(el: Element, relatedTarget: Node | null = null): void {
  el.dispatchEvent(new MouseEvent("mouseout", { bubbles: true, relatedTarget }));
}

/** Hover and advance one frame, so the core applies cursor decisions. */
export function hoverAndStep(app: Supermouse, el: Element, dtMs = 16): void {
  hover(el);
  app.step(performance.now() + dtMs);
}

/** Advance one frame without a hover. */
export function step(app: Supermouse, dtMs = 16): void {
  app.step(performance.now() + dtMs);
}
