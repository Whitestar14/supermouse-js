# @supermousejs/trail

Generates a procedural particle trail that follows the cursor.

## Installation

```bash
pnpm add @supermousejs/trail
```

## Usage

```ts
import { Supermouse } from '@supermousejs/core';
import { Trail } from '@supermousejs/trail';

const app = new Supermouse();

app.use(Trail({
  length: 10,      // Number of segments
  size: 6,         // Particle size
  color: '#ff00ff'
}));
```
