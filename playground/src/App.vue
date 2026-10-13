<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref } from "vue";
import gsap from "gsap";
import ChapterRail from "./showcase/components/ChapterRail.vue";
import CursorPanel from "./showcase/components/CursorPanel.vue";
import ControlsDrawer from "./showcase/components/ControlsDrawer.vue";
import { useCursorStage } from "./showcase/useCursorStage";
import { CURSORS, tally as tallyFor } from "./showcase/registry";
import type { CursorEntry, CursorValue } from "./showcase/types";

interface Slide {
  key: number;
  entry: CursorEntry;
  index: number;
}

/**
 * The page owns no cursor of its own — `useCursorStage` hands the whole
 * viewport to a scope and swaps cursors inside it, so the OS pointer is gone
 * before the first cursor is even installed.
 */
const stage = ref<HTMLElement | null>(null);
const drawer = ref<InstanceType<typeof ControlsDrawer> | null>(null);
const {
  index,
  entry,
  chapters,
  config,
  lag,
  native,
  tally,
  go,
  chapterTarget,
  inChapterTarget,
  reset
} = useCursorStage(stage);

const version = __SUPERMOUSE_VERSION__;

let seq = 0;
const slides = ref<Slide[]>([{ key: seq++, entry: CURSORS[0], index: 0 }]);
const nodes = new Map<number, HTMLElement>();
const locked = ref(false);
const hintSpent = ref(false);

function setNode(key: number, el: Element | null): void {
  if (el instanceof HTMLElement) nodes.set(key, el);
  else nodes.delete(key);
}

const still = (): boolean => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Seconds the page takes to change sides. */
const SLIDE = 0.78;

/** Park `incoming` on screen and retire the panel it replaced. */
function settle(outgoing: Slide, incoming: Slide): void {
  const toEl = nodes.get(incoming.key);
  if (toEl) {
    gsap.set([toEl, ...Array.from(toEl.querySelectorAll("[data-stagger]"))], {
      clearProps: "transform,opacity"
    });
  }
  slides.value = [incoming];
  nodes.delete(outgoing.key);
  locked.value = false;
}

/**
 * Advances the tour. The cursor changes immediately and the page slides after
 * it — the caption chasing the subject, rather than the other way round.
 */
async function navigate(delta: number): Promise<void> {
  if (locked.value) return;

  const total = CURSORS.length;
  const next = (((index.value + delta) % total) + total) % total;
  if (next === index.value) return;

  hintSpent.value = true;
  const outgoing = slides.value[slides.value.length - 1];
  const incoming: Slide = { key: seq++, entry: CURSORS[next], index: next };

  slides.value = [...slides.value, incoming];
  go(next);
  locked.value = true;

  let retired = false;
  const finish = (): void => {
    if (retired) return;
    retired = true;
    settle(outgoing, incoming);
  };

  await nextTick();
  const fromEl = nodes.get(outgoing.key);
  const toEl = nodes.get(incoming.key);

  if (!fromEl || !toEl || still()) {
    finish();
    return;
  }

  const dir = delta > 0 ? 1 : -1;
  gsap.set(toEl, { xPercent: dir * 100, opacity: 0 });

  gsap
    .timeline()
    .to(fromEl, { xPercent: -dir * 100, opacity: 0, duration: SLIDE, ease: "power3.inOut" }, 0)
    .to(toEl, { xPercent: 0, opacity: 1, duration: SLIDE, ease: "power3.inOut" }, 0)
    .fromTo(
      toEl.querySelectorAll("[data-stagger]"),
      { y: 24, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.62, ease: "power2.out", stagger: 0.07 },
      0.16
    );

  //
  // The retire step is driven by a timer rather than GSAP's `onComplete`:
  // tweens only advance on animation frames, so a tab that stops compositing
  // mid-transition would otherwise stay locked with two slides stacked.
  //
  window.setTimeout(finish, SLIDE * 1000 + 80);
}

