<script setup lang="ts">
import { watch, ref, onMounted, onUnmounted } from "vue";
import Lenis from "lenis";
import Navbar from "@components/landing/Navbar.vue";
import CursorEditor from "@components/playground/CursorEditor.vue";
import SearchPalette from "@components/landing/SearchPalette.vue";
import { useAppCursor } from "@composables/useAppCursor";
import { usePlayground } from "@composables/usePlayground";

const mouse = useAppCursor();

const { isOpen: isEditorOpen, activeRecipeId, close: closeEditor } = usePlayground();

const isSearchOpen = ref(false);

const toggleSearch = () => {
  isSearchOpen.value = !isSearchOpen.value;
};

const handleKeydown = (e: KeyboardEvent) => {
  if ((e.metaKey || e.ctrlKey) && e.key === "k") {
    e.preventDefault();
    toggleSearch();
  }
};

let lenis: Lenis | null = null;
let rafId: number;

onMounted(() => {
  window.addEventListener("keydown", handleKeydown);

  lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    orientation: "vertical",
    gestureOrientation: "vertical",
    smoothWheel: true
  });

  (window as any).lenis = lenis;

  function raf(time: number) {
    lenis?.raf(time);
    rafId = requestAnimationFrame(raf);
  }

  rafId = requestAnimationFrame(raf);

  watch(
    [isEditorOpen, isSearchOpen],
    ([editor, search]) => {
      if (typeof window === "undefined") return;

      if (editor || search) {
        lenis?.stop();
      } else {
        lenis?.start();
      }

      if (mouse.value) {
        if (editor || search) mouse.value.disable();
        else mouse.value.enable();
      }
    },
    { flush: "post" }
  );
});

onUnmounted(() => {
  window.removeEventListener("keydown", handleKeydown);
  if (lenis) {
    lenis.destroy();
    cancelAnimationFrame(rafId);
  }
});
</script>

<template>
  <div class="relative min-h-screen bg-white">
    <!-- Master Container -->
    <div
      class="relative mx-auto max-w-[1440px] bg-white min-h-screen border-x border-zinc-200 shadow-2xl shadow-zinc-100 flex flex-col"
    >
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
    <CursorEditor v-if="isEditorOpen" :active-recipe-id="activeRecipeId" @close="closeEditor" />

    <SearchPalette v-if="isSearchOpen" @close="isSearchOpen = false" />
  </div>
</template>
