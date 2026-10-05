---
title: SmartIcon
description: A state machine that morphs between SVG icons based on what's under the pointer.
---

`SmartIcon` is a single DOM node that swaps between several SVG states automatically. Instead of registering an icon per context, you describe a small set — `default`, `pointer`, `text`, `grab` — and it picks the right one from semantic tags (`<a>`, `<input>`), hover data, or your own attributes.

## Installation

```bash
pnpm add @supermousejs/labs
```

## Usage

```typescript
import { Supermouse } from "@supermousejs/core";
import { SmartIcon } from "@supermousejs/labs";

const app = new Supermouse();
app.use(
  SmartIcon({
    icons: {
      default: "<svg>…</svg>",
      pointer: "<svg>…</svg>",
      text: "<svg>…</svg>",
      grab: "<svg>…</svg>"
    },
    size: 24,
    useSemanticTags: true,
    transitionDuration: 120
  })
);
```

Semantic tags drive the default choice; `data-supermouse-icon="grab"` on an element overrides it, as long as `icons` has a matching key.
