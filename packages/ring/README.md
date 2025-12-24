
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
