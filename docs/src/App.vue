<script setup lang="ts">
import { watch, ref, onMounted, onUnmounted, nextTick } from "vue";
import { useRouter } from "vue-router";
import Lenis from "lenis";
import Navbar from "@components/landing/Navbar.vue";
import CursorEditor from "@components/playground/CursorEditor.vue";
import SearchPalette from "@components/landing/SearchPalette.vue";
import { useAppCursor } from "@composables/useAppCursor";
import { usePlayground } from "@composables/usePlayground";

const router = useRouter();
const mouse = useAppCursor();

const { isOpen: isEditorOpen, activeRecipeId, close: closeEditor } = usePlayground();

const isSearchOpen = ref(false);
const isRouteReady = ref(import.meta.env.SSR);

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
let resizeObserver: ResizeObserver | null = null;

const startLenis = () => {
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

const stopLenis = () => {
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

onMounted(async () => {
  window.addEventListener("keydown", handleKeydown);

  if (!import.meta.env.SSR) {
    await router.isReady();
    isRouteReady.value = true;
    document.documentElement.classList.remove("route-pending");
  }

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

watch(
  [isEditorOpen, isSearchOpen],
  ([editor, search]) => {
    if (typeof window === "undefined" || !lenis) return;

    if (editor || search) {
      lenis.stop();
    } else {
      lenis.start();
    }

    if (mouse.value) {
      if (editor || search) mouse.value.disable();
      else mouse.value.enable();
    }
  },
  { flush: "post" }
);

onUnmounted(() => {
  window.removeEventListener("keydown", handleKeydown);
  stopLenis();
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
      <main v-if="isRouteReady" class="flex-1 flex flex-col min-h-0 relative z-10">
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
