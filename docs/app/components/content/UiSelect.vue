<script setup lang="ts">
defineProps<{
  modelValue: string;
  label: string;
  options: string[];
  description?: string;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
}>();
</script>

<template>
  <div class="space-y-3 p-3">
    <div>
      <label class="text-sm font-bold text-inverse block">{{ label }}</label>
      <p v-if="description" class="text-[10px] text-muted font-mono mt-0.5">
        {{ description }}
      </p>
    </div>

    <div class="grid grid-cols-2 gap-px bg-border border border-border overflow-hidden">
      <button
        v-for="opt in options"
        :key="opt"
        type="button"
        class="px-3 py-2 text-xs font-bold transition-all capitalize text-center cursor-pointer"
        :class="
          modelValue === opt
            ? 'bg-inverse text-surface'
            : 'bg-surface text-muted hover:text-inverse hover:bg-surface-muted'
        "
        @click="emit('update:modelValue', opt)"
      >
        {{ opt }}
      </button>
    </div>
  </div>
</template>
