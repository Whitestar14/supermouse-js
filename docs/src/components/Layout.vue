
<script setup lang="ts">
import { watch } from 'vue';
import Navbar from './Navbar.vue';
import Footer from './Footer.vue';
import CursorEditor from './playground/CursorEditor.vue';
import { usePlayground } from '../composables/usePlayground';
import { useAppCursor } from '../composables/useAppCursor';

// --- INITIALIZATION ---
// Use the unified cursor setup (matches DocsLayout)
const mouse = useAppCursor();

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
