---
"@supermousejs/core": patch
"@supermousejs/labs": patch
---

Beta.4

**Added**

- `state.authoredCursor` — the cursor value the page intends at the element under the pointer, resolved as if Supermouse's suppression were not active. Populated on every pointerTarget change, in all cursor modes. Read this to know what the page wants (`canvas { cursor: crosshair }`, `.drag-handle { cursor: grab }`, `[disabled] { cursor: not-allowed }`) rather than just whether the OS cursor should be shown (`state.isNative`).
- `state.pointerTarget` — the raw element under the pointer, regardless of hover selectors. Distinct from `state.hoverTarget`, which reports the nearest ancestor matching a hover selector.

**Fixed**

- Cursor detection in `auto` mode no longer reads its own suppression output. The previous implementation called `getComputedStyle(target).cursor` while the scope's hide class was active, so it always saw `"none"` and never triggered native fallback for authored exotic cursors. A probe attribute (`data-sm-probe`) is now excluded from every generated suppression rule, so the read sees the page's intended value.

**Changed**

- `@supermousejs/labs`: `SmartIcon` now reads `state.pointerTarget` and `state.authoredCursor` instead of relying on a broad hover-selector sweep. Hovering a `<p>` no longer sets `state.isHover` on the primary scope.
- `@supermousejs/labs`: `SmartIconOptions.useSemanticTags` renamed to `useSemanticDetection`. The old name referred to a `registerHoverTarget` sweep that no longer runs.

**Internal**

- Size budget raised to 6.5 kB gzip / 5.75 kB brotli to accommodate the beta.4 surface. Will be re-tightened once the shape settles.
