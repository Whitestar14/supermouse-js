# Plugins

With supermouse, plugins are the primary extension mechanism for every non-core effect to keep the core bundle lean. Plugins can be custom cursors, wrappers or cursor effects. They can modify cursor intent, visuals, augment interations and can react to mouse state and other runtime data.

The Supermouse `MouseState` and the `interaction` layer is [how they communicate](#plugin-communication), otherwise Supermouse ensures they are isolated from one another , ordered, and fault-tolerant to crashing the runtime. The core will catch the error if a plugin throws during `update()` and will disable the plugin calling the `onDisable()` and `destroy()` hooks before removing it from the update loop so other plugins continue to run normally.

However, if a plugin throws during installation, the core rejects it entirely and it is never added.

### Publishing Plugins

Plugins are generally expected to be published independently so you don't need to contribute to this repo to extend supermouse. The `@supermousejs/*` scope contains core and reference plugins only, but community plugins are encouraged.

## API

```ts
export interface SupermousePlugin {
  /** Unique name for the plugin. Used for toggling/retrieval. */
  name: string;
  /** Execution priority. Lower numbers run first. */
  priority?: number;
  /** If false, update() will not be called. */
  isEnabled?: boolean;
  /** Reference to the plugin's root DOM element, if any. The core auto-hides this when the plugin is disabled. */
  element?: HTMLElement;

  /** Called when `app.use()` is executed. */
  install?: (instance: SupermouseInstance) => void;
  /** Called on every animation frame with the frame delta time in milliseconds. */
  update?: (instance: SupermouseInstance, deltaTime: number) => void;
  /** Called when the plugin is removed or the app is destroyed. */
  destroy?: (instance: SupermouseInstance) => void;

  /** Called when the plugin is enabled via .enablePlugin() */
  onEnable?: (instance: SupermouseInstance) => void;
  /** Called when the plugin is disabled via .disablePlugin() */
  onDisable?: (instance: SupermouseInstance) => void;
}
```

### Runtime Model

Supermouse runs a deterministic pipeline every frame to ensure consistency across framerates using a frame independent lerp function. It's input system captures events like the native cursor, normalizes coordinates and pre-scrapes attributes, updating `state.pointer`.

Supermouse ensures accessibility across devices that require it and auto-disables the custom cursor on mobile devices with the `autoDisableOnMobile` set to `true` by default.

## Plugins Definition

All plugins are essentially the same. The only distinction that sets them apart are when they run (determined by `priority`) and what they modify.

Depending on what effect you are trying to achieve with Supermouse, such as a effect where cursors behave a certain way, or more commonly, define the appearance of the custom cursor, you would opt for logic plugins of `priority < 0` that read the `pointer` and will have to modify `state.target` to achieve the intended effect. The engine runs through them first before visual plugins. When two plugins have the same priority, Supermouse runs them in the order they are registered:

```ts
import { Supermouse } from "@supermouse/core";

const mouse = Supermouse();

const Gravity = {
  name: "gravity",
  priority: -10, // Must run before physics
  update(app) {
    if (!app.state.hasReceivedInput) return;
    app.state.target.y += 5;
  }
};

app.use(Dot());
```

While visual plugins defined with `priority >= 0` are expected to read `state.smooth`/`state.pointer` to obtain the smoothed coords or the raw ones and render their elements in the `container` stage to the DOM, and they are what you will write 95% of the time when using Supermouse:

```ts
import { dom } from "@supermouse/utils";
import { Supermouse } from "@supermouse/core";

const mouse = Supermouse();

const Dot = {
  name: "dot",
  priority: 0, // Runs after physics
  update(app) {
    if (!app.state.hasReceivedInput) return;
    const { x, y } = app.state.smooth;
    dom.setTransform(el, x, y);
  }
};

app.use(Dot());
```

> NOTE: Supermouse defaults `priority` to `0` if unspecified, so if you intend to write a plugin that modifies `state.target`, you must specify the priority or supermouse will ignore it and assume a visual plugin configuration.

## Writing Plugins

Writing Supermouse plugins is simple as plugins are mostly just functions that return objects with a `name` and `install`, `update`, `destroy` method in the simplest. You do not need complex classes, and it can be written as a plain object like this:

```ts
const el = document.createElement("div");

const RedDot = {
  name: "red-dot",
  element: el,

  install(app) {
    el.style.width = "8px";
    el.style.height = "8px";
    el.style.borderRadius = "50%";
    el.style.background = "red";
    el.style.position = "fixed";
    el.style.pointerEvents = "none";
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

const mouse = new Supermouse({ plugins: [RedDot] });
```

But it is advisable to write them as factory functions to prevent state from leaking between instances:

```ts
import type { SupermousePlugin } from "@supermousejs/core";

export const RedDot = (): SupermousePlugin => {
  let el: HTMLDivElement | null = null;

  return {
    name: "red-dot",
    element: el,

    install(app) {
      el = document.createElement("div");
      el.style.width = "8px";
      el.style.height = "8px";
      el.style.borderRadius = "50%";
      el.style.background = "red";
      el.style.position = "fixed";
      el.style.pointerEvents = "none";
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

### Plugin Options

Options are read at plugin construction. Changing options later does not automatically update behavior unless you design for it. However, you can use the [`normalize` helper function](#plugin-reactivity) provided by `@supermouse/utils` to handle this.

### Plugin Closures

A plugin instance persists for the lifetime of `app.use()` and closures persist across enable/disable, so state is not reset automatically.

```ts
const MyPlugin = definePlugin({
  install(app) {
    this.count = 0;
  },

  update(app) {
    if (!app.state.isEnabled) return;
    this.count++;
  },

  onDisable(app) {
    // `count` is not reset
    console.log("Disabled with count =", this.count);
  },

  onEnable(app) {
    // `count` still has its old value
    console.log("Re-enabled with count =", this.count);
  }
});
```

If you need to reset visuals, do it explicitly in `onEnable`/`onDisable` hook.

When the pointer leaves the browser window and `hideOnLeave` is `true`, the core sets `hasReceivedInput` to `false` and moves `pointer` and `smooth` to off-screen coordinates (`-100, -100`). Plugins must check `state.hasReceivedInput` before reading `pointer` or `smooth` to avoid rendering at invalid positions. Many effects keep a last-known valid position to animate a natural fade-out or collapse in place.

### The `definePlugin()` helper

Alternatively, it can be written with the `definePlugin` helper from `@supermouse/utils`, a collection of utility functions that makes writing plugins easier and more performant, which is the recommended way to writing visual-heavy plugins. It assigns the root DOM element automatically to `plugin.element` so disabling/enabling can be handled with granularity, and is flexible enough to handle logic/visual plugins.

When writing a logic config, you can omit the `create` function since you're managing behavior. The visual config however requires `create`, and optionally accepts `selector`, `update`, `cleanup`, `onEnable`, and `onDisable`.

When you assign a root DOM element to optional `plugin.element` (which `definePlugin` does automatically), the core sets `element.style.display = "none"` when the plugin is disabled and `element.style.display = ""` when it is re-enabled. Doing this prevents ghost cursors when the `States` plugin swaps active plugin sets.

```ts
import { definePlugin, css, dom, setTransform } from "@supermousejs/utils";

definePlugin({
  name: "my-plugin",
  // Auto-registers this as a hover target
  selector: "[data-my-plugin]",
  create: (app) => {
    const el = dom.createActor("div");

    css(el, {
      borderRadius: "50%",
      background: "red"
    });

    return el;
  },
  update: (app, el, dt) => {
    const { x, y } = app.state.smooth;
    setTransform(el, x, y);
  }
});
```

Note that both produce the same runtime behavior, using `definePlugin` just makes writing it easier.

> `definePlugin` is optimized best for plugins with one root element. If you need multiple elements, conditional mounting, or custom containers, a plain object might be better used.

## Plugin Reactivity

Most plugin options accept `ValueOrGetter<T>`, which means they can be a static value or a function that receives `MouseState`:

```html
<script>
  Dot({ size: 24 }); // Static options

  Dot({ size: (state) => (state.isDown ? 12 : 24) }); // Reactive options
</script>
```

The `normalize` utility converts either form into a callable function:

```ts
import { normalize } from "@supermousejs/utils";

const getSize = normalize(options.size, 8); // default 8
const size = getSize(app.state); // Always returns reactive data
```

Use `normalize` for any option that you want to react to state changes, and if you have multiple options that use `normalize`, use `normalizeAll` for cleaner code.

```ts
  const cfg = normalizeAll(options, {
    size: 20,
    color: "#ffffff",
    borderWidth: 2,
    opacity: 1
  });

  const size = cfg.size(app.state)
  const color = cfg.color(app.state)

  // instead of

  const getSize = normalize(options.size, 8)
  const getColor = normalize(options.color, "#ffffff")
  const getBorderWidth = normalize(options.borderWidth, 2)
  const getOpacity = normalize(options.opacity, 1)

  const size = getSize(app.state)
  ...
```

You can read more on how the utilities work in the [utilities documentation]().

### Styling with `css()`

`css()` is the single convention for all DOM style writes from `@supermouse/utils`. It is a performant function that accepts an object of properties and only touches the DOM when a value has actually changed.

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

## Plugin Communication

Plugins are isolated, but often times they need to coordinate with buses so as to ensure all plugins remain performant over the same shared `state`. Supermouse provides specific state channels for this.

### `state.shape`

```bash
pnpm add @supermouse/stick

npm install @supermouse/stick
```

```ts
interface ShapeState {
  width: number;
  height: number;
  borderRadius: number;
}
```

Calculating geometry (using `getBoundingClientRect`) of a target element is common with cursor effects but can be expensive when multiple overlapping effects and cursor are all making independent calculations. Installing the built in Supermouse `stick` plugin allows you (and multiple other plugins) to access the geometry of a plugin calculated once for all plugins and passes it into `state.shape` bridge where other plugins can read from it very cheaply.

```ts
import { Stick } from "@supermouse/stick"

...

const Circle = {
  name: "effect",
  install() => {...},
  update(app, el) => {
    if (app.state.shape) {
      { width, height, radius } = app.state.shape // shape is not null
    }
  }
  ...
}

app = new Supermouse({ plugins: [Stick, Circle] });

```

This decoupling allows you to swap the visual plugin (for example, use a `Square` cursor instead of `Circle`) without rewriting the sticky logic.

### `state.interaction`

Reading DOM attributes (`getAttribute`) inside the loop forces the browser to synchronously recalculate layout and can cause stutter, and this can be troublesome when a cursor needs to read the `data-` attribute of HTML like the example below:

```html
<div data-supermouse-color="..."></div>
```

The input system solves this by scraping interactive data once on `mouseover` and caches it in `state.interaction`. Therefore avoid writing `el.getAttribute('data-color')` inside `update()` and instead leverage the interaction bus by using `app.state.interaction.color`

```ts
const Swirl = {
  ...
  update(app, el) {
    backgroundColor = app.state.interaction.color
  }
}
```

Attribute keys are case-insensitive: `data-supermouse-MyKey` and `data-supermouse-mykey` both become `interaction.myKey`. Empty attributes like `data-supermouse-stick` resolve to boolean `true`.

```html
<div data-supermouse-stick></div>
// This will resolve to true and cursors with morphing implemented will react around it
```

#### Reacting to hover metadata

```ts
const mouse = new Supermouse({
  rules: {
    "[data-magnetic]": { magnetic: true }
  }
});
```

```html
<button data-supermouse-magnetic="0.4">Hover me</button>
```

Both feed into `state.interaction`, merged (rules first, then matching
`data-{dataPrefix}-*` attributes on the same element, which can override or
extend the rule). Give plugin authors type safety via module augmentation:

```ts
declare module "@supermousejs/core" {
  interface InteractionState {
    magnetic?: boolean | number;
  }
}
```

> Visual plugins are recommended to fade out, not remove DOM, on disable.
