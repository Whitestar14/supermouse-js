
<script setup lang="ts">
defineProps<{
  title?: string;
  variant?: 'neutral' | 'warning';
}>();
</script>

<template>
  <div 
    class="p-6 border text-sm my-8"
    :class="variant === 'warning' 
      ? 'bg-amber-50 border-amber-200 border-l-4 border-l-amber-500' 
      : 'bg-zinc-50 border-zinc-200 border-l-4 border-l-black'"
  >
    <strong v-if="title" class="block font-bold mb-2" :class="variant === 'warning' ? 'text-amber-900' : 'text-zinc-900'">
      {{ title }}
    </strong>
    <div :class="variant === 'warning' ? 'text-amber-800' : 'text-zinc-600'" class="leading-relaxed">
      <slot />
    </div>
  </div>
</template>
