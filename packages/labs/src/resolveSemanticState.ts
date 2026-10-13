export interface SmartIconMap {
  [key: string]: string;
}

/**
 * Resolves a semantic icon state from a pointer target, or null when nothing
 * matches and the caller should fall back to its default state.
 *
 * Priority: text inputs and contenteditable -> "text"; links and buttons ->
 * "pointer"; block-level content -> "text"; the core's authored cursor last.
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

  // `closest()` rather than a tag check: `pointerTarget` is the deepest element
  // under the pointer, so an <em> inside a <p> would otherwise miss.
  if (
    icons["text"] &&
    target.closest("p, span, h1, h2, h3, h4, h5, h6, li, blockquote, code, pre")
  ) {
    return "text";
  }

  // The core samples the authored cursor before suppression, so this never
  // reads back the `cursor: none` Supermouse itself applies.
  if (icons["text"] && authoredCursor === "text") return "text";
  if (icons["grab"] && authoredCursor === "grab") return "grab";

  return null;
}
