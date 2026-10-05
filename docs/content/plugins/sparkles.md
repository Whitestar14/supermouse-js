---
title: Sparkles
description: Emits particles along the pointer's path, throttled by distance travelled.
---

`Sparkles` drops particles behind the cursor as it moves. Unlike a trail, the particles are independent — each has its own lifetime and drift — so the effect reads as a sprinkle rather than a ribbon.

:cursor-demo{demo="sparkles" title="Sparkles"}

## Installation

```bash
pnpm add @supermousejs/labs
```

## Usage

```typescript
import { Supermouse } from "@supermousejs/core";
import { Sparkles } from "@supermousejs/labs";

const app = new Supermouse();
app.use(Sparkles({ color: "#f59e0b", frequency: 10 }));
```

`frequency` counts pixels of travel between spawns and `count` caps the particle pool, so a fast flick doesn't flood the screen.
