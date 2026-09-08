# Supermouse.js - TypeScript cursor engine

[![npm version](https://img.shields.io/npm/v/@supermousejs/core.svg?style=flat-square)](https://www.npmjs.com/package/@supermousejs/core)
[![npm downloads](https://img.shields.io/npm/dm/@supermousejs/core.svg?style=flat-square)](https://www.npmjs.com/package/@supermousejs/core)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)
![npm bundle size](https://img.shields.io/bundlephobia/minzip/%40supermousejs%2Fcore?label=minzip)

Supermouse is a headless, physics‑based cursor engine for the web written in TypeScript. It provides pointer tracking, state, physics, and a plugin lifecycle. You install plugins (or write your own) to render custom cursors and effects. The core is zero‑dependency and TypeScript‑first.

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

Or use the plugin interface directly:

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

## Options

| Option                | Default                                                                 | Description                                   |
| --------------------- | ----------------------------------------------------------------------- | --------------------------------------------- |
| `smoothness`          | `0.15`                                                                  | Lower = smoother cursor follow                |
| `hoverSelectors`      | `["a", "button", "input", "textarea", "[data-hover]", "[data-cursor]"]` | Selectors that set `state.isHover`            |
| `enableTouch`         | `false`                                                                 | Allow touch events to move cursor             |
| `autoDisableOnMobile` | `true`                                                                  | Disable on coarse‑pointer devices             |
| `cursor`              | `"auto"`                                                                | `"auto"`, `"custom"`, `"native"`, or `"both"` |
| `hideOnLeave`         | `true`                                                                  | Hide when pointer leaves window               |
| `container`           | `document.body`                                                         | Scoping container                             |
| `zIndex`              | `9999`                                                                  | Stage stacking order                          |
| `dataPrefix`          | `"supermouse"`                                                          | Prefix for data attributes                    |
| `rules`               | —                                                                       | Map of selectors to interaction data          |
| `plugins`             | —                                                                       | Plugins to install at creation                |
| `autoStart`           | `true`                                                                  | Set `false` and call `.start()` manually      |

## Cursor Modes

- `"auto"` – native cursor on interactive elements, custom elsewhere.
- `"custom"` – always custom, hide native.
- `"native"` – always native, hide custom.
- `"both"` – show both native and custom together.

Change at runtime with `mouse.setCursor("both")`.

## Containers & Multiple Instances

Scope an instance to a container:

```ts
const modal = document.getElementById("modal");
const mouse = new Supermouse({ container: modal, cursor: "custom" });
```

Multiple instances can coexist; CSS rules are scoped automatically.

## Native Cursor Fallback

In `"auto"` mode, add `data-supermouse-ignore` to force the native cursor on an element and its descendants.

```html
<div data-supermouse-ignore>Native cursor here</div>
```

## Data Attributes

Plugins can react to `data-*` attributes, e.g. `data-supermouse-color`. The prefix is configurable via `dataPrefix`.

## Rules

Define interaction data without writing many attributes:

```ts
const mouse = new Supermouse({
  rules: {
    ".primary-action": { magnetic: true, color: "red" }
  }
});
```

HTML `data-*` attributes override rule values per property.

## API

```ts
mouse.state; // current MouseState
mouse.options; // resolved options
mouse.stage; // DOM element plugins render into
mouse.isEnabled; // boolean

mouse.enable(); // start input, hide native cursor
mouse.disable(); // stop input, show native cursor, reset
mouse.suspend(); // pause non‑destructively
mouse.resume(); // resume from suspend

mouse.setCursor(mode); // "auto" | "custom" | "native" | "both"

mouse.use(plugin); // install plugin
mouse.getPlugin(name); // retrieve plugin
mouse.enablePlugin(name); // enable plugin
mouse.disablePlugin(name); // disable plugin
mouse.togglePlugin(name); // toggle plugin

mouse.registerHoverTarget(sel); // add hover selector at runtime
mouse.start(); // start animation loop
mouse.step(time); // advance one frame manually
mouse.destroy(); // destroy instance and plugins
```

## Browser Support

All modern browsers.

## License

MIT
