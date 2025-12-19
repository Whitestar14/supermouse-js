
<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import EditorControls from './EditorControls.vue';
import EditorPreview from './EditorPreview.vue';
import { RECIPES, type PresetRecipe } from './recipes';

const props = defineProps<{
  activeRecipeId: string | null;
}>();

const emit = defineEmits(['close']);

// State
const config = ref<Record<string, any>>({});
const globalConfig = ref({
  smoothness: 0.15,
  showNative: false
});

const currentRecipe = computed(() => {
  return RECIPES.find(r => r.id === props.activeRecipeId) || RECIPES[0];
});

// Reset config when recipe changes
watch(() => props.activeRecipeId, (newId) => {
  if (newId) {
    const recipe = RECIPES.find(r => r.id === newId);
    if (recipe) {
      // Hydrate config with defaults
      const defaults: Record<string, any> = {};
      recipe.schema.forEach(field => {
        defaults[field.key] = field.defaultValue;
      });
      config.value = defaults;
      
      // Reset globals
      globalConfig.value = { smoothness: 0.15, showNative: false };
    }
  }
}, { immediate: true });

// Code Export Logic
const getExportCode = () => {
  const parts: string[] = [];
  
  // 1. Imports
  parts.push(`import { Supermouse } from '@supermousejs/core';`);
  if (currentRecipe.value.id.includes('dot')) parts.push(`import { Dot } from '@supermousejs/dot';`);
  if (currentRecipe.value.id.includes('ring')) parts.push(`import { Ring } from '@supermousejs/ring';`);
  if (currentRecipe.value.id.includes('sparkles')) parts.push(`import { Sparkles } from '@supermousejs/sparkles';`);
  if (currentRecipe.value.id.includes('text')) parts.push(`import { Text } from '@supermousejs/text';`);
  
  parts.push('');
  parts.push('// 1. Initialize Core');
  parts.push(`const app = new Supermouse({`);
  parts.push(`  smoothness: ${globalConfig.value.smoothness},`);
  parts.push(`  hideCursor: ${!globalConfig.value.showNative},`);
  parts.push(`});`);
  parts.push('');
  
  // 3. Plugin Usage
  parts.push(`// 2. Add Plugins`);
  if (currentRecipe.value.id.includes('dot')) {
      parts.push(`app.use(Dot({ size: ${config.value.size || 8}, color: '${config.value.color || '#000'}' }));`);
  }
  if (currentRecipe.value.id.includes('ring')) {
      parts.push(`app.use(Ring({ size: ${config.value.size}, color: '${config.value.color}' }));`);
  }
  if (currentRecipe.value.id.includes('sparkles')) {
      parts.push(`app.use(Sparkles({ color: '${config.value.color}' }));`);
  }
  
  return parts.join('\n');
};

const copyCode = () => {
    navigator.clipboard.writeText(getExportCode());
    alert('Code copied to clipboard!');
};
</script>

<template>
  <div v-if="activeRecipeId" class="fixed inset-0 z-[100] bg-white/90 backdrop-blur-sm flex items-center justify-center p-0 md:p-8 animate-in fade-in duration-200">
    
    <div class="bg-white w-full h-full max-w-[1600px] border border-zinc-900 flex flex-col overflow-hidden relative shadow-none">
        
        <!-- Mobile Close Button (Top Right) -->
        <button 
            @click="emit('close')"
            class="absolute top-4 right-4 z-50 w-10 h-10 flex items-center justify-center bg-white border border-black hover:bg-black hover:text-white transition-colors lg:hidden"
        >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>

        <div class="flex flex-1 overflow-hidden flex-col lg:flex-row">
            <!-- Controls (Left) -->
            <div class="w-full lg:w-[400px] border-b lg:border-b-0 lg:border-r border-zinc-200 shrink-0 h-1/3 lg:h-full overflow-hidden">
                <EditorControls 
                    :schema="currentRecipe.schema" 
                    v-model:config="config"
                    v-model:globalConfig="globalConfig"
                />
            </div>

            <!-- Preview (Right) -->
            <div class="flex-1 bg-zinc-50 relative h-2/3 lg:h-full">
                <!-- Header inside Preview for desktop context -->
                <div class="absolute top-8 left-8 z-30 hidden lg:block">
                    <div class="flex items-center gap-4">
                        <span class="text-3xl filter grayscale">{{ currentRecipe.icon }}</span>
                        <div>
                            <h2 class="text-3xl font-bold tracking-tighter text-zinc-900 leading-none">{{ currentRecipe.name }}</h2>
                            <p class="text-xs text-zinc-500 font-mono mt-2">{{ currentRecipe.description }}</p>
                        </div>
                    </div>
                </div>

                <div class="absolute top-8 right-8 z-30 hidden lg:flex gap-0">
                    <button @click="copyCode" class="h-10 px-6 bg-white border border-zinc-200 border-r-0 text-xs font-bold uppercase tracking-wide hover:bg-zinc-50 transition-colors">
                        Copy Code
                    </button>
                    <button @click="emit('close')" class="h-10 px-6 bg-black text-white text-xs font-bold uppercase tracking-wide hover:bg-zinc-800 transition-colors">
                        Done
                    </button>
                </div>

                <EditorPreview 
                    :recipe="currentRecipe" 
                    :config="config"
                    :globalConfig="globalConfig"
                />
            </div>
        </div>
    </div>

  </div>
</template>
