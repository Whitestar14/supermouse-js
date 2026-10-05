---
title: Writing Plugins
description: Build Supermouse plugins — the plugin contract, definePlugin, priority, the interaction and shape buses, and how to keep the frame loop cheap.
section: Architecture
order: 1
---

Plugins are the only extension mechanism in Supermouse. The core is deliberately thin: it captures input, sorts plugins by priority, damps the cursor toward its target, and stays out of the way. **Every visual and every behaviour — the dot, the ring, magnetism, sticky cursors — is a plugin.**

That means writing a plugin is the normal way to make Supermouse do something new. This page takes you from an empty file to a published package.

## The contract

A plugin is a plain object with a `name`. Everything else is optional:

```typescript
import type { SupermousePlugin } from "@supermousejs/core";

export const Gravity = (intensity = 5): SupermousePlugin => ({
  name: "gravity",
  priority: -10, // logic plugins run before physics
  update(app, dtMs) {
    app.state.target.y += intensity * (dtMs / 1000); // dtMs keeps it framerate-independent
  }
});
```

Register it like any other plugin:

```typescript
app.use(Gravity(12)); // or: new Supermouse({ plugins: [Gravity(12)] })
```

Three rules matter more than the rest.

**Always export a factory, never a shared object literal.** The factory closure is where per-instance state lives. A module-level object reused by two cursors will interleave its state and misbehave.

```typescript
export const RedDot = (): SupermousePlugin => {
  let el: HTMLDivElement | null = null; // one element per instance
  return {
    name: "red-dot",
    install(app) {
      /* … */
    },
    update(app) {
      /* … */
    },
    destroy() {
      el?.remove();
    }
  };
};
```

**`name` is the runtime handle.** `getPlugin`, `enablePlugin`, `disablePlugin`, `togglePlugin` and `States()` all resolve plugins by name, so names must be unique per instance. `use()` warns and refuses a duplicate.

**Guard on `state.hasReceivedInput`.** Before the first pointer event — and whenever the pointer leaves the window with `hideOnLeave` (the default) — the engine sets `hasReceivedInput` to `false` and parks `pointer`, `target` and `smooth` off-screen at `(-100, -100)`. Read those coordinates only when input is real, or your effect will fling itself into the corner as it fades. If you want an element to shrink or drift away on exit, cache the last valid position and animate from that instead — so the exit plays out at the exact edge point where the pointer left.

## A complete visual plugin

Visual plugins are simpler than they look: create one element, style it from options, position it from state.

```typescript
import type { SupermousePlugin } from "@supermousejs/core";
import { css, setTransform } from "@supermousejs/utils";

export const Crosshair = (options: { size?: number } = {}): SupermousePlugin => {
  const size = options.size ?? 16;
  let el: HTMLDivElement | null = null;

  return {
    name: "crosshair",

    install(app) {
      el = document.createElement("div");
      el.textContent = "+";
      css(el, { fontSize: `${size}px`, lineHeight: 1, color: "#fff" });
      app.stage.appendChild(el);
      // tells the engine this element counts as hoverable
      app.addHoverSelectors("[data-supermouse-crosshair]");
    },

    update(app) {
      if (!el || !app.state.hasReceivedInput) return;
      const { x, y } = app.state.smooth;
      setTransform(el, x, y);
    },

    destroy() {
      el?.remove();
    }
  };
};
```

The element is appended to `app.stage`, not to the body — that is what keeps cursor art above page content and lets the engine show and hide it as scopes change. Assign it to `plugin.element` (as `definePlugin` does for you) if you want the engine to hide it automatically when the plugin is disabled.

Write styles through `css()` from `@supermousejs/utils`. It caches the last value per property and skips the DOM write when nothing changed, which is why a plugin can set the same width every frame for free:

```typescript
css(el, {
  width: `${size}px`,
  height: `${size}px`,
  opacity: app.state.isHover ? 1 : 0.5
});
setTransform(el, app.state.smooth.x, app.state.smooth.y);
```

:::callout{title="Two habits for a cheap update()" variant="note"}
`update()` runs 60–240 times a second on the main thread, so **never assign `el.style.*` directly** (that is what `css()` is for), and **never read layout** — no `getBoundingClientRect`, `offsetWidth`, or `getComputedStyle`. Measure once on hover and cache it, the way `Stick` does. Reuse elements and vectors rather than allocating each frame; `Trail` builds its pool once and afterwards only moves numbers through a history buffer.
:::

