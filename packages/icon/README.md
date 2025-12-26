
# @supermousejs/icon

Renders a static SVG icon at the cursor position. Useful for custom pointers.

## Installation

```bash
pnpm add @supermousejs/icon
```

## Usage

```ts
import { Supermouse } from '@supermousejs/core';
import { Icon } from '@supermousejs/icon';

const app = new Supermouse();

app.use(Icon({
  svg: '<svg>...</svg>', // Your SVG string
  size: 24,
  color: 'black'
}));
```

## Documentation

Full documentation and interactive playground available at [supermouse](https://supermouse.vercel.app) or [check out the repo](https://github.com/Whitestar14/supermouse-js).