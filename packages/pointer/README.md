
# @supermousejs/pointer

A "Vehicle" style pointer arrow that rotates based on movement velocity.

## Installation

```bash
pnpm add @supermousejs/pointer
```

## Usage

```ts
import { Supermouse } from '@supermousejs/core';
import { Pointer } from '@supermousejs/pointer';

const app = new Supermouse();

app.use(Pointer({
  size: 32,
  color: 'black',
  restingAngle: -45, // Angle when stopped
  returnToRest: true // Snap back when stopped
}));
```
