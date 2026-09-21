# @supermousejs/core

## 2.5.0-beta.3

### Patch Changes

- 264bcbd: Beta.3 fixes and internal refactors.

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

- e9431a5: Renamed `disable` and `enable` to `deactivate` and `activate` for clarify of function and implement lazy loading of containers

## 2.5.0-beta.2

### Patch Changes

- ff288b4: Fixed Logic Plugins not have effect from wrong ordering of target overwrite
- 18b57de: Fixed CSS stylesheets being destroyed erroneously from a lack of a primary owner and plugins being activated all at once by the `States` plugin when re-entering previously exited scope

## 2.5.0-beta.1

### Patch Changes

- 5d5ec21: Updated README to document cursor policy and scopes

## 2.5.0-beta.0

### Minor Changes

- 0af4732: Architecture rewrite for v2.5. This is a beta, therefore expect API surface churn before the stable release.

  **Scopes.** A single instance can now own multiple scopes. Pass them at construction or add them at runtime:

  ```ts
  const mouse = new Supermouse({
    scopes: [{ name: "sidebar", container: sidebarEl, cursor: "native" }]
  });

  const handle = mouse.addScope({ container: modalEl, cursor: "custom" });
  handle.setCursor("auto");
  handle.remove();
  ```

  The innermost scope whose container contains the pointer is the active one. Plugin installation, cursor mode, hover selectors, and native-cursor state are all managed per scope.

  **Cursor policy.** `NATIVE_TAGS` and the old `Stage.selectors` are unified into a single `CursorPolicy`. Pass a custom policy via `cursorPolicy` at the top level or per scope. `DEFAULT_CURSOR_POLICY` is exported for spreading.

  **Ancestor-chain interaction.** `data-supermouse-*` attributes and `rules` now cascade from ancestors to the hovered element, ensuring the closest ancestor wins. This fixes the tag-inside-a-tag class of bugs. Disable with `inheritDataAttributes: false`.

  **Lifecycle.** `onBeforeDisable` (and its `definePlugin` equivalent, `beforeDisable`) is now scope-aware: when a scope deactivates, each of its plugins runs `onBeforeDisable`, and the core waits for any returned Promise before hiding the element and calling `onDisable`.

  **Changed.**
  - `disable()` no longer resets physics. Call `disable({ reset: true })` for the old behavior.
  - `suspend()` and `resume()` are removed. Use scopes.
  - `registerHoverTarget` now mutates the active scope's selector set. It's still available for raw-object plugins, but `definePlugin`'s `selector` option is preferred.
  - Stage no longer owns an individual `<style>` tag. All scopes share a single engine-level stylesheet.

  **Removed.**
  - `NATIVE_TAGS`, `SUPERMOUSE_CURSORS` internal constants (moved into policy).
  - `Stage.addSelector` / `Stage.addSelectors` no-ops.

### Patch Changes

- 1325a9c: Reorganized Supermouse core for better tree-shaking and module isolation

## 2.4.3

### Patch Changes

- 16a387f: Updated README with npm-sensible quick start section

## 2.4.2

### Patch Changes

- 291b5c1: Updated package.json to export only necessary files, skipping out src artifacts

## 2.4.1

### Patch Changes

- 1048a35: Fixed repository metadata pointing to @supermousejs/core instead of their respective directory in package.json
- be2d65d: Fix `hideOnLeave` bug where stage didn't fade out on window leave in gecko-based browsers

## 2.4.0

### Minor Changes

- 53b7276: This release stabilises the core after experimental work, keeping the best improvements while reverting the approach that caused cursor flickering.
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

- 0cd6a04: - Unified cursor modes to reduce api surface by replacing cursor and hideCursor with single cursor option, decouple interaction parsing causing bugs
  - Cache rule entries and hover selector string to reduce per-frame work.
  - Suspend/resume no longer toggle native cursor state. this is an identified multi-scope limitation.
- ab3cad2: Enhanced supermouse containerization and added options for caching computed cursor styles

### Patch Changes

- 36d5366: Added proper description messages to package meta
- 4fc5aed: Added forward-compatible `onBeforeDisable` hook for plugins in preparation for architecture rewrite in v2.5

## 2.3.0

### Minor Changes

- 8dc8e06: cleanup and robustness pass: better case-insensitive data-\* handling, safer plugin lifecycle behavior, more reliable cursor restoration, and a more consistent reset/update flow
- 600de13: added `dataPrefix` option for customizable data attribute handling, added a `start()` public method to manually start the raf loop and enhanced supermouse's resistance to bugs

### Patch Changes

- b72e264: Renamed `setCursor` to `setNativeCursor` for simplicity and removed redundant checks on `ignoreOnNative`

## 2.2.0

### Minor Changes

- f6f44b2: Improved tree-shaking by consolidating subordinate files and helpers into the main module file

## 2.1.0

### Minor Changes

- 2590af3: - Refactored engine by removing 200 lines of redundant comments and typedocs, with appropriate re-reference to canon web docs
  - Fixed a framework reactivity cache trap by moving away from WeakMap (computations are light and relatively inexpensive)
  - Fixed double crashing by implementing a `try {} catch {}` safety net for plugin installation
  - Fixed the Input layer not refreshing plugin states (particularly on hover) when DOM content is detached in reactive frameworks with `Node.isConnected`

### Patch Changes

- 6d70c18: remove legacy package and update supermouse domain in readme
- 14fb5b6: Updated tsconfig to be reference-compliant with core, utils and zoetrope when required

## 2.0.5

### Patch Changes

- 67f771b: Add relevant npm metadata to package.json file

## 2.0.4

### Patch Changes

- 993dc67: Updated supemousejs packages with proper author, license and url descriptors to repo

## 2.0.3

### Patch Changes

- Add keywords to core package

## 2.0.2

### Patch Changes

- ae219a0: Update READMEs with correct link to documentation

## 2.0.1

### Patch Changes

- Add minimal README.md files to packages

## 2.0.0

### Major Changes

- Initial v2.0.0 release
