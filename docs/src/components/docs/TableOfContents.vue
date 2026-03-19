<script setup lang="ts">
export interface TOCSection {
  id: string;
  label: string;
}

defineProps<{
  sections: TOCSection[];
  activeSection: string;
}>();

defineEmits<{
  navigate: [id: string];
}>();
</script>

<template>
  <div>
    <div
      class="font-mono text-xs font-bold uppercase tracking-widest text-zinc-400 mb-3"
    >
      On This Page
    </div>
    <nav class="flex flex-col gap-2 text-sm">
      <button
        v-for="section in sections"
        :key="section.id"
        type="button"
        @click="$emit('navigate', section.id)"
        class="text-left w-full transition-colors"
        :class="
          activeSection === section.id
            ? 'text-black font-bold'
            : 'text-zinc-600 hover:text-black'
        "
      >
        {{ section.label }}
      </button>
    </nav>
  </div>
</template>
