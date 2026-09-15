---
title: Methods
description: The complete Supermouse instance surface — plugins, cursor policy, lifecycle and introspection.
section: Reference
order: 4
---

```typescript
import { Supermouse } from "@supermousejs/core";

const app = new Supermouse();
```

## Plugin management

| Method | Returns | Description |
| :--- | :--- | :--- |
| `use(plugin)` | `this` | Installs a plugin, sorts by priority. Chainable. |
| `getPlugin(name)` | `SupermousePlugin \| undefined` | Looks up an installed plugin by name. |
| `enablePlugin(name)` | `void` | Re-enables a plugin, restores its element and calls `onEnable`. |
| `disablePlugin(name)` | `void` | Awaits `onBeforeDisable`, then hides the element and calls `onDisable`. |
| `togglePlugin(name)` | `void` | Flips the enabled state. |

### `use(plugin)`

```typescript
import { Ring } from "@supermousejs/ring";
import { Magnetic } from "@supermousejs/magnetic";

app.use(Ring({ size: 24 })).use(Magnetic({ attraction: 0.4 }));
```

`install()` runs synchronously inside `use()`. Throwing there rejects the plugin
and it is never registered; registering an existing `name` logs a warning and is
ignored.

### `disablePlugin(name)` / `enablePlugin(name)`

Disabling sets `isEnabled = false` so the plugin is skipped in the frame loop,
and hides its stage element. It is the cheap alternative to conditionals inside
`update()`.

```typescript
app.disablePlugin("trail"); // while a heavy panel is open
app.enablePlugin("trail");
```

If the plugin defines `onBeforeDisable` (or `beforeDisable` in a `definePlugin`
config) and it returns a promise, the element is not hidden until it resolves —
the supported way to play an exit animation.

## Cursor and hover targets

### `registerHoverTarget(selector)`

Adds a selector to hover detection **and** to the native-cursor suppression
stylesheet, without discarding the defaults.

```typescript
app.registerHoverTarget(".cmd-palette-item");
```

Comma-separated groups are split and registered individually. Registering a broad
selector such as `div` will suppress the OS pointer across your whole page.

### `setCursor(mode)`

Sets the native-pointer policy at runtime: `"auto"`, `"custom"`, `"native"` or
`"both"`. See [cursor modes](/docs/reference/options#cursor).

```typescript
app.setCursor("both");
```

## Lifecycle

### `enable()` / `disable()`

| | `enable()` | `disable()` |
| :--- | :--- | :--- |
| Input | resumes | stops |
| Physics | snaps `smooth`/`target` to the last pointer position | reset to off-screen |
| Stage | visible according to cursor mode | hidden |
| Native cursor | restored per mode | always restored |
| `isEnabled` | `true` | `false` |

Snapping physics on enable is deliberate: the cursor never animates in from
`(-100, -100)`.

```typescript
if (prefersCalm) app.disable();
else app.enable();
```

### `suspend()` / `resume()`

Lighter than disable/enable, and intended for yielding the pointer to embedded
content such as an iframe or canvas.

```typescript
canvas.addEventListener("pointerenter", () => app.suspend());
canvas.addEventListener("pointerleave", () => app.resume());
```

`suspend()` stops input, clears hover state and hides the stage. `resume()`
re-enables input, re-syncs physics, runs one plugin pass so nothing renders a
stale coordinate, and then shows the stage. Both are no-ops when already in the
target state.

### `start()` / `step(time)`

`start()` begins the `requestAnimationFrame` loop — automatic unless
[`autoStart: false`](/docs/reference/options#autostart). `step(time)` runs a
single frame at the given timestamp, which is how the test suite drives the
engine:

```typescript
const app = new Supermouse({ autoStart: false });
app.use(MyPlugin());
app.step(0);
app.step(16.67);
```

There is no `stop()`; use `disable()` to pause input, or `destroy()` to end the
instance. The loop also parks itself while the tab is hidden and resumes on
visibility change.

### `destroy()`

Permanent teardown:

1. Cancels the animation frame and the visibility listener.
2. Removes all window, document and container listeners.
3. Runs `destroy()` on every plugin (after their `cleanup`).
4. Removes the stage element and its stylesheet, and restores the container's
   original `position` and inline `cursor`.

```typescript
onUnmounted(() => {
  app.destroy();
});
```

Calling it twice is harmless, but the instance is not reusable afterwards.

## Introspection

| Member | Type | Description |
| :--- | :--- | :--- |
| `state` | `MouseState` | The live cursor state. See [MouseState](/docs/reference/state). |
| `isEnabled` | `boolean` (getter) | Whether the input layer is currently processing. |
| `container` | `HTMLElement` (getter) | The element the instance is scoped to. |
| `stage` | `HTMLDivElement` (getter) | The element plugins mount into. |
| `version` | `string` | Engine version. |
| `Supermouse.version` | `string` (static) | Same value without an instance. |
| `plugins` | `SupermousePlugin[]` | The live plugin list, in priority order. |
| `options` | `Required<SupermouseOptions>`-ish | The resolved options. |

```typescript
const el = document.createElement("div");
app.stage.appendChild(el); // manual mounting, if you are not using definePlugin
```
