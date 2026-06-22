<script setup lang="ts">
import { onMounted, onUnmounted, watch, ref, reactive, nextTick } from "vue";
import { Supermouse } from "@supermousejs/core";
import type { PresetRecipe } from "./recipes";

const props = defineProps<{
  recipe: PresetRecipe;
  config: Record<string, any>;
  globalConfig: {
    smoothness: number;
    showNative: boolean;
  };
}>();

const containerRef = ref<HTMLElement | null>(null);
let mouse: Supermouse | null = null;

// Reactive proxy that connects the recipe getters to the current props
const liveConfig = reactive<Record<string, any>>({});

// Interaction State
const isBouncing = ref(false);
const triggerBounce = () => {
  isBouncing.value = true;
  setTimeout(() => {
    isBouncing.value = false;
  }, 150);
};

const cleanupAttributes = () => {
  if (!containerRef.value) return;
  // Remove temporary attributes injected by previous recipes
  const targets = containerRef.value.querySelectorAll(
    "[data-supermouse-magnetic], [data-supermouse-stick]"
  );
  targets.forEach((el) => {
    el.removeAttribute("data-supermouse-magnetic");
    el.removeAttribute("data-supermouse-stick");
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

  mouse = new Supermouse({
    container: containerRef.value,
    smoothness: props.globalConfig.smoothness,
    hideCursor: true
  });

  if (props.globalConfig.showNative) {
    mouse.setNativeCursor("show");
  }

  mouse.disable();

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

watch(
  () => props.recipe.id,
  async () => {
    await nextTick(initCursor);
  }
);

watch(
  () => props.config,
  (newVal) => {
    Object.assign(liveConfig, newVal);
  },
  { deep: true }
);

watch(
  () => props.globalConfig,
  (newVal) => {
    if (mouse) {
      mouse.options.smoothness = newVal.smoothness;

      if (newVal.showNative) {
        mouse.setNativeCursor("show");
      } else {
        mouse.setNativeCursor("auto");
      }
    }
  },
  { deep: true }
);

onMounted(() => {
  initCursor();
});

onUnmounted(() => {
  mouse?.destroy();
});
</script>

<template>
  <div
    ref="containerRef"
    class="w-full h-full relative bg-zinc-50 flex flex-col overflow-hidden"
    @mouseenter="onEnter"
    @mouseleave="onLeave"
  >
    <!-- Grid Background -->
    <div class="absolute inset-0 grid-bg opacity-50 pointer-events-none" />

    <!-- Center Content -->
    <div class="flex-1 flex items-center justify-center relative z-10 flex-col gap-4">
      <h1
        class="text-4xl md:text-6xl font-bold text-zinc-200 tracking-tighter select-none pointer-events-none text-center"
      >
        Test Area
      </h1>
    </div>

    <!-- Interactive Elements Toolbar (Flush Strip) -->
    <div
      class="h-12 border-t border-zinc-200 bg-white relative z-20 flex items-stretch justify-center divide-x divide-zinc-200"
    >
      <!-- Button -->
      <button
        class="px-8 bg-white text-black text-xs font-bold uppercase tracking-widest hover:bg-black hover:text-white transition-colors duration-100 ease-out"
        :class="{ 'bg-black text-white': isBouncing }"
        data-supermouse-text="Click me"
        @click="triggerBounce"
      >
        Button
      </button>

      <!-- Circular Button (Test Sticky Shape) -->
      <div class="flex items-center justify-center w-16">
        <button
          class="w-8 h-8 rounded-full border border-zinc-300 bg-zinc-100 hover:bg-black hover:border-black transition-colors"
          title="Circle Test"
        />
      </div>

      <!-- Link/Text -->
      <div
        class="flex items-center px-8 text-sm font-bold text-zinc-900 hover:bg-zinc-50 transition-colors cursor-pointer"
        data-hover
        data-supermouse-text="Go to Link"
      >
        <span class="underline decoration-2 underline-offset-4">Hyperlink</span>
      </div>

      <!-- Input -->
      <input
        type="text"
        placeholder="Type here..."
        class="px-6 w-32 md:w-64 bg-white text-sm font-mono focus:outline-none focus:bg-zinc-50 transition-colors placeholder:text-zinc-400"
      />

      <!-- Loading Trigger -->
      <div
        class="w-12 flex items-center justify-center bg-white hover:bg-zinc-50 cursor-wait"
        data-supermouse-icon="loading"
        title="Hover to test loading icon"
      >
        <div class="w-1.5 h-1.5 bg-zinc-300 rounded-full" />
      </div>
    </div>
  </div>
</template>
