---
title: Vue.js
description: useSupermouse and provideSupermouse for Vue 3 and Nuxt.
section: Integrations
order: 1
package: @supermousejs/vue
dependency: vue >= 3.2.0
license: MIT
---

The Vue adapter wraps `@supermousejs/core` in `provide` / `inject` and owns the lifecycle, so you never call [`destroy()`](/docs/reference/methods#destroy) by hand.

## Install

```bash
pnpm add @supermousejs/vue @supermousejs/core @supermousejs/dot
```

## Root provider

Call `provideSupermouse` once at the root. It takes the same options as the [constructor](/docs/reference/options), plus an array of plugins.

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

The instance is constructed in `onMounted` and destroyed in `onUnmounted`, so it is safe under SSR: nothing touches `window` during render. Options and plugins are read at mount time only — changing them later does nothing, because the engine was configured once.

## Reading the instance

```typescript
interface SupermouseContext {
  instance: Ref<SupermouseInstance | null>;
  isEnabled: Ref<boolean>;
}
```

`instance` is `null` until mount, so guard before reading [state](/docs/reference/state) or calling methods.

```vue
<script setup>
import { useSupermouse } from "@supermousejs/vue";

const { instance } = useSupermouse();

const toggle = () => {
  if (!instance.value) return;
  instance.value.isEnabled ? instance.value.disable() : instance.value.enable();
};
</script>
```

`isEnabled` tracks explicit `enable()` / `disable()` calls, because the adapter patches those two methods. It does not follow the engine's own hibernation on a coarse pointer — read `instance.value.isEnabled` when you need the real answer.

`useSupermouse()` warns and returns empty refs when no provider is above it, rather than throwing, so a component can render before the provider mounts.

## Nuxt

No `<ClientOnly>` wrapper is needed. Calling `provideSupermouse` from a layout or `app.vue` is enough:

```vue
<!-- app.vue -->
<script setup>
import { provideSupermouse } from "@supermousejs/vue";
import { Dot } from "@supermousejs/dot";

provideSupermouse({ smoothness: 0.05 }, [Dot({ size: 8 })]);
</script>
```

To react to route changes, watch `instance` in a child component instead of re-providing the engine per page.
