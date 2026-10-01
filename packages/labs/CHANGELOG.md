# @supermousejs/labs

## 2.4.4-beta.7

### Patch Changes

- Updated dependencies [dd5af3d]
- Updated dependencies [eef841f]
  - @supermousejs/core@2.5.0-beta.7
  - @supermousejs/utils@2.4.4-beta.7

## 2.4.4-beta.6

### Patch Changes

- Updated dependencies [187e451]
  - @supermousejs/core@2.5.0-beta.6
  - @supermousejs/utils@2.4.4-beta.6

## 2.4.4-beta.5

### Patch Changes

- d82c62d: ---

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

- Updated dependencies [d82c62d]
  - @supermousejs/utils@2.4.4-beta.5
  - @supermousejs/core@2.5.0-beta.5

## 2.4.4-beta.4

### Patch Changes

- cb9bf9a: Beta.4

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

- Updated dependencies [cb9bf9a]
  - @supermousejs/core@2.5.0-beta.4
  - @supermousejs/utils@2.4.4-beta.4

## 2.4.4-beta.3

### Patch Changes

- Updated dependencies [264bcbd]
- Updated dependencies [e9431a5]
  - @supermousejs/core@2.5.0-beta.3
  - @supermousejs/utils@2.4.4-beta.3

## 2.4.4-beta.2

### Patch Changes

- Updated dependencies [ff288b4]
- Updated dependencies [18b57de]
  - @supermousejs/core@2.5.0-beta.2
  - @supermousejs/utils@2.4.4-beta.2

## 2.4.4-beta.1

### Patch Changes

- Updated dependencies [5d5ec21]
  - @supermousejs/core@2.5.0-beta.1
  - @supermousejs/utils@2.4.4-beta.1

## 2.4.4-beta.0

### Patch Changes

- Updated dependencies [1325a9c]
- Updated dependencies [0af4732]
  - @supermousejs/core@2.5.0-beta.0
  - @supermousejs/utils@2.4.4-beta.0

## 2.4.3

### Patch Changes

- Updated dependencies [16a387f]
  - @supermousejs/core@2.4.3
  - @supermousejs/utils@2.4.3

## 2.4.2

### Patch Changes

- 291b5c1: Updated package.json to export only necessary files, skipping out src artifacts
- Updated dependencies [291b5c1]
  - @supermousejs/utils@2.4.2
  - @supermousejs/core@2.4.2

## 2.4.1

### Patch Changes

- 1048a35: Fixed repository metadata pointing to @supermousejs/core instead of their respective directory in package.json
- Updated dependencies [1048a35]
- Updated dependencies [be2d65d]
  - @supermousejs/utils@2.4.1
  - @supermousejs/core@2.4.1

## 2.4.0

### Minor Changes

- 0cba9cb: - Restructured @supermousejs/labs to be maximally treeshakeable and reducing bundle size
  - Updated `TextRing` to use CSS `letterSpacing` as SVG `textlength`/`lengthAdjust` attributes don't work/work reliably on Firefox-based browsers. Bug report: https://bugzilla.mozilla.org/show_bug.cgi?id=569722
  - Updated Sparkles to use decayPerSecond so it's frame-independent
  - Updated READMEs to reflect API changes and better scope description
  - Removed now-deprecated @supermousejs/zoetrope dependency as utilities have now been moved to @supermousejs/utils
- baa6cff: - Updated SmartRing, Sparkles, TextRing, Pointer, Ring, Stick, and other plugins to use `normalizeAll` for better option management where possible.
  - Enhanced the `doctor` utility to provide detailed diagnostics for plugin configurations and potential issues.
  - Removed the deprecated layers utility and integrated layer constants directly into the CSS utility.
  - Improved code readability and consistency across various plugins by standardizing the use of `dom.css` for style application.

### Patch Changes

- 36d5366: Added proper description messages to package meta
- Updated dependencies [faf6e9c]
- Updated dependencies [53b7276]
- Updated dependencies [36d5366]
- Updated dependencies [9681b6c]
- Updated dependencies [c43a720]
- Updated dependencies [baa6cff]
- Updated dependencies [4fc5aed]
- Updated dependencies [dea1e57]
- Updated dependencies [0cd6a04]
- Updated dependencies [ab3cad2]
  - @supermousejs/utils@2.4.0
  - @supermousejs/core@2.4.0

## 2.3.1

### Minor Changes

- 9e93e6d: implement hysteresis logic for state transitions with configurable switch delay

### Patch Changes

- d09c83e: update README files for various plugins
- Updated dependencies [b72e264]
- Updated dependencies [d09c83e]
- Updated dependencies [8dc8e06]
- Updated dependencies [600de13]
  - @supermousejs/core@2.3.0
  - @supermousejs/zoetrope@2.3.1
  - @supermousejs/utils@2.3.1

## 2.3.0

### Patch Changes

- Updated dependencies [f6f44b2]
  - @supermousejs/core@2.2.0
  - @supermousejs/utils@2.3.0
  - @supermousejs/zoetrope@2.3.0

## 2.2.0

### Minor Changes

- 9fa6ece: Add `injectStyles` to safely handle injecting global CSS styles into the document head

### Patch Changes

- 6d70c18: remove legacy package and update supermouse domain in readme
- 14fb5b6: Updated tsconfig to be reference-compliant with core, utils and zoetrope when required
- Updated dependencies [6d70c18]
- Updated dependencies [2590af3]
- Updated dependencies [14fb5b6]
- Updated dependencies [9fe1a7b]
- Updated dependencies [9fa6ece]
  - @supermousejs/core@2.1.0
  - @supermousejs/utils@2.2.0
  - @supermousejs/zoetrope@2.2.0

## 2.1.1

### Patch Changes

- 67f771b: Add relevant npm metadata to package.json file
- Updated dependencies [67f771b]
  - @supermousejs/zoetrope@2.1.1
  - @supermousejs/utils@2.1.1
  - @supermousejs/core@2.0.5

## 2.1.0

### Minor Changes

- 0a1652d: fixed build architecture and updated plugin metadata

### Patch Changes

- Updated dependencies [0a1652d]
  - @supermousejs/zoetrope@2.1.0
  - @supermousejs/utils@2.1.0

## 2.0.4

### Patch Changes

- 993dc67: Updated supemousejs packages with proper author, license and url descriptors to repo
- Updated dependencies [993dc67]
  - @supermousejs/zoetrope@2.0.4
  - @supermousejs/utils@2.0.4
  - @supermousejs/core@2.0.4

## 2.0.3

### Patch Changes

- Updated dependencies
  - @supermousejs/core@2.0.3
  - @supermousejs/utils@2.0.3
  - @supermousejs/zoetrope@2.0.3

## 2.0.2

### Patch Changes

- ae219a0: Update READMEs with correct link to documentation
- Updated dependencies [ae219a0]
  - @supermousejs/zoetrope@2.0.2
  - @supermousejs/utils@2.0.2
  - @supermousejs/core@2.0.2

## 2.0.1

### Patch Changes

- Add minimal README.md files to packages
- Updated dependencies
  - @supermousejs/zoetrope@2.0.1
  - @supermousejs/utils@2.0.1
  - @supermousejs/core@2.0.1

## 2.0.0

### Major Changes

- Initial v2.0.0 release

### Patch Changes

- Updated dependencies
  - @supermousejs/zoetrope@2.0.0
  - @supermousejs/utils@2.0.0
  - @supermousejs/core@2.0.0
