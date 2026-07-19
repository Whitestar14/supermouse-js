# @supermousejs/text

Injects contextual text bubbles near the cursor on interaction. Works like a tooltip.

## Installation

```bash
pnpm add @supermousejs/text
```

## Text

Injects contextual text bubbles near the cursor on interaction. Works like a tooltip.

### Usage

```ts
import { Supermouse } from "@supermousejs/core";
import { Text } from "@supermousejs/text";
const app = new Supermouse();
app.use(Text({ duration: 200 }));
```

### Options

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| className | string | 'supermouse-text' | CSS class added to container. |
| offset | [number, number] | [0, 24] | X/Y offset from cursor. |
| duration | number | 200 | Fade transition time in ms. |

## Documentation

Full documentation and interactive playground available at [supermouse](https://supermouse.js.org) or [check out the repo](https://github.com/Whitestar14/supermouse-js).
