<script setup lang="ts">
defineProps<{
  size?: "xs" | "sm" | "base" | "lg";
  color?: "default" | "muted" | "subtle";
  weight?: "normal" | "medium" | "bold";
  mono?: boolean;
}>();
</script>

<template>
  <p
    :class="[
      'leading-relaxed text-pretty mb-4',
      mono ? 'font-mono' : '',
      size === 'xs'
        ? 'text-xs'
        : size === 'sm'
          ? 'text-sm'
          : size === 'lg'
            ? 'text-lg'
            : 'text-base',
      color === 'muted' ? 'text-zinc-400' : color === 'subtle' ? 'text-zinc-500' : 'text-zinc-600',
      weight === 'medium' ? 'font-medium' : weight === 'bold' ? 'font-bold' : 'font-normal'
    ]"
  >
    <slot />
  </p>
</template>
