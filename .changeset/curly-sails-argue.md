---
"@supermousejs/core": minor
---

- Refactored engine by removing 200 lines of redundant comments and typedocs, with appropriate re-reference to canon web docs
- Fixed a framework reactivity cache trap by moving away from WeakMap (computations are light and relatively inexpensive)
- Fixed double crashing by implementing a `try {} catch {}` safety net for plugin installation
- Fixed the Input layer not refreshing plugin states (particularly on hover) when DOM content is detached in reactive frameworks with `Node.isConnected`
