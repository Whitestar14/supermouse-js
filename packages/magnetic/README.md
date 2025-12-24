
# @supermousejs/magnetic

A **Logic Plugin** that attracts the cursor to interactive elements.

## Installation

```bash
pnpm add @supermousejs/magnetic
```

## Usage

```ts
import { Supermouse } from '@supermousejs/core';
import { Magnetic } from '@supermousejs/magnetic';

const app = new Supermouse();

// Priority is handled automatically (-10)
app.use(Magnetic({
  attraction: 0.3, // Strength (0-1)
  distance: 100    // Capture radius in px
}));
```

**HTML:**
```html
<button data-supermouse-magnetic="true">Magnetic Button</button>
```
