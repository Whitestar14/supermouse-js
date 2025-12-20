
<script setup lang="ts">
import { computed } from 'vue';
import { highlight } from '../utils/highlight';

const props = defineProps<{
  code: string;
  title?: string;
  clean?: boolean;
  lang?: string;
}>();

const highlightedCode = computed(() => {
  return highlight(props.code, props.lang || 'typescript');
});
</script>

<template>
  <div class="w-full bg-[#282c34] font-mono text-sm group" :class="clean ? '' : 'rounded-lg shadow-2xl ring-1 ring-white/10 overflow-hidden'">
    <!-- Mac Terminal Header (Only if not clean) -->
    <div v-if="!clean" class="px-4 py-3 bg-[#21252b] border-b border-black/20 flex items-center justify-between select-none">
      <div class="flex gap-2">
        <div class="w-3 h-3 rounded-full bg-[#ff5f56] shadow-sm"></div>
        <div class="w-3 h-3 rounded-full bg-[#ffbd2e] shadow-sm"></div>
        <div class="w-3 h-3 rounded-full bg-[#27c93f] shadow-sm"></div>
      </div>
      <span v-if="title" class="text-xs text-[#abb2bf] font-medium opacity-60 font-sans tracking-wide">{{ title }}</span>
      <div class="w-12"></div> <!-- Spacer -->
    </div>
    
    <div class="relative">
       <pre class="p-6 overflow-x-auto scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent"><code class="block text-[#abb2bf] leading-relaxed" v-html="highlightedCode"></code></pre>
    </div>
  </div>
</template>

<style scoped>
/* Custom Scrollbar for Code Block */
::-webkit-scrollbar {
  height: 8px;
  width: 8px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: #4b5263;
  border-radius: 4px;
}
</style>
