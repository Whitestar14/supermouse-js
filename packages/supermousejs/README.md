# supermousejs (Deprecated)

> **This package is deprecated.**
> Supermouse has moved to a fully modular architecture for easier maintainability.
> Please use the scoped packages instead:
>
> - Core engine: [`@supermousejs/core`](https://www.npmjs.com/package/@supermousejs/core)
> - Dot plugin: [`@supermousejs/dot`](https://www.npmjs.com/package/@supermousejs/dot)
> - Ring plugin: [`@supermousejs/ring`](https://www.npmjs.com/package/@supermousejs/ring)
> - All other plugins are available under the `@supermousejs/*` scope.

## Migration Guide

### Before (deprecated)

```ts
import Supermouse, { Dot, Ring } from "supermousejs";
```

### After (recommended)

```ts
import { Supermouse } from "@supermousejs/core";
import { Dot } from "@supermousejs/dot";
import { Ring } from "@supermousejs/ring";

const mouse = new Supermouse();
mouse.use(Dot()).use(Ring());
```

## Installation

```bash
pnpm add supermousejs
```

## Supermouse JS (Standard)

Deprecated: Use scoped packages @supermousejs/core, @supermousejs/dot, @supermousejs/ring instead.

### Usage

```ts
import Supermouse, { Dot, Ring } from 'supermousejs';
import { Supermouse } from '@supermousejs/core';
import { Dot } from '@supermousejs/dot';
import { Ring } from '@supermousejs/ring';
import { Supermouse JS (Standard) } from "supermousejs";
// Deprecated
// Recommended
app.use(Dot()).use(Ring());
```

### Options

No explicit options are documented for this plugin.

## Documentation

Full documentation and interactive playground available at [supermouse](https://supermouse.js.org) or [check out the repo](https://github.com/Whitestar14/supermouse-js).
