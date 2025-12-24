
<script setup lang="ts">
import { computed, ref } from 'vue';
import { highlight } from '../utils/highlight';
import { usePlayground } from '../composables/usePlayground';

const props = defineProps<{
  code: string;
  title?: string;
  clean?: boolean;
  lang?: string;
  recipeId?: string;
}>();

const { open } = usePlayground();
const copied = ref(false);

const highlightedCode = computed(() => {
  return highlight(props.code, props.lang || 'typescript');
});

const copy = async () => {
  await navigator.clipboard.writeText(props.code);
  copied.value = true;
  setTimeout(() => copied.value = false, 2000);
};
</script>

<template>
  <div 
    class="w-full flex flex-col font-mono text-sm group relative overflow-hidden" 
    :class="clean ? '' : 'border border-zinc-200 bg-[#09090b]'"
  >
    <!-- Header -->
    <div 
      v-if="!clean" 
      class="w-full px-4 py-3 bg-zinc-50 border-b border-zinc-200 flex items-center justify-between select-none shrink-0"
    >
      <div class="flex items-center gap-3">
        <span v-if="title" class="text-[10px] uppercase tracking-widest font-bold text-zinc-900 bg-zinc-200/50 px-2 py-1">
          {{ title }}
        </span>
        <span v-else class="text-[10px] uppercase tracking-widest font-bold text-zinc-400">
          Snippet
        </span>
      </div>

      <div class="flex items-center gap-4">
        <!-- Run Button -->
        <button 
          v-if="recipeId" 
          @click="open(recipeId)"
          class="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-amber-500 transition-colors"
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" class="relative top-[-0.5px]">
            <path d="M5 3l14 9-14 9V3z"/>
          </svg>
          Run Live
        </button>

        <!-- Copy Button (Header) -->
        <button 
          @click="copy"
          class="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest transition-colors"
          :class="copied ? 'text-green-600' : 'text-zinc-400 hover:text-black'"
        >
          <span v-if="copied">Copied</span>
          <span v-else>Copy</span>
          <svg v-if="!copied" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
          <svg v-else width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
        </button>

        <!-- Window Controls -->
        <div class="flex gap-1.5 opacity-50 grayscale group-hover:grayscale-0 group-hover:opacity-100 transition-all">
          <div class="w-2.5 h-2.5 border border-zinc-400 bg-zinc-200"></div>
          <div class="w-2.5 h-2.5 border border-zinc-400 bg-zinc-200"></div>
        </div>
      </div>
    </div>

    <!-- Floating Copy Button (Clean Mode) -->
    <button 
      v-if="clean"
      @click="copy"
      class="absolute top-4 right-4 z-10 p-2 bg-zinc-800/50 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded opacity-0 group-hover:opacity-100 transition-all duration-200 backdrop-blur-sm"
      title="Copy to clipboard"
    >
      <svg v-if="!copied" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
      <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" class="text-green-400"><polyline points="20 6 9 17 4 12"></polyline></svg>
    </button>
    
    <!-- Code Area -->
    <div class="w-full relative bg-[#09090b] text-zinc-300 min-h-0 flex-1 overflow-hidden">
       <!-- 
          Added selection classes: selection:bg-zinc-700 selection:text-white 
          This overrides the global light-mode selection style for code blocks.
       -->
       <pre class="m-0 p-6 overflow-x-auto h-full scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-zinc-900 w-full selection:bg-zinc-700 selection:text-white"><code class="block leading-relaxed" v-html="highlightedCode"></code></pre>
    </div>
  </div>
</template>

<style scoped>
::-webkit-scrollbar {
  height: 8px;
  width: 8px;
}
::-webkit-scrollbar-track {
  background: #09090b;
}
::-webkit-scrollbar-thumb {
  background: #27272a;
}
::-webkit-scrollbar-thumb:hover {
  background: #3f3f46;
}
</style>
