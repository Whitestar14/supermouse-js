<script setup lang="ts">
import CodeBlock from "../CodeBlock.vue";

defineProps<{
  code: string;
  title?: string;
  lang?: string;
  description?: string;
  recipeId?: string;
  clean?: boolean;
}>();
</script>

<template>
  <div class="flex flex-col gap-4">
    <p v-if="description" class="text-zinc-600 text-sm">
      {{ description }}
    </p>
    <CodeBlock
      :code="code"
      :title="title"
      :lang="lang"
      :recipeId="recipeId"
      :clean="clean"
    />
    <slot />
  </div>
</template>
