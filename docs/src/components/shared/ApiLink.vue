<script setup lang="ts">
import { computed } from "vue";
import { resolveApiHref } from "@composables/useApiReference";

const props = defineProps<{
  to: string;
}>();

const href = computed(() => resolveApiHref(props.to));
</script>

<template>
  <RouterLink
    :to="href"
    replace
    :data-supermouse-text="`Jump to API: ${to}`"
    class="link cursor-pointer text-black font-bold underline decoration-dotted decoration-zinc-300 underline-offset-4 hover:decoration-black transition-all"
  >
    <slot>{{ to }}</slot>
  </RouterLink>
</template>
