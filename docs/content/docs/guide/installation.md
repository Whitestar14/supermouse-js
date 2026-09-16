---
title: Installation
description: Install the core engine and the plugins you need, then mount a single instance.
section: Guide
order: 2
---

## Package manager

The engine and every other other plugin are separate packages, so you only pay for what you
register. Start with the core plus one shape plugin:

```bash
pnpm add @supermousejs/core @supermousejs/dot
```

Add then, you can add more as you need them:

```bash
pnpm add @supermousejs/ring @supermousejs/magnetic @supermousejs/states
```

`@supermousejs/core` has no runtime
dependencies, while every other plugin depends on `@supermousejs/utils` except `utils` itself as a recommended convention if you plan on writing plugins yourself. All packages ship ESM
and UMD builds.

You can see the full list of the official supermouse plugins in [Cookbook](/docs/guide/cookbook).

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

  const mouse = new Supermouse({ smoothness: 0.15 }).use(Ring({ size: 24 })).use(Dot({ size: 8 }));
</script>
```

If your UMD globals differ, check the `unpkg`/`jsdelivr` field in each
package's `package.json` before copying the snippet.

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

// Registering later works too, and is chainable with `.use`:
// app.use(Ring({ size: 24 })).use(Dot({ size: 8 }));
```

`cursor: "auto"` is the default and the best starting point, this option has it that the engine hides
the OS pointer over interactive elements and restores it over text inputs,
`select` elements and anything marked with
[`data-supermouse-ignore`](/docs/guide/usage#opting-out). Use
`cursor: "custom"` only when you want the native pointer suppressed everywhere.

## Cleanup

In a single-page app or under hot module replacement, call `destroy()` when the
owner, usually your root file such as `App.vue`, unmounts. It cancels the animation frame, removes window listeners, deletes
the stage element and its stylesheet, and runs `destroy()` on every plugin.

```typescript
onUnmounted(() => {
  app.destroy();
});
```

The [Vue](/docs/integrations/vue) / [React](/docs/integrations/react) adapters automatically do this for you. If you mount manually inside a
component that re-mounts (e.g. React Strict Mode, HMR), forgetting `destroy()` is the
most common cause of duplicated cursors in UI frameworks — see
[Troubleshooting](/docs/guide/troubleshooting) if you run into any issues.
