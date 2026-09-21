<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  modelValue: number;
  label: string;
  min: number;
  max: number;
  step: number;
  unit?: string;
  description?: string;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: number): void;
}>();

const progress = computed(() => {
  if (props.max === props.min) return 0;
  return ((props.modelValue - props.min) / (props.max - props.min)) * 100;
});

/* Token-based track fill; inline because the track is a CSS gradient. */
const trackStyle = computed(() => ({
  background: `linear-gradient(to right, var(--color-inverse) ${progress.value}%, var(--color-border) ${progress.value}%)`
}));
</script>

<template>
  <div
    class="space-y-3 p-3 border border-transparent hover:border-border-subtle hover:bg-surface-muted/50 transition-colors"
  >
    <div class="flex justify-between items-baseline">
      <div>
        <label class="text-xs font-bold text-inverse uppercase tracking-tighter">{{
          label
        }}</label>
        <p v-if="description" class="text-[10px] text-muted font-mono mt-0.5 leading-none">
          {{ description }}
        </p>
      </div>
      <span
        class="font-mono text-[10px] text-body font-bold bg-surface-subtle px-1.5 py-0.5 min-w-[2.5rem] text-right border border-border"
      >
        {{ modelValue }}{{ unit || "" }}
      </span>
    </div>

    <input
      type="range"
      :value="modelValue"
      :min="min"
      :max="max"
      :step="step"
      class="supermouse-range"
      :style="trackStyle"
      @input="emit('update:modelValue', Number(($event.target as HTMLInputElement).value))"
      data-supermouse-icon="grab"
    />
  </div>
</template>

<style scoped>
/* Slider chrome lives in index.css (.supermouse-range) so the demo drawers
   can reuse the identical control. */
</style>
