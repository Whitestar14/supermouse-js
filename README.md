# Supermouse.js - TypeScript cursor engine

[![npm version](https://img.shields.io/npm/v/@supermousejs/core.svg?style=flat-square)](https://www.npmjs.com/package/@supermousejs/core)
[![npm downloads](https://img.shields.io/npm/dm/@supermousejs/core.svg?style=flat-square)](https://www.npmjs.com/package/@supermousejs/core)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)
![npm bundle size](https://img.shields.io/bundlephobia/minzip/%40supermousejs%2Fcore?label=minzip)

<div align="center">
    <img src="./docs/public/favicon.svg" width="180" height="180">
</div>

Supermouse.js is a physics-based custom cursor engine written in TypeScript for the web. It lets you install composable cursors and cursor effects, or write them yourself, in your own code. It is highly performant, written in TypeScript from scratch, has zero dependencies, and uses a plugin system so the core remains lean.

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

Supermouse itself does not render a cursor; it is not a component system, and it does not render a default stub.

The core is headless: it provides pointer tracking, state, physics, and a plugin lifecycle. Plugins use the internal engine to render to the DOM, but you can write a renderer yourself like in the example below:

```ts
import { Supermouse } from "@supermousejs/core";

const mouse = new Supermouse({ smoothness: 0.15 });

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

mouse.stage.appendChild(dot);

function render() {
  const { smooth } = mouse.state;
  dot.style.transform = `translate3d(${smooth.x}px, ${smooth.y}px, 0) translate(-50%, -50%)`;
  requestAnimationFrame(render);
}

render();
```

It is best to avoid writing this way though. Two `requestAnimationFrame` loops (yours and Supermouse's) will fight each other. Use the plugin interface instead:

```ts
import { Supermouse } from "@supermousejs/core";

const dot = document.createElement("div");
Object.assign(dot.style, { /* ... */ });

const redDot = {
  name: "red-dot",
  install(mouse) {
    mouse.stage.appendChild(dot);
  },
  update(mouse) {
    const { smooth } = mouse.state;
    dot.style.transform = `translate3d(${smooth.x}px, ${smooth.y}px, 0) translate(-50%, -50%)`;
  },
  destroy() {
    dot.remove();
  }
};

const mouse = new Supermouse({ plugins: [redDot] });
```

Now your dot is part of the Supermouse lifecycle: the native cursor is hidden automatically, input is normalized, hover detection and accessibility are baked in, and the dot respects `enable`/`disable`/`destroy`.

For a simple red dot on a webpage, plain HTML/CSS and a few lines of JS will always beat a cursor engine on size and complexity. Supermouse earns its keep once effects multiply: multiple shapes, reactive states, scoped contexts, and sharing physics between them. For example, adding a `Ring` is one line:

```ts
import { Dot } from "@supermousejs/dot";
import { Ring } from "@supermousejs/ring";

const app = new Supermouse({
  plugins: [Dot({ size: 8 }), Ring({ size: 24 })]
});
```

Plugins can also be added imperatively with `.use()`:

```ts
app.use(Dot({ size: 8 }));

if (someEffect) {
  app.use(Effect1({ /* ... */ })).use(Effect2({ /* ... */ }));
}
```

Read more about plugins and how to write them [here](./PLUGINS.md).

## Options

| Option                   | Default                                                                 | Description                                                                                                     |
| ------------------------ | ----------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `smoothness`             | `0.15`                                                                  | Lower values for a smoother follow                                                                              |
| `hoverSelectors`         | `["a", "button", "input", "textarea", "[data-hover]", "[data-cursor]"]` | Selectors that set `state.isHover` to `true`.                                                                   |
| `enableTouch`            | `false`                                                                 | Whether touch events move the cursor.                                                                           |
| `autoDisableOnMobile`    | `true`                                                                  | Disables the custom cursor on devices with a coarse pointer unless `enableTouch` is `true`.                     |
| `cursor`                 | `"auto"`                                                                | Cursor mode: `"auto"`, `"custom"`, `"native"`, or `"both"`.                                                     |
| `cursorPolicy`           | `DEFAULT_CURSOR_POLICY`                                                 | Rules for native-cursor fallback and CSS suppression. See [Cursor Policy](#cursor-policy).                      |
| `inheritDataAttributes`  | `true`                                                                  | Whether `data-*` attributes and `rules` cascade from ancestors to the hovered element.                          |
| `hideOnLeave`            | `true`                                                                  | Hides the cursor when the pointer leaves the browser window.                                                    |
| `container`              | `document.body`                                                         | Primary scope's container.                                                                                      |
| `scopes`                 | —                                                                       | Additional scopes registered at construction. See [Scopes](#scopes).                                            |
| `zIndex`                 | `9999`                                                                  | The stack order of the cursor stage. Increase this if overlays cover the cursor.                                |
| `dataPrefix`             | `"supermouse"`                                                          | A prefix for `data-*` attributes. Prevents conflicts between instances.                                         |
| `rules`                  | —                                                                       | A map of selectors to interaction data. The core adds this data to `state.interaction` on hover.                |
| `plugins`                | —                                                                       | Plugins to install when you create the instance.                                                                |
| `autoStart`              | `true`                                                                  | Set to `false` to prevent automatic start. Call `.start()` when ready.                                          |

## Cursor Modes

The `cursor` option decides how the native and custom cursors coexist. There are four modes:

- **`"auto"`** (default) — Supermouse looks at whatever is under the pointer. Over inputs, links, and other native controls, the OS cursor appears; everywhere else, your custom cursor takes over.
- **`"custom"`** — Always show the custom cursor, hide native.
- **`"native"`** — Always show the native cursor, hide custom.
- **`"both"`** — Show both native and custom together. Useful for effects that surround the native pointer rather than replace it.

Switch at runtime with `mouse.setCursor("both")`.

The mode decides what to show. The [Cursor Policy](#cursor-policy) decides which elements are treated as native when mode is `"auto"`.

## Cursor Policy

The policy is a single declarative object mapping selectors to two independent flags:

- `native` — In `"auto"` mode, elements matching this selector yield to the OS cursor.
- `hide` — When the custom cursor is active, elements matching this selector get `cursor: none !important`. This is needed for elements whose UA stylesheet sets a cursor value (`a { cursor: pointer }`) that would otherwise override the inherited `cursor: none`.

The two flags are independent, so you can have elements that hide the native cursor without triggering fallback (default for `a`, `button`), or vice versa. `DEFAULT_CURSOR_POLICY` covers inputs, textareas, selects, contenteditable elements, links, buttons, `[role="button"]`, and `[tabindex]`.

Extend the default policy:

```ts
import { Supermouse, DEFAULT_CURSOR_POLICY } from "@supermousejs/core";

const mouse = new Supermouse({
  cursorPolicy: {
    rules: [
      ...DEFAULT_CURSOR_POLICY.rules,
      { selector: "[data-native]", native: true }
    ]
  }
});
```

Or use the shorthand form:

```ts
const mouse = new Supermouse({
  cursorPolicy: {
    native: ["input", "textarea", "select", "[data-native]"],
    hide: ["a", "button", "[role='button']"]
  }
});
```

Scopes can override the top-level policy:

```ts
mouse.addScope({
  container: modal,
  cursorPolicy: { native: ["input"] }
});
```

## Scopes

A single Supermouse instance can own multiple **scopes**. Each scope has its own container, its own cursor mode, its own hover selectors, its own cursor policy, and its own plugin set. The innermost scope whose container contains the pointer is the active one. Plugin activation, cursor state, and hover detection follow automatically.

This replaces the v2.4 pattern of creating one `Supermouse` instance per container. Scopes coordinate natively, share a single engine loop, and use a single stylesheet.

Register scopes at construction:

```ts
const mouse = new Supermouse({
  scopes: [
    {
      name: "main",
      container: document.body,
      cursor: "auto",
      plugins: [Dot({ color: "red" })]
    },
    {
      name: "sidebar",
      container: document.getElementById("sidebar"),
      cursor: "custom",
      plugins: [Dot({ color: "blue" })]
    }
  ]
});
```

Or add them at runtime:

```ts
const handle = mouse.addScope({
  name: "modal",
  container: document.getElementById("modal"),
  cursor: "both",
  plugins: [Dot({ color: "green" })]
});

handle.setCursor("auto");
handle.remove();
```

The single-container form is a shorthand for the same thing internally:

```ts
const mouse = new Supermouse({
  container: document.getElementById("modal"),
  cursor: "custom"
});
```

Hover targets are per-scope. Plugins created with `definePlugin` register their `selector` against whichever scope installs them. Raw-object plugins can still call `mouse.registerHoverTarget()` during `install` to add selectors to the current scope.

## Forcing Native Cursor on an Element

When `cursor` is `"auto"`, Supermouse detects native elements via the Cursor Policy. To force the native cursor on an element and its descendants regardless of the policy, add `data-supermouse-ignore`:

```html
<div data-supermouse-ignore>This area will show the native cursor</div>
```

The custom cursor will not appear over that element.

#### Why Allow Native Fallback?

Custom cursors often break usability on native controls (inputs, text selection, drag handles). The `"auto"` cursor mode yields control back to the OS cursor for those interactions so accessibility is not compromised for style.

## Data Attributes

Plugins can react to `data-*` attributes on the hovered element. `Dot`, for example, watches `data-supermouse-color`:

```html
<div data-supermouse-color="#fff000">...</div>

<script>
  const app = new Supermouse({ smoothness: 0.45 });
  app.use(Dot({ color: "red" }));
</script>
```

Other plugins can define their own reactive attributes. Supermouse reads any `data-{prefix}-*` attribute on hover and merges it into `state.interaction`.

Attributes cascade from ancestors to the hovered element when `inheritDataAttributes` is `true` (the default). This means hovering a child of an attributed element behaves as if you hovered the parent:

```html
<a data-supermouse-text="Edit this page" href="...">
  <svg>...</svg>
</a>
```

Hovering anywhere inside the `<a>` — including the SVG — surfaces the `text` interaction.

The prefix is configurable:

```ts
const app = new Supermouse({ dataPrefix: "sm" });
```

```html
<div data-sm-stick>Sticky Zone</div>
```

`data-supermouse-ignore` follows the same prefix and becomes `data-sm-ignore`.

## Rules

Writing data attributes on many elements gets tedious. Use `rules` to centralize interaction data by selector:

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

Sweeping rules across many elements work the same way:

```ts
const app = new Supermouse({
  rules: {
    button: { magnetic: true, color: "#ff0000" },
    "button .primary-button": { color: "#00ff00", size: 20 }
  }
});
```

Rules match ancestors as well as the hovered element, following the same cascade rules as data attributes. When both `rules` and `data-*` attributes resolve to the same key, the data attribute wins:

```ts
// Config
rules: {
  button: { magnetic: true, color: "#ff0000" }
}

// HTML
<button
  data-supermouse-magnetic="false"
  data-supermouse-text="Click"
></button>

// Result
{
  magnetic: false,       // data attribute overrides rule
  color: "#ff0000",      // rule value wins where no attribute exists
  text: "Click"
}
```

For comprehensive details on these options, visit the [options documentation](https://supermouse.js.org/advanced/api).

## API

```ts
const mouse = new Supermouse(options?);

// State and options
mouse.state;      // MouseState read by plugins
mouse.options;    // all options with defaults applied
mouse.stage;      // DOM element plugins render into (active scope)
mouse.container;  // container element (active scope)
mouse.isEnabled;  // true if the instance is processing input
mouse.isRunning;  // true if the animation loop is active

// Input lifecycle
mouse.enable();                       // start input, apply cursor state
mouse.disable();                      // stop input, restore native cursor
mouse.disable({ reset: true });       // also reset physics and hover state
mouse.reset();                        // reset state without touching input

// Cursor
mouse.setCursor("auto" | "custom" | "native" | "both");

// Scopes
mouse.addScope({ container, cursor?, hoverSelectors?, cursorPolicy?, plugins?, inheritDataAttributes?, zIndex?, name? });
//   -> { name, container, setCursor(mode), remove() }

// Plugins
mouse.use(plugin);
mouse.getPlugin(name);
mouse.enablePlugin(name);
mouse.disablePlugin(name);
mouse.togglePlugin(name);

// Hover targets
mouse.registerHoverTarget(selector);

// Loop
mouse.start();
mouse.step(time);

// Teardown
mouse.destroy();
```

## Browser support

Supermouse.js is supported by all modern browsers.

## Contributing

Any bug fixes, performance and docs improvements are welcome. Before adding new effects or features to core, please read [how to contribute](./CONTRIBUTING.md).

## Credits

Supermouse.js is a project inspired heavily by the now-archived Pointer.js and the cursor effects gallery, Curzr.

## License

MIT

Built and maintained by [Whitestar14](https://github.com/Whitestar14).