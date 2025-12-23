
<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { provideSupermouse } from '@supermousejs/vue';
import { Dot } from '@supermousejs/dot';
import { Text } from '@supermousejs/text';
import { Magnetic } from '@supermousejs/magnetic';
import { Image } from '@supermousejs/image';
import { Stick } from '@supermousejs/stick';
import { Pointer } from '@supermousejs/pointer';
import { Trail } from '@supermousejs/trail';
import { SmartRing, SmartIcon, TextRing, Sparkles } from '@supermousejs/labs';

const ICONS = {
  default: `<svg viewBox="0 0 24 24" fill="white" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="transform: rotate(-45deg)"><path d="m3 3 7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/></svg>`,
  hand: `<svg viewBox="0 0 24 24" fill="white" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2"/><path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2"/><path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/></svg>`,
  search: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>`,
};

// --- STATE ---
const pluginsState = reactive<Record<string, boolean>>({
  dot: true,
  ring: true,
  trail: false,
  sparkles: false,
  text: true,
  'text-ring': false,
  image: true,
  icon: false,
  pointer: false,
  magnetic: true,
  stick: true
});

const isMobileMenuOpen = ref(false);

// --- SETUP ---
const mouse = provideSupermouse({
  smoothness: 0.15,
  hideCursor: true,
  ignoreOnNative: true,
  rules: {
    'a': { icon: 'hand' }
  }
}, [
  Dot({ name: 'dot', size: 8, color: '#f0f' }),
  SmartRing({ name: 'ring', size: 24, color: '#f0f', enableSkew: true }),
  Trail({ name: 'trail', color: '#f0f', isEnabled: false }),
  Sparkles({ name: 'sparkles', color: '#f0f', isEnabled: false }),
  Text({ name: 'text', offset: [20, 20] }),
  TextRing({ name: 'text-ring', text: 'SUPERMOUSE • V2 • ', color: '#0ff', isEnabled: false }),
  Image({ name: 'image', offset: [30, 30] }),
  SmartIcon({ name: 'icon', icons: ICONS, size: 24, color: '#000', isEnabled: false }),
  Pointer({ name: 'pointer', size: 32, color: '#ff0', isEnabled: false }),
  Magnetic({ name: 'magnetic' }),
  Stick({ name: 'stick' })
]);

const togglePlugin = (name: string) => {
  pluginsState[name] = !pluginsState[name];
  if (mouse.value) {
    if (pluginsState[name]) mouse.value.enablePlugin(name);
    else mouse.value.disablePlugin(name);
  }
};

</script>

<template>
  <div class="flex h-screen bg-zinc-950 text-white font-sans overflow-hidden">
    
    <!-- LEFT: Test Area -->
    <main class="flex-1 relative overflow-y-auto p-8 md:p-12 flex flex-col gap-12">
      <!-- Grid BG -->
      <div class="absolute inset-0 opacity-10 pointer-events-none" style="background-image: linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px); background-size: 40px 40px;"></div>

      <header class="relative z-10">
        <h1 class="text-4xl font-bold tracking-tighter mb-2">Supermouse<span class="text-purple-500">.js</span></h1>
        <p class="text-zinc-500 font-mono text-sm">v2.0.0 Dev Playground</p>
      </header>

      <!-- TEST ZONES -->
      <div class="relative z-10 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        
        <!-- Magnetic -->
        <div class="p-8 border border-zinc-800 bg-zinc-900/50 rounded-xl flex flex-col gap-4 items-center justify-center min-h-[200px]">
          <span class="text-xs font-mono text-zinc-500 uppercase tracking-widest">Magnetic</span>
          <div class="flex gap-4">
             <button class="w-12 h-12 rounded-full border border-zinc-700 hover:border-purple-500 transition-colors" data-supermouse-magnetic></button>
             <button class="w-12 h-12 rounded-full border border-zinc-700 hover:border-purple-500 transition-colors" data-supermouse-magnetic></button>
          </div>
        </div>

        <!-- Sticky -->
        <div class="p-8 border border-zinc-800 bg-zinc-900/50 rounded-xl flex flex-col gap-4 items-center justify-center min-h-[200px]">
          <span class="text-xs font-mono text-zinc-500 uppercase tracking-widest">Stick</span>
          <button class="px-8 py-4 bg-zinc-800 rounded hover:bg-zinc-700 transition-colors" data-supermouse-stick>
            Sticky Button
          </button>
        </div>

        <!-- Text Hover -->
        <div class="p-8 border border-zinc-800 bg-zinc-900/50 rounded-xl flex flex-col gap-4 items-center justify-center min-h-[200px]">
          <span class="text-xs font-mono text-zinc-500 uppercase tracking-widest">Text Tooltip</span>
          <div class="w-full h-16 bg-zinc-800 rounded border border-dashed border-zinc-700 flex items-center justify-center" 
               data-supermouse-text="Hello World!">
             Hover Me
          </div>
        </div>

        <!-- Image Hover -->
        <div class="p-8 border border-zinc-800 bg-zinc-900/50 rounded-xl flex flex-col gap-4 items-center justify-center min-h-[200px]">
          <span class="text-xs font-mono text-zinc-500 uppercase tracking-widest">Image Preview</span>
          <div class="w-full h-16 bg-zinc-800 rounded border border-dashed border-zinc-700 flex items-center justify-center" 
               data-supermouse-img="https://images.unsplash.com/photo-1721332155545-c7a8005a2501?w=400&q=80">
             Hover for Image
          </div>
        </div>

        <!-- Icon Trigger -->
        <div class="p-8 border border-zinc-800 bg-zinc-900/50 rounded-xl flex flex-col gap-4 items-center justify-center min-h-[200px]">
          <span class="text-xs font-mono text-zinc-500 uppercase tracking-widest">Icon Trigger</span>
          <div class="w-16 h-16 bg-zinc-800 rounded flex items-center justify-center" 
               data-supermouse-icon="search">
             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          </div>
        </div>

        <!-- Text Ring -->
        <div class="p-8 border border-zinc-800 bg-zinc-900/50 rounded-xl flex flex-col gap-4 items-center justify-center min-h-[200px]">
          <span class="text-xs font-mono text-zinc-500 uppercase tracking-widest">Text Ring</span>
          <div class="w-24 h-24 rounded-full border border-zinc-700 flex items-center justify-center"
               data-supermouse-text-ring="LOADING • LOADING • ">
             <span class="text-xs">Hover</span>
          </div>
        </div>

      </div>
      
      <!-- Footer links -->
      <div class="relative z-10 flex gap-6 text-sm text-zinc-500">
         <a href="#" class="hover:text-white transition-colors">Standard Link</a>
         <a href="#" class="hover:text-white transition-colors">Another Link</a>
      </div>

    </main>

    <!-- RIGHT: Control Panel -->
    <aside class="w-[320px] border-l border-zinc-800 bg-zinc-900 flex flex-col shrink-0 relative z-20">
      <div class="p-6 border-b border-zinc-800">
        <h2 class="font-bold text-white mb-1">Plugins</h2>
        <p class="text-xs text-zinc-500">Toggle enabled state in real-time.</p>
      </div>
      
      <div class="flex-1 overflow-y-auto p-6 space-y-2">
        <div v-for="(enabled, name) in pluginsState" :key="name" 
             class="flex items-center justify-between p-3 bg-black/20 rounded border border-zinc-800 hover:border-zinc-700 transition-colors">
           <span class="capitalize text-sm font-medium" :class="enabled ? 'text-white' : 'text-zinc-500'">{{ name }}</span>
           
           <button @click="togglePlugin(name)" 
                   class="w-10 h-5 rounded-full relative transition-colors duration-200 ease-in-out"
                   :class="enabled ? 'bg-purple-600' : 'bg-zinc-700'">
              <div class="absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform duration-200"
                   :class="enabled ? 'translate-x-5' : 'translate-x-0'"></div>
           </button>
        </div>
      </div>

      <div class="p-6 border-t border-zinc-800 bg-black/20">
         <div class="text-xs text-zinc-500 font-mono mb-2">Instance Status</div>
         <div class="flex items-center gap-2">
            <div class="w-2 h-2 rounded-full" :class="mouse ? 'bg-green-500' : 'bg-red-500'"></div>
            <span class="text-sm font-bold">{{ mouse ? 'Active' : 'Initializing...' }}</span>
         </div>
      </div>
    </aside>

  </div>
</template>
