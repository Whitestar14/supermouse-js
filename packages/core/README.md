
# @supermousejs/core

The high-performance runtime engine for **Supermouse v2**.

It separates cursor **intent** (input, physics, logic) from **rendering** (visuals), exposing a deterministic plugin pipeline.

## Installation

```bash
pnpm add @supermousejs/core
```

## Basic Usage

```ts
import { Supermouse } from '@supermousejs/core';
// Import visuals separately to keep bundle size low
import { Dot } from '@supermousejs/dot';

const app = new Supermouse({
  smoothness: 0.15, // 0-1 (Physics damping)
  hideCursor: true, // Auto-hide native cursor
});

app.use(Dot({ size: 8, color: '#f59e0b' }));
```

## Documentation

Full documentation and interactive playground available at [supermouse](https://supermouse.vercel.app) or [check out the repo](https://github.com/Whitestar14/supermouse-js).
