export interface SmartIconMap {
  [key: string]: string;
}

/**
 * Resolves a semantic icon state from a pointer target.
 *
 * Priority order:
 *   1. Contenteditable / text-input elements → "text"
 *   2. Links and buttons (including descendants) → "pointer"
 *   3. Block-level content tags → "text"
 *   4. Authored cursor value from the core probe ("text" or "grab")
 *   5. Nothing — the caller falls back to `defaultState`.
 *
 * `authoredCursor` is `state.authoredCursor`, populated by Supermouse on
 * every pointerTarget change, in every cursor mode. Null when there is
 * no pointer target.
 */
export function resolveSemanticState(
  target: HTMLElement,
  icons: SmartIconMap,
  authoredCursor: string | null
): string | null {
  const tag = target.tagName.toLowerCase();

  const isEditable =
    target.isContentEditable ||
    target.closest(
      '[contenteditable=""], [contenteditable="true"], [contenteditable="plaintext-only"]'
    ) !== null;

  if (tag === "input" || tag === "textarea" || isEditable) {
    const type = (target as HTMLInputElement).type;
    if (!["button", "submit", "checkbox", "radio", "range", "color"].includes(type)) {
      if (icons["text"]) return "text";
    } else if (icons["pointer"]) {
      return "pointer";
    }
  } else if (tag === "a" || tag === "button" || target.closest("a") || target.closest("button")) {
    if (icons["pointer"]) return "pointer";
  }

  // Uses `closest()` rather than a strict tag check. `pointerTarget` is
  // the deepest element under the pointer, so an <em> inside a <p> would
  // miss a tag-name comparison.
  if (
    icons["text"] &&
    target.closest("p, span, h1, h2, h3, h4, h5, h6, li, blockquote, code, pre")
  ) {
    return "text";
  }

  // Authored cursor, sampled at mouseover by the core. The prior
  // implementation read getComputedStyle(target).cursor directly, which
  // returned "none" whenever Supermouse's own suppression was active.
  if (icons["text"] && authoredCursor === "text") return "text";
  if (icons["grab"] && authoredCursor === "grab") return "grab";

  return null;
}
