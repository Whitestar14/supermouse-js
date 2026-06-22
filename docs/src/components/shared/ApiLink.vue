<script setup lang="ts">
import { useRouter } from "vue-router";

defineProps<{
  to: string;
}>();

const router = useRouter();

const navigate = async (anchor: string): Promise<void> => {
  await router.push({ path: "/docs/reference/api", hash: `#${anchor}` });
};
</script>

<template>
  <button
    :data-supermouse-text="`Jump to API: ${to}`"
    class="text-black font-bold underline decoration-dotted decoration-zinc-300 underline-offset-4 hover:decoration-black transition-all"
    @click="navigate(to)"
  >
    <slot>{{ to }}</slot>
  </button>
</template>
