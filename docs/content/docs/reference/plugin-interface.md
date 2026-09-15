---
title: Plugin Interface
description: The raw SupermousePlugin object contract, its hooks and its failure semantics.
section: Reference
order: 5
---

`SupermousePlugin` is the object the engine actually stores. Most plugins are
written with [`definePlugin()`](/docs/reference/utilities#defineplugin), which
produces one of these — but the raw contract is what the runtime sees, and it is
the right shape for logic plugins and multi-element visuals.

```typescript
import type { SupermousePlugin } from "@supermousejs/core";

export interface SupermousePlugin {
  name: string;
  priority?: number;
  isEnabled?: boolean;
  element?: HTMLElement | SVGElement;

  install?: (instance: SupermouseInstance) => void;
  update?: (instance: SupermouseInstance, deltaTime: number) => void;
  destroy?: (instance: SupermouseInstance) => void;

  onEnable?: (instance: SupermouseInstance) => void;
  onDisable?: (instance: SupermouseInstance) => void;
  onBeforeDisable?: (instance: SupermouseInstance) => void | Promise<void>;
}
```

> **Always return a fresh object from a factory.** A module-level literal shared
> across instances will interleave its closures:
>
> ```typescript
> export const Gravity = (intensity = 5): SupermousePlugin => ({ /* … */ });
> ```

## Fields

| Field | Type | Description |
| :--- | :--- | :--- |
| `name` | `string` **required** | Unique handle. `getPlugin`, `enablePlugin`, `disablePlugin`, `togglePlugin` and `States()` all resolve by it. |
| `priority` | `number` | Frame-order sort key. Lower runs earlier. Default `0`. |
| `isEnabled` | `boolean` | When `false`, `update()` is skipped. Set to `true` automatically on `use()` if undefined. |
| `element` | `HTMLElement \| SVGElement` | Optional visual root. Hidden with `display: none` when disabled and restored on enable. |

## Hooks

| Hook | Signature | When it runs |
| :--- | :--- | :--- |
| `install` | `(app) => void` | Once, synchronously, inside `app.use()`. |
| `update` | `(app, deltaTime) => void` | Every frame while enabled. `deltaTime` is **milliseconds**. |
| `onEnable` | `(app) => void` | After `enablePlugin()` re-enables the plugin. |
| `onDisable` | `(app) => void` | After `disablePlugin()` disables it. |
| `onBeforeDisable` | `(app) => void \| Promise<void>` | Before disabling; a returned promise delays hiding. |
| `destroy` | `(app) => void` | On `app.destroy()`, or when the plugin is removed after crashing. |

`onBeforeDisable` is the raw hook name. The `definePlugin` config calls it
`beforeDisable` and passes the element as a second argument — see
[authoring](/docs/architecture/authoring#failures-and-teardown).

Note that `onEnable`/`onDisable` are *not* called for the initial state: a plugin
installed with `isEnabled: false` is hidden during `install()` and only fires
`onEnable` if it is later enabled.

## Priority

| Range | Meaning | Examples |
| :--- | :--- | :--- |
| `< 0` | Logic — rewrites `state.target` before physics runs | `Magnetic` and `Stick` at `-10` |
| `0` | Visual — renders at the damped position | `Dot`, `Ring`, `Trail`, `Text` |
| `<= -900` | Controller — toggles other plugins before they run | `States` at `-999` |

Logic plugins **must** be negative. At `0` they interleave with visuals, and
some plugins render the new target while others render the old one — visible as
the dot detaching from the ring. `doctor()` reports this.

## Frame-order guarantees

- `update()` is only called when `plugin.isEnabled !== false`.
- `install()` runs before any `update()` for that plugin.
- `update()` receives milliseconds; divide by 1000 for `damp`/`lerp`.
- Plugins run in ascending `priority`; ties keep registration order, since the
  sort is stable and re-applied after each `use()`.
- Plugins still run while input is disabled — only the physics step is skipped.

## Failure semantics

| Failure | Result |
| :--- | :--- |
| `install()` throws | The plugin is rejected, never added, and the error is logged. |
| `update()` throws | The plugin is marked disabled, the error is logged, and after the plugin pass it is removed with `onDisable()` + `destroy()` and its element discarded. |
| `onBeforeDisable` rejects | The rejection is logged and the element is hidden anyway, so the cursor never gets stuck on screen. |

A crashing plugin degrades its own behaviour and nothing else.
