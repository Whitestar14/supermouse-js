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

const emit = defineEmits(["update:modelValue"]);

// Calculate the percentage fill for the track
const progress = computed(() => {
  return ((props.modelValue - props.min) / (props.max - props.min)) * 100;
});
</script>

<template>
  <div
    class="space-y-3 p-3 border border-transparent hover:border-zinc-100 hover:bg-zinc-50/50 transition-colors"
  >
    <div class="flex justify-between items-baseline">
      <div>
        <label class="text-xs font-bold text-zinc-900 uppercase tracking-tighter">{{
          label
        }}</label>
        <p v-if="description" class="text-[10px] text-zinc-500 font-mono mt-0.5 leading-none">
          {{ description }}
        </p>
      </div>
      <span
        class="font-mono text-[10px] text-zinc-600 font-bold bg-zinc-100 px-1.5 py-0.5 min-w-[2.5rem] text-right border border-zinc-200"
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
      :style="{
        background: `linear-gradient(to right, #000 ${progress}%, #e4e4e7 ${progress}%)`
      }"
      @input="emit('update:modelValue', Number(($event.target as HTMLInputElement).value))"
    />
  </div>
</template>

<style scoped>
.supermouse-range {
  @apply w-full h-1 appearance-none cursor-pointer transition-all;
  outline: none;
}

/* Custom Thumb (Knob) Styling */
.supermouse-range::-webkit-slider-thumb {
  @apply appearance-none w-3 h-3 bg-black border border-white shadow-[0_0_0_1px_black] transition-transform active:scale-125;
  cursor: grab;
}

.supermouse-range::-moz-range-thumb {
  @apply w-3 h-3 bg-black border border-white shadow-[0_0_0_1px_black] rounded-none transition-transform active:scale-125;
  cursor: grab;
}

/* Ensure track looks consistent in Firefox */
.supermouse-range::-moz-range-track {
  @apply h-1 bg-transparent;
}
</style>
