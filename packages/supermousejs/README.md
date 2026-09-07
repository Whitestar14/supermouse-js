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

If you still need this package for legacy compatibility:

```bash
pnpm add supermousejs
```

But **strongly prefer** the scoped packages for new projects.

## Documentation

Full documentation and interactive playground: [supermouse.js.org](https://supermouse.js.org)
<br/>
Repository: [github.com/Whitestar14/supermouse-js](https://github.com/Whitestar14/supermouse-js)
