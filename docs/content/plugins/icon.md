---
title: Icon
description: Renders a static SVG glyph at the cursor position.
---

`Icon` puts a single SVG at the pointer. It's the minimal cousin of [`SmartIcon`](/docs/plugins/smart-icon): no state machine, no semantic detection — you hand it one glyph and it follows the cursor.

Use it for a fixed cursor — a crosshair, custom arrow, or lozenge — rather than one that reacts to context.

## Installation

```bash
pnpm add @supermousejs/icon
```

## Usage

```typescript
import { Supermouse } from "@supermousejs/core";
import { Icon } from "@supermousejs/icon";

const app = new Supermouse();
app.use(
  Icon({
    svg: "<svg viewBox='0 0 24 24'><path d='M12 2 2 22h20z'/></svg>",
    size: 24,
    color: "#f59e0b"
  })
);
```

`svg` takes an SVG string, and `size` and `color` are reactive; icons that use `currentColor` pick up `color` automatically.
