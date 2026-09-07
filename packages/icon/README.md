# @supermousejs/icon

Renders a static SVG icon at the cursor position.

## Installation

```bash
pnpm add @supermousejs/icon
```

## Icon

Renders a static SVG icon at the cursor position.

### Usage

```ts
import { Supermouse } from "@supermousejs/core";
import { Icon } from "@supermousejs/icon";
const app = new Supermouse();
app.use(Icon({ svg: '<svg>...</svg>', size: 24 }));
```

### Options

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| svg | string | undefined | SVG content string. (Required) |
| size | number | 24 | Size of the icon container. |
| color | string | 'black' | CSS color (currentColor). |
| opacity | number | 1 | Opacity level (0-1). |
| offset | [number, number] | [0, 0] | Fixed [x, y] offset from cursor center. |

## Documentation

Full documentation and interactive playground available at [supermouse](https://supermouse.js.org) or [check out the repo](https://github.com/Whitestar14/supermouse-js).
