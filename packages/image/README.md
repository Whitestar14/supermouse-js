# @supermousejs/image

Displays a custom image or thumbnail as the cursor hover state using a hover target's `data-supermouse-img` attribute.

## Installation

```bash
pnpm add @supermousejs/image
```

## Image

Displays a custom image or thumbnail as the cursor hover state using a hover target's `data-supermouse-img` attribute.

### Usage

```ts
import { Supermouse } from "@supermousejs/core";
import { Image } from '@supermousejs/image';
const app = new Supermouse();
app.use(Image({ className: 'supermouse-image', offset: [0, 30] }));
// Hover target markup
<a href="/gallery" data-supermouse-img="/images/gallery-thumb.jpg">Open gallery</a>
```

### Options

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| className | string | 'supermouse-image' | CSS class added to container. |
| offset | [number, number] | [0, 30] | X/Y offset from cursor. |
| duration | number | 200 | Fade transition time in ms. |
| smoothness | number | 1 | Lerp factor for image lag. |

## Documentation

Full documentation and interactive playground available at [supermouse](https://supermouse.js.org) or [check out the repo](https://github.com/Whitestar14/supermouse-js).
