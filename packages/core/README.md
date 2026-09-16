# @supermousejs/core

[![npm version](https://img.shields.io/npm/v/@supermousejs/core.svg?style=flat-square)](https://www.npmjs.com/package/@supermousejs/core)
[![npm downloads](https://img.shields.io/npm/dm/@supermousejs/core.svg?style=flat-square)](https://www.npmjs.com/package/@supermousejs/core)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)
![npm bundle size](https://img.shields.io/bundlephobia/minzip/%40supermousejs%2Fcore?label=minzip)

Supermouse is a headless, physics-based cursor engine for the web, written in TypeScript. It provides pointer tracking, state, physics, and a plugin lifecycle. You install plugins (or write your own) to render custom cursors and effects. Zero runtime dependencies.

**Documentation:** [supermouse.js.org](https://supermouse.js.org)

## Installation

```bash
pnpm add @supermousejs/core
npm install @supermousejs/core
```

Install plugins you need:

```bash
pnpm add @supermousejs/dot @supermousejs/ring
npm install @supermousejs/dot @supermousejs/ring
```

## Quick Start

```ts
import { Supermouse } from "@supermousejs/core";
import { Dot } from "@supermousejs/dot";

const mouse = new Supermouse({
  plugins: [Dot({ size: 8 })]
});
```

Or write a plugin directly:

```ts
import { Supermouse } from "@supermousejs/core";

const dot = document.createElement("div");
// ... style dot ...

const redDot = {
  name: "red-dot",
  install(app) {
    app.stage.appendChild(dot);
  },
  update(app) {
    const { smooth } = app.state;
    dot.style.transform = `translate3d(${smooth.x}px, ${smooth.y}px, 0)`;
  },
  destroy() {
    dot.remove();
  }
};

const mouse = new Supermouse({ plugins: [redDot] });
```

> Mount plugin elements to `app.stage`, not to `document.body`, so cursor suppression, scope switching, and cleanup work automatically.

## Options

| Option                  | Default                                                                 | Description                                                    |
| ----------------------- | ----------------------------------------------------------------------- | -------------------------------------------------------------- |
| `smoothness`            | `0.15`                                                                  | Lower = smoother cursor follow                                 |
| `hoverSelectors`        | `["a", "button", "input", "textarea", "[data-hover]", "[data-cursor]"]` | Selectors that set `state.isHover`                             |
| `enableTouch`           | `false`                                                                 | Allow touch events to move the cursor                          |
| `autoDisableOnMobile`   | `true`                                                                  | Disable on coarse-pointer devices                              |
| `cursor`                | `"auto"`                                                                | `"auto"`, `"custom"`, `"native"`, or `"both"`                  |
| `cursorPolicy`          | `DEFAULT_CURSOR_POLICY`                                                 | Rules for native-cursor fallback and CSS suppression           |
| `inheritDataAttributes` | `true`                                                                  | Cascade `data-*` attributes and `rules` from ancestors         |
| `hideOnLeave`           | `true`                                                                  | Hide when the pointer leaves the window                        |
| `container`             | `document.body`                                                         | Primary scope's container                                      |
| `scopes`                | —                                                                       | Additional scopes registered at construction                   |
| `zIndex`                | `9999`                                                                  | Stage stacking order                                           |
| `dataPrefix`            | `"supermouse"`                                                          | Prefix for data attributes                                     |
| `rules`                 | —                                                                       | Map of selectors to interaction data                           |
| `plugins`               | —                                                                       | Plugins to install at creation                                 |
| `autoStart`             | `true`                                                                  | Set `false` and call `.start()` manually                       |

## Cursor Modes

The `cursor` option decides which cursor(s) to show:

- `"auto"` — native cursor on elements that should own it (inputs, links), custom elsewhere.
- `"custom"` — always custom, hide native.
- `"native"` — always native, hide custom.
- `"both"` — show both native and custom together.

Change at runtime with `mouse.setCursor("both")`.

The [Cursor Policy](#cursor-policy) decides which elements are considered native in `"auto"` mode.

## Cursor Policy

A single object maps selectors to two independent flags:

- `native` — in `"auto"` mode, matching elements yield to the OS cursor.
- `hide` — when the custom cursor is active, matching elements get `cursor: none !important`.

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

Or shorthand:

```ts
const mouse = new Supermouse({
  cursorPolicy: {
    native: ["input", "textarea", "select", "[data-native]"],
    hide: ["a", "button", "[role='button']"]
  }
});
```

## Scopes

A single Supermouse instance can own multiple scopes. Each scope has its own container, cursor mode, hover selectors, cursor policy, and plugins. The innermost scope containing the pointer is the active one.

```ts
const mouse = new Supermouse({
  scopes: [
    { name: "main", container: document.body, plugins: [Dot({ color: "red" })] },
    { name: "sidebar", container: sidebarEl, cursor: "custom" }
  ]
});
```

Or add at runtime:

```ts
const handle = mouse.addScope({ container: modalEl, cursor: "both" });
handle.setCursor("auto");
handle.remove();
```

The single-container form is shorthand for one scope:

```ts
const mouse = new Supermouse({ container: modalEl, cursor: "custom" });
```

## Native Cursor Fallback

In `"auto"` mode, add `data-supermouse-ignore` to force the native cursor on an element and its descendants:

```html
<div data-supermouse-ignore>Native cursor here</div>
```

## Data Attributes

Plugins can react to `data-*` attributes (e.g. `data-supermouse-color`). Attributes cascade from ancestors to the hovered element when `inheritDataAttributes` is `true`. Change the prefix with `dataPrefix`.

## Rules

Define interaction data without writing many attributes:

```ts
const mouse = new Supermouse({
  rules: {
    ".primary-action": { magnetic: true, color: "red" }
  }
});
```

Rules match ancestors as well as the hovered element. HTML `data-*` attributes override rule values per property.

## API

```ts
mouse.state;      // current MouseState
mouse.options;    // resolved options
mouse.stage;      // DOM element plugins render into
mouse.container;  // container element (active scope)
mouse.isEnabled;  // input processing flag
mouse.isRunning;  // animation loop flag

mouse.enable();                 // start input, apply cursor state
mouse.disable();                // stop input, restore native cursor
mouse.disable({ reset: true }); // also reset physics and hover state
mouse.reset();                  // reset state only

mouse.setCursor(mode);          // "auto" | "custom" | "native" | "both"

mouse.addScope(config);         // -> { name, container, setCursor, remove }

mouse.use(plugin);              // install plugin
mouse.getPlugin(name);          // retrieve plugin
mouse.enablePlugin(name);       // enable plugin
mouse.disablePlugin(name);      // disable plugin
mouse.togglePlugin(name);       // toggle plugin

mouse.registerHoverTarget(sel); // add hover selector at runtime
mouse.start();                  // start animation loop
mouse.step(time);               // advance one frame manually
mouse.destroy();                // destroy instance and plugins
```

## Browser Support

All modern browsers.

## License

MIT