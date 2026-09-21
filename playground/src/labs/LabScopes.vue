<script setup lang="ts">
import { ref } from "vue";
import { Dot } from "@supermousejs/dot";
import { Ring } from "@supermousejs/ring";
import { Stick } from "@supermousejs/stick";
import { SmartRing } from "@supermousejs/labs";
import { Supermouse } from "@supermousejs/core";
import { useLab, usePoll } from "../lib/useLab";
import type { Lab } from "../lib/labs";
import LabHead from "../components/LabHead.vue";
import Readout from "../components/Readout.vue";

defineProps<{ lab: Lab }>();

/**
 * One instance, one loop, four regions:
 *   a — page cursor (Dot), the scope everything inherits from
 *   b — nested inside a, cursor: native, no plugins
 *   c — own cursor mode and its own plugin set
 *   d — inherits everything from the primary scope
 */
const host = ref<HTMLElement | null>(null);
const { app } = useLab(host, (el) => {
  const a = el.querySelector<HTMLElement>("[data-zone='a']")!;
  const b = el.querySelector<HTMLElement>("[data-zone='b']")!;
  const c = el.querySelector<HTMLElement>("[data-zone='c']")!;

  return new Supermouse({
    smoothness: 0.15,
    cursor: "custom",
    hoverSelectors: ["a", "button", "[data-hover]"],
    plugins: [Dot({ size: 7, color: "#ffffff" })],
    scopes: [
      {
        name: "alpha",
        container: a,
        plugins: [Ring({ size: 30, borderWidth: 1, color: "#f59e0b" })]
      },
      {
        name: "beta",
        container: b,
        cursor: "native",
        plugins: []
      },
      {
        name: "gamma",
        container: c,
        plugins: [Stick({ padding: 14 }), SmartRing({ size: 18, hoverSize: 46, borderWidth: 2 })]
      }
    ]
  });
});

/** `app.container` is the *active* scope's container — the cheapest live probe. */
const active = usePoll(() => app.value?.container.dataset.zone ?? "none");
const mode = usePoll(() => app.value?.state.cursorMode ?? "—");
const stages = usePoll(() =>
  Array.from(document.querySelectorAll(".supermouse-scope"))
    .map((el) => Array.from(el.classList).find((c) => c.startsWith("supermouse-scope-")) ?? "?")
    .join(" ")
);
</script>

<template>
  <section ref="host" class="lab">
    <LabHead :lab="lab" />

    <div class="lab__body">
      <div class="canvas">
        <div data-zone="a" class="zone" :class="{ 'zone--active': active === 'a' }" style="inset: 24px 38% 24px 24px">
          A · page cursor + ring

          <div
            data-zone="b"
            class="zone zone--nested"
            :class="{ 'zone--active': active === 'b' }"
            style="inset: 64px 20px auto 40px; padding: 10px"
          >
            B · nested, native, no plugins
          </div>
        </div>

        <div
          data-zone="c"
          class="zone"
          :class="{ 'zone--active': active === 'c' }"
          style="inset: 24px 24px 84px 64%"
        >
          C · stick + smart ring
          <a href="#" data-supermouse-stick style="position: absolute; right: 14px; bottom: 14px">
            hover me
          </a>
        </div>

        <div class="zone zone--nested" style="inset: auto 24px 24px 24px; height: 44px; align-items: center">
          D · outside every scope — still driven by the page cursor
        </div>
      </div>

      <aside class="rail-panel">
        <Readout
          title="active scope"
          :rows="[
            ['container', active],
            ['state.cursorMode', mode]
          ]"
        />
        <Readout title="stage classes" :rows="[['.supermouse-scope', stages || 'none']]" />
        <section class="panel">
          <p class="panel__title">what this tests</p>
          <div class="panel__body code">B is nested inside A, so the innermost container has to win — and it hands the pointer back to the OS while still inside A. Leave B and A resumes without the page cursor flickering in from a corner.</div>
        </section>
      </aside>
    </div>
  </section>
</template>
