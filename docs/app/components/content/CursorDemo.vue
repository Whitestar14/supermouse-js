<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import DemoStage from "@playground/DemoStage.vue";
import { DEMOS, createDemoSpec, smoothnessPlugin, type DemoSpec } from "@playground/demos";

/**
 * CursorDemo — inline *interactive preview* for docs content.
 */
const props = withDefaults(
  defineProps<{
    /** Key into the `DEMOS` registry (`@playground/demos.ts`). */
    demo: string;
    /** Header label. Falls back to a friendly name, then the id. */
    title?: string;
    /** Show the controls panel toggle (top-right) — on by default. */
    controls?: boolean | string;
  }>(),
  { title: undefined, controls: true }
);

const DEMO_TITLES: Record<string, string> = {
  dot: "Dot",
  ring: "Ring",
  "dot-ring": "Dot + Ring",
  magnetic: "Magnetic",
  pointer: "Pointer",
  trail: "Trail",
  sparkles: "Sparkles",
  stick: "Stick",
  text: "Text",
  "smart-ring": "SmartRing"
};

const title = computed(() => props.title ?? DEMO_TITLES[props.demo] ?? props.demo);

/* ---------------- declarative spec ---------------- */

const spec = reactive<DemoSpec>(createDemoSpec());
const DEFAULT_SPEC: DemoSpec = { ...spec };

const plugins = computed(() => {
  const factory = DEMOS[props.demo];
  if (!factory) return undefined;
  // The reactive spec is read through getters, so slider changes are live
  // without re-mounting the stage.
  return () => [smoothnessPlugin(() => spec.smoothness), ...factory(spec)];
});

watch(
  () => props.demo,
  () => {
    Object.assign(spec, DEFAULT_SPEC);
  }
);

const specOpen = ref(false);
const targetsOpen = ref(false);
const hasControls = computed(() => props.controls !== false && props.controls !== "false");
const unknownDemo = computed(() => !DEMOS[props.demo]);

/** Track fill painted from theme tokens — same treatment as UiRange. */
const trackStyle = (value: number, min: number, max: number) => {
  const pct = max === min ? 0 : ((value - min) / (max - min)) * 100;
  return {
    background: `linear-gradient(to right, var(--color-inverse) ${pct}%, var(--color-border) ${pct}%)`
  };
};

/** Shared treatment for the drawer toggles: square marker plus mono label. */
const toggleClass = (open: boolean): string =>
  [
    "flex h-7 items-center gap-2 mono text-[10px] font-bold uppercase tracking-widest transition-colors outline-none",
    open ? "text-inverse" : "text-subtle hover:text-inverse"
  ].join(" ");

const markerClass = (open: boolean): string =>
  [
    "w-1.5 h-1.5 border transition-colors",
    open ? "bg-inverse border-inverse" : "border-subtle group-hover/ctl:bg-subtle"
  ].join(" ");
</script>

<template>
  <div class="group my-8 border border-code-border bg-code-surface not-prose overflow-hidden">
    <!-- Header: same geometry as a code block header -->
    <div
      class="flex items-center justify-between gap-3 h-11 px-3 bg-surface-muted border-b border-code-border select-none"
    >
      <div class="flex items-center gap-2.5 min-w-0">
        <span class="w-1.5 h-1.5 shrink-0" :class="unknownDemo ? 'bg-faint' : 'bg-accent'" />
        <span class="mono text-[10px] font-bold uppercase tracking-widest text-muted truncate">
          {{ title }}
        </span>
        <span
          class="hidden sm:inline mono text-[9px] font-bold uppercase tracking-widest text-faint border-l border-border pl-2.5"
        >
          Interactive preview
        </span>
      </div>

      <div class="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          class="group/ctl"
          :class="toggleClass(targetsOpen)"
          :aria-expanded="targetsOpen"
          @click="targetsOpen = !targetsOpen"
        >
          <span :class="markerClass(targetsOpen)" />
          Targets
        </button>

        <button
          v-if="hasControls"
          type="button"
          class="group/ctl"
          :class="toggleClass(specOpen)"
          :aria-expanded="specOpen"
          @click="specOpen = !specOpen"
        >
          <span :class="markerClass(specOpen)" />
          Controls
        </button>
      </div>
    </div>

    <!-- Specification drawer (integrated controls, replaces the modal workflow) -->
    <div
      v-if="specOpen"
      class="border-b border-code-border bg-surface-muted/60 px-4 py-4"
    >
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 max-w-2xl">
        <label class="flex items-center justify-between gap-4">
          <span class="mono text-[10px] font-bold uppercase tracking-widest text-muted">Size</span>
          <input
            v-model.number="spec.size"
            type="range"
            min="4"
            max="48"
            step="1"
            class="supermouse-range w-40"
            :style="trackStyle(spec.size, 4, 48)"
          />
          <span class="mono text-[10px] text-body font-bold w-12 text-right">{{ spec.size }}px</span>
        </label>

        <label class="flex items-center justify-between gap-4">
          <span class="mono text-[10px] font-bold uppercase tracking-widest text-muted">Color</span>
          <input
            v-model="spec.color"
            type="color"
            class="w-16 h-7 border border-border cursor-pointer bg-transparent"
          />
          <span class="mono text-[10px] text-body font-bold w-20 text-right">{{ spec.color }}</span>
        </label>

        <label class="flex items-center justify-between gap-4">
          <span class="mono text-[10px] font-bold uppercase tracking-widest text-muted">Lag</span>
          <input
            v-model.number="spec.smoothness"
            type="range"
            min="0.02"
            max="0.5"
            step="0.01"
            class="supermouse-range w-40"
            :style="trackStyle(spec.smoothness, 0.02, 0.5)"
          />
          <span class="mono text-[10px] text-body font-bold w-12 text-right">{{
            spec.smoothness.toFixed(2)
          }}</span>
        </label>

        <button
          type="button"
          class="justify-self-start sm:justify-self-end mono text-[10px] font-bold uppercase tracking-widest text-subtle hover:text-inverse border border-border px-3 py-2 transition-colors"
          @click="Object.assign(spec, DEFAULT_SPEC)"
        >
          Reset
        </button>
      </div>
    </div>

    <!-- Live canvas -->
    <DemoStage
      v-if="plugins"
      :plugins="plugins"
      :bare="true"
      :targets="targetsOpen"
      height-class="h-64 md:h-72"
    />

    <div v-else class="h-40 flex items-center justify-center">
      <p class="mono text-[10px] font-bold uppercase tracking-widest text-faint">
        Unknown demo "{{ demo }}"
      </p>
    </div>
  </div>
</template>
