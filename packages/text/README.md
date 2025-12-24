
# @supermousejs/text

Displays a contextual text label next to the cursor when hovering interactive elements.

## Installation

```bash
pnpm add @supermousejs/text
```

## Usage

```ts
import { Supermouse } from '@supermousejs/core';
import { Text } from '@supermousejs/text';

const app = new Supermouse();

app.use(Text({
  offset: [20, 20], // X, Y offset from cursor
  duration: 200     // Fade duration
}));
```

**HTML:**
```html
<button data-supermouse-text="Click Me">Hover Here</button>
```