## `definePlugin()`

`definePlugin(config, userOptions?)` from `@supermousejs/utils` removes the boilerplate: it creates the element, mounts it on the stage, assigns `plugin.element`, wires enable/disable visibility, and runs teardown. If the config has a `create` function it is treated as **visual**; otherwise it is a **logic** plugin and is returned almost unchanged.

```typescript
import { definePlugin, css, setTransform } from "@supermousejs/utils";

export const MyDot = definePlugin<HTMLDivElement>({
  name: "my-dot",
  hoverSelector: "[data-my-dot]", // auto-registers a hover selector on install

  create: () => {
    const el = document.createElement("div");
    css(el, { width: "8px", height: "8px", borderRadius: "50%", background: "red" });
    return el;
  },

  update: (app, el) => {
    if (!app.state.hasReceivedInput) return;
    const { x, y } = app.state.smooth;
    setTransform(el, x, y);
  }
});
```

### Visual config

| Field           | Signature                                 | Notes                                                                    |
| :-------------- | :---------------------------------------- | :----------------------------------------------------------------------- |
| `create`        | `(app) => E`                              | **Required.** Called once during `install()`. Return the root element.   |
| `update`        | `(app, element, dtMs) => void`            | Every frame while enabled. `dtMs` is milliseconds.                       |
| `onEnable`      | `(app, element) => void`                  | Element is already visible.                                              |
| `onDisable`     | `(app, element) => void`                  | Element is still in the DOM — start exit transitions here.               |
| `cleanup`       | `(app, element) => void`                  | Runs before the element is removed. Detach listeners and kill timelines. |
| `destroy`       | `(app) => void`                           | General teardown, after `cleanup` and removal.                           |
| `hoverSelector` | `string`                                  | Adds a selector to the owning scope's hover set on install.              |
| `beforeDisable` | `(app, element) => void \| Promise<void>` | Return a promise to delay hiding until an exit animation finishes.       |
| `priority`      | `number`                                  | Default `0`.                                                             |
| `name`          | `string`                                  | **Required.**                                                            |

### Logic config

| Field                    | Signature                        | Notes                                              |
| :----------------------- | :------------------------------- | :------------------------------------------------- |
| `update`                 | `(app, dtMs) => void`            | Required in practice — modify `state.target` here. |
| `install`                | `(app) => void`                  | Register hover selectors or external listeners.    |
| `onEnable` / `onDisable` | `(app) => void`                  | Toggle hooks.                                      |
| `destroy`                | `(app) => void`                  | Teardown.                                          |
| `beforeDisable`          | `(app) => void \| Promise<void>` | Async exit hook.                                   |
| `priority`               | `number`                         | Default `0`.                                       |
| `name`                   | `string`                         | **Required.**                                      |

### `userOptions`

The second argument is the override channel. Every official plugin forwards it, so callers can rename or pre-disable an instance without editing your plugin:

```typescript
app.use(SmartRing({ name: "playground-card-bg", isEnabled: false }));
```

## Priority: who runs first

`use()` sorts the plugin list by `priority` ascending after every registration, and the frame loop runs them in that order. Lower runs earlier. Ties fall back to registration order, so installation order only matters between equal priorities.

| Range              | Use for                                                                           |
| :----------------- | :-------------------------------------------------------------------------------- |
| `priority < 0`     | **Logic** — rewrite `state.target`. `Magnetic` and `Stick` use `-10`.             |
| `priority: 0`      | **Visual** — read `state.smooth` / `state.target` and render. The default.        |
| `priority <= -900` | **Controllers** — `States` uses `-999` so it can toggle the plugins about to run. |

:::callout{title="Execution order and state consistency" variant="warning"}
A logic plugin left at the default priority (`0`) interleaves with visual plugins: any visual plugin that runs after it sees the updated `target`, while one that runs before it sees last frame's value. If your plugin writes to `state.target`, give it a **negative priority**.
:::

## Reacting to hover: the interaction bus

If you need to know about the element under the pointer, do **not** read its attributes inside `update()`. Doing that every frame forces synchronous layout and is the most common cause of jank in cursor plugins. Instead, the input layer rebuilds `state.interaction` from `rules` and data attributes the moment the hover target changes — the DOM cost is already paid for you:

