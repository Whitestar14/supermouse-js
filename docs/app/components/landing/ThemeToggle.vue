<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import { gsap } from "gsap";

const props = defineProps<{ isDark: boolean }>();
const emit = defineEmits<{ toggle: [] }>();

/* unique mask id — avoid collisions if two toggles are on the page */
const uid = Math.random().toString(36).slice(2, 9);
const maskId = `moon-${uid}`;

const buttonRef = ref<HTMLButtonElement | null>(null);
const iconRef = ref<SVGSVGElement | null>(null);
const raysRef = ref<SVGGElement | null>(null);
const coreRef = ref<SVGCircleElement | null>(null);
const cutRef = ref<SVGCircleElement | null>(null);

const RAYS = [0, 45, 90, 135, 180, 225, 270, 315];

let tl: ReturnType<typeof gsap.timeline> | null = null;

const prefersReduced = (): boolean =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

onMounted(() => {
  if (!raysRef.value || !coreRef.value || !cutRef.value) return;

  tl = gsap.timeline({ paused: true });

  /* sun → moon */
  tl.to(
    raysRef.value,
    {
      opacity: 0,
      scale: 0.3,
      rotate: 60,
      svgOrigin: "12 12",
      duration: 0.4,
      ease: "power2.in"
    },
    0
  )
    .to(coreRef.value, { attr: { r: 5.4 }, duration: 0.45, ease: "power2.inOut" }, 0)
    .to(cutRef.value, { attr: { cx: 15.8, cy: 8.2 }, duration: 0.5, ease: "power3.inOut" }, 0);

  /* Jump to the correct state before first paint — no sun-flash on dark mode. */
  tl.progress(1, true);
  tl.progress(props.isDark ? 1 : 0, true);
});

watch(
  () => props.isDark,
  (dark) => {
    if (!tl) return;

    if (prefersReduced()) {
      tl.progress(dark ? 1 : 0, true);
      return;
    }

    dark ? tl.play() : tl.reverse();

    if (buttonRef.value) {
      gsap.fromTo(
        buttonRef.value,
        { scale: 0.9 },
        { scale: 1, duration: 0.4, ease: "back.out(3)", overwrite: true }
      );
    }
  }
);

/** Hover cue on the glyph only — the button chrome stays untouched. */
const hover = (active: boolean): void => {
  if (prefersReduced() || !iconRef.value) return;
  gsap.to(iconRef.value, {
    rotate: active ? 12 : 0,
    duration: 0.3,
    ease: "power2.out",
    overwrite: true
  });
};

onBeforeUnmount(() => {
  tl?.kill();
  tl = null;
});
</script>

<template>
  <button
    ref="buttonRef"
    type="button"
    role="switch"
    :aria-checked="isDark"
    :aria-label="isDark ? 'Switch to light theme' : 'Switch to dark theme'"
    :title="isDark ? 'Switch to light theme' : 'Switch to dark theme'"
    class="group inline-flex shrink-0 items-center text-subtle transition-colors duration-150 outline-none hover:text-inverse focus-visible:text-inverse focus-visible:ring-1 focus-visible:ring-subtle"
    @mouseenter="hover(true)"
    @mouseleave="hover(false)"
    @click="emit('toggle')"
  >
    <svg
      ref="iconRef"
      viewBox="0 0 24 24"
      class="size-5 overflow-visible"
      fill="none"
      stroke="currentColor"
      stroke-width="1.6"
      stroke-linecap="square"
      aria-hidden="true"
    >
      <defs>
        <mask :id="maskId" maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24">
          <rect width="24" height="24" fill="white" />
          <!-- the bite — starts off-canvas, ends overlapping the disc -->
          <circle ref="cutRef" cx="30" cy="-2" r="5.2" fill="black" />
        </mask>
      </defs>

      <!-- sun rays: fade + shrink + spin as the disc becomes a moon -->
      <g ref="raysRef">
        <line
          v-for="deg in RAYS"
          :key="deg"
          x1="12"
          y1="2.2"
          x2="12"
          y2="5.4"
          :transform="`rotate(${deg} 12 12)`"
        />
      </g>

      <!-- the sun disc / moon crescent — one element, masked -->
      <circle
        ref="coreRef"
        cx="12"
        cy="12"
        r="4.6"
        fill="currentColor"
        stroke="none"
        :mask="`url(#${maskId})`"
      />
    </svg>
  </button>
</template>
