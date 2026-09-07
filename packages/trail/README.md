# @supermousejs/trail

Generates procedural particles that trail behind your motion

## Installation

```bash
pnpm add @supermousejs/trail
```

## Trail

Generates procedural particles that trail behind your motion.

### Usage

```ts
import { Supermouse } from "@supermousejs/core";
import { Trail } from "@supermousejs/trail";
const app = new Supermouse();
app.use(Trail({ length: 12, color: '#f0f' }));
```

### Options

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| length | number | 10 | Number of trail segments. |
| size | number | 6 | Size of trail particles. |
| color | string | '#ff00ff' | Color of segments. |

## Documentation

Full documentation and interactive playground available at [supermouse](https://supermouse.js.org) or [check out the repo](https://github.com/Whitestar14/supermouse-js).
