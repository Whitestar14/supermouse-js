<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from "vue";
import { useRouter } from "vue-router";
import { useSearch } from "@composables/useSearch";

const emit = defineEmits(["close"]);
const router = useRouter();
const { query, results } = useSearch();
const searchInput = ref<HTMLInputElement | null>(null);
const selectedIndex = ref(0);

const navigate = async (path: string): Promise<void> => {
  await router.push(path);
  emit("close");
};

const handleKeydown = (e: KeyboardEvent): void => {
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
      void (async () => {
        await navigate(results.value[selectedIndex.value].path);
        emit("close");
      })();
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
  <div class="fixed inset-0 z-[100] flex flex-col md:items-center md:pt-[10.5vh]">
    <!-- Backdrop: lighter on desktop, solid on mobile -->
    <div class="absolute inset-0 md:bg-zinc-900/30" @click="emit('close')" />

    <!-- Container: full mobile, max-width desktop, sharp, bordered -->
    <div
      class="relative w-full md:max-w-3xl md:border md:border-zinc-200 bg-white flex flex-col h-full md:h-auto md:min-h-[30vh]"
    >
      <!-- Input -->
      <div class="flex items-center border-b border-zinc-200 h-16 md:h-20 px-4 shrink-0">
        <span class="mono text-xs font-bold text-zinc-400">
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
            <line x1="21" y1="21" x2="16.65" y2="16.65" /></svg
        ></span>
        <input
          ref="searchInput"
          v-model="query"
          type="text"
          placeholder="..."
          class="flex-1 h-full outline-none text-lg font-semibold tracking-tight placeholder:text-zinc-300 bg-transparent text-black"
        />
        <!-- Mobile close button -->
        <button
          class="md:hidden mono text-[10px] font-bold text-zinc-500 px-2 py-1 ml-2"
          @click="emit('close')"
        >
          CLOSE
        </button>
        <kbd
          class="mono text-[10px] bg-zinc-100 px-1.5 py-0.5 text-zinc-500 font-bold border border-zinc-200 hidden md:inline ml-2"
        >
          ESC
        </kbd>
      </div>

      <!-- Results -->
      <div v-if="results.length" class="flex-1 overflow-y-auto md:max-h-[50vh]">
        <div
          v-for="(res, i) in results"
          :key="res.id"
          class="w-full text-left px-4 h-14 flex items-center border-b border-zinc-200 last:border-b-0 transition-colors duration-100"
          :class="
            i === selectedIndex ? 'bg-black text-white' : 'bg-white text-black hover:bg-zinc-50'
          "
          @click="navigate(res.path)"
          data-supermouse-icon="pointer"
        >
          <span
            class="text-sm font-bold tracking-tight truncate w-48 shrink-0"
            :class="i === selectedIndex ? 'text-white' : 'text-zinc-900'"
          >
            {{ res.label }}
          </span>
          <span class="mono text-[11px] truncate flex-1 px-4 text-zinc-400">
            {{ res.path }}
          </span>
          <span class="mono text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 shrink-0">
            {{ res.type }}
          </span>
        </div>
      </div>

      <!-- Empty: explicit height, not flex-1 -->
      <div
        v-else-if="query"
        class="flex items-center justify-center h-32 md:h-48 border-t border-zinc-200"
      >
        <p class="mono text-xs font-bold text-zinc-400 tracking-widest">NO RESULTS</p>
      </div>
    </div>
  </div>
</template>
