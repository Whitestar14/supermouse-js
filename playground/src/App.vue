<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import { Supermouse } from '@supermousejs/core';
import { Dot } from '@supermousejs/dot';
import { Ring } from '@supermousejs/ring';
import { Text } from '@supermousejs/text';
import { Sparkles } from '@supermousejs/sparkles';
import { Magnetic } from '@supermousejs/magnetic';
import { Image } from '@supermousejs/image';

let mouse: Supermouse | null = null;
const isEnabled = ref(true);

onMounted(() => {
  mouse = new Supermouse({
    enableTouch: false,
    ignoreOnNative: true, // Auto-hide on inputs/textareas
    hideCursor: true      // Core will inject styles to hide native cursor
  });

  mouse
    // Logic Plugins first (Calculates positions)
    .use(Magnetic({ force: 0.1 }))
    // Visual Plugins next
    .use(Dot({ size: 8, color: 'var(--cursor-color)', hideOnStick: true }))
    .use(Ring({ size: 20, hoverSize: 45, color: 'var(--cursor-color)', enableStick: true, enableSkew: true }))
    .use(Text({ className: 'custom-tooltip' }))
    .use(Image({ offset: [20, 20], smoothness: 0.15 }))
    .use(Sparkles({ color: 'var(--cursor-color)', maxParticles: 30 }));
    
  // Set initial theme variable
  document.documentElement.style.setProperty('--cursor-color', '#750c7e');
});

onUnmounted(() => {
  mouse?.destroy();
});

const toggleCursor = () => {
  if (isEnabled.value) {
    mouse?.disable(); // Removes injected styles, native cursor returns
  } else {
    mouse?.enable();  // Re-injects styles
  }
  isEnabled.value = !isEnabled.value;
};

const switchTheme = () => {
  const current = document.documentElement.style.getPropertyValue('--cursor-color').trim();
  const next = current === '#750c7e' ? '#00ff00' : '#750c7e';
  document.documentElement.style.setProperty('--cursor-color', next);
};
</script>

<template>
  <div class="min-h-screen p-10 font-sans bg-gray-950 text-white"> 
    
    <!-- Header -->
    <header class="text-center mb-16">
      <h1 class="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
        Supermouse V2
      </h1>
      <p class="text-gray-400">Vue 3 Integration Test</p>
    </header>

    <!-- Test Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
      
      <!-- Card 1: Basic -->
      <div class="bg-gray-900 p-8 rounded-2xl border border-gray-800 flex flex-col items-center gap-4">
        <h3 class="text-xl font-semibold text-gray-200">Basic Interaction</h3>
        <button class="px-6 py-3 bg-purple-600 rounded-lg hover:bg-purple-500 transition-colors">
          Hover Me
        </button>
      </div>

      <!-- Card 2: Magnetic -->
      <div class="bg-gray-900 p-8 rounded-2xl border border-gray-800 flex flex-col items-center gap-4">
        <h3 class="text-xl font-semibold text-gray-200">Magnetic</h3>
        <!-- UPDATED ATTRIBUTE -->
        <button class="px-6 py-3 border border-white rounded-full hover:bg-white hover:text-black transition-colors" 
                data-supermouse-magnetic>
          Snap to Center
        </button>
      </div>

      <!-- Card 3: Stick -->
      <div class="bg-gray-900 p-8 rounded-2xl border border-gray-800 flex flex-col items-center gap-4">
        <h3 class="text-xl font-semibold text-gray-200">Stick Effect</h3>
        <!-- UPDATED ATTRIBUTE -->
        <button class="px-8 py-4 bg-gray-800 rounded-xl" data-supermouse-stick>
          Stick to Shape
        </button>
      </div>

      <!-- Card 4: Text Label -->
      <div class="bg-gray-900 p-8 rounded-2xl border border-gray-800 flex flex-col items-center gap-4">
        <h3 class="text-xl font-semibold text-gray-200">Text Tooltip</h3>
        <!-- UPDATED ATTRIBUTE -->
        <div class="w-full h-20 bg-gray-800 rounded-lg flex items-center justify-center" 
             data-supermouse-text="VIEW PROJECT">
          Hover Area
        </div>
      </div>

      <!-- Card 5: Image Hover -->
      <div class="bg-gray-900 p-8 rounded-2xl border border-gray-800 flex flex-col items-center gap-4">
        <h3 class="text-xl font-semibold text-gray-200">Image Reveal</h3>
        <!-- UPDATED ATTRIBUTE -->
        <div class="text-2xl font-bold underline decoration-purple-500"
             data-supermouse-img="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400">
          Hover This Title
        </div>
      </div>

      <!-- Card 6: Native Inputs -->
      <div class="bg-gray-900 p-8 rounded-2xl border border-gray-800 flex flex-col items-center gap-4">
        <h3 class="text-xl font-semibold text-gray-200">Native Input</h3>
        <!-- Native cursor logic handles this automatically -->
        <input type="text" placeholder="Cursor should vanish..." 
               class="w-full px-4 py-2 bg-black border border-gray-700 rounded focus:border-purple-500 outline-none" />
      </div>

    </div>

    <!-- Controls (Fixed Bottom) -->
    <div class="fixed bottom-8 left-1/2 -translate-x-1/2 flex gap-4 z-50 cursor-default"
         @mousedown.stop @mouseover.stop>
      <button @click="toggleCursor" 
              class="px-4 py-2 bg-gray-800 border border-gray-700 rounded hover:bg-gray-700 cursor-pointer text-sm font-mono">
        {{ isEnabled ? 'Disable Cursor' : 'Enable Cursor' }}
      </button>
      <button @click="switchTheme" 
              class="px-4 py-2 bg-gray-800 border border-gray-700 rounded hover:bg-gray-700 cursor-pointer text-sm font-mono">
        Switch Theme
      </button>
    </div>

  </div>
</template>

<style>
/* Custom Class for Text Plugin (passed via className prop) */
.custom-tooltip {
  background: white;
  color: black;
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: bold;
  font-size: 11px;
  letter-spacing: 1px;
  pointer-events: none;
  box-shadow: 0 4px 6px rgba(0,0,0,0.3);
}

/* Default Image Plugin Class */
.supermouse-image {
  width: 200px;
  height: 140px;
  border-radius: 8px;
  border: 2px solid white;
  box-shadow: 0 10px 20px rgba(0,0,0,0.5);
}
</style>