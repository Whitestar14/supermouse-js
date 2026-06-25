<script setup lang="ts">
import CodeBlock from "@shared/CodeBlock.vue";
import Text from "@shared/Text.vue";
import { coreClassDef } from "@composables/useApiReference";
</script>

<template>
  <div id="core-class" class="mb-20 scroll-mt-32">
    <h3
      class="font-mono text-xs font-bold uppercase tracking-widest text-zinc-900 mb-4 pb-2 border-b border-zinc-200"
    >
      Core Class
    </h3>
    <Text class="mb-6 max-w-3xl">
      The <code>Supermouse</code> class is the runtime entry point. It owns the animation loop,
      input layer, plugin pipeline, and shared <code>MouseState</code>.
    </Text>
    <CodeBlock :code="coreClassDef" lang="typescript" :clean="false" title="Signature" />
  </div>
</template>
