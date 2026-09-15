<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  id?: string;
  /** Heading level: 1, 2 or 3. */
  level: 1 | 2 | 3;
}>();

const CLASSES: Record<number, string> = {
  1: "text-3xl md:text-4xl mt-6 mb-4",
  2: "text-2xl md:text-3xl mt-12 mb-4",
  3: "text-xl mt-8 mb-3"
};

const tag = computed(() => `h${props.level}`);
const anchorSize = computed(() => (props.level >= 3 ? "text-base" : "text-xl"));
</script>

<template>
  <component
    :is="tag"
    :id="id"
    class="group relative flex items-center scroll-mt-28 font-bold tracking-tight text-zinc-900"
    :class="CLASSES[level]"
  >
    <a v-if="id" :href="`#${id}`" class="no-underline text-inherit flex items-center gap-2">
      <span><slot /></span>
      <span
        class="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-black font-mono font-normal select-none transition-opacity"
        :class="anchorSize"
        aria-hidden="true"
      >
        #
      </span>
    </a>
    <slot v-else />
  </component>
</template>
