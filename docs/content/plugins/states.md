---
title: States
description: A logic controller that enables and disables other plugins based on what the pointer is hovering.
---

`States` is the only plugin that ships no visuals. It watches the hovered element for a state attribute and, from that, tells the rest of the cursor which plugins should be **on** — so you can light up a different combination of cursor art without touching an option at runtime.

## Installation

```bash
pnpm add @supermousejs/states
```

## Usage

```typescript
import { Supermouse } from "@supermousejs/core";
import { States } from "@supermousejs/states";
import { Dot } from "@supermousejs/dot";
import { Ring } from "@supermousejs/ring";

const app = new Supermouse();

// The plugins listed here must be registered by these exact names.
app.use(Dot());
app.use(Ring());

app.use(
  States({
    default: ["dot"],
    states: {
      hover: ["dot", "ring"]
    }
  })
);
```

```html
<a href="/pricing" data-supermouse-state="hover">Pricing</a>
```

The names in `default` and `states` match each plugin's registered `plugin.name`, so they must be unique. Managed plugins resolve lazily, so `States` can be registered before the plugins it controls.
