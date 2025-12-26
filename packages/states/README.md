
# @supermousejs/states

A **Logic Controller** that enables/disables other plugins based on hover attributes.
Useful for creating complex interaction modes (e.g. "View" mode vs "Edit" mode).

## Installation

```bash
pnpm add @supermousejs/states
```

## Usage

```ts
import { Supermouse } from '@supermousejs/core';
import { States } from '@supermousejs/states';

const app = new Supermouse();

// Define your plugins normally (names are required)
app.use(Dot({ name: 'dot' }));
app.use(Ring({ name: 'ring' }));
app.use(Text({ name: 'text' }));

// Configure states
app.use(States({
  default: ['dot'], // Plugins active by default
  states: {
    'hover': ['dot', 'ring'],
    'info': ['text']
  }
}));
```

**HTML:**
```html
<div data-supermouse-state="hover">Hover me</div>
<div data-supermouse-state="info" data-supermouse-text="Hello">Info</div>
```

## Documentation

Full documentation and interactive playground available at [supermouse](https://supermouse.vercel.app) or [check out the repo](https://github.com/Whitestar14/supermouse-js).