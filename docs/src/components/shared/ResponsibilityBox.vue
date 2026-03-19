<script setup lang="ts">
defineProps<{
  title?: string;
}>();
</script>

<template>
  <div class="p-4 bg-zinc-50 border border-zinc-200 text-xs text-zinc-500 font-mono space-y-1">
    <span
      v-if="title"
      class="block font-bold text-zinc-900 mb-1 uppercase tracking-widest text-[10px]"
    >
      {{ title }}
    </span>
    <slot />
  </div>
</template>
