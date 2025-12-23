
<script setup lang="ts">
import { ref } from 'vue';
import CodeBlock from './CodeBlock.vue';

const copied = ref(false);

const copyCommand = () => {
  navigator.clipboard.writeText('pnpm add @supermousejs/core');
  copied.value = true;
  setTimeout(() => copied.value = false, 2000);
};

const heroCode = `import { Supermouse } from '@supermousejs/core';
import { Dot } from '@supermousejs/dot';

// 1. Initialize the core
const app = new Supermouse();

// 2. Extend with plugins
app.use(Dot({ 
  size: 8, 
  color: '#750c7e',
  mixBlendMode: 'difference' 
}));`;
</script>

<template>
  <div class="relative border-b border-zinc-200 bg-white">
    <div class="flex flex-col lg:flex-row min-h-[640px]">
        
        <!-- Sidebar Spacer -->
        <div class="hidden lg:block w-[96px] border-r border-zinc-200 shrink-0 bg-white z-10"></div>

        <!-- Main Content Area -->
        <div class="flex-1 relative flex flex-col lg:flex-row items-center">
            <!-- Background Grid -->
            <div class="absolute inset-0 grid-bg opacity-100 pointer-events-none mix-blend-multiply"></div>

            <div class="w-full h-full flex flex-col lg:flex-row max-w-7xl mx-auto z-10">
                
                <!-- Text Column -->
                <div class="flex-1 py-16 px-6 md:px-12 lg:px-16 flex flex-col justify-center border-b lg:border-b-0 lg:border-r border-zinc-200 bg-white/95 backdrop-blur-sm">
                    
                    <!-- Version Badge -->
                    <div class="inline-flex items-center gap-2 mb-10">
                       <span class="mono text-[11px] uppercase tracking-widest text-zinc-500 font-bold">v2.0 Stable</span>
                    </div>

                    <!-- Headline -->
                    <h1 class="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tighter text-zinc-900 mb-8 leading-[1.05]">
                      Cursor Engine <br />
                      for Modern Tooling.
                    </h1>

                    <!-- Subtext -->
                    <p class="text-xl text-zinc-600 font-medium max-w-md mb-12 leading-relaxed text-pretty">
                      A modular, <span class="text-black font-bold border-b-2 border-black/10">unopinionated</span> engine for creating fluid, physics-based pointer interactions.
                    </p>

                    <!-- Actions -->
                    <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                       <router-link to="/docs" class="h-12 px-8 bg-black text-white text-sm font-bold flex items-center justify-center hover:bg-zinc-800 transition-colors">
                          Get Started
                       </router-link>
                       
                       <button @click="copyCommand" class="group h-12 px-5 bg-white border border-zinc-200 flex items-center gap-4 hover:border-zinc-400 transition-colors">
                          <span class="mono text-zinc-400 text-xs select-none">$</span>
                          <code class="mono text-sm text-zinc-900 font-bold">pnpm add @supermousejs/core</code>
                          <div class="relative w-4 h-4 ml-2">
                             <svg v-if="!copied" class="w-4 h-4 text-zinc-400 group-hover:text-black transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                             <svg v-else class="w-4 h-4 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
                          </div>
                       </button>
                    </div>
                </div>

                <!-- Code Column -->
                <div class="w-full lg:w-[520px] shrink-0 bg-zinc-50/50 flex flex-col justify-center p-8 lg:p-12">
                    <CodeBlock :code="heroCode" title="main.ts" class="shadow-none border border-zinc-200" />
                    
                    <div class="mt-8 flex gap-8 justify-center opacity-40 grayscale">
                        <!-- Fake logos/tech badges -->
                         <div class="h-6 w-6 rounded-full bg-zinc-300"></div>
                         <div class="h-6 w-6 rounded-full bg-zinc-300"></div>
                         <div class="h-6 w-6 rounded-full bg-zinc-300"></div>
                    </div>
                </div>

            </div>
        </div>
    </div>
  </div>
</template>
