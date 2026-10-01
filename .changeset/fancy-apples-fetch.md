---
"@supermousejs/core": patch
---

## Fixed

- `handleDown` and `handleUp` now respect `autoDisableOnMobile` on hybrid devices. Previously, only `handleMove` filtered touch events; on a touchscreen laptop with `autoDisableOnMobile: true` and `enableTouch: false`, a finger tap set `state.isDown = true` even though Supermouse should have been ignoring touch entirely. On pure touch devices the existing `isEnabled` guard already blocked the write, so this only affected hybrid hardware. The pointer-type check is now shared across the three pointer-event handlers via `shouldIgnorePointerEvent`.
- `parseDOMInteraction` now handles hyphenated `dataPrefix` values. With `dataPrefix: "super-mouse"`, the browser's `dataset` API camelizes `data-super-mouse-icon` to `superMouseIcon`, and the previous prefix comparison — which lowercased `"superMouseIcon"` and compared against `"super-mouse"` — never matched. The prefix is now camelized before comparison, matching how `dataset` stores attribute names. The default `"supermouse"` prefix was unaffected.
