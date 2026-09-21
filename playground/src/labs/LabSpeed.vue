<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import { Supermouse } from "@supermousejs/core";
import { Dot } from "@supermousejs/dot";
import { Ring } from "@supermousejs/ring";
import { useLab, usePoll } from "../lib/useLab";
import type { Lab } from "../lib/labs";
import LabHead from "../components/LabHead.vue";
import Readout from "../components/Readout.vue";

defineProps<{ lab: Lab }>();

const smoothness = ref(0.15);
const lagHistory = ref<number[]>([]);

const host = ref<HTMLElement | null>(null);
const { app } = useLab(host, (el) =>
  new Supermouse({
    container: el,
    cursor: "custom",
    smoothness: smoothness.value,
    plugins: [
      Ring({ size: 34, borderWidth: 1 }),
      Dot({ size: 6, color: "#34d399", hideOnShape: false })
    ]
  })
);

/**
 * `smoothness` is an instance option, so writing it directly is the only way to
 * retune a live cursor. The docs' own preview does the same from inside a scope.
 */
function setSmoothness(): void {
  if (app.value) app.value.options.smoothness = smoothness.value;
}

const lambda = computed(() => (1 / smoothness.value) * 2);
const lag = usePoll(() => (app.value ? Math.hypot(app.value.state.displacement.x, app.value.state.displacement.y) : 0), 60);
const speed = usePoll(() => (app.value ? Math.hypot(app.value.state.velocity.x, app.value.state.velocity.y) : 0), 60);
const velocity = usePoll(() => (app.value ? `${app.value.state.velocity.x.toFixed(0)}, ${app.value.state.velocity.y.toFixed(0)}` : "—"), 60);

/** Half-life of the exponential: how long until the lag is halved, in ms. */
const halfLife = computed(() => (Math.log(2) / lambda.value) * 1000);
const lagIndex = computed(() => Math.min(100, (lag.value / 220) * 100));
const reduced = usePoll(() => app.value?.state.reducedMotion ?? false, 400);

const samples = computed(() => lagHistory.value.length);
const meanLag = computed(() =>
  lagHistory.value.length ? lagHistory.value.reduce((a, b) => a + b, 0) / lagHistory.value.length : 0
);

let sampler = 0;
onMounted(() => {
  setSmoothness();
  sampler = window.setInterval(() => {
    lagHistory.value = [...lagHistory.value.slice(-59), lag.value];
  }, 100);
});
onUnmounted(() => window.clearInterval(sampler));
</script>

<template>
  <section ref="host" class="lab">
    <LabHead :lab="lab" />

    <div class="lab__body">
      <div class="canvas">
        <div class="zone" style="inset: 24px 24px 24px 24px; align-items: flex-start">
          move anywhere in here · the ring is `state.smooth`, the dot is `state.target`
        </div>
      </div>

      <aside class="rail-panel">
        <section class="panel">
          <p class="panel__title">smoothness</p>
          <div class="panel__body field">
            <label class="field__label">
              <span>smoothness</span>
              <b>{{ smoothness.toFixed(2) }}</b>
            </label>
            <input
              v-model.number="smoothness"
              type="range"
              min="0.02"
              max="1"
              step="0.01"
              @input="setSmoothness"
            />
            <div class="readout__row">
              <span class="readout__key">lambda = 2 / smoothness</span>
              <span class="readout__value">{{ lambda.toFixed(1) }}</span>
            </div>
            <div class="readout__row">
              <span class="readout__key">half-life</span>
              <span class="readout__value">{{ halfLife.toFixed(0) }} ms</span>
            </div>
          </div>
        </section>

        <Readout
          title="live"
          :rows="[
            ['lag |target - smooth|', `${lag.toFixed(1)} px`],
            ['mean lag (60 samples)', `${meanLag.toFixed(1)} px`],
            ['speed', `${speed.toFixed(0)} px/s`],
            ['state.reducedMotion', String(reduced)]
          ]"
        />

        <section class="panel">
          <p class="panel__title">lag meter</p>
          <div class="panel__body">
            <div class="bar"><div class="bar__fill" :style="{ width: `${lagIndex}%` }" /></div>
            <p class="code" style="margin-top: 8px">
              Samples: {{ samples }}. Higher smoothness means a lower lambda, so the cursor sits further behind the
              pointer for longer. The dot does not lag, because it renders from target. If
              <code>reducedMotion</code> is true the engine pins lambda to 1000 and the ring snaps too — that is the
              OS preference, not a bug in the slider.
            </p>
          </div>
        </section>

        <Readout title="state.velocity (px/s)" :rows="[['x, y', velocity]]" />
      </aside>
    </div>
  </section>
</template>
