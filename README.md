Here is the full README with **How it works**, **Options**, **API**, and **Plugins** rewritten to ADS-STE100. The **State Contract** and **cacheCursorStyle** sections from the previous pass are preserved unchanged.

````markdown
# Supermouse.js

[![npm version](https://img.shields.io/npm/v/@supermousejs/core.svg?style=flat-square)](https://www.npmjs.com/package/@supermousejs/core)
[![npm downloads](https://img.shields.io/npm/dm/@supermousejs/core.svg?style=flat-square)](https://www.npmjs.com/package/@supermousejs/core)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)

**supermouse** is a physics-based custom cursor engine for the web. Tracks the pointer, smooths
its motion with framerate-independent damping, hides the native OS cursor,
detects hover/native-input states, and exposes a small plugin architecture so
you can build cursor effects (magnetism, trails, shape morphing, text labels)
without touching the core.

Read the full documentation [here](https://supermouse.js.org)

## Install

```bash
pnpm add @supermousejs/core
```
````

or

```bash
npm install @supermouse/core
```

## Quick start

```ts
import { Supermouse } from "@supermousejs/core";

const mouse = new Supermouse();
```

A smoothed custom cursor now follows the pointer, hides the
native cursor over interactive elements, and auto-disables itself on
touch/coarse-pointer devices.

You can then pass plugins directly to the constructor

```ts
import { Dot } from "@supermousejs/dot";
import { Ring } from "@supermousejs/ring";

const app = new Supermouse({
  plugins: [Dot({ size: 8 }), Ring({ size: 24 })]
});
```

or you can chain them imperatively (To learn how to write plugins, see [Plugins](./PLUGINS.md).)

```ts
app.use(Dot({ size: 8 })).use(Ring({ size: 24 }));
```

## How it works

One instance manages three internal parts:

**`Input`**
This class listens to pointer events. It listens to `pointermove`, `pointerdown`, `pointerup`, `mouseover`, and `mouseout`. It writes data to the shared `MouseState`. Only this class can write to these properties:

- `pointer`
- `isDown`
- `isHover`
- `isNative`
- `hoverTarget`
- `interaction`
- `reducedMotion`

**`Stage`**
This class creates the DOM container that your plugin renders into. It hides the native OS cursor with a stylesheet, which is faster than writing inline styles on each element.

**`Supermouse`**
This class runs the `requestAnimationFrame` loop, reads the raw pointer position from `Input` and applies damping to produce `state.smooth`. Then it calls each plugin's `update()` once per frame.

## Options

| Option                | Default                                                                 | Notes                                                                                                                                          |
| --------------------- | ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `smoothness`          | `0.15`                                                                  | Lower = smoother/slower follow.                                                                                                                |
| `hoverSelectors`      | `["a", "button", "input", "textarea", "[data-hover]", "[data-cursor]"]` | Selectors that set `state.isHover` to `true`.                                                                                                  |
| `enableTouch`         | `false`                                                                 | Whether touch events move the cursor.                                                                                                          |
| `autoDisableOnMobile` | `true`                                                                  | Checks if the device has a fine pointer. Independent of `enableTouch`.                                                                         |
| `ignoreOnNative`      | `"auto"`                                                                | `"tag"` = check HTML tags only (fast). `"css"` = check computed `cursor` style (slow). `"auto"` = both. `null` = never show the native cursor. |
| `cacheCursorStyle`    | `false`                                                                 | Caches cursor style data per element. **Off by default** — see below.                                                                          |
| `hideCursor`          | `true`                                                                  | Whether the core hides the native cursor.                                                                                                      |
| `hideOnLeave`         | `true`                                                                  | Hides the cursor when the pointer leaves the browser window.                                                                                   |
| `container`           | `document.body`                                                         | The area where the instance is active. Default is the full page.                                                                               |
| `zIndex`              | `9999`                                                                  | The stack order of the cursor stage. Increase this if overlays cover the cursor.                                                               |
| `dataPrefix`          | `"supermouse"`                                                          | A prefix for `data-*` attributes. Prevents conflicts between instances.                                                                        |
| `rules`               | —                                                                       | A map of selectors to interaction data. The core adds this data to `state.interaction` on hover.                                               |
| `resolveInteraction`  | —                                                                       | A custom function to set interaction data. This bypasses `rules` and data attributes.                                                          |
| `plugins`             | —                                                                       | Plugins to install when you create the instance.                                                                                               |
| `autoStart`           | `true`                                                                  | Set to `false` to prevent automatic start. Call `.start()` when ready.                                                                         |

### A Note on `cacheCursorStyle`

When `ignoreOnNative` is `"css"` or `"auto"`, the core reads the `cursor` style of each element using `getComputedStyle()`.

You can make the core cache this data so the core does not read the style again when you hover the same element. This can help performance, but it is disabled by default for use in reactive frameworks like Vue/React, in which case you would **not use the cache if your application changes element styles.** because the element stays in the DOM, but its `cursor` style can change. The cache will keep the old data and Supermouse will then read the wrong `cursor` style.

Use the cache only when:

- Elements do not change their `cursor` style (such as with plain HTML), or
- You know that `"css"` or `"auto"` is slow in your application.

In most cases, you do not need the cache. The core reads the style only when you hover an element. It does not read the style on each frame.

## API

```ts
const mouse = new Supermouse(options?);

mouse.state              // MouseState. Read this in plugins. Do not change it outside Input or the tick loop.
mouse.options             // All options with defaults applied
mouse.container           // The DOM element that plugins render into
mouse.isEnabled           // Returns `true` if the instance processes input

mouse.enable()            // Start input processing. Hide the native cursor. Snap to the last known pointer position.
mouse.disable()           // Stop input processing. Show the native cursor. Reset the state.
mouse.freeze()            // Pause input and hide the stage. Do not change native cursor CSS. Use this when another instance takes control.
mouse.unfreeze()          // Resume input and show the stage. Snap to the live pointer to prevent a sweep from a stale position.

mouse.setNativeCursor("hide" | "show" | "auto")  // Force the native cursor state. This overrides auto-detection.

mouse.use(plugin)         // Install a plugin
mouse.getPlugin(name)     // Get a plugin by name
mouse.enablePlugin(name)  // Enable a disabled plugin
mouse.disablePlugin(name) // Disable a plugin
mouse.togglePlugin(name)  // Enable a plugin if it is disabled. Disable it if it is enabled.

mouse.registerHoverTarget(selector)  // Add a selector at runtime. The core detects hover on this selector and hides the native cursor for it.

mouse.start()             // Start the animation loop if it is stopped
mouse.step(time)          // Advance one frame manually
mouse.destroy()           // Remove all listeners, DOM elements, and plugins
```

## Plugins

```ts
interface SupermousePlugin {
  name: string;
  priority?: number;
  isEnabled?: boolean;
  element?: HTMLElement;

  install?(instance: Supermouse): void;
  update?(instance: Supermouse, deltaTime: number): void;
  destroy?(instance: Supermouse): void;
  onEnable?(instance: Supermouse): void;
  onDisable?(instance: Supermouse): void;
}
```

If a plugin crashes in `update()`, the core catches the error. The core disables the plugin and writes an error message. Then it calls `onDisable()` and `destroy()`. The rest of the instance continues to run.

### The State Contract

The core gives all plugins the same `state` object. The core does not make a copy for each plugin. This helps performance. But you must know which properties you can change.

**Do not change these properties in a plugin:**

- `pointer`
- `isDown`
- `isHover`
- `isNative`
- `hoverTarget`
- `interaction`
- `reducedMotion`

Only `Input` changes these properties.

**Do not change these properties unless you must:**

- `target`
- `smooth`
- `velocity`
- `angle`

The core tick loop changes these properties. If your plugin must change them (for example, a magnet effect), set a high `priority` number. A high number makes your plugin run after the core loop. Then your changes will stay.

**You can change these properties:**

- `shape`
- Properties you add to `InteractionState`

If your plugin reads a property, your plugin can write to that property.

### Reacting to hover metadata

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

## Browser support

There is no IE11/legacy Edge support as Supermouse requires `PointerEvent`, `matchMedia`, `WeakMap`, `AbortController`, and
`requestAnimationFrame`

## Ecosystem & Ownership

Plugins are generally expected to be published independently so you don't need to contribute to this repo to extend supermouse. The `@supermousejs/*` scope contains core and reference plugins only, but community plugins are encouraged.

## Contributing

Any bug fixes, performance improvement or docs improvement are welcome. Before adding new effects or features to core, read **[CONTRIBUTING.md](./CONTRIBUTING.md)**

## License

MIT

maintained by [Whitestar14](https://github.com/Whitestar14)
