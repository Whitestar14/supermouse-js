
<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  code: string;
  title?: string;
}>();

const highlightedCode = computed(() => {
  let c = props.code; // Preserve whitespace
  
  // Escape HTML
  c = c.replace(/&/g, "&amp;")
       .replace(/</g, "&lt;")
       .replace(/>/g, "&gt;")
       .replace(/"/g, "&quot;")
       .replace(/'/g, "&#039;");

  // 1. Strings (Capture first to avoid matching keywords inside)
  const strings: string[] = [];
  c = c.replace(/(['"`])(.*?)\1/g, (match) => {
    strings.push(match);
    return `___STRING${strings.length - 1}___`;
  });

  // 2. Keywords
  c = c.replace(/\b(import|from|const|let|var|new|return|export|default|class|interface|type|public|private|protected|static|readonly|function|async|await)\b/g, '<span class="text-[#c678dd]">$1</span>');
  
  // 3. Control Flow
  c = c.replace(/\b(if|else|for|while|switch|case|break|continue)\b/g, '<span class="text-[#e06c75]">$1</span>');

  // 4. Built-ins / Classes / Types
  c = c.replace(/\b(Supermouse|Dot|Ring|Sparkles|Magnetic|Image|Text|HTMLElement|string|number|boolean|void|any|console|Math|window|document)\b/g, '<span class="text-[#e5c07b]">$1</span>');

  // 5. Functions (Call site)
  c = c.replace(/\b([a-zA-Z0-9_]+)(?=\()/g, '<span class="text-[#61afef]">$1</span>');

  // 6. Restore Strings
  c = c.replace(/___STRING(\d+)___/g, (_, index) => {
    return `<span class="text-[#98c379]">${strings[parseInt(index)]}</span>`;
  });

  // 7. Comments (Last to override everything else)
  c = c.replace(/(\/\/.*$)/gm, '<span class="text-[#5c6370] italic">$1</span>');
  c = c.replace(/(\/\*[\s\S]*?\*\/)/gm, '<span class="text-[#5c6370] italic">$1</span>');

  return c;
});
</script>

<template>
  <div class="w-full rounded-lg overflow-hidden bg-[#282c34] shadow-2xl ring-1 ring-white/10 font-mono text-sm group">
    <!-- Mac Terminal Header -->
    <div class="px-4 py-3 bg-[#21252b] border-b border-black/20 flex items-center justify-between select-none">
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
