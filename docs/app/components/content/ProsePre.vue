<script setup lang="ts">
import { computed } from "vue";
import { highlight } from "@utils/highlight";

/**
 * Markdown code fences are highlighted with the same highlighter as
 * `CodeBlock.vue`. Shiki is disabled in nuxt.config so @nuxtjs/mdc no longer
 * injects `shiki` classes/styles that would override this shell — the raw
 * source always arrives here via MDC's `code` prop.
 */
const props = defineProps<{
  code?: string;
  language?: string | null;
  class?: string | null;
}>();

const html = computed(() => highlight(props.code ?? "", props.language || "ts"));
</script>

<template>
  <pre
    class="my-6 overflow-x-auto rounded-md bg-[#09090b] p-4 text-sm leading-relaxed"
    :class="props.class"
  ><code class="block" v-html="html" /></pre>
</template>
