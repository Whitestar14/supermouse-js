---
title: Stick
description: Measures the hovered element once and publishes its box as state.shape.
---

`Stick` is the second **logic plugin**. When the pointer lands on an element marked `data-supermouse-stick`, it measures that element, publishes its box as `state.shape`, and moves `state.target` to the element's centre. Any plugin that knows how to morph to a shape — `SmartRing` is the reference — draws to it.

:cursor-demo{demo="stick" title="Stick"}

## Installation

```bash
pnpm add @supermousejs/stick
```

## Usage

```typescript
import { Supermouse } from "@supermousejs/core";
import { Stick } from "@supermousejs/stick";
import { SmartRing } from "@supermousejs/labs";

const app = new Supermouse();
app.use(Stick({ padding: 10 }));
app.use(SmartRing({ size: 20, hoverSize: 44, fill: "transparent", borderWidth: 2 }));
```

```html
<a href="/pricing" data-supermouse-stick>Pricing</a>
```

Only elements carrying `data-supermouse-stick` are measured; the reference consumer of the published shape is [`SmartRing`](/docs/plugins/smart-ring).
