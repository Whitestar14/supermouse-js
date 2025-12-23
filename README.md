# supermouse.js

**supermouse** is a modular, high-performance cursor engine for the web.

it separates **cursor intent** (input, physics, logic) from **cursor rendering** (visuals),
and exposes a deterministic plugin pipeline for extending both.

supermouse is not a UI component. neither is it a "library" in the conventional sense.
it is a runtime.


## what it does

- smooths and interpolates pointer input
- manages hover + interaction state
- runs logic and visual plugins in a fixed pipeline
- renders cursor effects without layout thrashing
- stays out of your framework’s way

## installation

```bash
pnpm add @supermousejs/core
````

install only the plugins you want:

```bash
pnpm add @supermousejs/dot @supermousejs/ring
```


## basic usage

```ts
import { Supermouse } from '@supermousejs/core';
import { Dot } from '@supermousejs/dot';
import { Ring } from '@supermousejs/ring';

const app = new Supermouse({
  smoothness: 0.15,
  hideCursor: true,
});

app.use(Dot({ size: 8 }));
app.use(Ring({ size: 24 }));
```


## interaction model

supermouse uses data attributes to define interactive targets.

```html
<button data-supermouse-hover>hover</button>
<div data-supermouse-color="#00ff00">green</div>
<button data-supermouse-magnetic>snap</button>
```

plugins may read and write shared interaction state to cooperate.


## plugins are the point

supermouse is designed to be extended via plugins.

* logic plugins can redirect cursor intent
* visual plugins can render anything at the cursor
* plugins are isolated, ordered, and fault-tolerant

most effects should live **outside** the core.

👉 **read: [`PLUGINS.md`](./PLUGINS.md)**

## ecosystem & ownership

* plugins are expected to be published independently
* you do not need to contribute to this repo to extend supermouse
* the `@supermousejs/*` scope contains core + reference plugins only

community plugins are encouraged.


## repository layout

```text
packages/
  core/      runtime + loop
  utils/     shared helpers
  dot/       reference plugin
  ring/      reference plugin
playground/ interactive dev env
docs/       documentation
```

## contributing

bug fixes, performance improvements, and docs are welcome.

before adding new effects or features to core, read:

👉 **[`CONTRIBUTING.md`](./CONTRIBUTING.md)**

## license

MIT

maintained by [Whitestar14](https://github.com/Whitestar14)