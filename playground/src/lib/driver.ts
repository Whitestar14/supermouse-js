import { reactive } from "vue";
import type { SupermouseInstance } from "@supermousejs/core";

/**
 * One requestAnimationFrame loop for every lab instance.
 *
 * No lab lets the engine own its rAF: `autoStart: false` everywhere, and this
 * driver calls `step()` while timing the call. That is the whole reason the
 * playground can report the engine's own frame cost.
 */
export const frame = reactive({
  /** Wall-clock gap between driver frames, in ms. */
  dt: 0,
  /** Frames per second, averaged over the last half second. */
  fps: 0,
  /** The engine's share of the frame: time inside step(), in ms. */
  cost: 0,
  /** Worst cost seen since the lab mounted. */
  peak: 0,
  steps: 0,
  history: [] as number[]
});

const entries = new Set<SupermouseInstance>();
let raf = 0;
let last = 0;
let sampleStart = 0;
let sampleFrames = 0;
let sampleCost = 0;

function tick(now: number): void {
  const dt = last === 0 ? 0 : now - last;
  last = now;

  const started = performance.now();
  for (const app of entries) app.step(now);
  const cost = performance.now() - started;

  frame.dt = dt;
  frame.cost = cost;
  frame.peak = Math.max(frame.peak, cost);
  frame.steps++;

  sampleFrames++;
  sampleCost += cost;
  if (now - sampleStart >= 500) {
    frame.fps = (sampleFrames * 1000) / (now - sampleStart);
    sampleFrames = 0;
    sampleCost = 0;
    sampleStart = now;
  }

  frame.history.push(dt);
  if (frame.history.length > 120) frame.history.shift();

  raf = requestAnimationFrame(tick);
}

export function attach(app: SupermouseInstance): () => void {
  entries.add(app);

  if (!raf) {
    last = 0;
    sampleStart = performance.now();
    sampleFrames = 0;
    sampleCost = 0;
    frame.peak = 0;
    frame.steps = 0;
    frame.history = [];
    raf = requestAnimationFrame(tick);
  }

  return () => {
    entries.delete(app);
    if (entries.size === 0 && raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
  };
}

export function liveInstances(): number {
  return entries.size;
}
