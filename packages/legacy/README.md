
# supermouse

**This is the legacy wrapper for Supermouse.**

This package provides API compatibility for Supermouse v1, powered by the high-performance v2 engine under the hood. It bundles `@supermousejs/core`, `@supermousejs/dot`, and `@supermousejs/ring` together.

## For New Projects

We strongly recommend using the modular v2 packages directly:

```bash
pnpm add @supermousejs/core @supermousejs/dot
```

## Usage (Legacy / All-in-One)

```ts
import Supermouse from 'supermouse';

const cursor = new Supermouse({
  ringSize: 30,
  ringSmoothness: 0.2,
  // v2 options are also supported here
  ignoreOnNative: true
});
```
