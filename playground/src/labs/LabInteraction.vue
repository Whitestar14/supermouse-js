<script setup lang="ts">
import { ref } from "vue";
import type { SupermousePlugin } from "@supermousejs/core";
import { Supermouse } from "@supermousejs/core";
import { Dot } from "@supermousejs/dot";
import { Ring } from "@supermousejs/ring";
import { useLab, usePoll } from "../lib/useLab";
import type { Lab } from "../lib/labs";
import LabHead from "../components/LabHead.vue";
import Readout from "../components/Readout.vue";

defineProps<{ lab: Lab }>();

/**
 * Stamps a fresh value once per frame.
 *
 * Interaction values are re-resolved every frame while the ancestor chain is
 * cached per element, so this shows up in the readout without any of the
 * selector matching being redone.
 */
const ticker = (): SupermousePlugin => ({
  name: "ticker",
  priority: -50,
  update() {
    const el = document.querySelector<HTMLElement>("[data-dynamic]");
    if (el) el.dataset.supermouseTick = String(Math.round(performance.now()));
  }
});

const host = ref<HTMLElement | null>(null);
const { app } = useLab(host, (el) =>
  new Supermouse({
    container: el,
    cursor: "custom",
    plugins: [Ring({ size: 28, borderWidth: 1 }), Dot({ size: 6, color: "#fbbf24", hideOnShape: false }), ticker()],
    rules: {
      ".conflict": { tone: "from-rule" },
      "[data-tooltip]": (target) => ({ text: target.dataset.tooltip ?? "" }),
      ".boom": () => {
        throw new Error("this rule throws on purpose");
      }
    }
  })
);

const interaction = usePoll(() => JSON.stringify(app.value?.state.interaction ?? {}), 80);
const target = usePoll(() => {
  const el = app.value?.state.hoverTarget;
  if (!el) return "none";
  return `${el.tagName.toLowerCase()}${el.dataset.zone ? `[${el.dataset.zone}]` : ""}`;
}, 80);
const hover = usePoll(() => String(app.value?.state.isHover ?? false), 80);
</script>

<template>
  <section ref="host" class="lab">
    <LabHead :lab="lab" />

    <div class="lab__body">
      <div class="canvas" style="padding: 20px">
        <div class="cells">
          <button class="cell" data-supermouse-tone="alpha">
            <span class="cell__key">attribute</span>
            data-supermouse-tone="alpha"
          </button>

          <button class="cell" data-supermouse-flag>
            <span class="cell__key">valueless</span>
            data-supermouse-flag → true
          </button>

          <button class="cell" data-supermouse-pull="0.8">
            <span class="cell__key">string value</span>
            data-supermouse-pull="0.8"
          </button>

          <div class="cell" data-supermouse-tone="parent">
            <span class="cell__key">inheritance · parent</span>
            tone="parent"
            <a href="#" data-supermouse-tone="child">child link, tone="child"</a>
          </div>

          <button class="cell conflict" data-supermouse-tone="from-attribute">
            <span class="cell__key">rule vs attribute</span>
            rule says "from-rule" · attribute says "from-attribute"
          </button>

          <button class="cell" data-dynamic>
            <span class="cell__key">redrawn every frame</span>
            data-supermouse-tick
          </button>

          <button class="cell" data-tooltip="read from el.dataset">
            <span class="cell__key">function rule</span>
            [data-tooltip] → interaction.text
          </button>

          <button class="cell boom">
            <span class="cell__key">throwing rule</span>
            .boom throws · cursor keeps running
          </button>
        </div>
      </div>

      <aside class="rail-panel">
        <Readout
          title="input layer"
          :rows="[
            ['hoverTarget', target],
            ['isHover', hover]
          ]"
        />

        <section class="panel">
          <p class="panel__title">state.interaction</p>
          <div class="panel__body">
            <p class="code">{{ interaction }}</p>
          </div>
        </section>

        <section class="panel">
          <p class="panel__title">what this tests</p>
          <div class="panel__body code">Hover the conflict cell: the attribute wins over the rule on the same element. Hover the child link: its own declaration beats the parent's. The throwing rule logs once per frame and is skipped, while everything else keeps resolving.</div>
        </section>
      </aside>
    </div>
  </section>
</template>
