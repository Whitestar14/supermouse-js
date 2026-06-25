<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from "vue";
import { useRouter } from "vue-router";
import { useSearch } from "@composables/useSearch";

const emit = defineEmits(["close"]);
const router = useRouter();
const { query, results } = useSearch();
const searchInput = ref<HTMLInputElement | null>(null);
const selectedIndex = ref(0);

const navigate = (path: string) => {
  router.push(path);
  emit("close");
};

const handleKeydown = (e: KeyboardEvent) => {
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
    if (results.value[selectedIndex.value]) {
      navigate(results.value[selectedIndex.value].path);
    }
  } else if (e.key === "Escape") {
    emit("close");
  }
};

onMounted(() => {
  searchInput.value?.focus();
  window.addEventListener("keydown", handleKeydown);
});

onUnmounted(() => {
  window.removeEventListener("keydown", handleKeydown);
});

watch(query, () => {
  selectedIndex.value = 0;
});
</script>

<template>
  <div class="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4 duration-0">
    <!-- Backdrop -->
    <div
      class="absolute inset-0 bg-zinc-900/20 backdrop-blur-sm duration-0"
      @click="emit('close')"
    />

    <!-- Modal -->
    <div
      class="relative w-full max-w-2xl bg-white border border-zinc-900 shadow-2xl flex flex-col overflow-hidden rounded-none duration-0"
    >
      <!-- Input -->
      <div class="flex items-center px-6 h-16 border-b border-zinc-200 bg-white">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="3"
          class="text-zinc-900 mr-4"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          ref="searchInput"
          v-model="query"
          type="text"
          placeholder="Search docs, plugins, and guides..."
          class="flex-1 h-full outline-none text-lg font-medium placeholder:text-zinc-400 bg-transparent text-black"
        />
        <div
          class="mono text-[10px] bg-zinc-100 px-2 py-1 rounded-sm text-zinc-500 font-bold tracking-widest uppercase border border-zinc-200"
        >
          ESC
        </div>
      </div>

      <!-- Results (Lenis Prevent applied here) -->
      <div
        v-if="results.length > 0"
        class="bg-zinc-50 max-h-[400px] overflow-y-auto"
        data-lenis-prevent
      >
        <div
          class="mono text-[10px] font-bold text-zinc-400 uppercase tracking-widest px-6 py-3 border-b border-zinc-200 bg-zinc-100/50"
        >
          {{ query ? "Results" : "Quick Links" }}
        </div>
        <button
          v-for="(res, i) in results"
          :key="res.id"
          class="w-full text-left px-6 py-4 flex items-start justify-between gap-4 group transition-colors duration-100 border-b border-zinc-200 last:border-0"
          :class="
            i === selectedIndex ? 'bg-black text-white' : 'bg-white text-black hover:bg-zinc-100'
          "
          @click="navigate(res.path)"
        >
          <div class="flex-1 min-w-0 flex flex-col justify-center">
            <span
              class="text-sm font-bold tracking-tight block transition-colors duration-100"
              :class="i === selectedIndex ? 'text-white' : 'text-zinc-900'"
            >
              {{ res.label }}
            </span>
            <span
              v-if="res.description"
              class="text-[11px] block line-clamp-1 mt-1 transition-colors duration-100"
              :class="i === selectedIndex ? 'text-zinc-300' : 'text-zinc-500'"
            >
              {{ res.description }}
            </span>
            <span
              class="text-[10px] font-mono block truncate mt-2 transition-colors duration-100"
              :class="i === selectedIndex ? 'text-zinc-400' : 'text-zinc-400'"
            >
              {{ res.path }}
            </span>
          </div>
          <span
            class="mono text-[10px] uppercase tracking-widest font-bold whitespace-nowrap flex-shrink-0 px-2 py-1 border transition-colors duration-100 rounded-sm"
            :class="[
              i === selectedIndex
                ? 'bg-white text-black border-white'
                : 'bg-zinc-100 text-zinc-500 border-zinc-200'
            ]"
          >
            {{ res.type }}
          </span>
        </button>
      </div>

      <!-- Empty State -->
      <div v-else-if="query" class="p-8 text-center">
        <p class="text-zinc-400 font-mono text-xs">No results found for "{{ query }}"</p>
      </div>
    </div>
  </div>
</template>
