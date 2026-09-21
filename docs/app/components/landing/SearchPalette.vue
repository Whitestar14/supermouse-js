<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from "vue";
import { useSearch, type SearchResult } from "@composables/useSearch";

const emit = defineEmits(["close"]);
const router = useRouter();
const { query, results, isLoading } = useSearch();
const searchInput = ref<HTMLInputElement | null>(null);
const selectedIndex = ref(0);

/* The index builds in a few ms, so the loader would flash unseen; hold it for a
 * floor. A cached second open skips it entirely. */
const LOADER_FLOOR_MS = 700;
const showLoader = ref(false);
let loaderTimer: ReturnType<typeof setTimeout> | null = null;
let loaderShownAt = 0;

watch(
  isLoading,
  (loading) => {
    if (loaderTimer) clearTimeout(loaderTimer);

    if (loading) {
      loaderShownAt = Date.now();
      showLoader.value = true;
      return;
    }

    const remaining = LOADER_FLOOR_MS - (Date.now() - loaderShownAt);
    if (remaining <= 0) {
      showLoader.value = false;
      return;
    }
    loaderTimer = setTimeout(() => (showLoader.value = false), remaining);
  },
  { immediate: true }
);

/** Jump to the exact section, not just the page. */
const navigate = async (result: SearchResult): Promise<void> => {
  await router.push(result.anchor ? `${result.path}#${result.anchor}` : result.path);
  emit("close");
};

const handleKeydown = (e: KeyboardEvent): void => {
  if (e.key === "Escape") {
    emit("close");
    return;
  }

  const count = results.value.length;
  if (count === 0) return;

  if (e.key === "ArrowDown") {
    e.preventDefault();
    selectedIndex.value = (selectedIndex.value + 1) % count;
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    selectedIndex.value = (selectedIndex.value - 1 + count) % count;
  } else if (e.key === "Enter") {
    e.preventDefault();
    const target = results.value[selectedIndex.value];
    if (target) {
      void (async () => {
        await navigate(target);
        emit("close");
      })();
    }
  }
};

onMounted(() => {
  searchInput.value?.focus();
  window.addEventListener("keydown", handleKeydown);
});

onUnmounted(() => {
  window.removeEventListener("keydown", handleKeydown);
  if (loaderTimer) clearTimeout(loaderTimer);
});

watch(query, () => {
  selectedIndex.value = 0;
});
</script>

