# Plugins

With Supermouse, plugins are the primary extension mechanism for every non‑core effect, keeping the core bundle lean. Plugins can be custom cursors, wrappers, cursor effects, or logic modifiers. They can read and modify mouse state, visuals, and interaction data, and they can react to runtime changes.

The `MouseState` and the `interaction` layer are [how plugins communicate](#plugin-communication). Supermouse ensures they are isolated from one another, ordered, and fault‑tolerant. If a plugin throws during `update()`, the core catches the error, disables the plugin, calls `onDisable()` and `destroy()` hooks, and removes it from the update loop so other plugins continue to run normally.

However, if a plugin throws during installation (`install()`), the core rejects it entirely and it is never added.

### Publishing Plugins

Plugins are generally published independently so you don't need to contribute to this repo to extend Supermouse. The `@supermousejs/*` scope contains core and reference plugins only, but community plugins are encouraged.

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
  element?: HTMLElement | SVGElement;

  /** Called when `app.use()` is executed. */
  install?: (instance: SupermouseInstance) => void;
  /** Called on every animation frame with the frame delta time in milliseconds. */
  update?: (instance: SupermouseInstance, deltaTime: number) => void;
  /** Called before the plugin is disabled. Can return a Promise to delay hiding until an exit animation completes. */
  onBeforeDisable?: (instance: SupermouseInstance) => void | Promise<void>;
  /** Called when the plugin is disabled, after the element is hidden. */
  onDisable?: (instance: SupermouseInstance) => void;
  /** Called when the plugin is removed or the app is destroyed. */
  destroy?: (instance: SupermouseInstance) => void;

  /** Called when the plugin is enabled via `.enablePlugin()` */
  onEnable?: (instance: SupermouseInstance) => void;
}
```

## Runtime Model

Supermouse runs a deterministic pipeline every frame to ensure consistency across framerates, using a frame‑independent exponential damping function. Its input system captures events, normalises coordinates, and pre‑scrapes attributes into `state.interaction`. Plugins read from `state` and write to their own DOM elements, which are mounted inside the stage (`app.stage`).

Supermouse also respects accessibility preferences and can automatically disable the custom cursor on mobile devices via `autoDisableOnMobile` (default `true`).

## Plugin Definition

All plugins are essentially the same. The only distinction is when they run, which is determined by `priority` and what they do.

**Logic plugins** modify cursor intent, such as `state.target` or `state.velocity`. They often use a negative priority so they run before visual plugins, but that is not a hard rule.

**Visual plugins** render DOM elements into `app.stage`, usually based on `state.smooth` or `state.pointer`. They typically use the default priority `0` or a positive number if they need to run after something else.

The `priority` field only controls the order in which plugins are updated. A plugin that renders to the DOM and also modifies `state.target` would be both logic and visual; priority simply determines when its changes happen relative to other plugins. This is to ensure that plugin installation order doesn't matter. Supermouse will run plugins of lower specificity first before ones of higher. Installation order only matters when two plugins have the same priority, in which case they will run in the order they are registered.

Supermouse defaults `priority` to `0`.

#### Logic plugin example (modifies cursor intent)

```ts
import { Supermouse } from "@supermousejs/core";

const app = new Supermouse();

const Gravity = {
  name: "gravity",
  priority: -10, // Run before visual plugins so they see the modified target
  update(app) {
    if (!app.state.hasReceivedInput) return;
    app.state.target.y += 5;
  }
};

app.use(Gravity);
```

#### Visual plugin example (renders to the stage)

```ts
import { Supermouse } from "@supermousejs/core";
import { setTransform } from "@supermousejs/utils";

const app = new Supermouse();

const Dot = {
  name: "dot",
  priority: 0, // Default priority
  element: null,

  install(app) {
    const el = document.createElement("div");
    el.style.width = "8px";
    el.style.height = "8px";
    el.style.borderRadius = "50%";
    el.style.background = "red";
    el.style.position = "fixed";
    el.style.pointerEvents = "none";
    this.element = el;
    app.stage.appendChild(el);
  },

  update(app) {
    if (!app.state.hasReceivedInput) return;
    if (!this.element) return;
    const { x, y } = app.state.smooth;
    setTransform(this.element, x, y);
  },

  destroy() {
    this.element?.remove();
  }
};

