---
title: Text
description: A tooltip-style label that follows the cursor while hovering marked elements.
---

`Text` turns the cursor into a label. Hover an element that declares `data-supermouse-text` and the string appears next to the pointer; move away and it dismisses. It's the cheapest way to give interactive regions a name — no tooltip positioning, no overflow clipping, no focus management.

:cursor-demo{demo="text" title="Text"}

## Installation

```bash
pnpm add @supermousejs/text
```

## Usage

```typescript
import { Supermouse } from "@supermousejs/core";
import { Text } from "@supermousejs/text";

const app = new Supermouse();
app.use(Text({ className: "cursor-tooltip", offset: [16, 16], duration: 150 }));
```

```html
<a href="/work" data-supermouse-text="View case study">Case study</a>
```

Give `className` your own class to style the label; the plugin only creates the element and toggles its visibility.
