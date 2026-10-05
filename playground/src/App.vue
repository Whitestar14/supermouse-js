<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import { LABS } from "./lib/labs";
import Hud from "./components/Hud.vue";

const activeId = ref(readHash());
const lab = computed(() => LABS.find((item) => item.id === activeId.value) ?? LABS[0]);

function readHash(): string {
  const id = window.location.hash.replace(/^#\/?/, "");
  return LABS.some((item) => item.id === id) ? id : LABS[0].id;
}

function select(id: string): void {
  if (id === activeId.value) return;
  window.location.hash = `/${id}`;
}

function step(delta: number): void {
  const index = LABS.findIndex((item) => item.id === activeId.value);
  const next = (index + delta + LABS.length) % LABS.length;
  select(LABS[next].id);
}

function onHash(): void {
  activeId.value = readHash();
}

function onKey(event: KeyboardEvent): void {
  if (event.metaKey || event.ctrlKey || event.altKey) return;

  const target = event.target as HTMLElement | null;
  if (target && (target.isContentEditable || /input|textarea|select/i.test(target.tagName))) return;

  if (event.key === "ArrowRight" || event.key === "ArrowDown" || event.key === "j") step(1);
  else if (event.key === "ArrowLeft" || event.key === "ArrowUp" || event.key === "k") step(-1);
  else {
    const digit = Number(event.key);
    if (digit >= 1 && digit <= LABS.length) select(LABS[digit - 1].id);
  }
}

onMounted(() => {
  window.addEventListener("hashchange", onHash);
  window.addEventListener("keydown", onKey);
  if (!window.location.hash) window.location.hash = `/${LABS[0].id}`;
});

onUnmounted(() => {
  window.removeEventListener("hashchange", onHash);
  window.removeEventListener("keydown", onKey);
});
</script>

<template>
  <div class="shell">
    <aside class="rail">
      <nav class="rail__list" aria-label="Labs">
        <button
          v-for="(item, index) in LABS"
          :key="item.id"
          class="rail__item"
          :aria-current="item.id === activeId"
          :title="`${item.label} — ${item.question}`"
          @click="select(item.id)"
        >
          {{ String(index + 1).padStart(2, "0") }}
        </button>
      </nav>
      <p class="rail__mark">labs</p>
    </aside>

    <main
      class="stage"
      :style="{ '--bg': lab.bg, '--ink': lab.ink, '--accent': lab.accent }"
    >
      <component :is="lab.component" :key="lab.id" :lab="lab" />
      <Hud />
    </main>
  </div>
</template>
