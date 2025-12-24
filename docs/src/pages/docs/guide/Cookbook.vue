
<script setup lang="ts">
import DocsSection from '../../../components/docs/DocsSection.vue';
import { RECIPES } from '../../../components/playground/recipes';
import { usePlayground } from '../../../composables/usePlayground';

const { open } = usePlayground();
</script>

<template>
  <DocsSection label="Guide" title="Cookbook">
    
    <p class="text-lg text-zinc-600 mb-12 leading-relaxed">
      A collection of pre-configured cursor effects. Click "Run" to open the Studio, tweak parameters, and copy the code.
    </p>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-px bg-zinc-200 border border-zinc-200">
        <div 
            v-for="recipe in RECIPES" 
            :key="recipe.id"
            class="bg-white p-8 group hover:bg-zinc-50 transition-colors flex flex-col h-full"
        >
            <div class="flex items-start justify-between mb-6">
                <div class="w-12 h-12 border border-zinc-100 bg-zinc-50 flex items-center justify-center rounded-sm text-zinc-900">
                    <span v-html="recipe.icon" class="w-6 h-6"></span>
                </div>
                <button 
                    @click="open(recipe.id)"
                    class="text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-black border border-zinc-200 px-3 py-1.5 hover:border-black transition-colors"
                >
                    Run in Studio
                </button>
            </div>
            
            <h3 class="text-xl font-bold text-zinc-900 tracking-tight mb-2">{{ recipe.name }}</h3>
            <p class="text-sm text-zinc-600 leading-relaxed mb-6 flex-1">
                {{ recipe.description }}
            </p>

            <div class="pt-6 border-t border-zinc-100 flex gap-2">
                <span class="mono text-[10px] bg-zinc-100 text-zinc-500 px-2 py-1 rounded">
                    {{ recipe.schema.length }} Config Options
                </span>
            </div>
        </div>
    </div>

  </DocsSection>
</template>
