<script setup lang="ts">
defineProps<{
  /** Section label, e.g. "Guide" or the package name on plugin pages. */
  label: string;
  title: string;
  /** When set, the label is preceded by a link back to `/docs`. */
  crumb?: string;
}>();
</script>

<template>
  <div class="border-b border-border pb-8 mb-12">
    <div class="flex items-center gap-3 mb-4 min-w-0">
      <div class="w-2 h-2 bg-inverse shrink-0" />
      <div class="flex items-center gap-2 mono text-xs font-bold uppercase tracking-widest min-w-0">
        <template v-if="crumb">
          <NuxtLink to="/docs" class="text-subtle hover:text-inverse transition-colors shrink-0">
            {{ crumb }}
          </NuxtLink>
          <span class="text-faint shrink-0">/</span>
        </template>
        <span class="text-muted truncate">{{ label }}</span>
      </div>
    </div>

    <h1 class="text-5xl md:text-6xl font-bold tracking-tighter text-inverse leading-[0.9]">
      {{ title }}
    </h1>
  </div>
</template>
