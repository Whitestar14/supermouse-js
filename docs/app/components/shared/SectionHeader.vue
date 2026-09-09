<script setup lang="ts">
import { computed, useSlots } from "vue";

const props = defineProps<{
  level?: 1 | 2 | 3 | 4;
  dot?: boolean;
  id?: string;
}>();

const slots = useSlots();

const generatedId = computed(() => {
  if (props.id) return props.id;
  if (!slots.default) return "";
  try {
    const nodes = slots.default();
    let text = "";
    for (const node of nodes) {
      if (typeof node.children === "string") text += node.children;
      else if (typeof node.children === "object" && node.children !== null) {
        text += String(node.children);
      }
    }
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  } catch (e) {
    return "";
  }
});
</script>

<template>
  <component
    :is="`h${level || 3}`"
    :id="generatedId"
    class="text-zinc-900 font-bold tracking-tighter flex items-center gap-3 mb-3 group relative"
    :class="{
      'text-4xl mb-12': level === 1,
      'text-3xl mb-6': level === 2,
      'text-xl mb-3': level === 3 || !level,
      'text-lg mb-1.5': level === 4
    }"
  >
    <a
      v-if="generatedId"
      :href="`#${generatedId}`"
      class="absolute -left-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-zinc-300 hover:text-black hidden md:flex items-center justify-center w-6 h-6 text-xl font-light"
      aria-label="Link to section"
    >
      #
    </a>
    <div v-if="dot" class="w-2 h-2 bg-black flex-shrink-0" />
    <slot />
  </component>
</template>
