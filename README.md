# Supermouse.js - Typescript cursor engine

[![npm version](https://img.shields.io/npm/v/@supermousejs/core.svg?style=flat-square)](https://www.npmjs.com/package/@supermousejs/core)
[![npm downloads](https://img.shields.io/npm/dm/@supermousejs/core.svg?style=flat-square)](https://www.npmjs.com/package/@supermousejs/core)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)
![npm bundle size](https://img.shields.io/bundlephobia/minzip/%40supermousejs%2Fcore?label=minzip)

<div align="center">
    <img src="./docs/public/favicon.svg" width="180" height="180">
</div>

Supermouse.js is a physics-based custom cursor engine written in Typescript for the web that allows you toinstall composable cursors and cursor effects, or write them yourself, in your code. It is highly performant, written in Typescript from scratch, has zero dependencies and uses a plugin-system as an extension so the core remains lean.

[Documentation](https://supermouse.js.org) | [Examples](https://supermouse.js.org/docs/guide/cookbook) | [License](#license)

## Installation

```bash
pnpm add @supermousejs/core

npm install @supermouse/core
```

Install only the plugins you want:

```bash
pnpm add @supermousejs/dot @supermousejs/ring

npm install @supermousejs/dot @supermousejs/ring
```

## Usage

Supermouse itself does not render a cursor, as it is not a component system. Nor does it render a default stub.

The core is essentially a headless system that provides pointer tracking, state, physics, and a plugin
lifecycle. Plugins automatically use the internal supermouse engine to render to the DOM, but you can write a renderer yourself like in the example below:

```js
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

It is best to avoid writing this way though, as defining one besides the Supermouse internal `requestAnimationFrame` will leave you with two rAF loops. You would like to use Supermouse's plugin interface to avoid it.

```js
import { Supermouse } from '@supermousejs/core'

const dot = document.createElement('div')

Object.assign(dot.style, {...})

const redDot = {
      name: 'red-dot',
      install(mouse) {
        mouse.container.appendChild(dot)
      },
      update(mouse) {
        const { smooth } = mouse.state

        dot.style.transform =
          `translate3d(${smooth.x}px, ${smooth.y}px, 0) translate(-50%, -50%)`
      },
      destroy() {
        dot.remove()
      }
    }

const mouse = new Supermouse({
  plugins: [redDot]
})
```

Now your dot has all the capabilities of Supermouse (the native cursor automatically hidden, the input normalized, hover detection and accessibility baked in, and the red dot part of the plugin lifecycle). However, if your goal is a simple red dot on your webpage, then Supermouse will hardly be of any benefit and might even be overkill for your project, even though Supermouse is designed to use very little overhead. You are better off achieving the same simple effect with HTML/CSS and some Javascript.

Supermouse's advantages are much more serving when you need to handle increasingly complex effects with granularity with its plugins, for example, when you decide to add a `Ring` to the cursor, you can pass plugins declaratively to the constructor:

```ts
import { Dot } from "@supermousejs/dot";
import { Ring } from "@supermousejs/ring";

const app = new Supermouse({
  plugins: [Dot({ size: 8 }), Ring({ size: 24 })]
});
```

And you can chain plugin instantiation imperatively with `.use`:

```ts
app.use(Dot({ size: 8 }))

if (someEffect) {
  app.use(Effect1{...}).use(Effect2{...})
}
```

You can read more about plugins and how to write them [here](./PLUGINS.md).

## Options

| Option                | Default                                                                 | Description                                                                                        |
| --------------------- | ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `smoothness`          | `0.15`                                                                  | Lower values for a smoother follow                                                                 |
| `hoverSelectors`      | `["a", "button", "input", "textarea", "[data-hover]", "[data-cursor]"]` | Selectors that set `state.isHover` to `true`.                                                      |
| `enableTouch`         | `false`                                                                 | Whether touch events move the cursor.                                                              |
| `autoDisableOnMobile` | `true`                                                                  | Checks if the device has a fine pointer. Independent of `enableTouch`.                             |
| `ignoreOnNative`      | `"auto"`                                                                | `'auto'`,`'tag'`,`'css'`,`'null'`. Strategy for determining when to fallback to the native cursor. |
| `cacheCursorStyle`    | `false`                                                                 | Caches cursor style data per element.                                                              |
| `hideCursor`          | `true`                                                                  | Whether the core hides the native cursor.                                                          |
| `hideOnLeave`         | `true`                                                                  | Hides the cursor when the pointer leaves the browser window.                                       |
| `container`           | `document.body`                                                         | The area where the instance is active.                                                             |
| `zIndex`              | `9999`                                                                  | The stack order of the cursor stage. Increase this if overlays cover the cursor.                   |
| `dataPrefix`          | `"supermouse"`                                                          | A prefix for `data-*` attributes. Prevents conflicts between instances.                            |
| `rules`               | —                                                                       | A map of selectors to interaction data. The core adds this data to `state.interaction` on hover.   |
| `resolveInteraction`  | —                                                                       | A custom function to set interaction data. This bypasses `rules` and data attributes.              |
| `plugins`             | —                                                                       | Plugins to install when you create the instance.                                                   |
| `autoStart`           | `true`                                                                  | Set to `false` to prevent automatic start. Call `.start()` when ready.                             |

### Containers

By default, Supermouse appends the cursor surface where the elements live called the cursor **stage** to `document.body` and uses global event listeners, but you can choose to scope a Supermouse instance to a specific scoped container using absolute positioning relative to its container.

All css and cursor-hiding rules are scoped to avoid leakage outside the container, and mouse coordinates are automatically translated relative to the container:

```ts
const modal = document.getElementById("my-modal");

const app = new Supermouse({
  container: modal,
  hideCursor: true
});
```

This makes it so that you can have multiple instances of Supermouse running simultaneously without any CSS conflicts, all being completed independent and isolated from each other, while being performant as each active instance (the container the cursor currently hovers on) ignores events outside its scope.

```tsx
// Main page cursor
const app1 = new Supermouse({
  hideCursor: true,
  container: document.body
});
app1.use(Dot({ color: "red" }));

// Modal cursor
const app2 = new Supermouse({
  hideCursor: true,
  container: document.getElementById("modal")
});
app2.use(Dot({ color: "blue" }));

// Sidebar
const app3 = new Supermouse({
  hideCursor: true,
  container: document.getElementById("sidebar")
});
app3.use(Ring({ color: "green" }));
```

And Supermouse automatically handles CSS Scoping to ensure they never conflict:

```css
// app1's css
.supermouse-scope-0 button { cursor: none !important; }

// app2's CSS
.supermouse-scope-1 button {
  cursor: none !important;
}
```

> As each instance is completely indepedent of each other and are blind to events outside their own, hover targets must therefore be registered separately on each instance with `app.registerHoverTarget()`

### Forcing Native Cursor on an Element

Supermouse automatically detects when to show the native
OS cursor (for example, over `<input />` fields or text) based on the `ignoreOnNative`
configuration. This state is exposed to plugins via `app.state.isNative`. To always show the system
cursor on an element and its descendants when hovering over a specific area/element, add the
attribute `data-supermouse-ignore`:

```html
<div data-supermouse-ignore>This area will show the native cursor</div>
```

The custom cursor will not appear over that element, even if `hideCursor` is `true`.

#### Why Allow Native Fallback?

Custom cursors often break usability on native controls (inputs, text selection, drag handles). If the custom cursor has not handled for this, `ignoreOnNative` allows the app to briefly yield control back to the OS cursor for these interactions, ensuring accessibility is not compromised for style.

### Data Attributes

Some plugins, like dot, can be reactive to changes as defined by the HTML. Dot for example, watches for the `data-supermouse-color` attribute in HTML and will change color upon hovering over it and will return to the default color on leave.

```html
<div data-supermouse-color="#fff000">...</div>

<script>
  const app = new Supermouse({ smoothness: 0.45 });

  app.use(Dot({ color: "red" }));
</script>
```

Other plugins might offer other reactive ability with often different naming specific to those plugins that Supermouse will detect on hover and change accordingly.

```html
<div class="modal">
  // Supermouse is disabled outside this container
  <div data-supermouse-magnetic>...</div>

  <div data-supermouse-color="orange" data-supermouse-stick="true">...</div>

  <div data-supermouse-image="https://unsplash.com/..."></div>
</div>

<script>
  const app = new Supermouse({
    smoothness: 0.15,
    container: ".modal",
    plugins: [Magnetic, Dot, Stick, Image]
  });
</script>
```

The data-prefix is configurable via the `dataPrefix` constructor option, so `data-supermouse-{}` can be something else of your own choosing:

```ts
const app = new Supermouse({ dataPrefix: "sm" });
```

```html
<div data-sm-stick>Sticky Zone</div>
```

Likewise, the `data-supermouse-ignore` wildcard will also follow as `data-sm-ignore`.

### Rules

Writing data attributes on multiple elements can often get tedious to write and can quickly populate your HTML with data attributes, and it can be unmanageable if you require a reactive effect applied to all buttons. Use the `rules` constructor in Supermouse to reduce clutter and centralize logic in one place:

```html
<button
  data-supermouse-magnetic="true"
  data-supermouse-magnetic-distance="200"
  data-supermouse-color="red"
  data-supermouse-text="Click!"
  data-supermouse-scale="1.5"
>
  Complex Button
</button>
```

Using `rules` to define semantic styling makes this cleaner:

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

<button class="primary-action">Submit</button>
```

Or make sweeping semantic styling e.g. to all buttons of a specific class:

```ts
const app = new Supermouse({
  rules: {
    button: {
      magnetic: true,
      color: "#ff0000"
    },
    "button .primary-button": {
      color: "#00ff00",
      size: 20
    }
  }
});

<button>This button is magnetic</button>

<button class="primary-button">This button is both magnetic and data-supermouse-size set to 20</button>
```

In the event when both rules and data attributes apply to the same element, the HTML `data-supermouse-{}` attribute wins, and will often work as a wildcard in situations where you require a one-off effect on a specific element.

```ts
// Config
rules: {
  'button': {
    magnetic: true,
    color: '#ff0000'
  }
}

// HTML
<button
  data-supermouse-magnetic="false"
  data-supermouse-text="Click"
></button>

// Resolution
{
  magnetic: false,
  color: '#ff0000',
  text: 'Click'
}
```

### `ResolveInteraction`

For custom interaction resolutions involving complex custom logic, or with legacy innerHTML structures, Supermouse `rules` does not work as it does not read reactively. You can use `resolveInteraction` to completely replace the default parsing logic and takes in the `element` currently being hovered as an argument:

```ts
const app = new Supermouse({
  resolveInteraction(element) {
    // Full control over how metadata is extracted
    return {
      color: element.style.color,
      scale: element.dataset.cursorScale,
      magnetic: uiStore.enableAnimation
    };
  }
});
```

You can also write `rules` in conjuction with your custom parser in `resolveInteraction` and the parser will work only as an override in edge cases.

```ts
const app = new Supermouse({
  // Base rules for common cases
  rules: {
    button: { magnetic: true, color: "#ff0000" },
    a: { color: "#00ff00" }
  },

  // Override with custom logic for edge cases
  resolveInteraction(element) {
    const base = {};

    // Custom override
    if (element.hasAttribute("data-text")) {
      base.scale = 2.0;
      base.text = "Click Me";
    }

    return base;
  }
});
```

<>tODO find the sequence of how priority is handled with this three

For comprehensive details on the rest of these options, visit the [options documentation](https://supermouse.js.org/advanced/api).

## API

```ts
const mouse = new Supermouse(options?);

// Mouse state read inside plugins
mouse.state
// All options with defaults applied
mouse.options
// The DOM element the plugins render into
mouse.container
// Returns `true` if the instance is currently processing input
mouse.isEnabled

// Start processing input, hide the native cursor and snap to last known pointer position.
mouse.enable()
// Stop processing input, show native cursor an reset state.
mouse.disable()
// Pause input and hide the container stage non-destructively.
mouse.suspend()
// Resume input and show the container stage.
mouse.resume()

// Auto-detection override that forces the native cursor state.
mouse.setNativeCursor("hide" | "show" | "auto")

// Install a plugin
mouse.use(plugin)
// Return a plugin by name
mouse.getPlugin(name)
// Enable a disabled plugin
mouse.enablePlugin(name)
// Disable a plugin
mouse.disablePlugin(name)
// Toggle a plugin `.isEnabled` state
mouse.togglePlugin(name)

// Add a global selector at runtime. Whenever the cursor hovers over this selector, the Supermouse kernel detects it and hides the native cursor for it
mouse.registerHoverTarget(selector)

// Start the animation loop if it is stopped
mouse.start()
// Advance one frame manually
mouse.step(time)
// Destroys Supermouse and plugin instance
mouse.destroy()
```

## Browser support

Supermouse.js is supported by all modern browsers.

## Contributing

Any bug fixes, performance / docs improvement are welcome. Before adding new effects or features to core, please read [how to contribute](./CONTRIBUTING.md).

## Credits

Supermouse.js is a project inspired heavily by the now-archived Pointer.js and the cursor copy-and-paste effects gallery, Curzr.

## License

MIT

Built and maintained by [Whitestar14](https://github.com/Whitestar14).
