<template>
  <!-- Meta Data Strip -->
  <div
    class="flex flex-col md:flex-row items-start md:items-center gap-1 md:gap-6 mb-12 border-y border-border py-4 font-mono text-xs"
  >
    <template v-for="(item, index) in items" :key="item.label">
      <div :class="['flex items-center gap-2', item.class]">
        <span class="font-bold text-inverse">{{ item.label }}</span>
        <span class="text-muted">{{ item.content }}</span>
      </div>
      <div
        v-if="index < items.length - 1"
        class="w-full h-px hidden md:flex bg-border md:w-px md:h-4"
      />
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
