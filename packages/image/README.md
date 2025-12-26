
# @supermousejs/image

Displays a floating image thumbnail next to the cursor on hover.

## Installation

```bash
pnpm add @supermousejs/image
```

## Usage

```ts
import { Supermouse } from '@supermousejs/core';
import { Image } from '@supermousejs/image';

const app = new Supermouse();

app.use(Image({
  offset: [30, 30],
  smoothness: 0.1 // Lag factor for the image
}));
```

**HTML:**
```html
<a href="#" data-supermouse-img="/path/to/image.jpg">Hover to see preview</a>
```

## Documentation

Full documentation and interactive playground available at [supermouse](https://supermouse.vercel.app) or [check out the repo](https://github.com/Whitestar14/supermouse-js).