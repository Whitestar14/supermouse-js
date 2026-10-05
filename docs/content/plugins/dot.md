---
title: Dot
description: A minimalist precision point that follows your movements perfectly.
---

`Dot` renders a single element at `state.target` — the pointer's position before smoothing. It doesn't wait on physics, so it feels instant: the eye locks onto the dot while a [`Ring`](/docs/plugins/ring) trails behind it.

:cursor-demo{demo="dot" title="Dot"}

## Installation

```bash
pnpm add @supermousejs/dot
```

## Usage

```typescript
import { Supermouse } from "@supermousejs/core";
import { Dot } from "@supermousejs/dot";

const app = new Supermouse({ smoothness: 0.15 });
app.use(Dot({ size: 8, color: "#750c7e" }));
```
