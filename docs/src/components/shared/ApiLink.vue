<script setup lang="ts">
import { computed } from "vue";
import { resolveApiHref } from "@config/api-anchors";

const props = defineProps<{
  to: string;
}>();

const href = computed(() => resolveApiHref(props.to));
</script>

<template>
  <a
    :href="href"
    :data-supermouse-text="`Jump to API: ${to}`"
    class="text-black font-bold underline decoration-dotted decoration-zinc-300 underline-offset-4 hover:decoration-black transition-all"
  >
    <slot>{{ to }}</slot>
  </a>
</template>
