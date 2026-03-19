<script setup lang="ts">
defineProps<{
  phase: string;
  title: string;
  active?: boolean;
  last?: boolean;
}>();
</script>

<template>
  <div class="relative pl-8 md:pl-12 group" :class="!last && 'pb-16'">
    <!-- Timeline dot -->
    <div
      :class="[
        'absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 transition-all group-hover:scale-125',
        active
          ? 'bg-black border-zinc-900'
          : 'bg-white border-zinc-300 group-hover:border-black',
      ]"
    ></div>

    <!-- Content -->
    <div class="flex flex-col xl:flex-row gap-8">
      <div class="flex-1">
        <span
          class="mono text-[10px] font-bold text-zinc-900 uppercase tracking-widest mb-2 block"
        >
          {{ phase }}
        </span>
        <h4 class="text-xl font-bold text-zinc-900 mb-4">{{ title }}</h4>
        <slot />
      </div>
    </div>
  </div>
</template>
