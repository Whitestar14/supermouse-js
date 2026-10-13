<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from "vue";
import gsap from "gsap";
import FieldControl from "./FieldControl.vue";
import type { CursorConfig, CursorEntry, CursorValue, RangeControl, ToggleControl } from "../types";

/**
 * The only chrome in the showcase. It stays out of the way until the pointer
 * visits the top-left corner, then unfolds beneath the corner cue.
 */
const props = defineProps<{
  entry: CursorEntry;
  config: CursorConfig;
  lag: number;
  native: boolean;
  current: string;
  total: string;
}>();

const emit = defineEmits<{
  (event: "set", key: string, value: CursorValue): void;
  (event: "lag", value: number): void;
  (event: "native", value: boolean): void;
  (event: "reset"): void;
}>();

const open = ref(false);
const pinned = ref(false);
const panel = ref<HTMLElement | null>(null);

const reduceMotion = (): boolean =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

let grace: number | undefined;

function reveal(): void {
  if (grace) window.clearTimeout(grace);
  grace = undefined;
  open.value = true;
}

function retreat(): void {
  if (pinned.value) return;
  if (grace) window.clearTimeout(grace);
  // A short grace so the pointer can cross from the cue into the panel.
  grace = window.setTimeout(() => {
    open.value = false;
    grace = undefined;
  }, 220);
}

function togglePin(): void {
  pinned.value = !pinned.value;
  if (pinned.value) reveal();
  else retreat();
}

watch(open, (value) => {
  const el = panel.value;
  if (!el) return;

  if (reduceMotion()) {
    gsap.set(el, { xPercent: value ? 0 : -100, opacity: value ? 1 : 0 });
    return;
  }

  if (value) {
    gsap
      .timeline()
      .set(el, { xPercent: -100, opacity: 0 })
      .to(el, { xPercent: 0, opacity: 1, duration: 0.64, ease: "expo.out" })
      .fromTo(
        el.querySelectorAll("[data-row]"),
        { x: -16, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.5, ease: "power2.out", stagger: 0.03 },
        0.1
      );
  } else {
    gsap.to(el, { xPercent: -100, opacity: 0, duration: 0.36, ease: "power3.inOut" });
  }
});

onMounted(() => {
  if (panel.value) gsap.set(panel.value, { xPercent: -100 });
});

onUnmounted(() => {
  if (grace) window.clearTimeout(grace);
});

/** The physics every cursor shares — the two knobs the engine exposes. */
const lagField: RangeControl = {
  key: "lag",
  kind: "range",
  label: "Smoothing",
  min: 0.02,
  max: 0.5,
  step: 0.01,
  hint: "How far the cursor trails the pointer, engine-wide."
};

const nativeField: ToggleControl = {
  key: "native",
  kind: "toggle",
  label: "Native pointer",
  hint: "Draw the OS cursor alongside the custom one."
};

const setValue = (key: string, value: CursorValue): void => emit("set", key, value);

defineExpose({
  close: () => {
    pinned.value = false;
    open.value = false;
  },
  toggle: () => togglePin(),
  isOpen: (): boolean => open.value
});
</script>

<template>
  <div class="drawer" data-ui>
    <button
      class="cue"
      :class="{ 'is-open': open, 'is-pinned': pinned }"
      type="button"
      aria-label="Show cursor controls"
      :aria-expanded="open"
      @mouseenter="reveal"
      @mouseleave="retreat"
      @click="togglePin"
      @focus="reveal"
    >
      <span class="cue__mark" />
      <span class="cue__text">Controls</span>
      <span class="cue__entry">{{ entry.name }}</span>
    </button>

    <aside
      ref="panel"
      class="tray"
      aria-label="Cursor controls"
      @mouseenter="reveal"
      @mouseleave="retreat"
    >
      <header class="tray__head" data-row>
        <span class="tray__eyebrow">Cursor</span>
        <h3 class="tray__title">{{ entry.name }}</h3>
        <span class="tray__index">{{ current }}<i>/</i>{{ total }}</span>
      </header>

      <div class="tray__scroll">
        <div class="tray__group">
          <p class="tray__legend" data-row>
            <span>Options</span>
            <span>{{ entry.controls.length }}</span>
          </p>
          <FieldControl
            v-for="field in entry.controls"
            :key="field.key"
            data-row
            :field="field"
            :value="config[field.key]"
            @update="setValue(field.key, $event)"
          />
          <p v-if="!entry.controls.length" class="tray__empty" data-row>
            This cursor has no options — it is what it is.
          </p>
        </div>

        <div class="tray__group">
          <p class="tray__legend" data-row>
            <span>Physics</span>
            <span>shared</span>
          </p>
          <FieldControl
            data-row
            :field="lagField"
            :value="lag"
            @update="emit('lag', Number($event))"
          />
          <FieldControl
            data-row
            :field="nativeField"
            :value="native"
            @update="emit('native', $event === true)"
          />
        </div>
      </div>

      <footer class="tray__foot" data-row>
        <button type="button" class="tray__reset" @click="emit('reset')">Reset</button>
        <span class="tray__keys"><kbd>C</kbd> pin <kbd>Esc</kbd> close</span>
      </footer>
    </aside>
  </div>
</template>
