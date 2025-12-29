# supermousejs

The official all-in-one bundle for **Supermouse v2**.

This package provides a convenient, unscoped entry point for the Supermouse ecosystem. It bundles `@supermousejs/core` with the standard `Dot` and `Ring` plugins.

## Installation

```bash
pnpm add supermousejs
```
or
```bash
npm install supermousejs
```

## Usage

```ts
import Supermouse, { Dot, Ring } from 'supermousejs';

const mouse = new Supermouse({
  smoothness: 0.15
});

mouse.use(Dot({ size: 8 }));
mouse.use(Ring({ size: 24 }));
```

## Why use this over scoped packages?

If you prefer clean import paths or are using a CDN (like unpkg) and want a single file that "just works" with the standard cursor look, this is the package for you.

For advanced users or those looking to minimize bundle size, we recommend using the modular packages:
`@supermousejs/core`, `@supermousejs/dot`, etc.

## Documentation

Full documentation and interactive playground available at [supermouse](https://supermouse.vercel.app) or [check out the repo](https://github.com/Whitestar14/supermouse-js).
