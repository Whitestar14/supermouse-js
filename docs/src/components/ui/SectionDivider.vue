<script setup lang="ts">
defineProps<{
  size?: "sm" | "md" | "lg";
}>();
</script>

<template>
  <div
    :class="[
      'border-t border-zinc-200',
      size === 'sm' ? 'pt-8' : size === 'lg' ? 'pt-16' : 'pt-12',
      size === 'sm' ? 'mt-8' : size === 'lg' ? 'mt-16' : 'mt-12'
    ]"
  >
    <slot />
  </div>
</template>
