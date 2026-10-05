---
title: Installation
description: Install the core engine and plugins via package managers or CDN script tags.
section: Guide
order: 2
---

Supermouse is modular by design: the core engine and each plugin ship as their own package, so you install only the pieces you actually use. Nothing in the core pulls a visual effect in behind your back.

## Package Manager

Install the core package along with your chosen visual plugins:

```bash
# pnpm
pnpm add @supermousejs/core @supermousejs/dot @supermousejs/ring

# npm
npm install @supermousejs/core @supermousejs/dot @supermousejs/ring

# yarn
yarn add @supermousejs/core @supermousejs/dot @supermousejs/ring
```

`@supermousejs/core` has **zero runtime dependencies**. Official plugins depend solely on `@supermousejs/utils` for shared DOM, math, and SVG utilities. All packages ship ESM and UMD builds.

Every official plugin is listed in the sidebar, and the [Cookbook](/docs/guide/cookbook) shows them working together.

---

## CDN / Script Tag

For static HTML pages or quick prototyping without a build step, load the UMD bundles via a CDN like unpkg or jsDelivr:

```html
<script src="https://unpkg.com/@supermousejs/core"></script>
<script src="https://unpkg.com/@supermousejs/dot"></script>
<script src="https://unpkg.com/@supermousejs/ring"></script>

<script>
  const { Supermouse } = window.SupermouseCore;
  const { Dot } = window.SupermouseDot;
  const { Ring } = window.SupermouseRing;

  const mouse = new Supermouse({ smoothness: 0.15 })
    .use(Ring({ size: 24 }))
    .use(Dot({ size: 8 }));
</script>
```

---

## Initializing Supermouse

Create an instance and retain a reference to it, typically in your root application file (e.g., `App.vue`, `layout.tsx`, or main entry script):

```typescript
import { Supermouse } from "@supermousejs/core";
import { Dot } from "@supermousejs/dot";
import { Ring } from "@supermousejs/ring";

const app = new Supermouse({
  smoothness: 0.15,
  cursor: "auto",
  plugins: [Ring({ size: 24 }), Dot({ size: 8 })]
});

// Additional plugins can be registered dynamically via .use()
// app.use(MyCustomPlugin());
```

`cursor: "auto"` is the default and recommended mode. In this mode, Supermouse hides the native OS cursor over standard interactive elements, but automatically restores it over text inputs, textareas, selects, and elements marked with [`data-supermouse-ignore`](/docs/guide/usage#opting-out-data-supermouse-ignore).

See [Options Reference](/docs/reference/api#supermouseoptions) for details on all constructor options.

---

## Lifecycle and Teardown

In single-page applications or components subject to hot-module replacement (HMR), invoke `destroy()` when the owning component or page unmounts:

```typescript
// Example: Vue 3 / Nuxt
onUnmounted(() => {
  app.destroy();
});
```

```typescript
// Example: React useEffect
useEffect(() => {
  const app = new Supermouse({ plugins: [Dot({ size: 8 })] });
  return () => {
    app.destroy();
  };
}, []);
```

Calling `destroy()` cleanly removes animation frames, window and container listeners, disposes of stage elements and injected stylesheets, and calls `destroy()` on all active plugins.

If you are using our official adapters for [Vue](/docs/integrations/vue) or [React](/docs/integrations/react), lifecycle teardown is handled automatically.
