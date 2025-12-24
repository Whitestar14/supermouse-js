
# @supermousejs/stick

A **Logic Plugin** that calculates the bounding box of hovered elements.
Used in combination with `@supermousejs/ring` (or SmartRing) to create a morphing effect.

## Installation

```bash
pnpm add @supermousejs/stick
```

## Usage

```ts
import { Supermouse } from '@supermousejs/core';
import { Stick } from '@supermousejs/stick';
import { Ring } from '@supermousejs/ring';

const app = new Supermouse();

app.use(Stick({ padding: 10 }));
app.use(Ring()); // Ring automatically detects 'stick' state and morphs
```

**HTML:**
```html
<button data-supermouse-stick="true">Sticky Element</button>
```
