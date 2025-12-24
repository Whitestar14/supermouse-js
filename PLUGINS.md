
# supermouse plugins

plugins are the primary extension mechanism in supermouse.
the core exists to coordinate them, not to replace them.

>if a feature can be a plugin, it probably should be.

this document describes:
- how the plugin system works
- how to write plugins
- how plugins are expected to live in the ecosystem
- what patterns are encouraged (and which are not)

## what is a plugin?

a plugin is any module that participates in the cursor pipeline.

plugins can:
- modify cursor intent (logic)
- render cursor visuals (visuals)
- augment interaction semantics
- react to hover state, velocity, angle, etc.

plugins are isolated, ordered, and fault-tolerant.
if a plugin crashes, it is disabled automatically.

## plugin ownership & publishing (`!important`)

**plugins are expected to be published independently.**

you do not need to:
- submit a pull request
- use the `@supermousejs/*` namespace
- ask for permission

> you should name your plugins with descriptive names examples being `supermouse-plugin-xyz` or `@your-scope/supermouse-xyz`

the `@supermousejs/*` org is reserved for core runtime, utilities, reference implementations and canonical effects

some community plugins may be promoted later, but this is optional and rare.

## runtime model (the pipeline)

supermouse runs a deterministic pipeline every frame (~16ms). understanding this order is critical for preventing visual jitter.

1. **Input System**: Captures events, normalizes coordinates, scrapes attributes. Updates `state.pointer`.
2. **Logic Plugins** (`priority < 0`): Read `pointer`, modify `state.target`.
3. **Core Physics**: Interpolates `state.smooth` towards `state.target` using frame-independent damping.
4. **Visual Plugins** (`priority >= 0`): Read `state.smooth`, render to DOM.

### priority & the "tearing" bug
logic plugins (like `Magnetic` or `Stick`) **must** have negative priority (e.g. `-10`).

if a logic plugin has default priority (`0`), it runs mixed in with visual plugins. this causes "tearing":
- visuals registered *before* it will render the **old** position (frame N-1).
- visuals registered *after* it will render the **new** position (frame N).

this results in the cursor dot snapping correctly, while the ring trails behind for a single frame.

> **rule:** always set `priority: -10` for logic that affects position.

## logic vs visual plugins

logic plugins modify where the cursor goes and write to `app.state.target`. they generally should not touch the DOM.

```ts
const Gravity = {
  name: 'gravity',
  priority: -10, // Must run BEFORE physics
  update(app) {
    app.state.target.y += 5;
  }
};
```

visual plugins render at the cursor position (`app.state.pointer`) or read `app.state.smooth`. they own DOM or canvas elements and are usually non-negative priority.

```ts
const Dot = {
  name: 'dot',
  priority: 0, // Runs AFTER physics
  update(app) {
    const { x, y } = app.state.smooth; // Read interpolated value
    dom.setTransform(el, x, y);
  }
};
```

## native cursor state

supermouse automatically handles detecting when to show the native OS cursor (e.g., over `<input>` fields or text) based on the `ignoreOnNative` configuration.

this state is exposed to plugins via `app.state.isNative`.

### why allow native fallback?
custom cursors often break usability on native controls (inputs, text selection, drag handles). `ignoreOnNative` allows the app to briefly yield control back to the OS cursor for these interactions, ensuring accessibility isn't compromised for style.

## inter-plugin communication

plugins often need to coordinate. supermouse provides specific state channels for this.

### `state.shape` (morphing)

logic plugins like **Stick** calculate geometry but don't render. visual plugins like **Ring** render but don't calculate geometry. `state.shape` bridges them.

1. **Stick** (Logic) measures the hovered element and writes `{ width, height, borderRadius }` to `state.shape`.
2. **Ring** (Visual) checks `state.shape`. If present, it morphs to those dimensions. If null, it stays a circle.

this decoupling allows you to swap the visual plugin (e.g. use a `Square` cursor instead of `Ring`) without rewriting the sticky logic.

### `state.interaction` (metadata)

populated by the core input system. plugins read this to react to specific element attributes (like `data-supermouse-color`).

## plugin lifecycle

