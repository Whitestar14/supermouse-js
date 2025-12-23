
<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import EditorControls from './EditorControls.vue';
import EditorPreview from './EditorPreview.vue';
import CodeBlock from '../CodeBlock.vue';
import { RECIPES } from './recipes';
import { generateCode } from '../../utils/code-generator';

const props = defineProps<{
  activeRecipeId: string | null;
}>();

const emit = defineEmits(['close']);

type SidebarMode = 'config' | 'code';

// State
const config = ref<Record<string, any>>({});
const globalConfig = ref({
  smoothness: 0.15,
  showNative: false
});
const mode = ref<SidebarMode>('config');
const isCopied = ref(false);

const currentRecipe = computed(() => {
  return RECIPES.find(r => r.id === props.activeRecipeId) || RECIPES[0];
});

const generatedCode = computed(() => {
    return generateCode(currentRecipe.value.id, config.value, globalConfig.value);
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
      mode.value = 'config'; // Reset to config view
      isCopied.value = false;
    }
  }
}, { immediate: true });

const copyCode = () => {
    navigator.clipboard.writeText(generatedCode.value);
    isCopied.value = true;
    setTimeout(() => isCopied.value = false, 2000);
};
</script>

<template>
  <Teleport to="body">
    <!-- Modal Overlay -->
    <div v-if="activeRecipeId" class="fixed inset-0 z-[100] bg-white/95 flex items-center justify-center p-0 md:p-8">
        
        <div class="bg-white w-full h-full max-w-[1600px] border border-zinc-900 flex flex-col overflow-hidden relative shadow-2xl">
            
            <!-- Mobile Close -->
            <button 
                @click="emit('close')"
                class="absolute top-0 right-0 z-50 w-12 h-12 flex items-center justify-center bg-black text-white hover:bg-zinc-800 transition-colors lg:hidden"
            >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>

            <!-- Desktop Close -->
            <button 
                @click="emit('close')" 
                class="absolute top-0 right-0 z-50 h-12 px-8 bg-black text-white text-xs font-bold uppercase tracking-wide hover:bg-zinc-800 transition-colors hidden lg:flex items-center justify-center border-l border-b border-zinc-900"
            >
                Close Editor
            </button>

            <div class="flex flex-1 overflow-hidden flex-col lg:flex-row">
                <!-- Sidebar -->
                <div class="w-full lg:w-[400px] border-b lg:border-b-0 lg:border-r border-zinc-200 shrink-0 h-2/5 lg:h-full flex flex-col bg-white z-10">
                    
                    <!-- Tabs -->
                    <div class="h-12 flex border-b border-zinc-200 shrink-0 bg-zinc-50">
                       <button 
                          @click="mode = 'config'" 
                          class="flex-1 text-xs font-bold uppercase tracking-widest transition-colors duration-100 border-r border-zinc-200 relative"
                          :class="mode === 'config' ? 'bg-white text-black' : 'text-zinc-400 hover:text-black'"
                       >
                          Configuration
                          <!-- Active Indicator -->
                          <div v-if="mode === 'config'" class="absolute bottom-0 left-0 right-0 h-[2px] bg-black"></div>
                       </button>
                       <button 
                          @click="mode = 'code'" 
                          class="flex-1 text-xs font-bold uppercase tracking-widest transition-colors duration-100 relative"
                          :class="mode === 'code' ? 'bg-[#09090b] text-white border-b-0' : 'text-zinc-400 hover:text-black'"
                       >
                          Export Code
                       </button>
                    </div>

                    <!-- Content -->
                    <div class="flex-1 overflow-hidden relative">
                        <!-- Config View -->
                        <div v-if="mode === 'config'" class="absolute inset-0 overflow-y-auto">
                            <EditorControls 
                                :schema="currentRecipe.schema" 
                                v-model:config="config"
                                v-model:globalConfig="globalConfig"
                            />
                        </div>

                        <!-- Code View -->
                        <div v-else class="absolute inset-0 overflow-y-auto bg-[#09090b] flex flex-col">
                            <div class="flex-1 min-h-0 flex flex-col">
                               <!-- CodeBlock set to fill height, with clean prop to remove internal header -->
                               <CodeBlock :code="generatedCode" :clean="true" class="h-full" />
                            </div>
                            <button 
                                @click="copyCode" 
                                class="h-14 border-t border-zinc-800 text-xs font-bold uppercase tracking-widest shrink-0 sticky bottom-0 transition-colors duration-200 flex items-center justify-center gap-2"
                                :class="isCopied ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-[#09090b] text-zinc-300 hover:bg-zinc-900 hover:text-white'"
                            >
                                <span v-if="isCopied">Copied to Clipboard</span>
                                <span v-else>Copy to Clipboard</span>
                                <svg v-if="isCopied" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Preview -->
                <div class="flex-1 bg-zinc-50 relative h-3/5 lg:h-full overflow-hidden">
                    <div class="absolute top-8 left-8 z-30 hidden lg:block pointer-events-none select-none">
                        <div class="flex items-center gap-4">
                            <div class="w-12 h-12 flex items-center justify-center border border-zinc-200 bg-white rounded-sm shadow-sm">
                                <span class="text-2xl filter grayscale" v-html="currentRecipe.icon"></span>
                            </div>
                            <div>
                                <h2 class="text-2xl font-bold tracking-tighter text-zinc-900 leading-none">{{ currentRecipe.name }}</h2>
                                <p class="text-[10px] uppercase tracking-widest text-zinc-400 font-bold mt-1">Interactive Preview</p>
                            </div>
                        </div>
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
  </Teleport>
</template>
