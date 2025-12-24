
# @supermousejs/vue

Vue 3 integration for Supermouse.

## Installation

```bash
pnpm add @supermousejs/vue @supermousejs/core
```

## Usage

**In `App.vue` (Root):**

```vue
<script setup>
import { provideSupermouse } from '@supermousejs/vue';
import { Dot } from '@supermousejs/dot';

provideSupermouse({ smoothness: 0.15 }, [
  Dot({ size: 8 })
]);
</script>
```

**In Components:**

```vue
<script setup>
import { useSupermouse } from '@supermousejs/vue';

const mouse = useSupermouse(); // Returns Ref<Supermouse | null>
</script>
```
