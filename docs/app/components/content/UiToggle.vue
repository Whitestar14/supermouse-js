<script setup lang="ts">
defineProps<{
  modelValue: boolean;
  label: string;
  description?: string;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
}>();
</script>

<template>
  <div
    class="flex items-center justify-between border border-border p-3 bg-surface hover:border-faint transition-colors rounded-none"
  >
    <div class="flex flex-col">
      <span class="text-sm font-bold text-inverse">{{ label }}</span>
      <span v-if="description" class="text-[10px] text-muted font-mono mt-0.5">
        {{ description }}
      </span>
    </div>
    <button
      type="button"
      class="w-10 h-5 relative flex items-center p-0.5 transition-colors focus:outline-none focus:ring-2 focus:ring-black/10 cursor-pointer"
      :class="modelValue ? 'bg-inverse' : 'bg-border'"
      aria-label="Toggle"
      @click="emit('update:modelValue', !modelValue)"
    >
      <div
        class="w-4 h-4 bg-surface transition-transform duration-200 ease-out pointer-events-none"
        :class="modelValue ? 'translate-x-5' : 'translate-x-0'"
      />
    </button>
  </div>
</template>
