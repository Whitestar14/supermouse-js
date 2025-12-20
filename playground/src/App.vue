
<script setup lang="ts">
import { onMounted, onUnmounted, ref, reactive } from 'vue';
import { Supermouse } from '@supermousejs/core';
import { Dot } from '@supermousejs/dot';
import { Ring } from '@supermousejs/ring';
import { Pointer } from '@supermousejs/pointer';
import { Text } from '@supermousejs/text';
import { Sparkles } from '@supermousejs/sparkles';
import { Magnetic } from '@supermousejs/magnetic';
import { Image } from '@supermousejs/image';

let mouse: Supermouse | null = null;
const isEnabled = ref(true);

const plugins = reactive({
  dot: true,
  pointer: false,
  ring: true,
  sparkles: true,
  magnetic: true
});

onMounted(() => {
  mouse = new Supermouse({
    enableTouch: false,
    ignoreOnNative: true, 
    hideCursor: true,
  });

  mouse
    // Logic Plugins first (Calculates positions)
    .use(Magnetic({ attraction: 0.8 }))
    // Visual Plugins next
    .use(Pointer({ size: 24, isEnabled: false })) // Disabled by default, toggled via UI
    .use(Dot({ size: 8, color: 'var(--cursor-color)', hideOnStick: true }))
    .use(Ring({ size: 20, hoverSize: 45, color: 'var(--cursor-color)', enableStick: true, enableSkew: true }))
    .use(Text({ className: 'custom-tooltip' }))
    .use(Image({ offset: [20, 20], smoothness: 0.15 }))
    .use(Sparkles({ color: 'var(--cursor-color)', maxParticles: 30 }));
    
  document.documentElement.style.setProperty('--cursor-color', '#750c7e');
});

onUnmounted(() => {
  mouse?.destroy();
});

const toggleCursor = () => {
  if (isEnabled.value) {
    mouse?.disable(); 
  } else {
    mouse?.enable(); 
  }
  isEnabled.value = !isEnabled.value;
};

const switchTheme = () => {
  const current = document.documentElement.style.getPropertyValue('--cursor-color').trim();
  const next = current === '#750c7e' ? '#00ff00' : '#750c7e';
  document.documentElement.style.setProperty('--cursor-color', next);
};

// Plugin Toggle Handler
const togglePlugin = (name: 'dot' | 'ring' | 'sparkles' | 'magnetic' | 'pointer') => {
  mouse?.togglePlugin(name);
  plugins[name] = !plugins[name];
  
  // Exclusive toggles for demo clarity
  if (name === 'pointer' && plugins.pointer) {
    if (plugins.dot) { mouse?.disablePlugin('dot'); plugins.dot = false; }
    if (plugins.ring) { mouse?.disablePlugin('ring'); plugins.ring = false; }
  } else if ((name === 'dot' || name === 'ring') && plugins[name]) {
    if (plugins.pointer) { mouse?.disablePlugin('pointer'); plugins.pointer = false; }
  }
};
</script>

