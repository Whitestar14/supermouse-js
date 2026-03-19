<script setup lang="ts">
defineProps<{
  number: string | number;
  title: string;
  divider?: boolean;
}>();
</script>

<template>
  <div :class="['flex flex-col gap-4', divider && 'border-t border-zinc-200 pt-12']">
    <h3 class="text-xl font-bold text-zinc-900 flex items-center gap-3">
      <span
        class="w-6 h-6 bg-black text-white flex items-center justify-center text-xs font-mono rounded-sm flex-shrink-0"
      >
        {{ String(number).padStart(2, "0") }}
      </span>
      {{ title }}
    </h3>
    <slot />
  </div>
</template>
