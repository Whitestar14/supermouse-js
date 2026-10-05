---
title: Trail
description: A fading history of points that follows the motion of the pointer.
---

`Trail` keeps a short history of where the cursor has been and renders it as a decaying ribbon: the simplest way to add motion memory, so the cursor drags something behind it instead of teleporting.

:cursor-demo{demo="trail" title="Trail"}

## Installation

```bash
pnpm add @supermousejs/trail
```

## Usage

```typescript
import { Supermouse } from "@supermousejs/core";
import { Trail } from "@supermousejs/trail";
import { Dot } from "@supermousejs/dot";

const app = new Supermouse();
app.use(Trail({ length: 14, size: 6, color: "#6366f1" }));
app.use(Dot({ size: 8, color: "#6366f1" }));
```

`length` is how many points the ribbon remembers, so a longer trail is a longer memory rather than a larger frame cost.
