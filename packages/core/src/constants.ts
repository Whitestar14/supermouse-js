/** Off-screen park position before input arrives or after pointer leaves viewport. */
export const OFFSCREEN = { x: -100, y: -100 } as const;

/** HTML tags that always warrant native cursor fallback. */
export const NATIVE_TAGS = new Set(["input", "textarea", "select"]);

export const SUPERMOUSE_CURSORS = new Set([
  "default",
  "auto",
  "pointer",
  "none",
  "inherit",
  "grab",
  "grabbing"
]);

export const DEFAULT_HOVER_SELECTORS = [
  "a",
  "button",
  "input",
  "textarea",
  "[data-hover]",
  "[data-cursor]"
];
