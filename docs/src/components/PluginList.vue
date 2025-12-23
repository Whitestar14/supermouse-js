
<script setup lang="ts">
import { PLUGINS } from '../plugin-data';

const getSparklinePath = () => {
  return "M0 30 Q 10 25 20 30 T 40 10 T 60 30 T 80 10 T 100 20";
};
</script>

<template>
  <section class="relative">
    <!-- Header -->
    <div class="flex border-b border-zinc-200 h-16 md:h-20 bg-white">
      <div class="w-[80px] md:w-[96px] border-r border-zinc-200 flex items-center justify-center shrink-0">
        <span class="mono text-lg font-bold text-zinc-900">01</span>
      </div>
      <div class="flex-1 px-8 flex items-center justify-between">
         <h2 class="text-xl font-bold tracking-tighter text-zinc-900">Ecosystem</h2>
         <span class="mono text-[10px] text-zinc-400 uppercase tracking-widest font-bold">plugins.json</span>
      </div>
    </div>

    <div class="flex flex-col lg:flex-row border-b border-zinc-200">
       <!-- Sidebar Gutter -->
       <div class="hidden lg:block w-[96px] border-r border-zinc-200 shrink-0 bg-zinc-50/30"></div>
       
       <!-- List Container -->
       <div class="flex-1">
          <div class="px-8 py-12 border-b border-zinc-200 bg-zinc-50/20">
             <h3 class="text-3xl font-bold tracking-tighter mb-4 text-zinc-900">Standard & Labs</h3>
             <p class="text-zinc-600 max-w-2xl font-medium leading-relaxed">
                Standard plugins are dumb, fast, and stable. 
                <span class="text-black font-bold">@supermousejs/labs</span> contains smart, state-aware components for complex UIs.
             </p>
          </div>

          <!-- List Rows -->
          <div class="divide-y divide-zinc-200">
             <div v-for="plugin in PLUGINS" :key="plugin.id" class="group flex flex-col md:flex-row items-stretch hover:bg-zinc-50 transition-colors">
                
                <!-- Icon & Title -->
                <div class="flex-1 p-8 flex items-center gap-8">
                   <div 
                      class="w-16 h-16 bg-white border border-zinc-200 rounded-lg shadow-sm flex items-center justify-center p-4 text-zinc-900 shrink-0 group-hover:scale-105 transition-transform group-hover:border-zinc-300"
                      v-html="plugin.icon"
                   >
                   </div>
                   <div>
                      <div class="mono text-[10px] text-zinc-400 uppercase tracking-widest font-bold mb-1">
                         @supermousejs/{{ plugin.id }}
                      </div>
                      <h4 class="text-2xl font-bold text-zinc-900 tracking-tight">{{ plugin.name }}</h4>
                      <p class="text-sm text-zinc-500 font-medium mt-1 line-clamp-1">{{ plugin.description }}</p>
                   </div>
                </div>

                <!-- Stats Column -->
                <div class="w-full md:w-[240px] border-t md:border-t-0 md:border-l border-zinc-200 p-8 flex flex-col justify-center">
                   <div class="flex items-baseline gap-2 mb-1">
                      <span class="text-2xl font-bold text-zinc-900 font-mono">{{ (Math.random() * 100).toFixed(1) }}k</span>
                      <span class="text-[10px] text-zinc-400 uppercase font-bold tracking-widest">Stars</span>
                   </div>
                   <div class="flex items-baseline gap-2">
                      <span class="text-sm font-bold text-zinc-600 font-mono">{{ Math.floor(Math.random() * 200) }}</span>
                      <span class="text-[10px] text-zinc-400 uppercase font-bold tracking-widest">Contribs</span>
                   </div>
                </div>

                <!-- Graphic/Action Column -->
                <div class="hidden xl:flex w-[180px] border-l border-zinc-200 p-8 items-center justify-center bg-zinc-50/30">
                   <div class="w-full h-12 relative overflow-hidden opacity-50 grayscale group-hover:grayscale-0 transition-all">
                      <!-- Simple Sparkline SVG -->
                      <svg viewBox="0 0 100 40" class="w-full h-full stroke-current text-zinc-300 group-hover:text-purple-500" fill="none" stroke-width="2">
                         <path :d="getSparklinePath()" />
                      </svg>
                   </div>
                </div>

             </div>
          </div>
       </div>
    </div>
  </section>
</template>
