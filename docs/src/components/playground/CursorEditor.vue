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
                class="absolute top-0 right-0 z-50 h-12 px-8 bg-black text-white text-xs font-bold uppercase tracking-wide hover:bg-zinc-800 transition-colors hidden lg:flex items-center justify-center"
            >
                Close Editor
            </button>

            <div class="flex flex-1 overflow-hidden flex-col lg:flex-row">
                <!-- Sidebar -->
                <div class="w-full lg:w-[400px] border-b lg:border-b-0 lg:border-r border-zinc-200 shrink-0 h-2/5 lg:h-full flex flex-col bg-white z-10">
                    
                    <!-- Tabs -->
                    <div class="h-12 flex border-b border-zinc-200 shrink-0">
                       <button 
                          @click="mode = 'config'" 
                          class="flex-1 text-xs font-bold uppercase tracking-widest transition-colors duration-100"
                          :class="mode === 'config' ? 'bg-black text-white' : 'text-zinc-400 hover:bg-zinc-50 hover:text-black'"
                       >
                          Configuration
                       </button>
                       <div class="w-px bg-zinc-200"></div>
                       <button 
                          @click="mode = 'code'" 
                          class="flex-1 text-xs font-bold uppercase tracking-widest transition-colors duration-100"
                          :class="mode === 'code' ? 'bg-black text-white' : 'text-zinc-400 hover:bg-zinc-50 hover:text-black'"
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
                        <div v-else class="absolute inset-0 overflow-y-auto bg-[#282c34] flex flex-col">
                            <div class="flex-1">
                               <CodeBlock :code="generatedCode" :clean="true" />
                            </div>
                            <button 
                                @click="copyCode" 
                                class="h-12 border-t border-zinc-200 text-xs font-bold uppercase tracking-widest shrink-0 sticky bottom-0 transition-colors duration-200 flex items-center justify-center gap-2"
                                :class="isCopied ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white text-black hover:bg-black hover:text-white'"
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
                    <div class="absolute top-8 left-8 z-30 hidden lg:block pointer-events-none">
                        <div class="flex items-center gap-4">
                            <span class="text-3xl filter grayscale">{{ currentRecipe.icon }}</span>
                            <div>
                                <h2 class="text-3xl font-bold tracking-tighter text-zinc-900 leading-none">{{ currentRecipe.name }}</h2>
                                <p class="text-xs text-zinc-500 font-mono mt-2">{{ currentRecipe.description }}</p>
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