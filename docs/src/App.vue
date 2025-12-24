
<script setup lang="ts">
import { watch, ref, onMounted, onUnmounted } from 'vue';
import Navbar from './components/Navbar.vue';
import CursorEditor from './components/playground/CursorEditor.vue';
import SearchPalette from './components/SearchPalette.vue';
import { useAppCursor } from './composables/useAppCursor';
import { usePlayground } from './composables/usePlayground';

// 1. Initialize Global Cursor (Singleton across entire app)
const mouse = useAppCursor();

// 2. Global Editor State
const { isOpen: isEditorOpen, activeRecipeId, close: closeEditor } = usePlayground();

// 3. Search State
const isSearchOpen = ref(false);

const toggleSearch = () => {
  isSearchOpen.value = !isSearchOpen.value;
};

// 4. Keyboard Shortcuts
const handleKeydown = (e: KeyboardEvent) => {
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault();
    toggleSearch();
  }
};

onMounted(() => window.addEventListener('keydown', handleKeydown));
onUnmounted(() => window.removeEventListener('keydown', handleKeydown));

// 5. Coordinator: Disable global cursor when ANY modal is open
watch([isEditorOpen, isSearchOpen], ([editor, search]) => {
  if (mouse.value) {
    if (editor || search) mouse.value.disable();
    else mouse.value.enable();
  }
});
</script>

<template>
  <div class="relative min-h-screen bg-white">
    <!-- Master Container -->
    <div class="relative mx-auto max-w-[1440px] bg-white min-h-screen border-x border-zinc-200 shadow-2xl shadow-zinc-100 flex flex-col">
      
      <!-- Global Navigation -->
      <Navbar @open-search="isSearchOpen = true" />
      
      <!-- Route Content -->
      <main class="flex-1 flex flex-col min-h-0 relative z-10">
        <router-view v-slot="{ Component }">
          <component :is="Component" />
        </router-view>
      </main>

    </div>

    <!-- Global Modals -->
    <CursorEditor 
      v-if="isEditorOpen"
      :activeRecipeId="activeRecipeId" 
      @close="closeEditor" 
    />

    <SearchPalette 
      v-if="isSearchOpen"
      @close="isSearchOpen = false"
    />
  </div>
</template>
