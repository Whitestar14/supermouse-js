<script setup lang="ts">
import { ref, shallowRef } from "vue";
import { Supermouse, type SupermouseInstance } from "@supermousejs/core";
import { Dot } from "@supermousejs/dot";
import { Ring } from "@supermousejs/ring";
import { diagnose, type DoctorIssue } from "@supermousejs/utils";
import { useLab, usePoll } from "../lib/useLab";
import { liveInstances } from "../lib/driver";
import type { Lab } from "../lib/labs";
import LabHead from "../components/LabHead.vue";
import Readout from "../components/Readout.vue";

defineProps<{ lab: Lab }>();

const host = ref<HTMLElement | null>(null);
const { app, remount } = useLab(
  host,
  (el) =>
    new Supermouse({
      container: el,
      cursor: "custom",
      plugins: [Ring({ size: 30, borderWidth: 1 }), Dot({ size: 6, color: "#a3a3a3", hideOnShape: false })]
    })
);

/**
 * Each hand-made instance gets its own container, on purpose.
 *
 * Two instances sharing one container share the `supermouse-scope` class on it,
 * and the first `destroy()` takes that shared class off the element while the
 * other instance is still alive. Separate containers keep the counters honest.
 */
interface Spawned {
  instance: SupermouseInstance;
  container: HTMLElement;
}

const spawned = shallowRef<Spawned[]>([]);
const issues = ref<DoctorIssue[]>([]);
const ledger = ref<string[]>([]);

function mount(count: number): void {
  const el = host.value;
  if (!el) return;

  const created: Spawned[] = [];
  for (let i = 0; i < count; i++) {
    const container = document.createElement("div");
    container.style.cssText = "position:absolute;inset:0";
    el.appendChild(container);

    created.push({
      container,
      instance: new Supermouse({
        container,
        cursor: "native",
        plugins: [Dot({ size: 4, color: "#a3a3a3" })]
      })
    });
  }

  spawned.value = [...spawned.value, ...created];
  ledger.value = [...ledger.value, `mounted ${count} · live ${spawned.value.length}`].slice(-8);
}

function destroy(count: number): void {
  const next = [...spawned.value];
  for (let i = 0; i < count && next.length; i++) {
    const item = next.pop()!;
    item.instance.destroy();
    item.container.remove();
  }
  spawned.value = next;
  ledger.value = [...ledger.value, `destroyed ${count} · live ${next.length}`].slice(-8);
}

function audit(): void {
  issues.value = [...diagnose(app.value ?? undefined)];
  ledger.value = [...ledger.value, `diagnose(): ${issues.value.length} issue(s)`].slice(-8);
}

function reset(): void {
  destroy(spawned.value.length);
  issues.value = [];
  ledger.value = ["ledger reset"];
}

/** Distinct `supermouse-scope-N` classes = live instances on the page. */
const instances = usePoll(() => {
  const names = new Set<string>();
  document.querySelectorAll<HTMLElement>("[class*='supermouse-scope-']").forEach((el) =>
    el.classList.forEach((name) => {
      if (/^supermouse-scope-\d+$/.test(name)) names.add(name);
    })
  );
  return names.size;
}, 150);

/** Stage elements: the `pointer-events: none` div the core appends to a scope container. */
const stages = usePoll(() => {
  let count = 0;
  document.querySelectorAll<HTMLElement>("[class*='supermouse-scope-']").forEach((container) => {
    count += Array.from(container.children).filter(
      (child) => (child as HTMLElement).style.pointerEvents === "none"
    ).length;
  });
  return count;
}, 150);

const stylesheet = usePoll(
  () => (document.getElementById("supermouse-styles") ? "present" : "absent"),
  150
);
const transientCount = usePoll(() => spawned.value.length, 150);
</script>

<template>
  <section ref="host" class="lab">
    <LabHead :lab="lab" />

    <div class="lab__body">
      <div class="canvas" style="padding: 20px; display: flex; flex-direction: column; gap: 14px">
        <div class="zone" style="position: static; height: 84px">
          the lab instance lives here · every spawn gets its own container so the counters mean something
        </div>

        <div class="controls">
          <button class="btn" @click="mount(1)">mount 1</button>
          <button class="btn" @click="mount(10)">mount 10</button>
          <button class="btn" @click="destroy(1)">destroy 1</button>
          <button class="btn" @click="destroy(10)">destroy 10</button>
          <button class="btn" @click="audit">run diagnose()</button>
          <button class="btn" @click="reset">reset</button>
          <button class="btn" @click="remount">remount the lab instance</button>
        </div>

        <div class="cells" style="background: transparent; border: 0">
          <div class="cell">
            <span class="cell__key">instances on the page</span>
            {{ instances }} <span style="color: var(--dim)">(driver: {{ liveInstances() }})</span>
          </div>
          <div class="cell">
            <span class="cell__key">hand-made, not destroyed</span>
            {{ transientCount }}
          </div>
          <div class="cell">
            <span class="cell__key">stage elements</span>
            {{ stages }}
          </div>
          <div class="cell">
            <span class="cell__key">#supermouse-styles</span>
            {{ stylesheet }}
          </div>
        </div>
      </div>

      <aside class="rail-panel">
        <Readout
          title="ledger"
          :rows="ledger.length ? ledger.map((line, i) => [String(i + 1), line]) : [['—', 'no actions yet']]"
        />

        <section class="panel">
          <p class="panel__title">diagnose()</p>
          <div class="panel__body log">
            <p v-if="!issues.length" class="code">Nothing printed yet — mount something and run it again.</p>
            <p v-for="issue in issues" :key="issue.code" class="log__line">
              <span
                class="log__tag"
                :class="`log__tag--${issue.severity === 'error' ? 'error' : issue.severity === 'warn' ? 'warn' : 'pass'}`"
              >
                {{ issue.code }}
              </span>
              <span>{{ issue.message }}</span>
            </p>
          </div>
        </section>

        <section class="panel">
          <p class="panel__title">the test</p>
          <div class="panel__body code">Mount ten, destroy ten: instances and stages have to come back to where they started. A single-page app leans on exactly this path, and it is much easier to trust when you can watch the counters move.</div>
        </section>

        <section class="panel">
          <p class="panel__title">known core rough edge</p>
          <div class="panel__body code">The one shared <code>#supermouse-styles</code> tag has no owner count, so the first <code>destroy()</code> takes it away from every instance still alive. That is the absent stylesheet row above — and why the OS pointer comes back next to the custom one. <code>remount</code> rebuilds it. Same story for the <code>supermouse-scope</code> class when two instances share a container, which is why each spawn gets its own.</div>
        </section>
      </aside>
    </div>
  </section>
</template>
