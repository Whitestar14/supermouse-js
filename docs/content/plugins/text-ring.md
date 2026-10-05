---
title: TextRing
description: Rotates a string of text around the cursor position.
---

`TextRing` wraps a line of text around the pointer and spins it. It is a decorative, always-on cursor with no hover target to set up — a natural fit for a **loading** or **processing** state, or a status readout that keeps moving while the page is busy.

:cursor-demo{demo="text-ring" title="TextRing"}

## Installation

```bash
pnpm add @supermousejs/labs
```

## Usage

```typescript
import { Supermouse } from "@supermousejs/core";
import { TextRing } from "@supermousejs/labs";

const app = new Supermouse();
app.use(
  TextRing({
    text: "LOADING • ",
    radius: 40,
    fontSize: 10,
    speed: 45,
    color: "#10b981"
  })
);
```

```html
<button data-supermouse-text="Copy">…</button>
<div data-supermouse-text-ring="PROCESSING • ">…</div>
```

The text can come from the hovered element: `data-supermouse-text-ring` wins, with `data-supermouse-text` as a fallback.