app.use(Dot);
```

> [!NOTE]
> If you write a plugin that modifies `state.target` and you want visual plugins to react to that change, give it a lower (negative) priority than the visual plugins. If you omit `priority`, the plugin runs at `0`, which may be after other negative‑priority plugins.

## Writing Plugins

Writing Supermouse plugins is simple. Plugins are usually factory functions that return an object with `name`, `install`, `update`, and `destroy` methods.

```ts
export const RedDot = (): SupermousePlugin => {
  let el: HTMLDivElement | null = null;

  return {
    name: "red-dot",

    install(app) {
      el = document.createElement("div");
      el.style.width = "8px";
      el.style.height = "8px";
      el.style.borderRadius = "50%";
      el.style.background = "red";
      el.style.position = "fixed";
      el.style.pointerEvents = "none";
      app.stage.appendChild(el);
    },

    update(app) {
      if (!el || !app.state.hasReceivedInput) return;
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

Options are read at plugin construction. Changing them later does not automatically update behaviour unless you design for it. Use the [`normalize` helper](#plugin-reactivity) from `@supermousejs/utils` to handle reactive options.

### Plugin Closures

A plugin instance persists for the lifetime of `app.use()`. Closures persist across enable/disable, so state is not reset automatically.

```ts
const MyPlugin = {
  name: "my-plugin",
  count: 0,

  update(app) {
    this.count++;
  },

  onDisable(app) {
    console.log("Disabled with count =", this.count);
  },

  onEnable(app) {
    console.log("Re-enabled with count =", this.count);
  }
};
```

> [!TIP]
> If you need to reset visuals, do it explicitly in `onEnable`/`onDisable`.

### Handling Window Leave

When the pointer leaves the browser window and `hideOnLeave` is `true`, the core sets `hasReceivedInput` to `false` and moves `pointer`/`smooth` to off‑screen coordinates (`-100, -100`). Plugins must check `app.state.hasReceivedInput` before reading those values. Many effects keep a last‑known valid position to animate a natural fade‑out or collapse.

> [!NOTE]
> Always guard with `app.state.hasReceivedInput` before reading `pointer` or `smooth` to avoid rendering at off‑screen coordinates.

## The `definePlugin()` Helper

Alternatively, you can use the `definePlugin` helper from `@supermousejs/utils`. It simplifies writing visual plugins by automatically mounting the root element to `app.stage`, assigning it to `plugin.element`, and handling enable/disable visibility.

When writing a logic plugin config, you can omit `create`. The visual config requires `create`, and optionally accepts `update`, `selector`, `beforeDisable`, `onEnable`, and `onDisable`.

```ts
import { definePlugin, css, setTransform } from "@supermousejs/utils";

export const MyDot = definePlugin({
  name: "my-dot",
  selector: "[data-my-dot]",

  create: () => {
    const el = document.createElement("div");
    css(el, {
      width: "8px",
      height: "8px",
      borderRadius: "50%",
      background: "red"
    });
    return el;
  },

  update: (app, el, dt) => {
    if (!app.state.hasReceivedInput) return;
    const { x, y } = app.state.smooth;
    setTransform(el, x, y);
  },

  beforeDisable(app, el) {
    // Optional exit animation, return a Promise to delay hiding
    el.style.opacity = "0";
    return new Promise((resolve) => setTimeout(resolve, 200));
  }
});
```

> [!NOTE]
> `definePlugin` is best for plugins with one root element. If you need multiple elements, conditional mounting, or custom containers, a plain object might be more appropriate.

## Plugin Reactivity

Most plugin options accept `ValueOrGetter<T>`, meaning they can be a static value or a function that receives `MouseState`.

```ts
Dot({ size: 24 }); // Static

Dot({ size: (state) => (state.isDown ? 12 : 24) }); // Reactive
```

Use the `normalize` utility to convert either form into a callable function:

```ts
import { normalize } from "@supermousejs/utils";

const getSize = normalize(options.size, 8);
const size = getSize(app.state);
```

For multiple options, use `normalizeAll`:

```ts
const cfg = normalizeAll(options, {
  size: 20,
  color: "#ffffff",
  borderWidth: 2,
  opacity: 1
});

const size = cfg.size(app.state);
const color = cfg.color(app.state);
```

## Styling with `css()`

`css()` is the single convention for all DOM style writes from `@supermousejs/utils`. It only touches the DOM when a value changes.

```ts
import { css, setTransform } from "@supermousejs/utils";

update(app, el, dt) {
  const size = getSize(app.state);

  css(el, {
    width: `${size}px`,
    height: `${size}px`,
    backgroundColor: getColor(app.state),
    opacity: app.state.isHover ? 1 : 0.5
  });

  const { x, y } = app.state.smooth;
  setTransform(el, x, y);
}
```

> [!WARNING]
> **Do not** use `el.style.width = ...` directly inside animation loops. `css()` prevents layout thrashing.

## Plugin Communication

Plugins are isolated, but they often need to coordinate over the same shared `state`. Supermouse provides specific state channels for this.

### `state.shape`

Calculating geometry (e.g., `getBoundingClientRect`) can be expensive when multiple effects need it. The built‑in `Stick` plugin calculates geometry once and stores it in `state.shape`.

```ts
import { Stick } from "@supermousejs/stick";

const Circle = {
  name: "circle",
  update(app, el) {
    if (app.state.shape) {
      const { width, height, borderRadius } = app.state.shape;
      // use geometry
    }
  }
};

const app = new Supermouse({ plugins: [Stick, Circle] });
```

This decoupling allows you to swap visual plugins without rewriting the sticky logic.

### `state.interaction`

Reading DOM attributes inside the loop forces synchronous layout and can cause jank. Instead, Supermouse pre‑scrapes data attributes into `state.interaction` on hover.

```html
<div data-supermouse-color="#ff0000">...</div>
```

```ts
const Swirl = {
  update(app, el) {
    const color = app.state.interaction.color;
  }
};
```

Attribute keys are case‑insensitive: `data-supermouse-MyKey` and `data-supermouse-mykey` both become `interaction.myKey`. Empty attributes like `data-supermouse-stick` resolve to `true`.

### Rules & Interaction Data

Use the `rules` option to define interaction data without writing many data attributes:

```ts
const app = new Supermouse({
  rules: {
    ".primary-action": {
      magnetic: true,
      color: "red"
    }
  }
});
```

When both `rules` and data attributes apply to the same element, the HTML `data-{dataPrefix}-*` attribute wins for that property. This allows one‑off overrides.

Plugins can also add type safety via module augmentation:

```ts
declare module "@supermousejs/core" {
  interface InteractionState {
    magnetic?: boolean | number;
    color?: string;
  }
}
```

## Cursor Modes & `state.isNative`

Supermouse has a unified `cursor` option that controls both custom and native cursor visibility. The possible values are:

- `"auto"` – default, falls back to native cursor on interactive elements.
- `"custom"` – always custom, hide native.
- `"native"` – always native, hide custom.
- `"both"` – show both.

Plugins can inspect `app.state.cursorMode` and `app.state.isNative` to adapt. In `"auto"` mode, `isNative` is set when the pointer is over an element that should show the native cursor (e.g., `<input>`, `<textarea>`, or an element with `data-supermouse-ignore`).

To force native cursor on an area, add `data-supermouse-ignore` (or your custom prefix):

```html
<div data-supermouse-ignore>Native cursor here</div>
```

> [!NOTE]
> This only works when `cursor` is `"auto"`.

## Lifecycle Hooks & Exit Animations

Supermouse now supports an asynchronous `onBeforeDisable` hook (or `beforeDisable` in `definePlugin`). Use it to play an exit animation before the plugin is hidden:

```ts
const plugin = {
  name: "my-plugin",
  onBeforeDisable(app) {
    return new Promise((resolve) => setTimeout(resolve, 300));
  },
  onDisable(app) {
    // cleanup after hidden
  }
};
```

The core will wait for the Promise to resolve before hiding the element and calling `onDisable`. This replaces the old need for manual `setTimeout` hacks.

---

For comprehensive details on these options, visit the [Supermouse documentation](https://supermouse.js.org).
