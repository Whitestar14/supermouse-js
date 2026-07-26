---
"@supermousejs/utils": minor
---

Made enhancements and many improvements to `options.ts`:

- **Removed `styles` map compilation** in `definePlugin` — no more per-plugin style setter arrays and `normalize` calls for properties that were never used
- **Collapsed `setStyle`/`applyStyles` into `css()`** — single WeakMap cache instead of scattered helpers, fewer function allocations
- **Slimmed `definePlugin` itself** — dropped the `defaults` parameter and `O` type parameter, less generic instantiation overhead
