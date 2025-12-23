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

## runtime model (mental map)

supermouse runs a deterministic pipeline every frame:

1. input system updates raw pointer
2. **logic plugins** (`priority < 0`) may modify `state.target`
3. core physics interpolates `state.smooth`
4. **visual plugins** (`priority >= 0`) render using `state.smooth`

> plugins are sorted by priority **once**, at registration.

## logic vs visual plugins

logic plugins modify where the cursor goes and write to `app.state.target`. they generally should not touch the DOM and usually use negative priority to run before visual plugins do

```ts
const Gravity = {
  name: 'gravity',
  priority: -10,
  update(app) {
    app.state.target.y += 5;
  }
};
```

visual plugins render at the cursor position (`app.state.pointer`) or read `app.state.smooth`. they own DOM or canvas elements and are usually non-negative priority.

>if you write plugins with the plain object, there's no strict rule that says you can't write visual and logic code in the same file, however **it is recommended** to keep them apart.

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
supermousejs is optimized for performance, therefore when writing plugins, these general rules should help guide you through writing for an engine running at 60fps on the hot path.

1. do not create or destroy dom in update. Use pooling instead
2. do not read layout or query the dom in update (use `app.state.interaction` if you have to)
3. use transforms, not top/left
4. cache everything you can
5. respect reduced motion

plugins that violate this affect the entire app.

### interaction state (input-derived metadata)

to improve performance by avoiding querying the dom at the refresh rate of client monitor, `app.state.interaction` is pre-populated by the input system and ran once, representing metadata scraped from the currently hovered DOM element. `interaction` exists to avoid repeated DOM queries at 60–144fps. it is a perf cache, not a state store.
<br />
if you care about performance at all, read from it instead of querying the DOM yourself.

>mutating `interaction` is allowed but discouraged.
changes are not persistent and may affect other plugins reading in the same frame.

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