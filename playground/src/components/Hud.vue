<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import { Supermouse } from "@supermousejs/core";
import { frame, liveInstances } from "../lib/driver";

const canvas = ref<HTMLCanvasElement | null>(null);
let timer = 0;

function draw(): void {
  const el = canvas.value;
  const ctx = el?.getContext("2d");
  if (!el || !ctx) return;

  const { width, height } = el;
  ctx.clearRect(0, 0, width, height);

  const samples = frame.history;
  if (samples.length < 2) return;

  const scale = Math.max(33.4, ...samples);
  ctx.strokeStyle = getComputedStyle(el).color;
  ctx.lineWidth = 1;
  ctx.beginPath();
  samples.forEach((dt, i) => {
    const x = (i / (samples.length - 1)) * width;
    const y = height - (dt / scale) * height;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  // 16.7ms budget line
  ctx.beginPath();
  const y = height - (16.7 / scale) * height;
  ctx.moveTo(0, y);
  ctx.lineTo(width, y);
  ctx.stroke();
}

onMounted(() => {
  timer = window.setInterval(draw, 100);
});
onUnmounted(() => window.clearInterval(timer));
</script>

<template>
  <div class="hud">
    <div class="hud__cell">
      dt <b>{{ frame.dt.toFixed(1) }}</b>ms
    </div>
    <div class="hud__cell">
      fps <b>{{ frame.fps.toFixed(0) }}</b>
    </div>
    <div class="hud__cell">
      step <b>{{ frame.cost.toFixed(2) }}</b>ms
    </div>
    <div class="hud__cell">
      peak <b>{{ frame.peak.toFixed(2) }}</b>ms
    </div>
    <div class="hud__cell">
      instances <b>{{ liveInstances() }}</b>
    </div>
    <div class="hud__cell">
      core <b>{{ Supermouse.version }}</b>
    </div>
    <div class="hud__cell">
      <canvas ref="canvas" class="spark" width="120" height="22" />
    </div>
  </div>
</template>
