---
title: Ring
description: A lagging outer ring that trails the pointer with exponential damping.
---

`Ring` is the other half of the classic cursor: where [`Dot`](/docs/plugins/dot) snaps to `state.target`, `Ring` eases toward it at `state.smooth`. That lag is what gives the cursor weight.

:cursor-demo{demo="ring" title="Ring"}

## Installation

```bash
pnpm add @supermousejs/ring
```

## Usage

```typescript
import { Supermouse } from "@supermousejs/core";
import { Ring } from "@supermousejs/ring";

const app = new Supermouse({ smoothness: 0.15 });
app.use(Ring({ size: 32, borderWidth: 2, color: "#ffffff" }));
```

`Ring` renders at `state.smooth`, so its trailing distance comes from the instance's `smoothness`; pair it with [`Dot`](/docs/plugins/dot) for the classic cursor.
