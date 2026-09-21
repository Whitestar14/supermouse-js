<script setup lang="ts">
import { computed } from "vue";
import { highlight } from "@utils/highlight";

/**
 * Fenced code, highlighted by the same local highlighter as `CodeBlock.vue`.
 * Shiki is off in `nuxt.config.ts`, so MDC hands over raw source.
 */
const props = defineProps<{
  code?: string;
  language?: string | null;
  class?: string | null;
}>();

const html = computed(() => highlight(props.code ?? "", props.language || "ts"));

const { copied, copy: writeToClipboard } = useClipboard();

const copy = (): void => {
  void writeToClipboard(props.code ?? "");
};

const LANG_LABEL: Record<string, string> = {
  ts: "TS",
  typescript: "TS",
  js: "JS",
  javascript: "JS",
  vue: "VUE",
  html: "HTML",
  css: "CSS",
  bash: "SH",
  sh: "SH",
  shell: "SH",
  zsh: "SH",
  text: "TXT",
  plaintext: "TXT"
};
const langLabel = computed(() => LANG_LABEL[(props.language ?? "ts").toLowerCase()] ?? "CODE");
</script>

<template>
  <div class="group relative my-6" :class="props.class">
    <div
      class="absolute top-2.5 right-2.5 z-10 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-150"
    >
      <span
        v-if="language"
        class="mono text-[9px] font-bold uppercase tracking-widest text-code-muted select-none"
      >
        {{ langLabel }}
      </span>
      <button
        type="button"
        class="flex h-7 w-7 items-center justify-center bg-surface/80 text-code-muted backdrop-blur-sm transition-colors hover:text-strong"
        :class="copied ? 'text-code-accent' : ''"
        :title="copied ? 'Copied' : 'Copy to clipboard'"
        aria-label="Copy code to clipboard"
        @click="copy"
      >
        <svg
          v-if="!copied"
          width="12"
          height="12"
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
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </button>
    </div>

    <pre
      class="code-scroll overflow-x-auto border border-code-border bg-code-surface p-4 text-sm leading-relaxed text-code-text"
    ><code class="block" v-html="html" /></pre>
  </div>
</template>
