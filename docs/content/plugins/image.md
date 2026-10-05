---
title: Image
description: Shows an image or thumbnail as the cursor while hovering an element that declares one.
---

`Image` previews a picture at the cursor. Hover an element carrying `data-supermouse-img` and the referenced image fades in next to the pointer — the classic peek treatment for galleries and product grids.

:cursor-demo{demo="image" title="Image"}

## Installation

```bash
pnpm add @supermousejs/image
```

## Usage

```typescript
import { Supermouse } from "@supermousejs/core";
import { Image } from "@supermousejs/image";

const app = new Supermouse();
app.use(Image({ className: "supermouse-image", offset: [0, 30] }));
```

```html
<a href="/gallery" data-supermouse-img="/images/gallery-thumb.jpg">Open gallery</a>
```

The `src` comes from the hovered element's `data-supermouse-img`, so one plugin serves every thumbnail in a list.
