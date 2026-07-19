# @supermousejs/magnetic

Attracts the cursor to interactive elements using physics-based magnetism.

## Installation

```bash
pnpm add @supermousejs/magnetic
```

## Magnetic

Attracts the cursor to interactive elements using physics-based magnetism.

### Usage

```ts
import { Supermouse } from "@supermousejs/core";
import { Magnetic } from "@supermousejs/magnetic";
const app = new Supermouse();
app.use(Magnetic({ attraction: 0.4, distance: 100 }));
```

### Options

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| attraction | number | 0.3 | Strength of the pull (0-1). |
| distance | number | 100 | Radius in pixels where attraction begins. |

## Documentation

Full documentation and interactive playground available at [supermouse](https://supermouse.js.org) or [check out the repo](https://github.com/Whitestar14/supermouse-js).
