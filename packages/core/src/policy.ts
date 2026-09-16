/**
 * A single rule that ties a CSS selector to native-cursor behaviour
 * and/or native-cursor CSS suppression.
 */
export interface CursorTargetRule {
  /** CSS selector to match. */
  selector: string;
  /**
   * In `"auto"` cursor mode, an element matching this selector yields to the
   * OS cursor.
   * @default true
   */
  native?: boolean;
  /**
   * Generate a `cursor: none !important` rule for this selector when the
   * custom cursor is active. Needed for elements whose UA stylesheet sets a
   * cursor value (e.g. `a { cursor: pointer }`) that would otherwise override
   * the container's inherited `cursor: none`.
   * @default true
   */
  hide?: boolean;
}

export interface CursorPolicy {
  rules: CursorTargetRule[];
}

/** Shorthand form accepted at the public API boundary. */
export type CursorPolicyInput =
  | CursorPolicy
  | {
      native?: string[];
      hide?: string[];
    };

/** Tag + attribute checks that don't need a selector match. */
export const NATIVE_ATTRIBUTE_SELECTOR = "[contenteditable]";

export const DEFAULT_CURSOR_POLICY: CursorPolicy = {
  rules: [
    { selector: "input", native: true, hide: true },
    { selector: "textarea", native: true, hide: true },
    { selector: "select", native: true, hide: true },
    { selector: "[contenteditable]", native: true, hide: true },
    { selector: "a", native: false, hide: true },
    { selector: "button", native: false, hide: true },
    { selector: '[role="button"]', native: false, hide: true },
    { selector: "[tabindex]", native: false, hide: true }
  ]
};

/** Normalize a user-supplied policy input into the full form. */
export function normalizePolicy(input?: CursorPolicyInput): CursorPolicy {
  if (!input) return DEFAULT_CURSOR_POLICY;
  if ("rules" in input) return input;

  const rules: CursorTargetRule[] = [];
  const nativeSet = new Set(input.native ?? []);
  const hideSet = new Set(input.hide ?? []);
  const allSelectors = new Set([...nativeSet, ...hideSet]);

  for (const selector of allSelectors) {
    rules.push({
      selector,
      native: nativeSet.has(selector),
      hide: hideSet.has(selector)
    });
  }

  return { rules };
}

/** Precomputed matchers for fast runtime lookup. */
export interface CompiledPolicy {
  native: string[];
  hide: string[];
}

export function compilePolicy(policy: CursorPolicy): CompiledPolicy {
  const native: string[] = [];
  const hide: string[] = [];

  for (const rule of policy.rules) {
    if (rule.native !== false) native.push(rule.selector);
    if (rule.hide !== false) hide.push(rule.selector);
  }

  return { native, hide };
}
