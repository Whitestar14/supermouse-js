<script setup lang="ts">
import { computed } from "vue";
import { highlight } from "@utils/highlight";
import { usePlayground } from "@composables/usePlayground";

const props = defineProps<{
  code: string;
  title?: string;
  clean?: boolean;
  lang?: string;
  recipeId?: string;
}>();

const { open } = usePlayground();
const { copied, copy: writeToClipboard } = useClipboard(2000);

const highlightedCode = computed(() => {
  return highlight(props.code, props.lang || "typescript");
});

const copy = (): void => {
  void writeToClipboard(props.code);
};
</script>

<template>
  <div
    class="w-full flex flex-col font-mono text-sm group relative overflow-hidden"
    :class="clean ? '' : 'border border-border bg-code-surface'"
  >
    <!-- Header -->
    <div
      v-if="!clean"
      class="w-full px-4 py-3 bg-surface-muted border-b border-border flex items-center justify-between select-none shrink-0"
    >
      <div class="flex items-center gap-3">
        <span
          v-if="title"
          class="text-[10px] uppercase tracking-widest font-bold text-inverse bg-border/50 px-2 py-1"
        >
          {{ title }}
        </span>
        <span v-else class="text-[10px] uppercase tracking-widest font-bold text-subtle">
          Snippet
        </span>
      </div>

      <div class="flex items-center gap-4">
        <!-- Run Button -->
        <button
          v-if="recipeId"
          class="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted hover:text-accent transition-colors"
          @click="open(recipeId)"
        >
          <svg
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="currentColor"
            class="relative top-[-0.5px]"
          >
            <path d="M5 3l14 9-14 9V3z" />
          </svg>
          Run Live
        </button>

        <!-- Copy Button (Header) -->
        <button
          class="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest transition-colors"
          :class="copied ? 'text-accent' : 'text-subtle hover:text-inverse'"
          @click="copy"
        >
          <span v-if="copied">Copied</span>
          <span v-else>Copy</span>
          <svg
            v-if="!copied"
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
          >
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
          <svg
            v-else
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="3"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </button>

        <!-- Window Controls -->
        <div
          class="flex gap-1.5 opacity-50 grayscale group-hover:grayscale-0 group-hover:opacity-100 transition-all"
        >
          <div class="w-2.5 h-2.5 border border-subtle bg-border" />
          <div class="w-2.5 h-2.5 border border-subtle bg-border" />
        </div>
      </div>
    </div>

    <!-- Floating Copy Button (Clean Mode) -->
    <button
      v-if="clean"
      class="code-scroll absolute top-4 right-4 z-10 flex h-7 w-7 items-center justify-center border border-code-border bg-surface/80 text-code-muted opacity-0 backdrop-blur-sm transition-all duration-150 hover:text-strong group-hover:opacity-100 focus-visible:opacity-100"
      title="Copy to clipboard"
      @click="copy"
    >
      <svg
        v-if="!copied"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
      </svg>
      <svg
        v-else
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="3"
        class="text-accent"
      >
        <polyline points="20 6 9 17 4 12" />
      </svg>
    </button>

    <!-- Code Area -->
    <div class="w-full relative bg-code-surface text-code-text min-h-0 flex-1 overflow-hidden">
      <!-- Selection uses code-theme tokens; see index.css -->
      <pre
        class="code-scroll m-0 p-6 overflow-x-auto h-full w-full selection:bg-code-muted/40 selection:text-code-strong"
      ><code
class="block leading-relaxed"
             v-html="highlightedCode"
      /></pre>
    </div>
  </div>
</template>


