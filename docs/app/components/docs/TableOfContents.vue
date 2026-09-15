<script setup lang="ts">
import type { TocSection } from "@composables/useToc";

defineProps<{
  sections: TocSection[];
  activeSection: string;
}>();
</script>

<template>
  <div>
    <div class="font-mono text-xs font-bold uppercase tracking-widest text-zinc-400 mb-3">
      On This Page
    </div>
    <nav class="flex flex-col gap-1 text-sm">
      <a
        v-for="section in sections"
        :key="section.id"
        :href="`#${section.id}`"
        class="transition-colors leading-snug"
        :class="[
          section.depth === 3 ? 'pl-3 text-xs' : 'text-sm',
          activeSection === section.id
            ? 'text-black font-semibold'
            : section.depth === 3
              ? 'text-zinc-400 hover:text-zinc-700'
              : 'text-zinc-600 hover:text-black'
        ]"
      >
        {{ section.label }}
      </a>
    </nav>
  </div>
</template>
