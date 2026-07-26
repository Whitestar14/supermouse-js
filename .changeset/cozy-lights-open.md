---
"@supermousejs/core": minor
---

This release stabilises the core after experimental work, keeping the best improvements while reverting the approach that caused cursor flickering.

- `zIndex` option – customise the stage’s z‑index (default `9999`).
- `cacheCursorStyle` option – opt‑in per‑element caching of computed `cursor` values, with `clearStyleCache()` to invalidate.
- `suspend()` / `resume()` – temporarily yield to another Supermouse instance without tearing down the current one.
- `hasSeenPointer` flag – enables `enable()` to snap the cursor to the live pointer instantly, no more off‑screen sweep.
- Nested‑instance CSS exclusion – scoped stylesheets now automatically prevent outer instance cursor rules from leaking into nested containers.

- `enable()` now respects any active `forcedCursor` override.
- `disable()` always restores the native cursor.
- `clearHover()` now resets `isNative` and `nativeTarget` to prevent stale state.
- Plugin crash handling: crashing plugins are removed after the frame with full cleanup (`onDisable` → `destroy` → element removal).
- `enablePlugin` / `disablePlugin` now hide/show the plugin’s DOM element (if it exposes an `element` property) and call lifecycle hooks.
- `reset()` no longer wipes `state.pointer`, so `enable()` can always snap to the last known position.
- Native‑cursor suppression now uses a class‑toggled CSS approach with additional rules for `<label>`, `<select>`, and range slider thumbs.
- `handleMouseOut` clears `isNative` only when truly leaving the native element, preventing flicker when moving within native controls.
- Animation loop pauses when the tab is hidden and resumes on focus.
- `Stage` warns if the container is not attached to the DOM yet.
- Original container `cursor` style is restored on destroy.
- Various other stability and edge‑case fixes.
