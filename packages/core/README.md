# Supermouse.js - TypeScript cursor engine

[![npm version](https://img.shields.io/npm/v/@supermousejs/core.svg?style=flat-square)](https://www.npmjs.com/package/@supermousejs/core)
[![npm downloads](https://img.shields.io/npm/dm/@supermousejs/core.svg?style=flat-square)](https://www.npmjs.com/package/@supermousejs/core)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)
![npm bundle size](https://img.shields.io/bundlephobia/minzip/%40supermousejs%2Fcore?label=minzip)

<div align="center">
    <img src="https://raw.githubusercontent.com/Whitestar14/supermouse-js/main/docs/public/favicon.svg" width="180" height="180">
</div>

Supermouse.js is a physics-based custom cursor engine written in TypeScript for the web that allows you to install composable cursors and cursor effects, or write them yourself, in your code. It is highly performant, written in TypeScript from scratch, has zero dependencies, and uses a plugin system so the core remains lean.

[Documentation](https://supermouse.js.org) | [Examples](https://supermouse.js.org/docs/guide/cookbook) | [License](#license)

## Installation

```bash
pnpm add @supermousejs/core

npm install @supermousejs/core
```

Install only the plugins you want:

```bash
pnpm add @supermousejs/dot @supermousejs/ring

npm install @supermousejs/dot @supermousejs/ring
```

## Usage

Supermouse itself does not render a cursor, as it is not a component system. Nor does it render a default stub.

The core is essentially a headless system that provides pointer tracking, state, physics, and a plugin lifecycle. Plugins automatically use the internal Supermouse engine to render to the DOM, but you can write a renderer yourself like in the example below:

```ts
import { Supermouse } from "@supermousejs/core";

const mouse = new Supermouse({
  smoothness: 0.15
});

const dot = document.createElement("div");

Object.assign(dot.style, {
  width: "8px",
  height: "8px",
  borderRadius: "50%",
  background: "red",
  position: "absolute",
  transform: "translate(-50%, -50%)",
  pointerEvents: "none"
});

mouse.container.appendChild(dot);

function render() {
  const { smooth } = mouse.state;

  dot.style.transform = `translate3d(${smooth.x}px, ${smooth.y}px, 0) translate(-50%, -50%)`;

  requestAnimationFrame(render);
}

render();
```

It is best to avoid writing this way though, as defining another `requestAnimationFrame` besides Supermouse's internal one will leave you with two rAF loops. Use Supermouse's plugin interface instead:

```ts
import { Supermouse } from "@supermousejs/core";

const dot = document.createElement("div");

Object.assign(dot.style, {
  width: "8px",
  height: "8px",
  borderRadius: "50%",
  background: "red",
  position: "absolute",
  transform: "translate(-50%, -50%)",
  pointerEvents: "none"
});

const redDot = {
  name: "red-dot",
  install(mouse) {
    mouse.container.appendChild(dot);
  },
  update(mouse) {
    const { smooth } = mouse.state;

    dot.style.transform = `translate3d(${smooth.x}px, ${smooth.y}px, 0) translate(-50%, -50%)`;
  },
  destroy() {
    dot.remove();
  }
};

const mouse = new Supermouse({
  plugins: [redDot]
});
```

Now your dot has all the capabilities of Supermouse (the native cursor automatically hidden, the input normalized, hover detection and accessibility baked in, and the red dot part of the plugin lifecycle). However, if your goal is a simple red dot on your webpage, Supermouse might be overkill, even though the core is designed to be lightweight. For simple effects, plain HTML/CSS and JavaScript may suffice.

Supermouse's advantages become apparent when you need to handle increasingly complex effects with granularity. For example, adding a `Ring` to the cursor can be done declaratively:

```ts
import { Dot } from "@supermousejs/dot";
import { Ring } from "@supermousejs/ring";

const app = new Supermouse({
  plugins: [Dot({ size: 8 }), Ring({ size: 24 })]
});
```

You can also chain plugin instantiation imperatively with `.use`:

```ts
app.use(Dot({ size: 8 }))

if (someEffect) {
  app.use(Effect1({...})).use(Effect2({...}))
}
```

Read more about plugins and how to write them [here](https://github.com/Whitestar14/supermouse-js/blob/main/PLUGINS.md).

## Options

| Option                | Default                                                                 | Description                                                                                                     |
| --------------------- | ----------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `smoothness`          | `0.15`                                                                  | Lower values for a smoother follow                                                                              |
| `hoverSelectors`      | `["a", "button", "input", "textarea", "[data-hover]", "[data-cursor]"]` | Selectors that set `state.isHover` to `true`.                                                                   |
| `enableTouch`         | `false`                                                                 | Whether touch events move the cursor.                                                                           |
| `autoDisableOnMobile` | `true`                                                                  | Disables the custom cursor on devices with a coarse pointer unless `enableTouch` is `true`.                     |
| `cursor`              | `"auto"`                                                                | Cursor mode: `'auto'`, `'custom'`, `'native'`, or `'both'`. Replaces the old `hideCursor` and `ignoreOnNative`. |
| `hideOnLeave`         | `true`                                                                  | Hides the cursor when the pointer leaves the browser window.                                                    |
| `container`           | `document.body`                                                         | The area where the instance is active.                                                                          |
| `zIndex`              | `9999`                                                                  | The stack order of the cursor stage. Increase this if overlays cover the cursor.                                |
| `dataPrefix`          | `"supermouse"`                                                          | A prefix for `data-*` attributes. Prevents conflicts between instances.                                         |
| `rules`               | —                                                                       | A map of selectors to interaction data. The core adds this data to `state.interaction` on hover.                |
| `plugins`             | —                                                                       | Plugins to install when you create the instance.                                                                |
| `autoStart`           | `true`                                                                  | Set to `false` to prevent automatic start. Call `.start()` when ready.                                          |

### Cursor Modes

Prior to v2.4, earlier versions used two separate options, `hideCursor` and `ignoreOnNative`, to control when the native cursor should be hidden or shown. In v2.4, these have been combined into a single **`cursor`** option that decides both behaviors at once.

```ts
const app = new Supermouse({
  cursor: "auto"
});
```

There are four modes:

- **`"auto"`** (default) – Supermouse looks at whatever is under the pointer and makes a reasonable choice. Over buttons, links, inputs, and other native controls, the native OS cursor appears; everywhere else, your custom cursor takes over. This is the best starting point and for most projects, it's what you're going to use without extra configuration.

- **`"custom"`** – The custom cursor is always shown, and the native cursor is always hidden. This is the mode you'd use when you want complete visual control and are confident your custom cursor handles all interactions gracefully.

- **`"native"`** – The native cursor is always visible, and the custom cursor stays hidden. Useful when you temporarily want to give full control back to the OS.

- **`"both"`** – Both the native cursor and the custom cursor are visible at the same time. This is particularly useful for effects that surround the native pointer such as a ring that highlights the native arrow, or a trail that follows the real cursor.

You can switch modes at any time with:

```ts
mouse.setCursor("both");
```

If you’re coming from an older version and relied on those options, the following table might help you translate:

| Old behaviour                                | New `cursor` value                                         |
| -------------------------------------------- | ---------------------------------------------------------- |
| `hideCursor: true`, `ignoreOnNative: "auto"` | `"auto"`                                                   |
| `hideCursor: true`, `ignoreOnNative: null`   | `"custom"`                                                 |
| `hideCursor: false`                          | `"both"` or `"native"` depending on the rest of your setup |

The rest of the documentation uses `cursor` consistently. If you have questions about a specific migration case, the [options documentation](https://supermouse.js.org/advanced/api) covers the details.

### Containers

By default, Supermouse appends the cursor stage to `document.body` and uses global event listeners. You can scope an instance to a specific container:

```ts
const modal = document.getElementById("my-modal");

const app = new Supermouse({
  container: modal,
  cursor: "custom"
});
```

This allows multiple independent instances on the same page. CSS and cursor‑hiding rules are scoped to avoid leakage. For example:

```ts
// Main page cursor
const app1 = new Supermouse({
  container: document.body,
  cursor: "custom"
});
app1.use(Dot({ color: "red" }));

// Modal cursor
const app2 = new Supermouse({
  container: document.getElementById("modal"),
  cursor: "both"
});
app2.use(Dot({ color: "blue" }));
```

### Forcing Native Cursor on an Element

When `cursor` is `"auto"`, Supermouse automatically detects when to show the native OS cursor. To force native cursor on an element and its descendants, add the attribute `data-supermouse-ignore`:

```html
<div data-supermouse-ignore>This area will show the native cursor</div>
```

This only works when `cursor` is `"auto"`.

> **Note:** Custom cursors often break usability on native controls (inputs, text selection, drag handles). The `"auto"` cursor mode briefly yields control back to the OS cursor for these interactions, ensuring accessibility.

### Data Attributes

Some plugins can be reactive to HTML data attributes. For example, `Dot` watches for `data-supermouse-color`:

```html
<div data-supermouse-color="#fff000">...</div>
```

The `dataPrefix` option can customize this:

```ts
const app = new Supermouse({ dataPrefix: "sm" });
```

```html
<div data-sm-stick>Sticky Zone</div>
```

`data-supermouse-ignore` becomes `data-sm-ignore`.

### Rules

Use `rules` to define interaction data without writing many data attributes:

```ts
const app = new Supermouse({
  rules: {
    ".primary-action": {
      magnetic: true,
      distance: 200,
      color: "red",
      text: "Click!",
      scale: 1.5
    }
  }
});
```

When both rules and data attributes apply to the same element, the HTML `data-supermouse-*` attribute wins for that property.

## API

```ts
const mouse = new Supermouse(options?);

// Mouse state read inside plugins
mouse.state
// All options with defaults applied
mouse.options
// The DOM element the plugins render into
mouse.stage

// Whether the instance is currently processing input
mouse.isEnabled

// Start processing input and re-apply cursor state
mouse.enable()
// Stop processing input, restore native cursor, reset state
mouse.disable()
// Pause input and hide the stage without destroying the instance
mouse.suspend()
// Resume input and show the stage
mouse.resume()

// Set cursor mode: "auto" | "custom" | "native" | "both"
mouse.setCursor(mode)

// Install a plugin
mouse.use(plugin)
// Return a plugin by name
mouse.getPlugin(name)
// Enable a disabled plugin
mouse.enablePlugin(name)
// Disable a plugin
mouse.disablePlugin(name)
// Toggle a plugin's enabled state
mouse.togglePlugin(name)

// Add a selector at runtime. Whenever the cursor hovers over this selector, Supermouse detects it and hides the native cursor for it
mouse.registerHoverTarget(selector)

// Start the animation loop if stopped
mouse.start()
// Advance one frame manually
mouse.step(time)

// Destroy Supermouse and plugin instances
mouse.destroy()
```

## Browser support

Supermouse.js supports all modern browsers.

## Contributing

Any bug fixes, performance / docs improvements are welcome. Before adding new effects or features to core, please read [how to contribute](https://github.com/Whitestar14/supermouse-js/blob/main/CONTRIBUTING.md).

## Credits

This project was heavily inspired by [Pointer.js](https://github.com/mageowl/pointer.js) and the cursor effects gallery, [Curzr](https://github.com/fuzionix/curzr).

## License

MIT

Built and maintained by [Whitestar14](https://github.com/Whitestar14)
