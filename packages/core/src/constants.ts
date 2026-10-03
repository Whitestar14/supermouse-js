/** Off-screen park position before input arrives or after pointer leaves viewport. */
export const OFFSCREEN = { x: -100, y: -100 } as const;

export const SUPERMOUSE_CURSORS = new Set([
  "default",
  "auto",
  "pointer",
  "none",
  "inherit",
  "grab",
  "grabbing"
]);

/**
 * Selectors whose elements yield to the OS cursor in `"auto"` mode.
 */
export const DEFAULT_NATIVE_CURSOR_SELECTORS = ["input", "textarea", "select", "[contenteditable]"];

export const DEFAULT_HOVER_SELECTORS = [
  "a",
  "button",
  "input",
  "textarea",
  "[data-hover]",
  "[data-cursor]"
];
