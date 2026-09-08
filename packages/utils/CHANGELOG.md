# @supermousejs/utils

## 2.4.3

### Patch Changes

- Updated dependencies [16a387f]
  - @supermousejs/core@2.4.3

## 2.4.2

### Patch Changes

- 291b5c1: Updated package.json to export only necessary files, skipping out src artifacts
- Updated dependencies [291b5c1]
  - @supermousejs/core@2.4.2

## 2.4.1

### Patch Changes

- 1048a35: Fixed repository metadata pointing to @supermousejs/core instead of their respective directory in package.json
- Updated dependencies [1048a35]
- Updated dependencies [be2d65d]
  - @supermousejs/core@2.4.1

## 2.4.0

### Minor Changes

- faf6e9c: Added svg helpers and restructured the utility to be completely tree-shakeable
- baa6cff: - Updated SmartRing, Sparkles, TextRing, Pointer, Ring, Stick, and other plugins to use `normalizeAll` for better option management where possible.
  - Enhanced the `doctor` utility to provide detailed diagnostics for plugin configurations and potential issues.
  - Removed the deprecated layers utility and integrated layer constants directly into the CSS utility.
  - Improved code readability and consistency across various plugins by standardizing the use of `dom.css` for style application.
- dea1e57: Made enhancements and many improvements to `options.ts`:
  - **Removed `styles` map compilation** in `definePlugin` — no more per-plugin style setter arrays and `normalize` calls for properties that were never used
  - **Collapsed `setStyle`/`applyStyles` into `css()`** — single WeakMap cache instead of scattered helpers, fewer function allocations
  - **Slimmed `definePlugin` itself** — dropped the `defaults` parameter and `O` type parameter, less generic instantiation overhead

### Patch Changes

- 36d5366: Added proper description messages to package meta
- 9681b6c: Enhanced @supermouse/utils with `circumference` in math and `circlePath` in svg
- c43a720: Added `beforeDisable` lifecycle hook for plugins that want to run hooks/animation before core runs the `onDisable()` hook
- Updated dependencies [53b7276]
- Updated dependencies [36d5366]
- Updated dependencies [4fc5aed]
- Updated dependencies [0cd6a04]
- Updated dependencies [ab3cad2]
  - @supermousejs/core@2.4.0

## 2.3.1

### Patch Changes

- Updated dependencies [b72e264]
- Updated dependencies [8dc8e06]
- Updated dependencies [600de13]
  - @supermousejs/core@2.3.0

## 2.3.0

### Patch Changes

- Updated dependencies [f6f44b2]
  - @supermousejs/core@2.2.0

## 2.2.0

### Minor Changes

- 9fe1a7b: - Implemented idiomatic approach to using supermouse/utils
  - Rewrote `applyStyles`, `setTransform` and `setStyles` to share a global cache registry
- 9fa6ece: Add `injectStyles` to safely handle injecting global CSS styles into the document head

### Patch Changes

- 6d70c18: remove legacy package and update supermouse domain in readme
- 14fb5b6: Updated tsconfig to be reference-compliant with core, utils and zoetrope when required
- Updated dependencies [6d70c18]
- Updated dependencies [2590af3]
- Updated dependencies [14fb5b6]
  - @supermousejs/core@2.1.0

## 2.1.1

### Patch Changes

- 67f771b: Add relevant npm metadata to package.json file
- Updated dependencies [67f771b]
  - @supermousejs/core@2.0.5

## 2.1.0

### Minor Changes

- 0a1652d: fixed build architecture and updated plugin metadata

## 2.0.4

### Patch Changes

- 993dc67: Updated supemousejs packages with proper author, license and url descriptors to repo
- Updated dependencies [993dc67]
  - @supermousejs/core@2.0.4

## 2.0.3

### Patch Changes

- Updated dependencies
  - @supermousejs/core@2.0.3

## 2.0.2

### Patch Changes

- ae219a0: Update READMEs with correct link to documentation
- Updated dependencies [ae219a0]
  - @supermousejs/core@2.0.2

## 2.0.1

### Patch Changes

- Add minimal README.md files to packages
- Updated dependencies
  - @supermousejs/core@2.0.1

## 2.0.0

### Major Changes

- Initial v2.0.0 release

### Patch Changes

- Updated dependencies
  - @supermousejs/core@2.0.0
