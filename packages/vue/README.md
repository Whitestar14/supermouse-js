# @supermousejs/vue

Vue 3 integration for Supermouse.

## Installation

```bash
pnpm add @supermousejs/vue @supermousejs/core
```

## Usage

In `App.vue`/root file:

```vue
<script setup>
import { provideSupermouse } from "@supermousejs/vue";
import { Dot } from "@supermousejs/dot";

const { instance, isEnabled } = provideSupermouse({ smoothness: 0.15 }, [Dot({ size: 8 })]);
</script>
```

And in your components:

```vue
<script setup>
import { useSupermouse } from "@supermousejs/vue";

const { instance, isEnabled } = useSupermouse();

function toggleCursor() {
  if (instance.value) {
    if (isEnabled.value) instance.value.disable();
    else instance.value.enable();
  }
}
</script>

<template>
  <button @click="toggleCursor">{{ isEnabled ? "Disable" : "Enable" }} Cursor</button>
</template>
```

`provideSupermouse()` and `useSupermouse()` both return:

- `instance`: A `Ref<SupermouseInstance | null>`.
- `isEnabled`: A `Ref<boolean>` that stays in sync with `enable()` / `disable()`.

## Documentation

Full documentation and interactive playground: [supermouse.js.org](https://supermouse.js.org)
Repository: [github.com/Whitestar14/supermouse-js](https://github.com/Whitestar14/supermouse-js)
