# @supermousejs/core

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
