<script setup lang="ts">
import { ref } from "vue";
import { Supermouse, type CursorMode } from "@supermousejs/core";
import { Dot } from "@supermousejs/dot";
import { Ring } from "@supermousejs/ring";
import { useLab, usePoll } from "../lib/useLab";
import type { Lab } from "../lib/labs";
import LabHead from "../components/LabHead.vue";
import Readout from "../components/Readout.vue";

defineProps<{ lab: Lab }>();

const MODES: Array<[CursorMode, string]> = [
  ["auto", "heuristics decide"],
  ["custom", "always ours"],
  ["native", "always the OS"],
  ["both", "both, no suppression"]
];

const host = ref<HTMLElement | null>(null);
const { app } = useLab(host, (el) =>
  new Supermouse({
    container: el,
    cursor: "auto",
    plugins: [Ring({ size: 28, borderWidth: 1 }), Dot({ size: 6, color: "#e879f9", hideOnShape: false })]
  })
);

const mode = ref<CursorMode>("auto");

function set(next: CursorMode): void {
  mode.value = next;
  app.value?.setCursor(next);
}

/** Every probe below is a different reason the engine hands the pointer back. */
const isNative = usePoll(() => String(app.value?.state.isNative ?? false));
const received = usePoll(() => String(app.value?.state.hasReceivedInput ?? false));
const stageOpacity = usePoll(() => app.value?.stage.style.opacity ?? "—");
const hideClass = usePoll(() => {
  const el = app.value?.container;
  if (!el) return "—";
  return Array.from(el.classList).find((c) => c.startsWith("supermouse-hide-")) ?? "not suppressed";
});
const liveMode = usePoll(() => app.value?.state.cursorMode ?? "—");
</script>

<template>
  <section ref="host" class="lab">
    <LabHead :lab="lab" />

    <div class="lab__body">
      <div class="canvas" style="display: grid; place-items: center">
        <div class="probe" style="position: static; width: min(560px, 90%); display: grid; gap: 18px">
          <label style="display: grid; gap: 4px">
            input · native
            <input type="text" placeholder="type here" />
          </label>

          <textarea rows="2" placeholder="textarea · native"></textarea>

          <div contenteditable="true" style="border: 1px solid var(--line); padding: 8px">
            contenteditable · native
          </div>

          <div data-supermouse-ignore style="border: 1px dashed var(--accent); padding: 8px">
            [data-supermouse-ignore] · hands the pointer back in auto mode only
          </div>

          <div style="padding: 8px; border: 1px solid var(--line); cursor: text">
            inline <code>cursor: text</code> · treated as native by the heuristic
          </div>

          <button class="btn" data-hover>a button · ours</button>
        </div>
      </div>

      <aside class="rail-panel">
        <section class="panel">
          <p class="panel__title">cursor mode</p>
          <div class="panel__body">
            <div class="controls">
              <button
                v-for="[value, hint] in MODES"
                :key="value"
                class="btn"
                :aria-pressed="mode === value"
                :title="hint"
                @click="set(value)"
              >
                {{ value }}
              </button>
            </div>
          </div>
        </section>

        <Readout
          title="resolved this frame"
          :rows="[
            ['state.cursorMode', liveMode],
            ['state.isNative', isNative],
            ['state.hasReceivedInput', received],
            ['stage opacity', stageOpacity]
          ]"
        />

        <Readout title="container" :rows="[['suppression class', hideClass]]" />

        <section class="panel">
          <p class="panel__title">watch for</p>
          <div class="panel__body code">In <code>auto</code>, hovering the input or the ignore box flips isNative and fades the stage. Switch to <code>custom</code> and the ignore box stops working — that check only runs in auto mode. <code>native</code> hides the stage entirely.</div>
        </section>
      </aside>
    </div>
  </section>
</template>
