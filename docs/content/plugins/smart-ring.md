---
title: SmartRing
description: A reactive ring that skews with velocity and morphs onto stuck elements.
---

`SmartRing` is the batteries-included ring from `@supermousejs/labs`. It does everything [`Ring`](/docs/plugins/ring) does, plus two things that make a cursor feel alive: it **stretches in the direction of travel** while you're moving fast, and it **morphs to `state.shape`** when [`Stick`](/docs/plugins/stick) publishes one.

:cursor-demo{demo="smart-ring" title="SmartRing"}

## Installation

```bash
pnpm add @supermousejs/labs
```

## Usage

```typescript
import { Supermouse } from "@supermousejs/core";
import { SmartRing } from "@supermousejs/labs";

const app = new Supermouse({ smoothness: 0.15 });
app.use(
  SmartRing({
    size: 24,
    hoverSize: 44,
    fill: "transparent",
    borderWidth: 2,
    color: "#f59e0b",
    enableSkew: true
  })
);
```

Pair it with [`Stick`](/docs/plugins/stick), which measures the hovered element and publishes `state.shape` for the ring to morph to.
