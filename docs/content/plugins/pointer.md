---
title: Pointer
description: A "vehicle"-style arrow that rotates to face the direction of travel.
---

`Pointer` draws an arrow and turns it toward wherever the pointer is heading, easing back to a resting angle when you stop. It reads `state.velocity`, so the arrow only swings while you're genuinely moving — a nice alternative to a symmetrical [`Dot`](/docs/plugins/dot) when you want a sense of direction.

:cursor-demo{demo="pointer" title="Pointer"}

## Installation

```bash
pnpm add @supermousejs/pointer
```

## Usage

```typescript
import { Supermouse } from "@supermousejs/core";
import { Pointer } from "@supermousejs/pointer";

const app = new Supermouse();
app.use(
  Pointer({
    size: 32,
    rotationSmoothing: 0.2,
    restingAngle: -45,
    returnToRest: true,
    restDelay: 250
  })
);
```

`svg` replaces the built-in arrow glyph, and motion is disabled under `prefers-reduced-motion`.
