
<script setup lang="ts">
import { watch } from 'vue';
import Navbar from './components/Navbar.vue';
import CursorEditor from './components/playground/CursorEditor.vue';
import { useAppCursor } from './composables/useAppCursor';
import { usePlayground } from './composables/usePlayground';

// 1. Initialize Global Cursor (Singleton across entire app)
const mouse = useAppCursor();

// 2. Global Editor State
const { isOpen, activeRecipeId, close } = usePlayground();

// 3. Coordinator: Disable global cursor when editor is open
watch(isOpen, (open) => {
  if (mouse.value) {
    if (open) mouse.value.disable();
    else mouse.value.enable();
  }
});
</script>

<template>
  <div class="relative min-h-screen bg-white">
    <!-- Master Container -->
    <div class="relative mx-auto max-w-[1440px] bg-white min-h-screen border-x border-zinc-200 shadow-2xl shadow-zinc-100 flex flex-col">
      
      <!-- Global Navigation -->
      <Navbar />
      
      <!-- Route Content -->
      <main class="flex-1 flex flex-col min-h-0 relative z-10">
        <router-view v-slot="{ Component }">
          <component :is="Component" />
        </router-view>
      </main>

    </div>

    <!-- Global Modals -->
    <CursorEditor 
      v-if="isOpen"
      :activeRecipeId="activeRecipeId" 
      @close="close" 
    />
  </div>
</template>
