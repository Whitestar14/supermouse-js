---
title: Vue.js Integration
description: useSupermouse composable and provideSupermouse for Vue 3 and Nuxt.
section: Integrations
order: 1
package: @supermousejs/vue
dependency: vue >= 3.2.0
license: MIT
---

The Vue adapter wraps `@supermousejs/core` in `provide` / `inject` and owns the
engine lifecycle, so you never call [`destroy()`](/docs/reference/methods#destroy)
by hand.

## Installation

```bash
pnpm add @supermousejs/vue @supermousejs/core @supermousejs/dot
```

## Root provider

Call `provideSupermouse` once at the root. It takes the same options as the
[Supermouse constructor](/docs/reference/options) plus an array of plugins.

```vue
<script setup>
import { provideSupermouse } from "@supermousejs/vue";
import { Dot } from "@supermousejs/dot";

provideSupermouse({ smoothness: 0.15, cursor: "custom" }, [Dot({ size: 8, color: "black" })]);
</script>

<template>
  <RouterView />
</template>
```

The engine is created in `onMounted` and torn down in `onUnmounted`, so it is
safe under SSR: nothing touches `window` during render.

## Reading the instance

`useSupermouse()` returns the injected context:

```typescript
interface SupermouseContext {
  instance: Ref<SupermouseInstance | null>;
  isEnabled: Ref<boolean>;
}
```

`instance` is `null` until mount, so guard before reading
[state](/docs/reference/state) or calling methods. `isEnabled` stays in sync
with `enable()` / `disable()`.

```vue
<script setup>
import { useSupermouse } from "@supermousejs/vue";

const { instance, isEnabled } = useSupermouse();

const toggle = () => {
  if (!instance.value) return;
  isEnabled.value ? instance.value.disable() : instance.value.enable();
};
</script>
```

## Nuxt

No `<ClientOnly>` wrapper is needed — `provideSupermouse` defers to
`onMounted`. Calling it from a layout or `app.vue` is enough:

```vue
<!-- app.vue -->
<script setup>
import { provideSupermouse } from "@supermousejs/vue";
import { Dot } from "@supermousejs/dot";

provideSupermouse({ smoothness: 0.05 }, [Dot({ size: 8 })]);
</script>
```

If you also want the cursor to react to route changes, read `instance` inside a
`watch` in a child component rather than re-providing the engine per page.
