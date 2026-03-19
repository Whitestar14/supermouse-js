<script setup lang="ts">
defineProps<{
  level?: 1 | 2 | 3 | 4;
  dot?: boolean;
}>();
</script>

<template>
  <component
    :is="`h${level || 3}`"
    class="text-zinc-900 font-bold tracking-tighter flex items-center gap-3 mb-4"
    :class="{
      'text-4xl': level === 1,
      'text-3xl': level === 2,
      'text-xl': level === 3 || !level,
      'text-lg': level === 4,
    }"
  >
    <div v-if="dot" class="w-2 h-2 bg-black flex-shrink-0"></div>
    <slot />
  </component>
</template>
