# @supermousejs/dot

The standard Dot cursor plugin for **Supermouse v2**.

## Installation

```bash
pnpm add @supermousejs/dot
```

## Usage

```ts
import { Supermouse } from '@supermousejs/core';
import { Dot } from '@supermousejs/dot';

const app = new Supermouse();

app.use(Dot({
  size: 8,
  color: '#ff0000',
  mixBlendMode: 'difference'
}));
```

## Documentation

Full documentation and interactive playground available at [supermouse](https://supermouse.vercel.app) or [check out the repo](https://github.com/Whitestar14/supermouse-js).