every plugin runs in the direct `install` -> `update` -> `onEnable` + `onDisable` + `destroy` pipline.
| hook        | when it runs                            |
| ----------- | --------------------------------------- |
| `install`   | once, when `app.use()` is called        |
| `update`    | every frame (~60fps)                    |
| `onEnable`  | when enabled via `app.enablePlugin()`   |
| `onDisable` | when disabled via `app.disablePlugin()` |
| `destroy`   | when the app is destroyed               |

> it is recommended that visual plugins fade out, not remove dom, on disable.

## writing plugins

Supermouse plugins are simple. You do not need complex classes to build one. plugins can be written in two ways:
- **plain objects** (no helpers, full control)
- **`definePlugin` helper** (recommended for published plugins)

both result in the same runtime behavior.

> plugins may be defined as objects or factories but factories are recommended to avoid cross-instance state leakage.
### minimal plugin (plain object)

good for experiments, learning, or custom local effects.

```ts
import type { SupermousePlugin } from '@supermousejs/core';

export const RedDot = (): SupermousePlugin => {
  let el: HTMLDivElement | null = null;

  return {
    name: 'red-dot',

    install(app) {
      el = document.createElement('div');
      el.style.width = '8px';
      el.style.height = '8px';
      el.style.borderRadius = '50%';
      el.style.background = 'red';
      el.style.position = 'fixed';
      el.style.pointerEvents = 'none';

      app.container.appendChild(el);
    },

    update(app) {
      if (!el) return;
      const { x, y } = app.state.smooth;
      el.style.transform = `translate(${x}px, ${y}px)`;
    },

    destroy() {
      el?.remove();
    }
  };
};
```

### packaged plugin (definePlugin helper)
recommended for reusable or published plugins.

```ts
import { definePlugin, dom } from '@supermousejs/utils';

export const RedDot = () =>
    definePlugin({
     name: 'red-dot',

    create: () => {
        const el = dom.createCircle(8, 'red');
        return el;
    },

    update: (app, el) => {
        const { x, y } = app.state.smooth;
        dom.setTransform(el, x, y);
    }
    });
```

### which should I use?

| use case                      | approach     |
| ----------------------------- | ------------ |
| quick experiment              | plain object |
| learning the lifecycle        | plain object |
| npm package                   | definePlugin |
| configurable visual plugin    | definePlugin |
| multi-root or custom mounting | plain object |
| logic-only plugin             | plain object |

## performance contract (non-negotiable)
supermousejs is optimized for performance. plugins running at 60-240fps on the main thread must be disciplined.

### 1. the dom firewall (`state.interaction`)
**why?** reading DOM attributes (`getAttribute`) or layout (`getBoundingClientRect`, `getComputedStyle`) inside the loop forces the browser to synchronously recalculate layout. this is called "Layout Thrashing" and causes stutter.

**solution:** the input system scrapes interactive data *once* on `mouseover` and caches it in `state.interaction`.
*   ❌ `el.getAttribute('data-color')` inside `update()`
*   ✅ `app.state.interaction.color` inside `update()`

### 2. frame rate independence (`dt`)
**why?** users have different refresh rates (60hz vs 144hz). if you move `x += 5` every frame, the cursor moves 2.4x faster on a gaming monitor.

**solution:** use the `deltaTime` (dt) argument or the provided math helpers (`damp`, `lerp`).
*   ❌ `current += (target - current) * 0.1`
*   ✅ `current = damp(current, target, 10, dt)`

### 3. allocation discipline
**why?** creating objects (`{ x, y }`) or arrays every frame triggers Garbage Collection pauses.

**solution:**
*   reuse vectors/objects where possible.
*   do not create DOM elements in `update`.
*   use CSS transforms (GPU) instead of `top`/`left` (CPU Layout).

##  common footguns (read before publishing)
### plugin instances are singletons

a plugin instance persists for the lifetime of `app.use()` and closures persist across enable/disable so state is **not** reset automatically. if you need to reset visuals, do it in `onEnable` / `onDisable` explicitely.
`definePlugin` assumes a single root and it is optimized for plugins with one primary visual element.

if you need multiple elements, conditional mounting or custom containers, use a plain object plugin instead.

### priority matters more than helpers
- helpers do not change execution order.
- logic plugins must have negative priority
- visual plugins should not mutate state.target
- misusing priority leads to janky behavior.

### options are static

options are read at plugin construction.

changing options later will not automatically update behavior unless you design for it.
document this clearly in your plugin.

### bad candidates for core
- stylistic variants
- personal design preferences
- one-off site effects

those belong in user land