```typescript
update(app, el) {
  const sticky = app.state.interaction.stick === true;
  const color = app.state.interaction.color; // from data-supermouse-color
  if (color) css(el, { backgroundColor: color });
}
```

Values are re-resolved every frame, so they are safe for animation, not just enter/exit transitions. Declare your keys for TypeScript with module augmentation:

```typescript
declare module "@supermousejs/core" {
  interface InteractionState {
    magnetic?: boolean | number;
    stick?: boolean | string;
    color?: string;
  }
}
```

`rules` lets you describe the same data from CSS selectors instead of markup. HTML `data-{prefix}-*` attributes override rule values per property:

```typescript
const app = new Supermouse({
  rules: {
    ".primary-action": { magnetic: true, color: "red" }
  }
});
```

## Sharing geometry: the shape bus

Measuring a hovered element is expensive, so do it once and share it. Logic plugins that know the geometry of a target publish it to `state.shape`; visual plugins morph to it. This is how `Stick` and `SmartRing` stay decoupled — you can swap the visual without touching the sticky logic.

```typescript
// logic side — measured on hover, not in the loop
app.state.shape = {
  width: rect.width + padding,
  height: rect.height + padding,
  borderRadius: radius
};

// visual side
const shape = app.state.shape;
if (shape) {
  // morph to shape, then reset to null when the hover ends
}
```

Plugins that occupy the same space as a morphed shape can opt out with `hideOnShape: true` — `Dot` defaults to this.

## Reactive options

Most options accept `ValueOrGetter<T>` — a static value, or a function of `MouseState`. Normalise once, then call the getter in the loop; this removes `typeof` branching from the hot path entirely.

```typescript
Dot({
  size: 8,
  color: (state) => (state.isHover ? "#10b981" : "#000000"),
  opacity: (state) => (state.isDown ? 0.6 : 1)
});
```

```typescript
import { normalize, normalizeAll } from "@supermousejs/utils";

const getSize = normalize(options.size, 8);

const cfg = normalizeAll(options, { size: 20, color: "#ffffff", borderWidth: 2 });
// later, in update(): cfg.size(app.state)
```

## Lifecycle, exit animations, and failures

- `install(app)` runs once, synchronously, inside `app.use()`.
- `update(app, dtMs)` runs every frame while the plugin is enabled.
- `onEnable` / `onDisable` fire as plugins are toggled or as scopes change.
- `destroy(app)` runs when the plugin is removed or the app is destroyed.

`onBeforeDisable` (or `beforeDisable` in a `definePlugin` config) may return a promise. The core awaits it before hiding the element — that is how `SmartRing` plays a 150 ms fade-and-shrink exit with no `setTimeout` hacks:

```typescript
beforeDisable(app, el) {
  el.style.transition = "opacity 150ms ease, transform 150ms ease";
  el.style.opacity = "0";
  return new Promise((resolve) => setTimeout(resolve, 150));
}
```

Failures are contained:

- Throwing in `install()` rejects the plugin; it is never registered.
- Throwing in `update()` disables that plugin, logs the error, and later runs its `onDisable` and `destroy` hooks and removes its element. Other plugins keep running.

## Testing

Drive the loop yourself instead of waiting on real frames:

```typescript
import { Supermouse } from "@supermousejs/core";

const app = new Supermouse({ autoStart: false });
app.use(MyPlugin());

app.step(0);
app.step(16.67);
app.step(33.34);

expect(app.state.smooth.x).toBeGreaterThan(0);
```

Because `autoStart: false` stops the `requestAnimationFrame` loop, `step(time)` gives you deterministic delta time.

When something is off in the browser, run `doctor(app)` from `@supermousejs/utils` — it flags logic plugins left at a non-negative priority, mis-ordered `States()`, and competing instances.

## Publishing

Publish under your own namespace (`supermouse-plugin-x`, `@your-scope/supermouse-x`) — you don't need to contribute here to extend Supermouse. The `@supermousejs/*` scope is reserved for the official packages.

## Related

- [Plugin Interface](/docs/reference/api#supermouseplugin) — the field-by-field contract.
- [Core Concepts](/docs/architecture/pipeline) — execution pipeline and frame timing.
- [Utilities](/docs/reference/utilities) — `css`, `setTransform`, `normalize`, `doctor`, and friends.