/** Jumps to an absolute cursor, animating the same slide as a relative step. */
function navigateTo(target: number): void {
  if (target === index.value) return;
  void navigate(target - index.value);
}

function setLag(value: number): void {
  lag.value = value;
}

function setNative(value: boolean): void {
  native.value = value;
}

function onSet(key: string, value: CursorValue): void {
  config[key] = value;
}

function onPointerDown(event: PointerEvent): void {
  const target = event.target as HTMLElement | null;
  if (target?.closest("[data-ui]")) return;
  if (event.button === 0) void navigate(1);
  else if (event.button === 2) void navigate(-1);
}

let wheelUntil = 0;

function onWheel(event: WheelEvent): void {
  const target = event.target as HTMLElement | null;
  if (target?.closest("[data-ui]")) return;

  const now = performance.now();
  if (now < wheelUntil) return;

  const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
  if (Math.abs(delta) < 14) return;

  wheelUntil = now + 700;
  void navigate(delta > 0 ? 1 : -1);
}

function onKeyDown(event: KeyboardEvent): void {
  const target = event.target as HTMLElement | null;
  if (target && (target.isContentEditable || /input|textarea|select/i.test(target.tagName))) return;

  if (event.key === "ArrowRight" || event.key === "j") {
    event.preventDefault();
    void navigate(1);
  } else if (event.key === "ArrowLeft" || event.key === "k") {
    event.preventDefault();
    void navigate(-1);
  } else if (event.key === "]") {
    event.preventDefault();
    navigateTo(chapterTarget(1));
  } else if (event.key === "[") {
    event.preventDefault();
    navigateTo(chapterTarget(-1));
  } else if (event.key === "Escape") {
    drawer.value?.close();
  } else if (event.key === "c" || event.key === "C") {
    drawer.value?.toggle();
  } else {
    const digit = Number(event.key);
    if (Number.isInteger(digit) && digit >= 1 && digit <= 9) {
      navigateTo(inChapterTarget(digit));
    }
  }
}

onMounted(() => {
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("wheel", onWheel, { passive: true });

  const first = nodes.get(slides.value[0].key);
  if (first && !still()) {
    gsap.fromTo(
      first.querySelectorAll("[data-stagger]"),
      { y: 26, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.9, ease: "power3.out", stagger: 0.09, delay: 0.2 }
    );
    gsap.fromTo(
      ".chrome",
      { opacity: 0 },
      { opacity: 1, duration: 1.1, ease: "power2.out", delay: 0.45 }
    );
  }
});

onUnmounted(() => {
  window.removeEventListener("keydown", onKeyDown);
  window.removeEventListener("wheel", onWheel);
});
</script>

<template>
  <div ref="stage" class="showcase" @pointerdown="onPointerDown" @contextmenu.prevent>
    <div class="wash" aria-hidden="true" />
    <div class="frame" aria-hidden="true" />

    <div class="tour">
      <div
        v-for="(slide, i) in slides"
        :key="slide.key"
        :ref="(el) => setNode(slide.key, el as Element | null)"
        class="slide"
      >
        <CursorPanel
          :entry="slide.entry"
          :current="tallyFor(slide.index).current"
          :total="tallyFor(slide.index).total"
          :live="i === slides.length - 1"
        />
      </div>
    </div>

    <div class="chrome">
      <p class="chrome__brand">
        <span>Supermouse</span>
        <i>v{{ version }}</i>
      </p>
      <p class="chrome__hint" :class="{ 'is-spent': hintSpent }">
        Left click forward · right click back · [ ] chapters
      </p>
      <p class="notice">
        This showcase needs a pointing device — open it on a desktop to see the cursors move.
      </p>
    </div>

    <ChapterRail :chapters="chapters" :index="index" @jump="navigateTo" />

    <ControlsDrawer
      ref="drawer"
      :entry="entry"
      :config="config"
      :lag="lag"
      :native="native"
      :current="tally.current"
      :total="tally.total"
      @set="onSet"
      @lag="setLag"
      @native="setNative"
      @reset="reset"
    />
  </div>
</template>
