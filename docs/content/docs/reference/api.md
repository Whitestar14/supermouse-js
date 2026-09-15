---
title: API Reference
description: Complete options, state, methods, plugin interface, and utilities reference.
section: Reference
order: 1
---

Every public surface of the engine, specified field by field. Each page is
written against the source in `packages/core` and `packages/utils`, so the types,
defaults and failure modes are the ones you actually get.

```typescript
import { Supermouse } from "@supermousejs/core";
import { Ring } from "@supermousejs/ring";

const app = new Supermouse({ smoothness: 0.15, cursor: "custom" }).use(Ring({ size: 24 }));
```

| Page | Covers |
| :--- | :--- |
| [Options](/docs/reference/options) | Every `SupermouseOptions` field, its default and exact semantics. |
| [MouseState](/docs/reference/state) | The reactive state object, who writes each field, and when. |
| [Methods](/docs/reference/methods) | The instance surface — plugins, cursor policy, lifecycle, introspection. |
| [Plugin Interface](/docs/reference/plugin-interface) | The raw `SupermousePlugin` contract, priority rules and failure semantics. |
| [Utilities](/docs/reference/utilities) | Math, DOM, SVG, CSS constants and option helpers from `@supermousejs/utils`. |

New to Supermouse? Start with [installation](/docs/guide/installation) and the
[usage guide](/docs/guide/usage), then come back here for exact behaviour.
