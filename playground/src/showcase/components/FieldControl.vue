<script setup lang="ts">
import { computed } from "vue";
import type { CursorControl, CursorValue } from "../types";

/**
 * Renders one `CursorControl`. The drawer is schema-driven on purpose: a cursor
 * declares the knobs it has, and this file is the only thing that knows how a
 * knob looks.
 */
const props = defineProps<{
  field: CursorControl;
  value: CursorValue;
}>();

const emit = defineEmits<{ (event: "update", value: CursorValue): void }>();

const numeric = computed(() => Number(props.value));
const text = computed(() => String(props.value));
const digits = computed(() =>
  props.field.kind === "range" && (props.field.step ?? 1) < 1 ? 2 : 0
);
const isTransparent = computed(() => text.value === "transparent" || text.value === "");

/** `transparent` is not a colour input's vocabulary, so fall back to ink. */
const swatch = computed(() => (isTransparent.value ? "#000000" : text.value));

const readout = computed(() => {
  if (props.field.kind !== "range") return text.value;
  return `${numeric.value.toFixed(digits.value)}${props.field.unit ?? ""}`;
});

const onNumber = (event: Event): void => {
  emit("update", Number((event.target as HTMLInputElement).value));
};

const onString = (event: Event): void => {
  emit("update", (event.target as HTMLInputElement | HTMLSelectElement).value);
};

const onToggle = (): void => {
  emit("update", !(props.value === true));
};
</script>

<template>
  <div class="field" :class="{ 'field--structural': field.structural }">
    <div class="field__head">
      <label class="field__label" :for="`f-${field.key}`">{{ field.label }}</label>
      <span v-if="field.structural" class="field__flag" title="Rebuilt when changed">rebuild</span>
      <span v-if="field.kind === 'range'" class="field__value">{{ readout }}</span>
    </div>

    <input
      v-if="field.kind === 'range'"
      :id="`f-${field.key}`"
      class="field__range"
      type="range"
      :min="field.min"
      :max="field.max"
      :step="field.step ?? 1"
      :value="numeric"
      @input="onNumber"
    />

    <div v-else-if="field.kind === 'color'" class="field__color">
      <input
        :id="`f-${field.key}`"
        class="field__swatch"
        type="color"
        :value="swatch"
        @input="onString"
      />
      <span class="field__value field__value--hex">{{ isTransparent ? "none" : text }}</span>
      <button
        v-if="field.allowTransparent"
        type="button"
        class="field__none"
        :class="{ 'is-on': isTransparent }"
        title="Transparent"
        @click="emit('update', isTransparent ? '#fafafa' : 'transparent')"
      >
        ∅
      </button>
    </div>

    <button
      v-else-if="field.kind === 'toggle'"
      :id="`f-${field.key}`"
      type="button"
      class="field__switch"
      :class="{ 'is-on': value === true }"
      :aria-pressed="value === true"
      @click="onToggle"
    >
      <span class="field__knob" />
      <span class="field__state">{{ value === true ? "on" : "off" }}</span>
    </button>

    <select
      v-else-if="field.kind === 'select'"
      :id="`f-${field.key}`"
      class="field__select"
      :value="text"
      @change="onString"
    >
      <option v-for="option in field.options" :key="option.value" :value="option.value">
        {{ option.label }}
      </option>
    </select>

    <input
      v-else
      :id="`f-${field.key}`"
      class="field__text"
      type="text"
      :value="text"
      @input="onString"
    />

    <p v-if="field.hint" class="field__hint">{{ field.hint }}</p>
  </div>
</template>
