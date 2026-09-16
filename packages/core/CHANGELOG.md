# @supermousejs/core

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
