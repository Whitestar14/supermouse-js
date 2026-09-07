# @supermousejs/pointer

A vehicle style arrow that rotates based on velocity vectors.

## Installation

```bash
pnpm add @supermousejs/pointer
```

## Pointer

A 'Vehicle' style arrow that rotates based on velocity vectors.

### Usage

```ts
import { Supermouse } from "@supermousejs/core";
import { Pointer } from "@supermousejs/pointer";
const app = new Supermouse();
app.use(Pointer({ size: 32, color: '#000' }));
```

### Options

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| size | number | 32 | Size of the pointer in pixels. |
| color | string | 'black' | Fill color of the SVG. |
| svg | string | Default Arrow | Custom SVG content string. |
| restingAngle | number | -45 | Angle when stationary (degrees). |
| returnToRest | boolean | true | Snap back to resting angle when stopped. |
| restDelay | number | 200 | Milliseconds to wait before returning to rest. |
| opacity | number | 1 | Opacity level (0-1). |
| rotationSmoothing | number | 0.15 | Lerp factor for rotation. |

## Documentation

Full documentation and interactive playground available at [supermouse](https://supermouse.js.org) or [check out the repo](https://github.com/Whitestar14/supermouse-js).
