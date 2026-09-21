<script setup lang="ts">
import { ref } from "vue";
import { Supermouse } from "@supermousejs/core";
import { Stick } from "@supermousejs/stick";
import { SmartRing } from "@supermousejs/labs";
import { Dot } from "@supermousejs/dot";
import { dom } from "@supermousejs/utils";
import { useLab, usePoll } from "../lib/useLab";
import type { Lab } from "../lib/labs";
import LabHead from "../components/LabHead.vue";
import Readout from "../components/Readout.vue";

defineProps<{ lab: Lab }>();

const host = ref<HTMLElement | null>(null);
const { app } = useLab(host, (el) =>
  new Supermouse({
    container: el,
    cursor: "custom",
    plugins: [
      Stick({ padding: 12 }),
      SmartRing({ size: 18, hoverSize: 44, borderWidth: 2, fill: "transparent", mixBlendMode: "normal" }),
      Dot({ size: 6, color: "#fb7185", hideOnShape: true })
    ]
  })
);

const shape = usePoll(() => {
  const value = app.value?.state.shape;
  if (!value) return "null";
  return `${value.width.toFixed(0)} × ${value.height.toFixed(0)} · r${value.borderRadius.toFixed(0)}`;
}, 80);

const target = usePoll(() => app.value?.state.hoverTarget?.textContent?.trim() ?? "none", 80);

/** projectRect is the supported way to measure inside a container coordinate space. */
const rect = usePoll(() => {
  const instance = app.value;
  const el = instance?.state.hoverTarget;
  if (!instance || !el) return "—";
  const box = dom.projectRect(el, instance.container);
  return `x ${box.left.toFixed(0)} · y ${box.top.toFixed(0)} · ${box.width.toFixed(0)}×${box.height.toFixed(0)}`;
}, 80);

const radius = usePoll(() => {
  const el = app.value?.state.hoverTarget;
  if (!el) return "—";
  return window.getComputedStyle(el).borderRadius;
}, 200);
</script>

<template>
  <section ref="host" class="lab">
    <LabHead :lab="lab" />

    <div class="lab__body">
      <div class="canvas" style="display: grid; place-items: center; gap: 18px">
        <div style="display: grid; gap: 16px; justify-items: center">
          <button data-supermouse-stick style="padding: 10px 34px; border-radius: 999px; border: 1px solid var(--line); background: transparent">
            pill
          </button>

          <button data-supermouse-stick style="padding: 22px; border-radius: 2px; border: 1px solid var(--line); background: transparent">
            square
          </button>

          <div
            data-supermouse-stick
            style="padding: 24px 40px; border-radius: 18px; border: 1px solid var(--line); font-size: 12px"
          >
            rounded card
          </div>

          <a href="#" data-supermouse-stick style="border-radius: 4px; padding: 8px 12px; border: 1px dashed var(--line)">
            a link
          </a>
        </div>
      </div>

      <aside class="rail-panel">
        <Readout
          title="published shape"
          :rows="[
            ['state.shape', shape],
            ['hoverTarget', target],
            ['border-radius', radius]
          ]"
        />

        <Readout title="dom.projectRect(hoverTarget, app.container)" :rows="[['box', rect]]" />

        <section class="panel">
          <p class="panel__title">what this tests</p>
          <div class="panel__body code">Stick measures the element once per hover entry and publishes width, height and radius; SmartRing morphs to it. Dot is hidden the whole time because hideOnShape defaults to true. The readout reads geometry on an interval — never do this inside update().</div>
        </section>
      </aside>
    </div>
  </section>
</template>
