---
title: Magnetic
description: Pulls the cursor toward interactive elements with physics-based magnetism.
---

`Magnetic` is a **logic plugin**. When the pointer comes within range of a matching element, it nudges `state.target` toward the element's centre, and a visual plugin — [`Dot`](/docs/plugins/dot) is the usual choice — follows. Because it only rewrites intent, it composes with anything you already render.

:cursor-demo{demo="magnetic" title="Magnetic"}

## Installation

```bash
pnpm add @supermousejs/magnetic
```

## Usage

```typescript
import { Supermouse } from "@supermousejs/core";
import { Magnetic } from "@supermousejs/magnetic";
import { Dot } from "@supermousejs/dot";

const app = new Supermouse({ smoothness: 0.15 });
app.use(Magnetic({ attraction: 0.4, distance: 100 })).use(Dot({ size: 8 }));
```

Mark magnetic elements with `data-supermouse-magnetic`; a numeric value overrides `attraction` for that element:

```html
<button data-supermouse-magnetic>Default pull</button>
<button data-supermouse-magnetic="0.8">Strong pull</button>
```

The same effect can be declared without markup through [rules](/docs/guide/usage#defining-interactions).
