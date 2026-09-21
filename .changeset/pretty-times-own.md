---
"@supermousejs/core": patch
---

Beta.3 fixes and internal refactors.

**Fixed**

- Logic plugins (`priority < 0`) now correctly override `state.target` before physics. The update loop was reordering `target = pointer` after plugin execution, silently clobbering Magnetic, Stick, and any plugin that pins the cursor.
- Cursor state now applies synchronously on `mouseover`, `setCursor()`, and `handle.deactivate()`. Previously the cursor and stage visibility only updated on the next animation frame, causing a one-frame flash of the native cursor when entering a scope whose cursor mode differs from the previous one.
- Nested scope containers no longer inherit `cursor: none` from an outer scope. An engine-level `:where(.supermouse-scope .supermouse-scope) { cursor: auto }` rule cuts the inheritance without beating any authored cursor rule. Verified in Chromium and Firefox.
- `disablePlugin` on a plugin whose scope is inactive no longer re-fires `onBeforeDisable` and `onDisable`. Those hooks already ran when the scope went inactive. Semantics: `isEnabled` is user intent; lifecycle hooks fire on transitions of `(isEnabled && scopeIsActive)`.
- Deactivated eager scopes no longer orphan. The previous resolution model deleted the map entry on deactivation and never re-added it, so `handle.activate()` followed by a hover couldn't reactivate.
- Detached scope containers no longer pin stale bindings.
- `handle.activate()` is now eager when the pointer is already inside the container — fixes modals that mount under a stationary pointer.

**Changed**

- `ScopeHandle.remove()` renamed to `ScopeHandle.destroy()`.
- `ScopeHandle.disable()` / `ScopeHandle.enable()` renamed to `ScopeHandle.deactivate()` / `ScopeHandle.activate()`.
- `ScopeHandle.disabled` renamed to `ScopeHandle.active` (inverted).
- `CursorPolicy` is now `{ native: string[], hide: string[] }`. The previous `{ rules: CursorTargetRule[] }` shape is removed; `CursorTargetRule` is no longer exported.
- `ScopeConfig.container` accepts `HTMLElement | string`. A string is a CSS selector for lazy resolution. The scope stays dormant until an element matching the selector appears and the pointer enters it.
- `Stage.setNativeCursor` no longer writes inline `cursor` on the container. Cursor suppression is class-driven.

**Removed**

- `ViewportManager` module. Container rect reads are now direct `getBoundingClientRect()` calls in `Input.applyPointerToState`. Fixes stale-rect behavior after enter animations.
- Internal `scopeByContainer` map. Replaced with an ancestor walk using `Scope.match(el)`.

**Internal**

- Build target raised to `es2022`.
- `sideEffects: false` added to package.json.
- Size budget enforced at 6 kB gzip / 5.5 kB brotli via `size-limit`.
