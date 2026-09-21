/**
 * A cursor policy maps two independent concerns to flat selector lists.
 *
 * - `native`: selectors whose elements yield to the OS cursor when the
 *   cursor mode is `"auto"`. Hovering them temporarily shows the native
 *   cursor and hides the custom one.
 *
 * - `hide`: selectors that receive `cursor: none !important` when the
 *   custom cursor is active. Needed for elements whose UA stylesheet sets
 *   a cursor (`a { cursor: pointer }`) that would otherwise override the
 *   inherited suppression.
 */
export interface CursorPolicy {
  native: string[];
  hide: string[];
}

/**
 * Shorthand accepted at the public API boundary. `{ native?: [...], hide?: [...] }`
 * normalizes to the full `CursorPolicy` shape with missing keys defaulting to `[]`.
 */
export type CursorPolicyInput =
  | CursorPolicy
  | {
      native?: string[];
      hide?: string[];
    };

export const DEFAULT_CURSOR_POLICY: CursorPolicy = {
  native: ["input", "textarea", "select", "[contenteditable]"],
  hide: [
    "input",
    "textarea",
    "select",
    "[contenteditable]",
    "a",
    "button",
    '[role="button"]',
    "[tabindex]",
    "label"
  ]
};

/**
 * Normalizes shorthand into the full form. Pass-through when the input is
 * already a `CursorPolicy`.
 */
export function normalizePolicy(input?: CursorPolicyInput): CursorPolicy {
  if (!input) return DEFAULT_CURSOR_POLICY;
  return {
    native: input.native ?? [],
    hide: input.hide ?? []
  };
}
