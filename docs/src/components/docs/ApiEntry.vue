<script setup lang="ts">
import CodeBlock from "@shared/CodeBlock.vue";

defineProps<{
  id: string;
  name: string;
  type?: string;
  defaultValue?: string;
  returns?: string;
  signature?: string;
  usage?: string;
  usageTitle?: string;
  usageLang?: string;
}>();
</script>

<template>
  <article
    :id="id"
    class="scroll-mt-32 border-b border-zinc-100 pb-10 mb-10 last:mb-0 last:pb-0 last:border-0"
  >
    <div class="flex flex-wrap items-center gap-x-4 gap-y-2 mb-3">
      <h4 class="font-mono text-base font-bold text-zinc-900 tracking-tight">
        <a :href="`#${id}`" class="hover:underline decoration-zinc-300 underline-offset-4">
          {{ name }}
        </a>
      </h4>
      <span
        v-if="type"
        class="mono text-[11px] text-zinc-500 bg-zinc-50 border border-zinc-200 px-2 py-0.5"
      >
        {{ type }}
      </span>
      <span v-if="defaultValue" class="mono text-[11px] text-zinc-400">
        default <span class="text-zinc-600">{{ defaultValue }}</span>
      </span>
      <span v-if="returns" class="mono text-[11px] text-amber-700"> → {{ returns }} </span>
    </div>

    <p v-if="signature" class="font-mono text-sm text-zinc-600 mb-4 leading-relaxed">
      {{ signature }}
    </p>

    <div class="text-zinc-600 leading-relaxed text-sm space-y-3">
      <slot />
    </div>

    <div v-if="usage" class="mt-5">
      <CodeBlock
        :code="usage"
        :lang="usageLang ?? 'typescript'"
        :clean="true"
        :title="usageTitle ?? 'Example'"
        class="border border-zinc-200"
      />
    </div>
  </article>
</template>
