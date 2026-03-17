<template>
  <!-- Meta Data Strip -->
  <div
    class="flex items-center gap-6 mb-12 border-y border-zinc-200 py-4 font-mono text-xs"
  >
    <template v-for="(item, index) in items" :key="item.label">
      <div :class="['flex items-center gap-2', item.class]">
        <span class="font-bold text-zinc-900">{{ item.label }}</span>
        <span class="text-zinc-500">{{ item.content }}</span>
      </div>
      <div v-if="index < items.length - 1" class="w-px h-4 bg-zinc-200"></div>
    </template>
  </div>
</template>

<script setup lang="ts">
interface MetadataItem {
  label: string;
  content: string;
  class?: string;
}

const { items } = defineProps<{
  items: MetadataItem[];
}>();
</script>
