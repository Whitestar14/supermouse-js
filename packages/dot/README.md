# @supermousejs/dot

A minimalist precision point that follows your movements perfectly.

## Installation

```bash
pnpm add @supermousejs/dot
```

## Dot

A minimalist precision point that follows your movements perfectly.

### Usage

```ts
import { Supermouse } from "@supermousejs/core";
import { Dot } from "@supermousejs/dot";
const app = new Supermouse();
app.use(Dot({ size: 8, color: '#750c7e' }));
```

### Options

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| size | number | 8 | Diameter of the dot in pixels. |
| color | string | '#750c7e' | Background color. |
| opacity | number | 1 | Opacity level (0-1). |
| mixBlendMode | string | 'difference' | CSS blend mode. |
| hideOnShape | boolean | true | Fade out when a shape (like Stick) is active. |
| zIndex | string | '300' | CSS z-index. |

## Documentation

Full documentation and interactive playground available at [supermouse](https://supermouse.js.org) or [check out the repo](https://github.com/Whitestar14/supermouse-js).
