---
title: API Reference
description: Options, state, methods, plugin interface and utilities, specified field by field.
section: Reference
order: 1
---

Every public surface, written against the source in `packages/core` and `packages/utils`.

```typescript
import { Supermouse } from "@supermousejs/core";
import { Ring } from "@supermousejs/ring";

const app = new Supermouse({ smoothness: 0.15, cursor: "custom" });
app.use(Ring({ size: 24 }));
```

| Page | Covers |
| :--- | :--- |
| [Options](/docs/reference/options) | Every `SupermouseOptions` field, its default and what it changes. |
| [MouseState](/docs/reference/state) | The state object, who writes each field, and when. |
| [Methods](/docs/reference/methods) | Plugins, scopes, cursor modes, lifecycle, introspection. |
| [Plugin Interface](/docs/reference/plugin-interface) | The raw `SupermousePlugin` contract, priorities and failure semantics. |
| [Utilities](/docs/reference/utilities) | Math, DOM, SVG, CSS constants and authoring helpers from `@supermousejs/utils`. |

New here? [Installation](/docs/guide/installation) and [Basic Usage](/docs/guide/usage) first, then come back for exact behaviour.
