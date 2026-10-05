<script setup lang="ts">
import { computed, reactive, watch } from "vue";
import ControlSlider from "./ControlSlider.vue";

/**
 * ControlColor — a colour control built from the design system rather than a
 * native `<input type="color">`: a curated swatch row plus HSL rails, each with
 * a live gradient track and a handle tinted to the value it edits. This keeps
 * the picker reading like the rest of the docs chrome in both themes.
 */
const props = withDefaults(
  defineProps<{
    label?: string;
    modelValue: string;
  }>(),
  { label: "Color" }
);

const emit = defineEmits<{ "update:modelValue": [value: string] }>();

/** Brand accent first, then a balanced spread for the demos. */
const PRESETS = [
  "#f59e0b",
  "#ef4444",
  "#ec4899",
  "#8b5cf6",
  "#3b82f6",
  "#06b6d4",
  "#10b981",
  "#eab308",
  "#f4f4f5",
  "#18181b"
];

const hsl = reactive({ h: 38, s: 92, l: 50 });
let lastEmitted: string | null = null;

function hexToHsl(hex: string): { h: number; s: number; l: number } | null {
  let value = hex.trim().replace(/^#/, "");
  if (value.length === 3) {
    value = value
      .split("")
      .map((char) => char + char)
      .join("");
  }
  if (!/^[0-9a-f]{6}$/i.test(value)) return null;

  const r = parseInt(value.slice(0, 2), 16) / 255;
  const g = parseInt(value.slice(2, 4), 16) / 255;
  const b = parseInt(value.slice(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const lightness = (max + min) / 2;

  let hue = 0;
  let saturation = 0;
  if (max !== min) {
    const delta = max - min;
    saturation = lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min);
    if (max === r) hue = (g - b) / delta + (g < b ? 6 : 0);
    else if (max === g) hue = (b - r) / delta + 2;
    else hue = (r - g) / delta + 4;
    hue *= 60;
  }

  return { h: Math.round(hue), s: Math.round(saturation * 100), l: Math.round(lightness * 100) };
}

function hslToHex(h: number, s: number, l: number): string {
  const saturation = s / 100;
  const lightness = l / 100;
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const second = chroma * (1 - Math.abs(((h / 60) % 2) - 1));
  const offset = lightness - chroma / 2;

  let rgb: [number, number, number];
  if (h < 60) rgb = [chroma, second, 0];
  else if (h < 120) rgb = [second, chroma, 0];
  else if (h < 180) rgb = [0, chroma, second];
  else if (h < 240) rgb = [0, second, chroma];
  else if (h < 300) rgb = [second, 0, chroma];
  else rgb = [chroma, 0, second];

  const channel = (value: number): string =>
    Math.round((value + offset) * 255)
      .toString(16)
      .padStart(2, "0");

  return `#${channel(rgb[0])}${channel(rgb[1])}${channel(rgb[2])}`;
}

// Re-sync from the hex only when it did not originate here — the round-trip
// through 8-bit hex rarely reproduces the exact wheel values, and adopting them
// would make the rails jump under the handle mid-drag.
watch(
  () => props.modelValue,
  (value) => {
    if (lastEmitted && value.toLowerCase() === lastEmitted.toLowerCase()) return;
    const parsed = hexToHsl(value);
    if (parsed) Object.assign(hsl, parsed);
  },
  { immediate: true }
);

const commit = (): void => {
  lastEmitted = hslToHex(hsl.h, hsl.s, hsl.l);
  emit("update:modelValue", lastEmitted);
};

const selected = (preset: string): boolean =>
  preset.toLowerCase() === props.modelValue.toLowerCase();

const thumb = computed(() => hslToHex(hsl.h, hsl.s, hsl.l));

const HUE_TRACK =
  "linear-gradient(to right, hsl(0 100% 50%), hsl(60 100% 50%), hsl(120 100% 50%), hsl(180 100% 50%), hsl(240 100% 50%), hsl(300 100% 50%), hsl(360 100% 50%))";

const satTrack = computed(
  () => `linear-gradient(to right, hsl(${hsl.h} 0% ${hsl.l}%), hsl(${hsl.h} 100% ${hsl.l}%))`
);

const lightTrack = computed(
  () =>
    `linear-gradient(to right, hsl(${hsl.h} ${hsl.s}% 0%), hsl(${hsl.h} ${hsl.s}% 50%), hsl(${hsl.h} ${hsl.s}% 100%))`
);
</script>

<template>
  <div class="select-none">
    <div class="flex items-center justify-between gap-3 mb-2">
      <span class="mono text-[9px] font-bold uppercase tracking-widest text-muted">{{
        label
      }}</span>
      <span class="flex items-center gap-2">
        <span class="h-3.5 w-3.5 border border-border" :style="{ background: modelValue }" />
        <span class="mono text-[10px] font-bold uppercase tabular-nums text-body">{{
          modelValue
        }}</span>
      </span>
    </div>

    <div class="flex flex-wrap gap-1.5 mb-3">
      <button
        v-for="preset in PRESETS"
        :key="preset"
        type="button"
        class="h-4 w-4 border transition-colors"
        :class="
          selected(preset)
            ? 'border-inverse shadow-[0_0_0_1px_var(--color-inverse)]'
            : 'border-border hover:border-subtle'
        "
        :style="{ background: preset }"
        :aria-label="`Use colour ${preset}`"
        :aria-pressed="selected(preset)"
        @click="emit('update:modelValue', preset)"
      />
    </div>

    <div class="grid grid-cols-1 gap-x-6 gap-y-2.5 sm:grid-cols-3">
      <ControlSlider
        label="Hue"
        :model-value="hsl.h"
        :min="0"
        :max="360"
        unit="°"
        :track="HUE_TRACK"
        :thumb="thumb"
        @update:model-value="
          (value) => {
            hsl.h = value;
            commit();
          }
        "
      />
      <ControlSlider
        label="Saturation"
        :model-value="hsl.s"
        :min="0"
        :max="100"
        unit="%"
        :track="satTrack"
        :thumb="thumb"
        @update:model-value="
          (value) => {
            hsl.s = value;
            commit();
          }
        "
      />
      <ControlSlider
        label="Lightness"
        :model-value="hsl.l"
        :min="0"
        :max="100"
        unit="%"
        :track="lightTrack"
        :thumb="thumb"
        @update:model-value="
          (value) => {
            hsl.l = value;
            commit();
          }
        "
      />
    </div>
  </div>
</template>
