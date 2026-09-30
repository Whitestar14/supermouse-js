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
 *
 * The engine emits one wildcard rule per scope that suppresses the native
 * cursor over every element (with `!important`, exclusions, and the probe
 * attribute opt-out). This list is the exception: elements matching these
 * selectors override the wildcard and let the OS cursor through.
 *
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
