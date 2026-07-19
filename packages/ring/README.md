# @supermousejs/ring

Adds a lagging outer ring. Simple and performant.

## Installation

```bash
pnpm add @supermousejs/ring
```

## Ring

Adds a lagging outer ring. Simple and performant.

### Usage

```ts
import { Supermouse } from "@supermousejs/core";
import { Ring } from "@supermousejs/ring";
const app = new Supermouse();
app.use(Ring({ size: 32, color: '#000' }));
```

### Options

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| size | number | 20 | Diameter of the ring in pixels. |
| color | string | '#ffffff' | Border color. |
| borderWidth | number | 2 | Stroke width in pixels. |
| opacity | number | 1 | Opacity level (0-1). |
| mixBlendMode | string | 'difference' | CSS blend mode. |

## Documentation

Full documentation and interactive playground available at [supermouse](https://supermouse.js.org) or [check out the repo](https://github.com/Whitestar14/supermouse-js).
