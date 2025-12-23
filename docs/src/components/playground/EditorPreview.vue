
<script setup lang="ts">
import { onMounted, onUnmounted, watch, ref, reactive, nextTick } from 'vue';
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

// Reactive proxy that connects the recipe getters to the current props
const liveConfig = reactive<Record<string, any>>({});

// Interaction State
const isBouncing = ref(false);
const triggerBounce = () => {
  isBouncing.value = true;
  setTimeout(() => { isBouncing.value = false; }, 150);
};

const cleanupAttributes = () => {
  if (!containerRef.value) return;
  // Remove temporary attributes injected by previous recipes
  const targets = containerRef.value.querySelectorAll('[data-supermouse-magnetic], [data-supermouse-stick]');
  targets.forEach(el => {
    el.removeAttribute('data-supermouse-magnetic');
    el.removeAttribute('data-supermouse-stick');
  });
};

const initCursor = () => {
  if (!containerRef.value) return;
  
  // Cleanup previous instance
  if (mouse) {
    mouse.destroy();
    mouse = null;
  }

  // Cleanup DOM
  cleanupAttributes();

  // Sync initial config
  Object.assign(liveConfig, props.config);

  // 1. Create Core attached to THIS CONTAINER
  // Now that plugins use `projectRect`, this works correctly for Sticky/Magnetic.
  mouse = new Supermouse({
    container: containerRef.value, 
    smoothness: props.globalConfig.smoothness,
    hideCursor: true, 
    // CRITICAL: Set to false so the custom cursor persists over buttons/links
    // This allows Stick/Magnetic effects to be visible.
    ignoreOnNative: true 
  });

  // Apply initial Native Cursor state (if toggled on)
  if (props.globalConfig.showNative) {
    mouse.setCursor('auto');
  }

  // 2. Start in DISABLED state. 
  // We only enable it when the user hovers the preview area.
  mouse.disable();

  // 3. Run Recipe Setup with Reactive Config
  props.recipe.setup(mouse, liveConfig);
};

// --- Hover Management ---

const isHovering = ref(false);

const onEnter = () => {
    isHovering.value = true;
    mouse?.enable();
};

const onLeave = () => {
    isHovering.value = false;
    mouse?.disable();
};

// --- Reactivity ---

// 1. Recipe Change: HARD Reload (Different plugins needed)
watch(() => props.recipe.id, () => {
    nextTick(initCursor);
});

// 2. Config Change: SOFT Update (Update reactive state)
watch(() => props.config, (newVal) => {
    Object.assign(liveConfig, newVal);
}, { deep: true });

// 3. Global Config: Update core options via public API
watch(() => props.globalConfig, (newVal) => {
    if (mouse) {
        // Update smooth factor
        mouse.options.smoothness = newVal.smoothness;
        
        // Handle Native Cursor visibility override via public API
        // If showNative is true, we force it to 'auto'.
        // If showNative is false, we set it to null (resume auto-detection based on ignoreOnNative)
        if (newVal.showNative) {
            mouse.setCursor('auto');
        } else {
            mouse.setCursor(null);
        }
    }
}, { deep: true });

onMounted(() => {
  initCursor();
});

onUnmounted(() => {
  mouse?.destroy();
});
</script>

<template>
  <!-- 
    Removed data-supermouse-ignore="true":
    The container should NOT be ignored by its own Supermouse instance.
    Since the Global Cursor is disabled when the Editor is open (via App.vue), 
    we don't need to ignore it here.
  -->
  <div 
    ref="containerRef" 
    class="w-full h-full relative bg-zinc-50 flex flex-col overflow-hidden"
    @mouseenter="onEnter"
    @mouseleave="onLeave"
  >
    <!-- Grid Background -->
    <div class="absolute inset-0 grid-bg opacity-50 pointer-events-none"></div>

    <!-- Center Content -->
    <div class="flex-1 flex items-center justify-center relative z-10 flex-col gap-4">
        <h1 class="text-4xl md:text-6xl font-bold text-zinc-200 tracking-tighter select-none pointer-events-none text-center">
            Test Area
        </h1>
    </div>

    <!-- Interactive Elements Toolbar (Flush Strip) -->
    <div class="h-12 border-t border-zinc-200 bg-white relative z-20 flex items-stretch justify-center divide-x divide-zinc-200">
        
        <!-- Button -->
        <button 
            @click="triggerBounce"
            class="px-8 bg-white text-black text-xs font-bold uppercase tracking-widest hover:bg-black hover:text-white transition-colors duration-100 ease-out"
            :class="{ 'bg-black text-white': isBouncing }"
            data-supermouse-text="Click me"
        >
            Button
        </button>

        <!-- Circular Button (Test Sticky Shape) -->
        <div class="flex items-center justify-center w-16">
            <button 
                class="w-8 h-8 rounded-full border border-zinc-300 bg-zinc-100 hover:bg-black hover:border-black transition-colors"
                title="Circle Test"
            ></button>
        </div>

        <!-- Link/Text -->
        <div class="flex items-center px-8 text-sm font-bold text-zinc-900 hover:bg-zinc-50 transition-colors cursor-pointer" 
             data-hover data-supermouse-text="Go to Link">
            <span class="underline decoration-2 underline-offset-4">Hyperlink</span>
        </div>

        <!-- Input -->
        <input 
            type="text" 
            placeholder="Type here..." 
            class="px-6 w-32 md:w-64 bg-white text-sm font-mono focus:outline-none focus:bg-zinc-50 transition-colors placeholder:text-zinc-400"
        />

        <!-- Loading Trigger -->
        <div class="w-12 flex items-center justify-center bg-white hover:bg-zinc-50 cursor-wait"
             data-supermouse-icon="loading"
             title="Hover to test loading icon"
        >
            <div class="w-1.5 h-1.5 bg-zinc-300 rounded-full"></div>
        </div>

    </div>
  </div>
</template>
