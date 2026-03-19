<script setup lang="ts">
import { useRouter } from "vue-router";

defineProps<{
  to: string; // anchor id, e.g., "smoothness", "use", "state"
}>();

const router = useRouter();

const navigate = (anchor: string) => {
  router.push({ path: "/docs/reference/api", hash: `#${anchor}` });
};
</script>

<template>
  <button
    :data-supermouse-text="`Jump to API: ${to}`"
    class="text-black font-semibold underline underline-offset-2 hover:text-zinc-600 transition-colors cursor-pointer border-none bg-none p-0 font-inherit text-inherit"
    @click="navigate(to)"
  >
    <slot>{{ to }}</slot>
  </button>
</template>
