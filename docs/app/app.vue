<script setup lang="ts">
import Lenis from "lenis";
import Navbar from "@components/landing/Navbar.vue";
import CursorEditor from "@components/playground/CursorEditor.vue";
import SearchPalette from "@components/landing/SearchPalette.vue";
import { useAppCursor } from "@composables/useAppCursor";
import { usePlayground } from "@composables/usePlayground";
import { doctor } from "@supermousejs/utils";

const route = useRoute();
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

// Reset Lenis scroll on route change (SSR-safe, mirrors the old route-pending
// + router.isReady() behavior from the vite-ssg entry)
watch(
  () => route.path,
  () => {
    if (typeof window === "undefined" || !lenis) return;
    lenis.scrollTo(0, { immediate: true });
  }
);

const navigateEditor = (id: string): void => {
  activeRecipeId.value = id;
};

watch(
  [isEditorOpen, isSearchOpen],
  ([editor, search]) => {
    if (typeof window === "undefined" || !lenis) return;

    if (editor || search) {
      lenis.stop();
    } else {
      lenis.start();
    }
  },
  { flush: "post" }
);

watch(
  instance,
  (app) => {
    if (app) {
      if (import.meta.dev) {
        doctor(app);
      }
    }
  },
  { immediate: true }
);

onUnmounted(() => {
  window.removeEventListener("keydown", handleKeydown);
  stopLenis();
});
</script>

<template>
  <div class="relative min-h-screen bg-white flex flex-col">
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
