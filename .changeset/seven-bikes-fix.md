---
"@supermousejs/core": patch
---

Beta.6 — scope-handle collapse, detection fixes, and internal hygiene.

## Changed — breaking

- `ScopeHandle` type removed. `addScope()` returns `Scope`, `getScope()` returns `Scope | undefined`. The runtime object is unchanged — this is a type-level collapse of a wrapper that existed only to expose a subset of the scope's surface.
- `Scope.container` is `HTMLElement | null`, matching the previous handle contract. Internal code reads `scope.stage.containerElement` directly, which always returns the current binding.

## Fixed

- Programmatic scope transitions now re-settle hover state against the element under the pointer. `handle.activate()` (when the pointer is already inside the container), `handle.deactivate()`, and `handle.destroy()` previously left `state.isNative`, `state.hoverTarget`, `state.authoredCursor`, and `state.interaction` populated from the outgoing scope. If the incoming scope was `auto` mode and the pointer happened to be over an `<input>`, the cursor behaved as if it were hovering a plain div. Now the state is recomputed against whatever element the pointer is actually on.
- The probe attribute now tracks `dataPrefix` instead of being hardcoded to `data-sm-probe`. With the default prefix it's `data-supermouse-probe`; with `dataPrefix: "sm"` it's `data-sm-probe`. The `data-${prefix}-` convention is now consistent across `ignore`, `hover`, `cursor`, and the probe.

## Internal

- `buildScopeHandle` and the `scopeHandles` map removed. `Scope` methods delegate to the engine via an `_`-prefixed reference.
- The engine's delegate methods (`_destroyScope`, `_setScopeCursor`, `_activateScope`, `_deactivateScope`, `_installPlugin`, `_removePluginFromScope`) are tagged `@internal` and stripped from the emitted `.d.ts` via `stripInternal: true`. They no longer appear in autocomplete or the public type surface.
- `runBeforeDisable` helper extracted. The `onBeforeDisable → await → finish` pattern appeared identically in `deactivatePlugin`, `scopeDeactivatePlugin`, and `_removePluginFromScope`.
- `Scope.contains()` removed — unused.
- `Scope.buildRules()` no longer emits the wildcard rule twice.
