<script setup lang="ts">
import { computed } from "vue";
import { resolveApiHref } from "@composables/useApiReference";

const props = defineProps<{
  to: string;
}>();

const href = computed(() => resolveApiHref(props.to));
</script>

<template>
  <a
    :href="href"
    :data-supermouse-text="`Jump to API: ${to}`"
    class="link"
  >
    <slot>{{ to }}</slot>
  </a>
</template>
