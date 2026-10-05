<script setup lang="ts">
import { ref } from "vue";
import { Dot } from "@supermousejs/dot";
import { Ring } from "@supermousejs/ring";
import { Trail } from "@supermousejs/trail";
import { Pointer } from "@supermousejs/pointer";
import { Text } from "@supermousejs/text";
import { Sparkles, SmartRing } from "@supermousejs/labs";
import { Supermouse } from "@supermousejs/core";
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
      Pointer({ size: 22 }),
      Trail({ length: 14, size: 10 }),
      Ring({ size: 32, borderWidth: 1 }),
      SmartRing({ size: 18, hoverSize: 44, borderWidth: 2, mixBlendMode: "normal" }),
      Sparkles({ count: 24, frequency: 12 }),
      Text({ className: "supermouse-tooltip-cursor", offset: [24, 24] }),
      Dot({ size: 6, color: "#22d3ee", hideOnShape: false })
    ]
  })
);

/** `plugins` is a deprecated getter, but it is the live, sorted list. */
const table = usePoll(
  () =>
    app.value?.plugins.map((plugin) => ({
      name: plugin.name,
      priority: plugin.priority ?? 0,
      enabled: plugin.isEnabled !== false,
      element: plugin.element ? plugin.element.tagName.toLowerCase() : "—"
    })) ?? [],
  150
);

function toggle(name: string): void {
  app.value?.togglePlugin(name);
}

function enableOnly(name: string): void {
  for (const plugin of table.value) {
    if (plugin.name === name) app.value?.enablePlugin(plugin.name);
    else app.value?.disablePlugin(plugin.name);
  }
}
</script>

<template>
  <section ref="host" class="lab">
    <LabHead :lab="lab" />

    <div class="lab__body">
      <div class="canvas">
        <div class="zone" style="inset: 24px 24px auto 24px; align-items: center">
          hover this box, then hover a link with
          <a href="#" data-supermouse-text="text plugin" style="margin-left: 6px"> data-supermouse-text </a>
        </div>
      </div>

      <aside class="rail-panel">
        <section class="panel">
          <p class="panel__title">toggle ({{ table.filter((p) => p.enabled).length }}/{{ table.length }} on)</p>
          <div class="panel__body">
            <div v-for="plugin in table" :key="plugin.name" class="switch">
              <span>
                <span class="swatch" :style="{ opacity: plugin.enabled ? 1 : 0.2 }" />
                {{ plugin.name }}
              </span>
              <span class="controls">
                <button class="btn" :class="{ 'is-on': plugin.enabled }" @click="toggle(plugin.name)">
                  {{ plugin.enabled ? "on" : "off" }}
                </button>
                <button class="btn" title="solo this plugin" @click="enableOnly(plugin.name)">solo</button>
              </span>
            </div>
          </div>
        </section>

        <Readout
          title="live order"
          :rows="table.map((p) => [`${p.priority}`, `${p.name} · ${p.element} · ${p.enabled ? 'on' : 'off'}`])"
        />

        <section class="panel">
          <p class="panel__title">what this tests</p>
          <div class="panel__body code">The order above is the order the core calls them in: ascending priority, re-sorted on every registration. Disabling a plugin sets isEnabled false, which skips update() and hides its element — the list is read straight off the instance, so this is the engine's own bookkeeping, not a copy of it.</div>
        </section>
      </aside>
    </div>
  </section>
</template>
