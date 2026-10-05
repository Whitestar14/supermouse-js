<script setup lang="ts">
import { computed } from "vue";

/**
 * ControlSlider — a single labelled range row for the interactive previews.
 *
 * The label sits above the track and the readout opposite it, so the control
 * stays legible when the drawers collapse to one column on narrow screens.
 * The track is an inline `background-image` gradient; the `supermouse-range`
 * class in `index.css` sizes it and owns the handle chrome.
 */
const props = withDefaults(
  defineProps<{
    label: string;
    modelValue: number;
    min: number;
    max: number;
    step?: number;
    /** Readout suffix, e.g. `px` or `°`. */
    unit?: string;
    /** Decimal places in the readout. */
    precision?: number;
    /** Custom rail gradient (wins over the default fill). */
    track?: string;
    /** Handle colour, so a control can show the value it edits. */
    thumb?: string;
  }>(),
  { step: 1, unit: "", precision: 0, track: undefined, thumb: undefined }
);

const emit = defineEmits<{ "update:modelValue": [value: number] }>();

const readout = computed(() => {
  const value =
    props.precision > 0 ? props.modelValue.toFixed(props.precision) : String(props.modelValue);
  return `${value}${props.unit}`;
});

const trackBackground = computed(() => {
  if (props.track) return props.track;
  const pct =
    props.max === props.min ? 0 : ((props.modelValue - props.min) / (props.max - props.min)) * 100;
  return `linear-gradient(to right, var(--color-inverse) ${pct}%, var(--color-border) ${pct}%)`;
});

const inputStyle = computed(() => {
  const style: Record<string, string> = { backgroundImage: trackBackground.value };
  if (props.thumb) style["--range-thumb"] = props.thumb;
  return style;
});

const onInput = (event: Event): void => {
  emit("update:modelValue", Number((event.target as HTMLInputElement).value));
};
</script>

<template>
  <label class="block select-none cursor-pointer">
    <span class="flex items-baseline justify-between gap-3 mb-1.5">
      <span class="mono text-[9px] font-bold uppercase tracking-widest text-muted">{{
        label
      }}</span>
      <span class="mono text-[10px] font-bold tabular-nums text-body">{{ readout }}</span>
    </span>
    <input
      type="range"
      :min="min"
      :max="max"
      :step="step"
      :value="modelValue"
      class="supermouse-range"
      :style="inputStyle"
      @input="onInput"
    />
  </label>
</template>
