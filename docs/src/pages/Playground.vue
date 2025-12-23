
<script setup lang="ts">
import { ref, computed } from 'vue';
import { useSupermouse } from '@supermousejs/vue';
import CursorEditor from '../components/playground/CursorEditor.vue';
import { RECIPES } from '../components/playground/recipes';

const activeRecipeId = ref<string | null>(null);
const searchQuery = ref('');

// 1. Inject the Global Instance using the standard hook
const globalMouse = useSupermouse();

const filteredRecipes = computed(() => {
  const q = searchQuery.value.toLowerCase().trim();
  if (!q) return RECIPES;
  return RECIPES.filter(r => 
    r.name.toLowerCase().includes(q) || 
    r.description.toLowerCase().includes(q) ||
    r.id.toLowerCase().includes(q)
  );
});

const openEditor = (presetId: string) => {
  // 2. Disable Global Cursor (Native cursor returns, but will be hidden by Editor's local Supermouse)
  if (globalMouse.value) {
    globalMouse.value.disable();
  }
  activeRecipeId.value = presetId;
};

const closeEditor = () => {
  activeRecipeId.value = null;
  // 3. Re-enable Global Cursor
  if (globalMouse.value) {
    globalMouse.value.enable();
  }
};
</script>

<template>
  <div class="text-zinc-900 relative min-h-screen bg-white">
    
    <!-- Layout Logic (Unchanged) -->
    <div class="flex flex-col min-h-[calc(100vh-80px)]">
      
      <!-- Header -->
      <div class="sticky top-0 z-30 flex bg-white border-b border-zinc-200 h-16 md:h-20">
        <div class="w-[80px] md:w-[96px] border-r border-zinc-200 shrink-0 flex items-center justify-center bg-white"></div>
        <div class="hidden lg:flex w-[400px] xl:w-[480px] items-center px-12 border-r border-zinc-200 bg-white">
           <h1 class="font-bold tracking-tight text-zinc-900 text-lg">Supermouse Labs</h1>
        </div>
        <div class="flex-1 flex items-center bg-zinc-50/50">
           <div class="w-16 h-full flex items-center justify-center text-zinc-400 shrink-0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
           </div>
           <input 
              type="text" 
              v-model="searchQuery"
              placeholder="Search experiments..." 
              class="w-full h-full bg-transparent outline-none text-sm font-medium text-zinc-900 placeholder:text-zinc-400 font-mono tracking-tight"
           />
           <div v-if="searchQuery" class="pr-6">
              <span class="mono text-[10px] font-bold bg-zinc-200 text-zinc-600 px-2 py-1 rounded-sm">
                {{ filteredRecipes.length }}
              </span>
           </div>
        </div>
      </div>

      <!-- Content -->
      <div class="flex flex-col lg:flex-row flex-1 items-stretch">
        <div class="hidden lg:block w-[96px] border-r border-zinc-200 shrink-0 bg-white"></div>
        <div class="w-full lg:w-[400px] xl:w-[480px] border-b lg:border-b-0 lg:border-r border-zinc-200 bg-white p-8 md:p-12 flex flex-col relative z-10">
            <div class="lg:hidden mb-8">
               <h1 class="font-bold tracking-tight text-zinc-900 text-2xl">Supermouse Labs</h1>
            </div>
            <div class="lg:sticky lg:top-32">
                <h2 class="text-5xl mt-8 md:text-6xl font-bold tracking-tighter text-zinc-900 mb-8 leading-[0.95]">
                    Plugin<br/>Gallery
                </h2>
                <p class="text-lg text-zinc-600 font-medium leading-relaxed mb-8 text-pretty">
                    Explore experimental "Smart" plugins and standard tools. Enter the Studio Editor to configure physics, tweak visuals, and export code.
                </p>
                <div class="hidden lg:block mono text-[10px] uppercase tracking-widest text-zinc-400 font-bold mb-4">
                    Select a preset to edit
                </div>
            </div>
        </div>

        <div class="flex-1 bg-white min-h-[50vh]">
            <div v-if="filteredRecipes.length > 0" class="grid grid-cols-1 md:grid-cols-2 gap-px bg-zinc-200 border-b border-zinc-200">
                <button 
                    v-for="preset in filteredRecipes" 
                    :key="preset.id"
                    @click="openEditor(preset.id)"
                    class="group bg-white p-10 text-left hover:bg-zinc-50 transition-colors flex flex-col h-[280px] outline-none relative"
                    data-supermouse-state="card-hover"
                >
                    <div class="flex-1 mb-6 relative">
                        <span 
                          class="w-10 h-10 text-zinc-900 filter grayscale group-hover:grayscale-0 transition-all duration-500 block transform group-hover:scale-110 origin-top-left opacity-80 group-hover:opacity-100"
                          v-html="preset.icon"
                        ></span>
                    </div>
                    <div class="mt-auto relative z-10">
                        <div class="flex justify-between items-end mb-2">
                            <h3 class="text-lg font-bold text-zinc-900 tracking-tight group-hover:translate-x-1 transition-transform">{{ preset.name }}</h3>
                        </div>
                        <p class="text-xs text-zinc-500 font-mono leading-relaxed max-w-[90%] line-clamp-2">{{ preset.description }}</p>
                    </div>
                </button>
            </div>
            
            <div v-else class="flex flex-col items-center justify-center h-[50vh] text-zinc-300">
                <div class="mb-4 font-mono text-4xl opacity-20">∅</div>
                <span class="mono text-xs uppercase tracking-widest font-bold text-zinc-400">No matching presets</span>
            </div>
        </div>
      </div>
    </div>

    <CursorEditor 
        :activeRecipeId="activeRecipeId" 
        @close="closeEditor" 
    />

  </div>
</template>