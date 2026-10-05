<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from "vue";
import { resolveTokenColor, resolveTokenRgba } from "@utils/theme";
import { useTheme } from "@composables/useTheme";

const container = ref<HTMLElement | null>(null);
const cursorRef = ref<HTMLElement | null>(null);
/** Structural type so the GSAP import can stay dynamic (type-only). */
let ctx: { revert: () => void } | null = null;

const { isDark } = useTheme();

const spots = [
  { top: "30%", left: "20%", sel: ".node-1" },
  { top: "20%", left: "80%", sel: ".node-2" },
  { top: "70%", left: "50%", sel: ".node-3" }
];

async function build(): Promise<void> {
  ctx?.revert();
  ctx = null;

  // GSAP only drives the below-the-fold simulation, so it is imported after
  // mount rather than sitting on the initial critical path.
  const { gsap } = await import("gsap");
  if (!container.value) return;

  // Colours are read from tokens at build time, and the whole scene is rebuilt
  // when the theme flips — anything hardcoded here reads as a light-mode ghost
  // on a dark page.
  const C = {
    inverse: resolveTokenColor("--color-inverse", "#000000"),
    surface: resolveTokenColor("--color-surface", "#ffffff"),
    border: resolveTokenColor("--color-border", "#e4e4e7"),
    ripple: resolveTokenRgba("--color-inverse", 0.2)
  };

  ctx = gsap.context(() => {
    const tl = gsap.timeline({ repeat: -1, repeatDelay: 1 });

    gsap.set(cursorRef.value, {
      top: "50%",
      left: "50%",
      xPercent: -50,
      yPercent: -50,
      opacity: 0,
      scale: 0.5
    });

    tl.to(cursorRef.value, {
      opacity: 1,
      scale: 1,
      duration: 0.4,
      ease: "back.out(1.7)"
    });

    spots.forEach((spot) => {
      // 1. Move to node
      tl.to(cursorRef.value, {
        top: spot.top,
        left: spot.left,
        duration: 0.8,
        ease: "power3.inOut"
      });

      // 2. Press
      tl.to(cursorRef.value, { scale: 0.8, duration: 0.1, ease: "power1.out" }).to(
        spot.sel,
        {
          scale: 1.05,
          backgroundColor: C.inverse,
          borderColor: C.inverse,
          duration: 0.1
        },
        "<"
      );

      // 3. Ripple
      tl.fromTo(
        spot.sel,
        { boxShadow: `0 0 0 0px ${C.ripple}` },
        {
          boxShadow: `0 0 0 20px transparent`,
          duration: 0.5,
          ease: "power1.out",
          clearProps: "boxShadow"
        },
        "<"
      );

      // 4. Release
      tl.to(cursorRef.value, { scale: 1, duration: 0.2, ease: "back.out(2)" }, "+=0.1").to(
        spot.sel,
        {
          scale: 1,
          backgroundColor: C.surface,
          borderColor: C.border,
          duration: 0.4
        },
        "<"
      );

      tl.to({}, { duration: 0.3 });
    });

    // Exit to centre
    tl.to(cursorRef.value, {
      top: "50%",
      left: "50%",
      duration: 0.6,
      ease: "power2.inOut"
    }).to(cursorRef.value, { opacity: 0, scale: 0.5, duration: 0.4 }, "+=0.2");
  }, container.value);
}

onMounted(() => void build());
watch(isDark, () => void build());

onUnmounted(() => {
  ctx?.revert();
});
</script>

<template>
  <section class="relative">
    <!-- Header -->
    <div class="flex border-b border-border h-16 md:h-20 bg-surface">
      <div
        class="w-[80px] md:w-[96px] border-r border-border flex items-center justify-center shrink-0"
      >
        <span class="mono text-lg font-bold text-inverse">02</span>
      </div>
      <div class="flex-1 px-6 md:px-8 flex items-center justify-between">
        <h2 class="text-lg md:text-xl font-bold tracking-tighter text-inverse">Our Mission</h2>
        <span
          class="mono text-[10px] text-subtle uppercase tracking-widest font-bold hidden sm:inline-block"
          >manifesto.md</span
        >
      </div>
    </div>

    <div class="flex flex-col lg:flex-row border-b border-border relative overflow-hidden">
      <!-- Sidebar Gutter -->
      <div class="hidden lg:block w-[96px] border-r border-border shrink-0" />

      <!-- Text Content -->
      <div
        class="flex-1 px-6 py-12 md:p-16 lg:p-24 border-b lg:border-b-0 lg:border-r border-border bg-surface relative z-10"
      >
        <h2
          class="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tighter text-inverse mb-8 text-pretty leading-[1.1]"
        >
          The Mission
        </h2>
        <div class="prose prose-lg text-body font-medium leading-relaxed max-w-2xl text-pretty">
          <p class="mb-6">
            We are building a unified high-performance toolchain for user interaction, including
            <span class="text-inverse font-bold"> input normalization</span>,
            <span class="text-inverse font-bold"> physics-based smoothing</span>, and a
            <span class="text-inverse font-bold"> modular rendering stage</span>.
          </p>
          <p>
            Our mission is to make the next generation of web interfaces more organic and expressive
            than ever before, so while we shoulder handling performance cost, you can focus on
            designing beautiful cursors.
          </p>
        </div>
      </div>

      <!-- Graphic Content - Simulation Stage -->
      <div
        ref="container"
        class="w-full lg:w-[480px] shrink-0 bg-surface-muted/50 relative min-h-[320px] md:min-h-[400px] flex overflow-hidden border-t border-border lg:border-t-0"
      >
        <div class="absolute inset-0 grid-bg opacity-30 pointer-events-none" />

        <!-- Simulation Nodes -->
        <div
          class="node-1 absolute top-[30%] left-[20%] w-20 h-20 border border-border bg-surface shadow-sm transform -translate-x-1/2 -translate-y-1/2 rounded-sm"
        />

        <div
          class="node-2 absolute top-[20%] left-[80%] w-24 h-24 border border-border bg-surface shadow-sm transform -translate-x-1/2 -translate-y-1/2 rounded-sm"
        />

        <div
          class="node-3 absolute top-[70%] left-[50%] w-48 h-16 border border-border bg-surface shadow-sm transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center rounded-sm"
        >
          <div class="w-24 h-1 bg-surface-subtle" />
        </div>

        <!-- The Cursor -->
        <div ref="cursorRef" class="absolute w-6 h-6 z-20 pointer-events-none drop-shadow-xl">
          <svg viewBox="0 0 24 24" fill="none" stroke="none" class="w-full h-full text-inverse">
            <path d="M5.5 3.5L11.5 19.5L14 12.5L21 10L5.5 3.5Z" fill="currentColor" />
          </svg>
        </div>

        <div class="absolute bottom-6 left-6 right-6 flex justify-between items-end">
          <div class="mono text-[10px] text-subtle uppercase tracking-widest font-bold">
            Simulation Running
          </div>
          <div class="flex gap-1">
            <div class="w-1 h-1 bg-ok rounded-full animate-pulse" />
            <div class="w-1 h-1 bg-faint rounded-full" />
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