<template>
  <div class="fixed inset-0 z-[100] flex flex-col md:items-center md:pt-[12vh]">
    <div class="absolute inset-0 md:bg-inverse/20" @click="emit('close')" />

    <!--
      Stable frame: the card keeps a fixed height regardless of state (loading,
      empty, results), so opening the palette never shifts layout.
    -->
    <div
      class="relative w-full md:w-[42rem] max-w-full md:border border-border bg-surface flex flex-col h-full md:h-[26rem] overflow-hidden"
    >
      <!-- Input -->
      <div class="flex items-center border-b border-border h-16 md:h-14 px-4 shrink-0">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          class="text-subtle shrink-0"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          ref="searchInput"
          v-model="query"
          type="text"
          placeholder="Search Documentation..."
          class="flex-1 h-full outline-none text-base font-semibold tracking-tight placeholder:text-faint bg-transparent text-inverse px-3 min-w-0"
        />
        <!-- Mobile close button -->
        <button
          class="md:hidden mono text-[10px] font-bold text-muted px-2 py-1 ml-2 shrink-0"
          @click="emit('close')"
        >
          CLOSE
        </button>
        <kbd
          class="hidden md:inline mono text-[10px] bg-surface-subtle px-1.5 py-0.5 text-muted font-bold border border-border ml-2 shrink-0"
        >
          ESC
        </kbd>
      </div>

      <!--
        Results: flex-1 with min-h-0 so the list scrolls inside the stable
        frame instead of resizing it.
      -->
      <div v-if="results.length" class="flex-1 min-h-0 overflow-y-auto" data-lenis-prevent>
        <div
          v-for="(res, i) in results"
          :key="res.id"
          class="w-full text-left px-4 h-14 flex items-center border-b border-border last:border-b-0 transition-colors duration-100"
          :class="
            i === selectedIndex ? 'bg-inverse text-surface' : 'bg-surface text-inverse hover:bg-surface-muted'
          "
          @click="navigate(res)"
          data-supermouse-icon="pointer"
        >
          <div class="flex flex-col truncate w-56 shrink-0">
            <span
              class="text-sm font-bold tracking-tight truncate"
              :class="i === selectedIndex ? 'text-surface' : 'text-inverse'"
            >
              {{ res.label }}
            </span>
            <span
              v-if="res.heading && res.heading !== res.label"
              class="text-[10px] font-mono truncate"
              :class="i === selectedIndex ? 'text-faint' : 'text-muted'"
            >
              {{ res.heading }}
            </span>
          </div>
          <span
            class="text-xs truncate flex-1 px-4"
            :class="i === selectedIndex ? 'text-faint' : 'text-muted'"
          >
            {{ res.description || res.path }}
          </span>
          <span
            class="mono text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 shrink-0 border"
            :class="
              i === selectedIndex
                ? 'border-elevated text-faint'
                : 'border-border text-body bg-surface-muted'
            "
          >
            {{ res.type }}
          </span>
        </div>
      </div>

      <!-- Loading / empty share the stable frame; the square loader is a 3x3
           grid of cells that fills in rotation, npm-fetch-suggestion style. -->
      <div v-else class="flex-1 min-h-0 flex flex-col items-center justify-center gap-4">
        <template v-if="showLoader">
          <div class="grid grid-cols-3 gap-1" aria-label="Loading search index">
            <span
              v-for="cell in 9"
              :key="cell"
              class="w-1.5 h-1.5 bg-subtle"
              :style="{ animation: `search-cell 1.2s ${(cell - 1) * 0.12}s infinite ease-in-out` }"
            />
          </div>
          <p class="mono text-[10px] font-bold text-subtle tracking-widest">LOADING INDEX…</p>
        </template>
        <template v-else-if="query">
          <p class="mono text-xs font-bold text-subtle tracking-widest">NO RESULTS</p>
          <p class="mono text-[10px] text-faint tracking-widest">TRY A DIFFERENT QUERY</p>
        </template>
        <!-- Idle: the frame stays populated instead of collapsing to blank. -->
        <template v-else>
          <div class="flex items-center gap-2">
            <span class="w-1.5 h-1.5 bg-accent" />
            <p class="mono text-[11px] font-bold uppercase tracking-widest text-muted">
              Search the Documentation
            </p>
          </div>
          <p class="mono text-[10px] text-faint tracking-widest">
            GUIDES · PLUGINS · API REFERENCE
          </p>
        </template>
      </div>

      <!-- Footer key hints -->
      <div
        class="hidden md:flex h-9 shrink-0 items-center justify-between border-t border-border bg-surface-muted px-4"
      >
        <div class="flex items-center gap-4 mono text-[10px] font-bold text-muted">
          <span class="flex items-center gap-1.5">
            <kbd class="border border-border bg-surface px-1.5 py-0.5 text-subtle">↑↓</kbd>
            Navigate
          </span>
          <span class="flex items-center gap-1.5">
            <kbd class="border border-border bg-surface px-1.5 py-0.5 text-subtle">↵</kbd>
            Open
          </span>
          <span class="flex items-center gap-1.5">
            <kbd class="border border-border bg-surface px-1.5 py-0.5 text-subtle">ESC</kbd>
            Close
          </span>
        </div>
        <span class="mono text-[10px] uppercase tracking-widest text-faint font-bold">
          Supermouse Search
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes search-cell {
  0%,
  70%,
  100% {
    opacity: 0.2;
  }
  35% {
    opacity: 1;
  }
}
</style>
