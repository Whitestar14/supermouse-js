
<script setup lang="ts">
import { onMounted, onUnmounted, watch, ref } from 'vue';
import { Supermouse } from '@supermousejs/core';
import type { PresetRecipe } from './recipes';

const props = defineProps<{
  recipe: PresetRecipe;
  config: Record<string, any>;
  globalConfig: {
    smoothness: number;
    showNative: boolean;
  }
}>();

const containerRef = ref<HTMLElement | null>(null);
let mouse: Supermouse | null = null;

const initCursor = () => {
  if (!containerRef.value) return;
  if (mouse) mouse.destroy();

  // 1. Create Core
  mouse = new Supermouse({
    smoothness: props.globalConfig.smoothness,
    hideCursor: !props.globalConfig.showNative,
    ignoreOnNative: true
  });

  // 2. Run Recipe Setup
  props.recipe.setup(mouse, props.config);
};

// Watch Global Config
watch(() => props.globalConfig, () => {
  if (mouse) {
    mouse.options.smoothness = props.globalConfig.smoothness;
    mouse.options.hideCursor = !props.globalConfig.showNative;
    if (!props.globalConfig.showNative) mouse.stage.setNativeCursor('none');
    else mouse.stage.setNativeCursor('auto');
  }
}, { deep: true });

// Watch Recipe
watch(() => props.recipe.id, () => {
  initCursor();
});

// Watch Config
watch(() => props.config, () => {
    // Config updates are handled dynamically by plugins via getters where possible.
}, { deep: true });


onMounted(() => {
  initCursor();
});

onUnmounted(() => {
  mouse?.destroy();
});
</script>

<template>
  <div ref="containerRef" class="w-full h-full relative bg-zinc-50 flex flex-col overflow-hidden cursor-none">
    <!-- Grid Background -->
    <div class="absolute inset-0 grid-bg opacity-50 pointer-events-none"></div>

    <!-- Center Content -->
    <div class="flex-1 flex items-center justify-center relative z-10 flex-col gap-4">
        <h1 class="text-4xl md:text-6xl font-bold text-zinc-200 tracking-tighter select-none pointer-events-none text-center">
            Test Area
        </h1>
    </div>

    <!-- Interactive Elements Toolbar -->
    <div class="h-24 border-t border-zinc-200 bg-white relative z-20 flex items-center justify-center gap-0 px-8">
        
        <!-- Button -->
        <button class="h-12 px-8 bg-black text-white text-xs font-bold uppercase tracking-widest hover:bg-zinc-800 transition-colors"
                data-supermouse-text="Click me">
            Button
        </button>

        <!-- Link/Text -->
        <div class="h-12 flex items-center px-8 text-sm font-bold text-zinc-900 border border-l-0 border-zinc-200 hover:bg-zinc-50 transition-colors cursor-pointer" 
             data-hover data-supermouse-text="Go to Link">
            Hyperlink
        </div>

    </div>
  </div>
</template>
