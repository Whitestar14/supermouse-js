---
title: Installation
description: Install the core engine and the plugins you need, then mount a single instance.
section: Guide
order: 2
---

## Package manager

The engine and every plugin are separate packages, so you only pay for what you
register. Start with the core plus one shape plugin:

```bash
pnpm add @supermousejs/core @supermousejs/dot
```

Add more as you need them:

```bash
pnpm add @supermousejs/ring @supermousejs/magnetic @supermousejs/states
```

`@supermousejs/core` and `@supermousejs/utils` have **no runtime
dependencies** — everything else depends only on `utils`. All packages ship ESM
and UMD builds.

## Mounting

Create one instance per page and keep a reference to it:

```typescript
import { Supermouse } from "@supermousejs/core";
import { Dot } from "@supermousejs/dot";
import { Ring } from "@supermousejs/ring";

const app = new Supermouse({
  smoothness: 0.15,
  cursor: "auto",
  plugins: [Ring({ size: 24 }), Dot({ size: 8 })]
});

// Registering later works too, and is chainable:
// app.use(Ring({ size: 24 })).use(Dot({ size: 8 }));
```

`cursor: "auto"` is the default and the best starting point: the engine hides
the OS pointer over interactive elements and restores it over text inputs,
`select` elements and anything marked with
[`data-supermouse-ignore`](/docs/guide/usage#opting-out). Use
`cursor: "custom"` only when you want the native pointer suppressed everywhere.

## Framework adapters

The adapters own the instance lifecycle — you never call `destroy()` yourself.

```bash
pnpm add @supermousejs/vue @supermousejs/core @supermousejs/dot
# or
pnpm add @supermousejs/react @supermousejs/core @supermousejs/dot
```

See [Vue integration](/docs/integrations/vue) and
[React integration](/docs/integrations/react).

## CDN / script tag

For pages without a bundler, the packages expose UMD builds on a global
namespace:

```html
<script src="https://unpkg.com/@supermousejs/core"></script>
<script src="https://unpkg.com/@supermousejs/dot"></script>
<script src="https://unpkg.com/@supermousejs/ring"></script>

<script>
  const { Supermouse } = window.SupermouseCore;
  const { Dot } = window.SupermouseDot;
  const { Ring } = window.SupermouseRing;

  new Supermouse({ smoothness: 0.15 }).use(Ring({ size: 24 })).use(Dot({ size: 8 }));
</script>
```

If your UMD globals differ, check the `unpkg`/`jsdelivr` field in each
package's `package.json` before copying the snippet.

## Cleanup

In a single-page app or under hot module replacement, call `destroy()` when the
owner unmounts. It cancels the animation frame, removes window listeners, deletes
the stage element and its stylesheet, and runs `destroy()` on every plugin.

```typescript
onUnmounted(() => {
  app.destroy();
});
```

The Vue and React adapters do this for you. If you mount manually inside a
component that re-mounts (React Strict Mode, HMR), forgetting `destroy()` is the
most common cause of duplicated cursors — see
[Troubleshooting](/docs/guide/troubleshooting).

## Server rendering

`Supermouse` reads `window` in its constructor, so construct it on the client.
In Nuxt, either use the adapter or guard the construction:

```typescript
if (import.meta.client) {
  const app = new Supermouse();
}
```

The docs site itself is fully prerendered — a cursor engine simply has nothing
to do until the browser exists.

## Next steps

- [Basic Usage](/docs/guide/usage) — options, hover rules and lifecycle control.
- [Options reference](/docs/reference/options) — every field with its default.
