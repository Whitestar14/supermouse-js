
<script setup lang="ts">
import { computed } from 'vue';
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

const highlightedCode = computed(() => {
  return highlight(props.code, props.lang || 'typescript');
});
</script>

<template>
  <div 
    class="w-full flex flex-col font-mono text-sm group overflow-hidden" 
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

        <!-- Window Controls -->
        <div class="flex gap-1.5 opacity-50 grayscale group-hover:grayscale-0 group-hover:opacity-100 transition-all">
          <div class="w-2.5 h-2.5 border border-zinc-400 bg-zinc-200"></div>
          <div class="w-2.5 h-2.5 border border-zinc-400 bg-zinc-200"></div>
        </div>
      </div>
    </div>
    
    <!-- Code Area -->
    <div class="w-full relative bg-[#09090b] text-zinc-300 min-h-0 flex-1 overflow-hidden">
       <pre class="m-0 p-6 overflow-x-auto h-full scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-zinc-900 w-full"><code class="block leading-relaxed" v-html="highlightedCode"></code></pre>
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
