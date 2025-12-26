
# @supermousejs/ring

The standard Ring cursor plugin for **Supermouse v2**. Supports morphing when used with the Stick logic plugin.

## Installation

```bash
pnpm add @supermousejs/ring
```

## Usage

```ts
import { Supermouse } from '@supermousejs/core';
import { Ring } from '@supermousejs/ring';

const app = new Supermouse();

app.use(Ring({
  size: 20,
  color: 'black',
  borderWidth: 2
}));
```

## Documentation

Full documentation and interactive playground available at [supermouse](https://supermouse.vercel.app) or [check out the repo](https://github.com/Whitestar14/supermouse-js).