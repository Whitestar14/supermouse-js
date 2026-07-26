# Supermouse Plugins

Plugins are the primary extension mechanism in Supermouse. The core coordinates them; it does not replace them.

> If a feature can be a plugin, it should be a plugin.

This document describes:

- How the plugin system works
- How to write plugins
- How plugins live in the ecosystem
- Patterns you should use
- Patterns you must not use

## What Is a Plugin?

A plugin is any module that participates in the cursor pipeline. A plugin can:

- Modify cursor intent (logic)
- Render cursor visuals (visual)
- Augment interaction semantics
- React to hover state, velocity, angle, and other runtime data

Plugins are isolated, ordered, and fault-tolerant. If a plugin throws during `update()`, the core catches the error, disables the plugin, calls `onDisable()` and `destroy()`, and removes it from the pipeline. Other plugins continue to run normally. If a plugin throws during `install()`, the core rejects it entirely and it is never added.

## Publishing Plugins

> You can publish a plugin independently. You do not need to submit a pull request to the core, use the `@supermousejs/*` namespace, or ask for permission.

Name your package with a descriptive name. Use `supermouse-plugin-xyz` or `@your-scope/supermouse-xyz`.

The `@supermousejs/*` namespace is reserved for the core runtime, utilities, reference plugins, and canonical effects. Community plugins may be promoted into this namespace later, but this is optional and rare.

## Runtime Model

Supermouse runs a deterministic pipeline every frame. At 60 frames per second, each frame is approximately 16 ms. Understanding this order is critical for preventing visual jitter.

1. **Input System**: Captures events, normalizes coordinates, scrapes attributes. Updates `state.pointer`.
2. **Logic Plugins** (`priority < 0`): Read `pointer`, modify `state.target`.
3. **Core Physics**: Interpolates `state.smooth` toward `state.target` using frame-independent damping.
4. **Visual Plugins** (`priority >= 0`): Read `state.smooth`, render to the DOM.

### Off-Screen and Window Leave

When the pointer leaves the browser window and `hideOnLeave` is `true`, the core sets `hasReceivedInput` to `false` and moves `pointer` and `smooth` to off-screen coordinates (`-100, -100`). Plugins must check `state.hasReceivedInput` before reading `pointer` or `smooth` to avoid rendering at invalid positions. Many effects keep a last-known valid position to animate a natural fade-out or collapse in place.

### Priority and the Visual Jump Bug

Logic plugins (such as `Magnetic` or `Stick`) must have negative priority (for example, `-10`).

If a logic plugin has default priority (`0`), it runs mixed in with visual plugins. This causes a visual jump:

- Visual plugins registered before it render the old position (frame N-1).
- Visual plugins registered after it render the new position (frame N).

The cursor dot snaps correctly while the ring trails behind for a single frame.

> **Rule:** Logic plugins that affect position must have `priority: -10`.

## Logic Plugins and Visual Plugins

All plugins are essentially the same. The only distinction that sets them apart are when they run (determined by `priority`) and what they modify.

### Logic Plugins

Logic plugins modify where the cursor goes. They write to `app.state.target` and must not touch the DOM.

```ts
const Gravity = {
  name: "gravity",
  priority: -10, // Must run before physics
  update(app) {
    if (!app.state.hasReceivedInput) return;
    app.state.target.y += 5;
  }
};
```

### Visual Plugins

Visual plugins render at the cursor position. They read `app.state.smooth` or `app.state.pointer`, own DOM or canvas elements, and run at non-negative priority.

```ts
const Dot = {
  name: "dot",
  priority: 0, // Runs after physics
  update(app) {
    if (!app.state.hasReceivedInput) return;
    const { x, y } = app.state.smooth;
    dom.setTransform(el, x, y);
  }
};
```

## Native Cursor State

Supermouse automatically detects when to show the native OS cursor (for example, over `<input>` fields or text) based on the `ignoreOnNative` configuration. This state is exposed to plugins via `app.state.isNative`.

### Forcing Native Cursor on an Element

To always show the system cursor on an element and its descendants, add the attribute `data-supermouse-ignore`:

```html
<div data-supermouse-ignore>This area will show the native cursor</div>
```

