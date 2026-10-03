---
"@supermousejs/magnetic": patch
"@supermousejs/image": patch
"@supermousejs/stick": patch
"@supermousejs/utils": patch
"@supermousejs/core": patch
"@supermousejs/labs": patch
"@supermousejs/ring": patch
"@supermousejs/text": patch
"@supermousejs/dot": patch
---

---

Beta.5 — cursor policy flattening, suppression simplification, and API renames.

## Changed — breaking

- `cursorPolicy` option renamed to `nativeCursorSelectors` and flattened to a plain `string[]`. Migration: `cursorPolicy: { native: [".x"] }` → `nativeCursorSelectors: [".x"]`. The `hide` key is gone; cursor suppression is unconditional and no longer configurable.
- `CursorPolicy` and `CursorPolicyInput` types removed from the public export surface. Code importing them fails at compile time. The only remaining shape is `string[]`.
- `DEFAULT_CURSOR_POLICY` renamed to `DEFAULT_NATIVE_CURSOR_SELECTORS`. Value reduced to `["select", "[contenteditable]"]`.
- `registerHoverTarget(selector)` renamed to `addHoverSelectors(selectors)`. Same behavior — comma-separated selectors are added to the current scope's shared hover set. The new name matches `hoverSelectors` and reflects that it mutates a set rather than registering a single element.
- `@supermousejs/utils`: `VisualConfig.selector` renamed to `hoverSelector`. Update `definePlugin({ ..., selector: "x" })` to `definePlugin({ ..., hoverSelector: "x" })`.

## Changed — behavior

- `input` and `textarea` removed from the default native cursor list. Text inputs and textareas are unaffected — their UA cursor is `text`, which the probe reads and treats as a fallback trigger. Button-like inputs (`<input type="button">`, `<input type="submit">`) and checkboxes/radios change: their UA cursor is `default`, which the probe classifies as non-fallback, so the custom cursor now shows over them. This matches the pre-existing treatment of `<button>`.
- Cursor suppression is now a single wildcard rule per scope instead of a wildcard plus per-selector rules. Behavior is unchanged — verified in Chromium and Firefox against `<a>`, `<button>`, `<input>` (all types), `<textarea>`, `<select>`, `[contenteditable]`, `[role="button"]`, `[tabindex]`, `<label>`, and a `<canvas>` with site CSS. Range slider thumb pseudo-elements retain their explicit rules (`*` does not match pseudo-elements).

## Fixed

- `handleMouseOut` no longer leaves `state.isHover` and `state.isNative` stale when the pointer leaves from a descendant of the tracked element. Moving from `<span>` inside `<button>` directly outside the button previously failed to clear `hoverTarget` — the containment check was inverted.

## Internal

- `policy.ts` removed from `@supermousejs/core`. The default moved to `constants.ts`; `normalizePolicy` dissolved into `??` fallbacks at the call sites.
- `Scope.hideSelectors` field removed.
- Size budget re-tightened to 6.2 kB gzip / 5.5 kB brotli.
