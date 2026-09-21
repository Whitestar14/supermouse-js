<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import { Supermouse } from "@supermousejs/core";
import { Dot } from "@supermousejs/dot";
import { Ring } from "@supermousejs/ring";
import { damp } from "@supermousejs/utils";
import { useLab, usePoll } from "../lib/useLab";
import { frame } from "../lib/driver";
import type { Lab } from "../lib/labs";
import LabHead from "../components/LabHead.vue";
import Readout from "../components/Readout.vue";

defineProps<{ lab: Lab }>();

/** Registered with the shared driver: this is the live, real-input instance. */
const host = ref<HTMLElement | null>(null);
const { app } = useLab(host, (el) =>
  new Supermouse({
    container: el,
    cursor: "custom",
    autoStart: false,
    plugins: [Ring({ size: 30, borderWidth: 1 }), Dot({ size: 6, color: "#60a5fa", hideOnShape: false })]
  })
);

const canvas = ref<HTMLCanvasElement | null>(null);
const replay = ref<{ frames: number; maxLag: number; drift: number } | null>(null);

/**
 * A second instance, stepped entirely by hand — plus an independent reference.
 *
 * Nothing here goes through the input layer: the pointer is written straight
 * onto `state.pointer`, `hasReceivedInput` is forced true, and `step()` is called
 * with synthetic timestamps. Alongside it, a hand-rolled `damp()` loop walks the
 * same pointer path with the same lambda and dt. If the engine's physics is the
 * pure function it claims to be, the two trajectories agree — so the number
 * this lab reports is a determinism check, not a screenshot.
 */
function runReplay(frames = 240): void {
  const target = canvas.value;
  const ctx = target?.getContext("2d");
  if (!target || !ctx) return;

  const dummy = document.createElement("div");
  document.body.appendChild(dummy);

  const offline = new Supermouse({
    container: dummy,
    cursor: "native",
    autoStart: false,
    smoothness: app.value?.options.smoothness ?? 0.15
  });

  offline.state.hasReceivedInput = true;

  const lambda = offline.state.reducedMotion ? 1000 : 2 / offline.options.smoothness;
  const dt = 1 / 60;

  const pointer: Array<[number, number]> = [];
  const smooth: Array<[number, number]> = [];
  const reference: Array<[number, number]> = [];
  let referenceX = offline.state.smooth.x;
  let referenceY = offline.state.smooth.y;
  let maxLag = 0;
  let drift = 0;
  let t = 0;

  for (let i = 0; i < frames; i++) {
    const phase = (i / frames) * Math.PI * 2;
    const x = target.width / 2 + Math.sin(phase) * (target.width / 2 - 20);
    const y = target.height / 2 + Math.sin(phase * 2) * (target.height / 2 - 20);

    offline.state.pointer.x = x;
    offline.state.pointer.y = y;

    t += 1000 / 60;
    offline.step(t);

    referenceX = damp(referenceX, x, lambda, dt);
    referenceY = damp(referenceY, y, lambda, dt);

    pointer.push([x, y]);
    smooth.push([offline.state.smooth.x, offline.state.smooth.y]);
    reference.push([referenceX, referenceY]);

    maxLag = Math.max(maxLag, Math.hypot(offline.state.displacement.x, offline.state.displacement.y));
    drift = Math.max(drift, Math.hypot(offline.state.smooth.x - referenceX, offline.state.smooth.y - referenceY));
  }

  offline.destroy();
  dummy.remove();

  const path = (points: Array<[number, number]>, color: string, width: number): void => {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    points.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
    ctx.stroke();
  };

  ctx.clearRect(0, 0, target.width, target.height);
  const ink = getComputedStyle(target).color;
  const accent = getComputedStyle(target.parentElement!).getPropertyValue("--accent").trim() || ink;
  path(pointer, `${ink}44`, 1);
  path(reference, accent, 3);
  path(smooth, ink, 1);

  replay.value = { frames, maxLag, drift };
}

function clearReplay(): void {
  replay.value = null;
  const ctx = canvas.value?.getContext("2d");
  if (ctx && canvas.value) ctx.clearRect(0, 0, canvas.value.width, canvas.value.height);
}

const plugins = usePoll(() => app.value?.plugins.map((p) => p.name).join(" · ") ?? "—");

let resizeTimer = 0;
/** Assigning width/height clears the canvas, so only do it when the box changed. */
function fitCanvas(): void {
  const el = canvas.value;
  if (!el) return;
  const width = Math.round(el.clientWidth * devicePixelRatio);
  const height = Math.round(el.clientHeight * devicePixelRatio);
  if (width === el.width && height === el.height) return;
  el.width = width;
  el.height = height;
}

onMounted(() => {
  fitCanvas();
  resizeTimer = window.setInterval(fitCanvas, 500);
});
onUnmounted(() => window.clearInterval(resizeTimer));
</script>

<template>
  <section ref="host" class="lab">
    <LabHead :lab="lab" />

    <div class="lab__body">
      <div class="canvas">
        <canvas ref="canvas" style="width: 100%; height: 100%; display: block"></canvas>
      </div>

      <aside class="rail-panel">
        <Readout
          title="driver"
          :rows="[
            ['frames stepped', String(frame.steps)],
            ['dt', `${frame.dt.toFixed(1)} ms`],
            ['step cost', `${frame.cost.toFixed(2)} ms`],
            ['peak cost', `${frame.peak.toFixed(2)} ms`],
            ['state.reducedMotion', String(app?.state.reducedMotion ?? false)],
            ['plugins', plugins]
          ]"
        />

        <section class="panel">
          <p class="panel__title">replay</p>
          <div class="panel__body">
            <div class="controls">
              <button class="btn" @click="runReplay(240)">240 frames</button>
              <button class="btn" @click="runReplay(60)">60 frames</button>
              <button class="btn" @click="clearReplay">clear</button>
            </div>
            <p class="code" style="margin-top: 10px">
              Dim: the pointer path. Accent: a hand-rolled <code>damp()</code> loop. Thin: the
              engine's <code>state.smooth</code>, drawn over the top of it.
            </p>
            <div v-if="replay" class="readout" style="margin-top: 10px">
              <div class="readout__row">
                <span class="readout__key">frames</span>
                <span class="readout__value">{{ replay.frames }}</span>
              </div>
              <div class="readout__row">
                <span class="readout__key">engine vs reference</span>
                <span class="readout__value">{{ replay.drift.toFixed(6) }} px</span>
              </div>
              <div class="readout__row">
                <span class="readout__key">max lag on the wheel</span>
                <span class="readout__value">{{ replay.maxLag.toFixed(1) }} px</span>
              </div>
            </div>
          </div>
        </section>

        <section class="panel">
          <p class="panel__title">why bother</p>
          <div class="panel__body code">The engine's rAF loop is off everywhere in this playground; the driver above steps every lab instance and times the call. That number is the engine's whole per-frame cost, input layer included. If this machine reports <code>prefers-reduced-motion: reduce</code> the trajectory flattens onto the pointer — that is lambda pinned to 1000, and the reference loop does the same, so the drift figure stays meaningful.</div>
        </section>
      </aside>
    </div>
  </section>
</template>