The custom cursor will not appear over that element, even if `hideCursor` is `true`.

### Why Allow Native Fallback?

Custom cursors often break usability on native controls (inputs, text selection, drag handles). `ignoreOnNative` allows the app to briefly yield control back to the OS cursor for these interactions, ensuring accessibility is not compromised for style.

## Communication Between Plugins

Plugins often need to coordinate. Supermouse provides specific state channels for this.

### `state.shape` (Morphing)

Logic plugins like **Stick** calculate geometry but do not render. Visual plugins like **Ring** render but do not calculate geometry. `state.shape` bridges them.

1. **Stick** (logic) measures the hovered element and writes `{ width, height, borderRadius }` to `state.shape`.
2. **Ring** (visual) checks `state.shape`. If present, it morphs to those dimensions. If `null`, it stays a circle.

This decoupling allows you to swap the visual plugin (for example, use a `Square` cursor instead of `Ring`) without rewriting the sticky logic.

### `state.interaction` (Metadata)

Populated by the core input system. Plugins read this to react to specific element attributes (like `data-supermouse-color`). Attribute keys are case-insensitive: `data-supermouse-MyKey` and `data-supermouse-mykey` both become `interaction.myKey`. Empty attributes like `data-supermouse-stick` resolve to boolean `true`.

## Plugin Lifecycle

Every plugin runs through `install`, then `update`, then `onEnable`/`onDisable`, then `destroy`.

| Hook        | When It Runs                                                                 |
| ----------- | ---------------------------------------------------------------------------- |
| `install`   | Once, when `app.use()` is called                                             |
| `update`    | Every frame (~60fps)                                                         |
| `onEnable`  | When enabled via `app.enablePlugin()`                                        |
| `onDisable` | When disabled via `app.disablePlugin()`                                      |
| `destroy`   | When the app is destroyed, or when the core removes the plugin after a crash |

> Visual plugins are recommended to fade out, not remove DOM, on disable.

### The `element` Property

The `SupermousePlugin` interface includes an optional `element` property:

```ts
interface SupermousePlugin {
  name: string;
  element?: HTMLElement; // The core hides this when the plugin is disabled
  // ...
}
```

When you assign a root DOM element to `plugin.element` (which `definePlugin` does automatically), the core sets `element.style.display = "none"` when the plugin is disabled and `element.style.display = ""` when it is re-enabled. This prevents ghost cursors when the `States` plugin swaps active plugin sets.

## Writing Plugins

Supermouse plugins are simple. You do not need complex classes. Plugins can be written as plain objects or with the `definePlugin` helper. Both produce the same runtime behavior.

> Write plugins as factory functions. This prevents state from leaking between instances.

### The `definePlugin` Helper

The `definePlugin` utility from `@supermousejs/utils` is the recommended way to build visual plugins. It accepts two shapes:

If you're writing a **Logic Config**, you no `create` function since you're managing behavior.
**Visual Config** however requires `create`, and optionally accepts `selector`, `update`, `cleanup`, `onEnable`, and `onDisable`.

```ts
import { definePlugin, css, setTransform } from "@supermousejs/utils";

definePlugin({
  name: "my-plugin",
  selector: "[data-my-plugin]", // Auto-registers this as a hover target
  create: (app) => {
    // Runs once. Return your root DOM element.
    const el = document.createElement("div");
    return el;
  },
  update: (app, el, dt) => {
    // Runs every frame. `el` is the element from `create`.
    const { x, y } = app.state.smooth;
    setTransform(el, x, y);
  }
});
```

### Reactivity with `normalize`

Most plugin options accept `ValueOrGetter<T>`, which means they can be a static value or a function that receives `MouseState`:

```ts
// consumerFile.ts
Dot({ size: 24 }); // Static
Dot({ size: (state) => (state.isDown ? 12 : 24) }); // Reactive
```

The `normalize` utility converts either form into a callable function:

```ts
// myPlugin.ts
import { normalize } from "@supermousejs/utils";

const getSize = normalize(options.size, 8); // default 8
const size = getSize(app.state); // Always works
```

Use `normalize` for any option that should react to state changes.

