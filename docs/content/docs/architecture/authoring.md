---
title: Plugin Authoring
description: Build Supermouse plugins — the plugin contract, definePlugin, priority, and hot-path rules.
section: Architecture
order: 4
---

Plugins are the only extension mechanism. The core runtime is deliberately thin:
it aggregates input, sorts plugins by priority, damps the cursor toward its
destination, and gets out of the way. Everything visual or behavioural is a
plugin.

## The contract

A plugin is a plain object with a `name`:

```typescript
import type { SupermousePlugin } from "@supermousejs/core";

export const Gravity = (intensity = 5): SupermousePlugin => ({
  name: "gravity",
  priority: -10, // logic plugins run before physics
  update(app, dtMs) {
    app.state.target.y += intensity;
  }
});
```

Two rules matter more than the rest:

**Always export a factory, never a shared object literal.** The factory closure is
where per-instance state lives. A module-level object shared by two cursors will
interleave its state and misbehave.

**`name` is the runtime handle.** `getPlugin`, `enablePlugin`, `disablePlugin`,
`togglePlugin` and `States()` all resolve plugins by name. Names must be unique
per instance — `use()` warns and refuses a duplicate.

## Writing a visual plugin

Visual plugins are simpler than they look: create one element, style it from
options, position it from state. `definePlugin()` handles the mounting,
enabling, disabling and teardown for you.

```typescript
import { definePlugin, dom } from "@supermousejs/utils";
import type { SupermousePlugin } from "@supermousejs/core";

export const Crosshair = (options: { size?: number } = {}): SupermousePlugin => {
  const size = options.size ?? 16;

  return definePlugin<HTMLDivElement>(
    {
      name: "crosshair",
      // auto-registers as a hover target AND suppresses the native cursor over it
      selector: "[data-supermouse-crosshair]",

      create: () => {
        const el = document.createElement("div");
        el.textContent = "+";
        dom.css(el, { font: `${size}px/1 monospace` });
        return el;
      },

      update: (app, el) => {
        dom.setTransform(el, app.state.smooth.x, app.state.smooth.y);
      },

      cleanup: (app, el) => {
        // tear down anything create() attached outside the element
      }
    },
    options // lets callers override `name` and `isEnabled`
  );
};
```

The element returned by `create()` is appended to [`app.stage`](/docs/architecture/sandbox),
not to the body, and it is exposed to the runtime as `plugin.element` — which is
what lets the engine hide and restore it when the plugin is toggled.

## `definePlugin` reference

`definePlugin(config, userOptions?)` accepts one of two config shapes. If the
config has a `create` function it is treated as visual; otherwise it is a logic
plugin and is passed through unchanged.

### Visual config

| Field | Signature | Notes |
| :--- | :--- | :--- |
| `create` | `(app) => E` | **Required.** Called once during `install()`. Return the root element. |
| `update` | `(app, element, dtMs) => void` | Every frame while enabled. `dtMs` is milliseconds. |
| `onEnable` | `(app, element) => void` | Element is already visible. |
| `onDisable` | `(app, element) => void` | Element is still in the DOM — start exit transitions here. |
| `cleanup` | `(app, element) => void` | Runs before the element is removed. Detach listeners, kill timelines. |
| `destroy` | `(app) => void` | General teardown, after `cleanup` and removal. |
| `selector` | `string` | Auto-registers a hover target on install. |
| `beforeDisable` | `(app, element) => void \| Promise<void>` | Delays hiding until the returned promise resolves. |
| `priority` | `number` | Default `0`. |
| `name` | `string` | **Required.** |

### Logic config

| Field | Signature | Notes |
| :--- | :--- | :--- |
| `update` | `(app, dtMs) => void` | Required in practice — modify `state.target`. |
| `install` | `(app) => void` | Register hover targets here. |
| `onEnable` / `onDisable` | `(app) => void` | Toggle hooks. |
| `destroy` | `(app) => void` | Teardown. |
| `beforeDisable` | `(app) => void \| Promise<void>` | Async exit hook. |
| `priority` | `number` | Default `0`. |

### `userOptions`

The second argument is the override channel, and it is how every official plugin
lets callers rename or pre-disable an instance:

```typescript
app.use(SmartRing({ name: "playground-card-bg", isEnabled: false }));
```

## Priority

`use()` sorts the plugin list by `priority` ascending after every registration,
and the frame loop runs them in that order. Lower runs earlier.

| Range | Use for |
| :--- | :--- |
| `priority < 0` | **Logic** — rewrite `state.target`. `Magnetic` and `Stick` use `-10`. |
| `priority: 0` | **Visual** — read `state.smooth` / `state.target` and render. This is the default. |
| `priority <= -900` | **Controllers** — `States` uses `-999` so it can toggle the plugins about to run. |

:::callout{title="The tearing bug" variant="warning"}
A logic plugin left at the default `0` interleaves with visual plugins: whichever
visuals happen to sort after it see the new target while the ones before it see
the old one. The dot snaps while the ring trails, and the cursor looks like it
has come apart. Any plugin that writes `state.target` must use a negative
priority.
:::

## Reactive options

Options may be static values or a getter, typed as `ValueOrGetter<T>`:

```typescript
Dot({
  size: 8,
  color: (state) => (state.isHover ? "#10b981" : "#000000"),
  opacity: (state) => (state.isDown ? 0.6 : 1)
});
```

