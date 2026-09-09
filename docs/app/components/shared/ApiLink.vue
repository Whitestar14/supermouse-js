<script setup lang="ts">
import { computed, ref } from "vue";
import { resolveApiHref, API_CATALOG } from "@composables/useApiReference";

const props = defineProps<{
  to: string;
}>();

const href = computed(() => resolveApiHref(props.to));
const meta = computed(() => API_CATALOG[props.to.toLowerCase()] || API_CATALOG[props.to]);

const isHovered = ref(false);
let hideTimeout: ReturnType<typeof setTimeout> | null = null;

const onMouseEnter = () => {
  if (hideTimeout) {
    clearTimeout(hideTimeout);
    hideTimeout = null;
  }
  isHovered.value = true;
};

const onMouseLeave = () => {
  hideTimeout = setTimeout(() => {
    isHovered.value = false;
  }, 120);
};
</script>

<template>
  <span class="relative inline-block" @mouseenter="onMouseEnter" @mouseleave="onMouseLeave">
    <NuxtLink
      :to="href"
      :data-supermouse-text="`API: ${to}`"
      class="inline-flex items-center gap-1 font-mono text-xs font-bold text-zinc-900 bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 hover:border-zinc-400 px-1.5 py-0.5 transition-colors cursor-pointer rounded-none"
    >
      <span>{{ to }}</span>
      <span class="text-[9px] text-zinc-400 font-sans font-normal uppercase select-none">API</span>
    </NuxtLink>

    <!-- Fast Hover Popover Card -->
    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0 translate-y-1 scale-95"
      enter-to-class="opacity-100 translate-y-0 scale-100"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100 translate-y-0 scale-100"
      leave-to-class="opacity-0 translate-y-1 scale-95"
    >
      <div
        v-if="isHovered && meta"
        class="absolute left-0 bottom-full mb-2 z-50 w-72 p-3 bg-neutral-950 text-neutral-100 border border-neutral-800 shadow-2xl pointer-events-none rounded-none text-left"
      >
        <div class="flex items-center justify-between gap-2 mb-1.5">
          <span class="font-mono text-xs font-bold text-white">{{ meta.name }}</span>
          <span class="text-[9px] font-mono uppercase tracking-widest text-amber-400 px-1 bg-amber-400/10 border border-amber-400/20">
            {{ meta.category }}
          </span>
        </div>
        <div class="font-mono text-[10px] text-zinc-300 bg-neutral-900 px-2 py-1 mb-1.5 border border-neutral-800 break-all">
          {{ meta.signature }}
        </div>
        <p class="text-xs text-neutral-400 leading-tight">
          {{ meta.description }}
        </p>
      </div>
    </Transition>
  </span>
</template>