### Styling with `css()`

`css()` is the single convention for all DOM style writes. It accepts an object of properties and only touches the DOM when a value has actually changed.

```ts
import { css, setTransform } from "@supermousejs/utils";

update(app, el, dt) {
  const size = getSize(app.state);
  css(el, {
    width: `${size}px`,
    height: `${size}px`,
    backgroundColor: getColor(app.state),
    opacity: app.state.isHover ? 1 : 0.5,
  });

  const { x, y } = app.state.smooth;
  setTransform(el, x, y);
}
```

> **Do not** use `el.style.width = ...` directly. `css()` prevents layout thrashing by batching writes and skipping unchanged values.

`setStyle` and `applyStyles` are deprecated and will be removed. Use `css()` for everything.

### Which Approach Should I Use?

| Use Case                      | Approach                      |
| ----------------------------- | ----------------------------- |
| Quick experiment              | Plain object                  |
| Learning the lifecycle        | Plain object                  |
| npm package                   | `definePlugin`                |
| Configurable visual plugin    | `definePlugin` + `normalize`  |
| Multi-root or custom mounting | Plain object                  |
| Logic-only plugin             | Plain object / `definePlugin` |

## Performance Requirements

Supermouse is optimized for 60–240 frames per second on the main thread. Plugins must be disciplined.

### 1. The DOM Firewall (`state.interaction`)

**Why:** Reading DOM attributes (`getAttribute`) or layout (`getBoundingClientRect`, `getComputedStyle`) inside the loop forces the browser to synchronously recalculate layout. This is called layout thrashing and causes stutter.

The solution to this is the input system scrapes interactive data once on `mouseover` and caches it in `state.interaction`. Therefore avoid writing `el.getAttribute('data-color')` inside `update()` and instead leverage the interaction bus by using `app.state.interaction.color`

### 2. Frame Rate Independence (`dt`)

**Why:** Users have different refresh rates (60 Hz vs 144 Hz). If you move `x += 5` every frame, the cursor moves 2.4 times faster on a gaming monitor.

Use the `deltaTime` (dt) argument or the provided math helpers (`damp`, `lerp`) to account for this. In cases where you'd write `current += (target - current) * 0.1`, do this instead: `current = damp(current, target, 10, dt)`

### 3. Allocation Discipline

Creating objects (`{ x, y }`) or arrays every frame triggers garbage collection pauses.

So, Reuse vectors and objects where possible, avoid creating DOM elements in `update` and use CSS transforms (GPU) instead of `top`/`left` (CPU layout). Supermouse provides utilities that makes this easier via the `@supermouse/utils` package. Documentation on how they work can be found [here](./packages/utils/README.md)

### 4. Handle Off-Screen State

When `hasReceivedInput` is `false`, coordinates are invalid (off-screen). Plugins must either hide their visuals or use a last-known position to animate a graceful exit. Rendering at `(-100, -100)` places elements in the top-left corner unexpectedly.

## Common Mistakes

### Plugin Instances Are Singletons

A plugin instance persists for the lifetime of `app.use()` and closures persist across enable/disable, so state is not reset automatically. If you need to reset visuals, do it explicitly in `onEnable` or `onDisable`.

`definePlugin` is optimized for plugins with one root element. If you need multiple elements, conditional mounting, or custom containers, use a plain object plugin instead.

### Plugin Crash Removal

If a plugin throws during `update()`, it is removed from the pipeline and its `destroy` hook runs. Any external references to that plugin become stale. Do not rely on a plugin still being present after a crash.

### Priority Matters More Than Helpers

- Helpers do not change execution order.
- Logic plugins must have negative priority.
- Visual plugins must not mutate `state.target`.
- Misusing priority may leads to janky behavior.

### Options Are Static

Options are read at plugin construction. Changing options later does not automatically update behavior unless you design for it. You can use the `normalize` helper function provided by `@supermouse/utils` to solve this. Read more on to handle [reactivity with the `normalize`](#reactivity-with-normalize) function.

### Bad Candidates for Core

- Stylistic variants
- Personal design preferences
- One-off site effects

Those belong in user land or in a plugin.
