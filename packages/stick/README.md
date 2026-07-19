# @supermousejs/stick

Morphs the cursor shape to match the bounding box of hovered elements.

## Installation

```bash
pnpm add @supermousejs/stick
```

## Stick

Morphs the cursor shape to match the bounding box of hovered elements.

### Usage

```ts
import { Supermouse } from "@supermousejs/core";
import { Stick } from "@supermousejs/stick";
const app = new Supermouse();
app.use(Stick({ padding: 10 }));
```

### Options

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| padding | number | 10 | Extra padding around the target element in pixels. |

## Documentation

Full documentation and interactive playground available at [supermouse](https://supermouse.js.org) or [check out the repo](https://github.com/Whitestar14/supermouse-js).