Normalise once at construction, then call the getter in the loop — this removes
`typeof` branching from the hot path entirely:

```typescript
import { normalize, normalizeAll } from "@supermousejs/utils";

const getSize = normalize(options.size, 8);

const cfg = normalizeAll(options, { size: 20, color: "#ffffff", borderWidth: 2 });
// later, in update(): cfg.size(app.state)
```

## The interaction bus

`state.interaction` is a flat object the input layer rebuilds from `rules` and
`data-*` attributes. It is the **only** supported way to get hover metadata — the
engine has already paid the DOM cost for you.

```typescript
install(app) {
  app.registerHoverTarget("[data-supermouse-stick]"); // ensures hover detection
},

update(app) {
  const sticky = app.state.interaction.stick === true;
  const color = app.state.interaction.color; // from data-supermouse-color
  if (color) dom.css(el, { backgroundColor: color });
}
```

Values are re-resolved every frame, so they are safe to use for animation, not
just enter/exit transitions. Declare your keys for TypeScript with module
augmentation:

```typescript
declare module "@supermousejs/core" {
  interface InteractionState {
    magnetic?: boolean | number;
    stick?: boolean | string;
    color?: string;
  }
}
```

## The shape bus

Logic plugins that know the geometry of a target publish it to `state.shape`;
visual plugins morph to it. This is how `Stick` and `SmartRing` stay decoupled —
you can swap the visual without touching the sticky logic.

```typescript
// logic side
app.state.shape = { width: rect.width + padding, height: rect.height + padding, borderRadius: radius };

// visual side
const shape = app.state.shape;
if (shape) {
  // morph, then reset to null when the hover ends
}
```

Plugins that occupy the same space as a morphed shape can opt out with
`hideOnShape: true` — `Dot` defaults to this.

## Hot-path rules

`update()` runs 60–240 times a second on the main thread. Three rules:

**1. Never read layout.** No `getBoundingClientRect`, no `offsetWidth`, no
`getComputedStyle`. Read cached geometry on hover instead. `Stick` does its
`getBoundingClientRect` and `getComputedStyle` work once per element, guarded by
the cached `lastTarget`.

**2. Be frame-rate independent.** Use `dtMs / 1000` with `damp`/`lerp`, never a
fixed increment.

**3. Do not allocate.** Reuse elements and vectors. `Trail` allocates its pool
once in `create()` and then only moves numbers through a history buffer.

`dom.css()` already helps here — it caches the last written value per property
and skips the DOM write when nothing changed, which is why plugins can set the
same width and height every frame cheaply.

## Tracking multiple targets

Three workable strategies, in increasing order of setup cost:

- **Per-frame query** — `querySelectorAll` each frame into a `Map`. Fine for a
  handful of elements; expensive if the selector is broad.
- **Pre-created pool** — allocate N elements in `create()` and decide which to
  show during `update`. This is what `Sparkles` and `Trail` do; nothing is
  created inside the loop.
- **Static registration** — collect every target once in `install()` and reuse
  the references. Best when the DOM structure is stable.

Separate *what you track* from *how you draw it*. `Sparkles` does not know about
containers at all; it emits particles along the pointer path. A spotlight needs to
know which container the pointer is inside so it can clamp the highlight. Pick the
model that matches the data.

## When the pointer leaves

On `mouseleave` with `hideOnLeave` (the default), the engine sets
`state.hasReceivedInput = false` and parks `state.pointer` at `(-100, -100)`. A
plugin that renders those coordinates blindly will fling its element into the
corner as it fades.

Three ways out:

- **Last known position** — cache the last valid local coordinates and keep
  rendering them while the element fades or shrinks.
- **Stop sourcing** — for trailing effects, stop spawning on
  `hasReceivedInput === false` and let existing particles finish their own
  lifecycle. `Sparkles` does this.
- **Hide instantly** — set `opacity: 0` and restore on the first move back.

The last-known-position approach is usually right for effects that shrink on
exit, because the shrink plays out at the exact edge point where the pointer left.

## Failures and teardown

- Throwing in `install()` rejects the plugin; it is never registered.
- Throwing in `update()` disables the plugin, logs the error, and later runs its
  `onDisable` and `destroy` hooks and removes its element. Other plugins keep
  running.
- `onBeforeDisable` (or `beforeDisable` in a config) may return a promise. The
  core awaits it before hiding the element — that is how `SmartRing` plays a
  150ms fade-and-shrink exit.

```typescript
beforeDisable(app, el) {
  el.style.transition = "opacity 150ms ease, transform 150ms ease";
  el.style.opacity = "0";
  return new Promise((resolve) => setTimeout(resolve, 150));
}
```

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

Because `autoStart: false` stops the `requestAnimationFrame` loop, `step(time)`
gives you deterministic control over delta time in tests.

Run `doctor(app)` in the browser when something is off — it flags logic plugins
with a non-negative priority, mis-ordered `States()` and competing instances.

## Publishing

You are free to publish under your own namespace (`supermouse-plugin-x`,
`@your-scope/supermouse-x`). The `@supermousejs/*` scope is reserved for the
official packages.

## Related

- [Plugin Interface](/docs/reference/plugin-interface) — the field-by-field contract.
- [The Pipeline](/docs/architecture/pipeline) — exactly when your hooks run.
- [Contributing](/docs/architecture/contributing) — landing a plugin in this repo.
