<script setup lang="ts">
import { defineAsyncComponent } from "vue";
import Lenis from "lenis";
import Navbar from "@components/landing/Navbar.vue";
import { useAppCursor } from "@composables/useAppCursor";
import { usePlayground } from "@composables/usePlayground";
import { useScrollLock } from "@composables/useScrollLock";

const CursorEditor = defineAsyncComponent(() => import("@components/playground/CursorEditor.vue"));
const SearchPalette = defineAsyncComponent(() => import("@components/landing/SearchPalette.vue"));

const { instance } = useAppCursor();
const { isOpen: isEditorOpen, activeRecipeId, close: closeEditor } = usePlayground();

const isSearchOpen = ref(false);

const toggleSearch = (): void => {
  isSearchOpen.value = !isSearchOpen.value;
};

const handleKeydown = (e: KeyboardEvent): void => {
  if ((e.metaKey || e.ctrlKey) && e.key === "k") {
    e.preventDefault();
    toggleSearch();
  }
};

let lenis: Lenis | null = null;
let rafId: number;
let resizeObserver: ResizeObserver | null = null;

const startLenis = (): void => {
  if (lenis || typeof window === "undefined") return;

  lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    orientation: "vertical",
    gestureOrientation: "vertical",
    smoothWheel: true
  });

  (window as any).lenis = lenis;

  function raf(time: number): void {
    lenis?.raf(time);
    rafId = requestAnimationFrame(raf);
  }

  rafId = requestAnimationFrame(raf);
};

const stopLenis = (): void => {
  if (!lenis) return;
  cancelAnimationFrame(rafId);
  lenis.destroy();
  lenis = null;
  if (resizeObserver) {
    resizeObserver.disconnect();
    resizeObserver = null;
  }
  delete (window as any).lenis;
};

onMounted(() => {
  window.addEventListener("keydown", handleKeydown);

  startLenis();

  if (typeof ResizeObserver !== "undefined") {
    resizeObserver = new ResizeObserver(() => {
      if (lenis) lenis.resize();
    });
    nextTick(() => {
      resizeObserver?.observe(document.body);
    });
  }
});

useScrollLock(computed(() => isEditorOpen.value || isSearchOpen.value));

// Dev-only audit of the live instance: priorities, orphaned stages, cursor mode.
watch(
  instance,
  (app) => {
    if (app && import.meta.dev) {
      void import("@supermousejs/utils").then(({ doctor }) => doctor(app));
    }
  },
  { immediate: true }
);

const navigateEditor = (id: string): void => {
  activeRecipeId.value = id;
};

onUnmounted(() => {
  window.removeEventListener("keydown", handleKeydown);
  stopLenis();
});
</script>

<template>
  <div class="relative min-h-screen bg-surface flex flex-col">
    <Navbar @open-search="isSearchOpen = true" />

    <main class="flex-1 flex flex-col min-h-0 relative z-10">
      <NuxtLayout>
        <NuxtPage />
      </NuxtLayout>
    </main>

    <CursorEditor
      v-if="isEditorOpen"
      :active-recipe-id="activeRecipeId"
      @close="closeEditor"
      @navigate="navigateEditor"
    />
    <SearchPalette v-if="isSearchOpen" @close="isSearchOpen = false" />
  </div>
</template>
