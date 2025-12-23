
<script setup lang="ts">
import { watch } from 'vue';
import Navbar from './Navbar.vue';
import Footer from './Footer.vue';
import CursorEditor from './playground/CursorEditor.vue';
import { provideSupermouse } from '@supermousejs/vue';
import { SmartIcon, SmartRing } from '@supermousejs/labs';
import { Icon } from '@supermousejs/icon';
import { States } from '@supermousejs/states';
import { usePlayground } from '../composables/usePlayground';

// --- ASSETS ---
const LOGO_CURSOR = `
<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
  <g transform="rotate(90 16 16)">
    <path d="M25,30a5.82,5.82,0,0,1-1.09-.17l-.2-.07-7.36-3.48a.72.72,0,0,0-.35-.08.78.78,0,0,0-.33.07L8.24,29.54a.66.66,0,0,1-.2.06,5.17,5.17,0,0,1-1,.15,3.6,3.6,0,0,1-3.29-5L12.68,4.2a3.59,3.59,0,0,1,6.58,0l9,20.74A3.6,3.6,0,0,1,25,30Z" fill="#F2F5F8" />
    <path d="M16,3A2.59,2.59,0,0,1,18.34,4.6l9,20.74A2.59,2.59,0,0,1,25,29a5.42,5.42,0,0,1-.86-.15l-7.37-3.48a1.84,1.84,0,0,0-.77-.17,1.69,1.69,0,0,0-.73.16l-7.4,3.31a5.89,5.89,0,0,1-.79.12,2.59,2.59,0,0,1-2.37-3.62L13.6,4.6A2.58,2.58,0,0,1,16,3m0-2h0A4.58,4.58,0,0,0,11.76,3.8L2.84,24.33A4.58,4.58,0,0,0,7,30.75a6.08,6.08,0,0,0,1.21-.17,1.87,1.87,0,0,0,.4-.13L16,27.18l7.29,3.44a1.64,1.64,0,0,0,.39.14A6.37,6.37,0,0,0,25,31a4.59,4.59,0,0,0,4.21-6.41l-9-20.75A4.62,4.62,0,0,0,16,1Z" fill="#111920" />
  </g>
</svg>`;

const HAND_CURSOR = `<svg viewBox="0 0 24 24" fill="white" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2"/><path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2"/><path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/></svg>`;

const ARROW_CURSOR = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="square" stroke-linejoin="miter" d="M5 12h14M12 5l7 7-7 7"/></svg>`;

// --- INITIALIZATION ---
const mouse = provideSupermouse({
  smoothness: 0.15,
  enableTouch: false,
  hideCursor: true,
  ignoreOnNative: true,
  rules: {
    'a, button, [role="button"]': { icon: 'pointer' }
  }
}, [
  SmartIcon({ 
    name: 'default-icon',
    icons: { default: LOGO_CURSOR, pointer: HAND_CURSOR },
    size: 32, 
    color: 'black',
    anchor: 'center', 
    rotateWithVelocity: true,
  }),
  SmartRing({
    name: 'card-bg',
    size: 64, hoverSize: 64, 
    fill: 'black', color: 'black', borderWidth: 0, 
    mixBlendMode: 'normal'
  }),
  Icon({
    name: 'card-arrow',
    svg: ARROW_CURSOR,
    size: 24, color: 'white'
  }),
  States({
    default: ['default-icon'],
    states: {
      'card-hover': ['card-bg', 'card-arrow']
    }
  })
]);

// --- GLOBAL EDITOR STATE ---
const { isOpen, activeRecipeId, close } = usePlayground();

// Automatically disable the global cursor when the editor is open
watch(isOpen, (open) => {
  if (mouse.value) {
    if (open) mouse.value.disable();
    else mouse.value.enable();
  }
});
</script>

<template>
  <div class="relative min-h-screen bg-white">
    <div class="relative mx-auto max-w-[1440px] bg-white min-h-screen border-x border-zinc-200 shadow-2xl shadow-zinc-100 flex flex-col">
      <Navbar />
      <main class="relative z-10 flex-1">
        <slot />
      </main>
      <Footer />
    </div>

    <!-- Global Editor Overlay -->
    <CursorEditor 
      v-if="isOpen"
      :activeRecipeId="activeRecipeId" 
      @close="close" 
    />
  </div>
</template>