<template>
  <div class="min-h-screen p-10 font-sans bg-gray-950 text-white"> 
    
    <header class="text-center mb-16">
      <h1 class="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
        Supermouse V2
      </h1>
      <p class="text-gray-400">Vue 3 Integration Test</p>
    </header>

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
        <button class="px-6 py-3 border border-white rounded-full hover:bg-white hover:text-black transition-colors" 
                data-supermouse-magnetic>
          Snap to Center
        </button>
      </div>

      <!-- Card 3: Stick -->
      <div class="bg-gray-900 p-8 rounded-2xl border border-gray-800 flex flex-col items-center gap-4">
        <h3 class="text-xl font-semibold text-gray-200">Stick Effect</h3>
        <button class="px-8 py-4 bg-gray-800 rounded-xl" data-supermouse-stick>
          Stick to Shape
        </button>
      </div>

      <!-- Card 4: Text Label -->
      <div class="bg-gray-900 p-8 rounded-2xl border border-gray-800 flex flex-col items-center gap-4">
        <h3 class="text-xl font-semibold text-gray-200">Text Tooltip</h3>
        <div class="w-full h-20 bg-gray-800 rounded-lg flex items-center justify-center" 
             data-supermouse-text="VIEW PROJECT">
          Hover Area
        </div>
      </div>

      <!-- Card 5: Image Hover -->
      <div class="bg-gray-900 p-8 rounded-2xl border border-gray-800 flex flex-col items-center gap-4">
        <h3 class="text-xl font-semibold text-gray-200">Image Reveal</h3>
        <div class="text-2xl font-bold underline decoration-purple-500"
             data-supermouse-img="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400">
          Hover This Title
        </div>
      </div>

      <!-- Card 6: Native Inputs -->
      <div class="bg-gray-900 p-8 rounded-2xl border border-gray-800 flex flex-col items-center gap-4">
        <h3 class="text-xl font-semibold text-gray-200">Native Input</h3>
        <input type="text" placeholder="Cursor should vanish..." 
               class="w-full px-4 py-2 bg-black border border-gray-700 rounded focus:border-purple-500 outline-none" />
      </div>

    </div>

    <!-- Controls (Bottom Left) -->
    <div class="fixed bottom-8 left-8 flex gap-4 z-50 cursor-default" data-supermouse-ignore
         @mousedown.stop>
      <button @click="toggleCursor" 
              class="px-4 py-2 bg-gray-800 border border-gray-700 rounded hover:bg-gray-700 cursor-pointer text-sm font-mono transition-colors">
        {{ isEnabled ? 'Disable Cursor' : 'Enable Cursor' }}
      </button>
      <button @click="switchTheme" 
              class="px-4 py-2 bg-gray-800 border border-gray-700 rounded hover:bg-gray-700 cursor-pointer text-sm font-mono transition-colors">
        Switch Theme
      </button>
    </div>

    <!-- Plugin Toggles (Bottom Right) -->
    <div class="fixed bottom-8 right-8 flex flex-col gap-2 z-50 cursor-default" data-supermouse-ignore
         @mousedown.stop>
      <div class="text-xs text-gray-500 font-mono mb-1 text-right">PLUGINS</div>
      
      <button @click="togglePlugin('dot')" 
              class="px-3 py-1 rounded text-xs font-mono border transition-all cursor-pointer"
              :class="plugins.dot ? 'bg-purple-900 border-purple-500 text-purple-200' : 'bg-gray-900 border-gray-800 text-gray-500'">
        Dot: {{ plugins.dot ? 'ON' : 'OFF' }}
      </button>

      <button @click="togglePlugin('ring')" 
              class="px-3 py-1 rounded text-xs font-mono border transition-all cursor-pointer"
              :class="plugins.ring ? 'bg-purple-900 border-purple-500 text-purple-200' : 'bg-gray-900 border-gray-800 text-gray-500'">
        Ring: {{ plugins.ring ? 'ON' : 'OFF' }}
      </button>
      
      <button @click="togglePlugin('pointer')" 
              class="px-3 py-1 rounded text-xs font-mono border transition-all cursor-pointer"
              :class="plugins.pointer ? 'bg-purple-900 border-purple-500 text-purple-200' : 'bg-gray-900 border-gray-800 text-gray-500'">
        Pointer: {{ plugins.pointer ? 'ON' : 'OFF' }}
      </button>

      <button @click="togglePlugin('sparkles')" 
              class="px-3 py-1 rounded text-xs font-mono border transition-all cursor-pointer"
              :class="plugins.sparkles ? 'bg-purple-900 border-purple-500 text-purple-200' : 'bg-gray-900 border-gray-800 text-gray-500'">
        Sparkles: {{ plugins.sparkles ? 'ON' : 'OFF' }}
      </button>
      
      <button @click="togglePlugin('magnetic')" 
              class="px-3 py-1 rounded text-xs font-mono border transition-all cursor-pointer"
              :class="plugins.magnetic ? 'bg-purple-900 border-purple-500 text-purple-200' : 'bg-gray-900 border-gray-800 text-gray-500'">
        Magnetic: {{ plugins.magnetic ? 'ON' : 'OFF' }}
      </button>
    </div>

  </div>
</template>

<style>
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

.supermouse-image {
  width: 200px;
  height: 140px;
  border-radius: 8px;
  border: 2px solid white;
  box-shadow: 0 10px 20px rgba(0,0,0,0.5);
}
</style>
