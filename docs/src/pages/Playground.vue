
<script setup lang="ts">
import { ref } from 'vue';
import CursorEditor from '../components/playground/CursorEditor.vue';
import { RECIPES } from '../components/playground/recipes';

const activeRecipeId = ref<string | null>(null);

const openEditor = (presetId: string) => {
  activeRecipeId.value = presetId;
};
</script>

<template>
  <div class="text-zinc-900 relative min-h-screen bg-white">
    
    <!-- Section Header (Sticky) -->
    <div class="flex border-b border-zinc-200 h-16 md:h-20 bg-white sticky top-0 z-30">
      <div class="w-[80px] md:w-[96px] border-r border-zinc-200 flex items-center justify-center shrink-0 bg-white">
        <span class="mono text-lg font-bold text-zinc-900">05</span>
      </div>
      <div class="flex-1 px-8 flex items-center justify-between bg-white/80 backdrop-blur-md">
         <h2 class="text-xl font-bold tracking-tighter text-zinc-900">Playground</h2>
         <span class="mono text-[10px] text-zinc-400 uppercase tracking-widest font-bold">gallery.vue</span>
      </div>
    </div>

    <!-- Layout Container -->
    <div class="flex flex-col lg:flex-row min-h-[calc(100vh-80px)]">
        
        <!-- Sidebar Spacer (Left Gutter) -->
        <div class="hidden lg:block w-[96px] border-r border-zinc-200 shrink-0 bg-white z-20"></div>

        <!-- Main Content -->
        <div class="flex-1 flex flex-col lg:flex-row">
            
            <!-- Intro Column -->
            <div class="w-full lg:w-[400px] xl:w-[480px] p-8 md:p-12 lg:p-16 border-b lg:border-b-0 lg:border-r border-zinc-200 bg-white relative z-10">
                <div class="sticky top-32">
                    <div class="flex items-center gap-3 mb-6">
                        <div class="w-2 h-2 bg-black"></div>
                        <span class="mono text-[11px] font-bold uppercase tracking-widest text-zinc-500">Library</span>
                    </div>
                    <h1 class="text-4xl md:text-5xl font-bold tracking-tighter text-zinc-900 mb-6 leading-[1.05]">
                        Preset Gallery
                    </h1>
                    <p class="text-lg text-zinc-600 font-medium leading-relaxed mb-8">
                        Explore our collection of pre-configured cursor interactions. Select any preset to enter the <strong>Studio Editor</strong> and customize physics, aesthetics, and behavior.
                    </p>
                    
                    <div class="p-6 bg-zinc-50 border border-zinc-200">
                        <h4 class="font-bold text-sm mb-4 uppercase tracking-widest text-zinc-900 text-xs">How it works</h4>
                        <ul class="text-sm text-zinc-600 space-y-3 font-mono">
                            <li class="flex gap-4">
                                <span class="font-bold text-black">01</span>
                                Select a base style
                            </li>
                            <li class="flex gap-4">
                                <span class="font-bold text-black">02</span>
                                Tweak physics in the Editor
                            </li>
                            <li class="flex gap-4">
                                <span class="font-bold text-black">03</span>
                                Export configuration code
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            <!-- Gallery Grid -->
            <div class="flex-1 bg-white">
                <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-px bg-zinc-200 border-b border-zinc-200">
                    <button 
                        v-for="preset in RECIPES" 
                        :key="preset.id"
                        @click="openEditor(preset.id)"
                        class="group bg-white p-12 text-left hover:bg-zinc-50 transition-colors flex flex-col h-[320px] outline-none relative"
                    >
                        <div class="flex-1 mb-6 relative">
                            <span class="text-5xl filter grayscale group-hover:grayscale-0 transition-all duration-500 block transform group-hover:scale-110 origin-top-left">{{ preset.icon }}</span>
                        </div>
                        
                        <div class="mt-auto relative z-10">
                            <div class="flex justify-between items-end mb-2">
                                <h3 class="text-xl font-bold text-zinc-900 tracking-tight group-hover:translate-x-1 transition-transform">{{ preset.name }}</h3>
                                <div class="w-6 h-6 border border-zinc-200 flex items-center justify-center bg-white group-hover:border-black group-hover:bg-black group-hover:text-white transition-all">
                                    <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="square" stroke-linejoin="miter" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                                </div>
                            </div>
                            <p class="text-xs text-zinc-500 font-mono leading-relaxed max-w-[90%]">{{ preset.description }}</p>
                        </div>
                    </button>
                </div>
            </div>

        </div>
    </div>

    <!-- The Editor Modal -->
    <CursorEditor 
        :activeRecipeId="activeRecipeId" 
        @close="activeRecipeId = null" 
    />

  </div>
</template>
