<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import UiButton from "@components/ui/UiButton.vue";
import { resolveTokenColor } from "@utils/theme";

const container = ref<HTMLElement | null>(null);
const cursorRef = ref<HTMLElement | null>(null);
const moduleRef = ref<HTMLElement | null>(null);
const coreRef = ref<HTMLElement | null>(null);
const renderRef = ref<HTMLElement | null>(null);

/** Structural type so the GSAP import can stay dynamic (type-only). */
let ctx: { revert: () => void } | null = null;

onMounted(async () => {
  // GSAP only drives the below-the-fold simulation, so it is imported after
  // mount rather than sitting on the initial critical path.
  const { gsap } = await import("gsap");
  if (!container.value) return;

  ctx = gsap.context(() => {
    const tl = gsap.timeline({ repeat: -1, repeatDelay: 1 });

    const C = {
      strong: resolveTokenColor("--color-strong"),
      surface: resolveTokenColor("--color-surface", "#ffffff"),
      border: resolveTokenColor("--color-border"),
      muted: resolveTokenColor("--color-muted"),
      inverse: resolveTokenColor("--color-inverse"),
      accent: resolveTokenColor("--color-accent", "#f59e0b"),
      ok: resolveTokenColor("--color-ok", "#15803d")
    };
    gsap.set(moduleRef.value, {
      top: "75%",
      left: "25%",
      opacity: 1,
      scale: 1,
      backgroundColor: C.strong,
      color: C.surface,
      borderColor: C.strong,
      boxShadow: "none"
    });
    gsap.set(cursorRef.value, {
      top: "80%",
      left: "80%",
      opacity: 0,
      scale: 1
    });
    gsap.set(".slot-target", {
      borderColor: C.border,
      backgroundColor: "transparent"
    });
    gsap.set([coreRef.value, renderRef.value], {
      borderColor: C.border,
      color: C.muted,
      backgroundColor: C.surface,
      scale: 1
    });
    gsap.set(".pluginDot", { backgroundColor: C.accent });

    // 1. Cursor Enters
    tl.to(cursorRef.value, {
      opacity: 1,
      top: "78%",
      left: "30%",
      duration: 0.6,
      ease: "power2.out"
    })

      // 2. Grabs Module
      .to(cursorRef.value, { scale: 0.8, duration: 0.1 })
      .to(
        moduleRef.value,
        {
          scale: 1.05,
          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)",
          duration: 0.1
        },
        "<"
      )

      // 3. Drags to Slot
      .to([cursorRef.value, moduleRef.value], {
        top: "50%",
        left: "50%",
        duration: 0.8,
        ease: "power3.inOut"
      })

      // 4. Release & Snap
      .to(cursorRef.value, { scale: 1, duration: 0.15 })
      .to(moduleRef.value, { scale: 1, boxShadow: "none", duration: 0.15 }, "<")

      // 4.5 Light up effect
      .to(".pluginDot", { backgroundColor: C.ok })
      // 5. Connect Effect
      .to([coreRef.value, moduleRef.value, renderRef.value], {
        borderColor: C.inverse,
        color: C.inverse,
        backgroundColor: C.surface,
        scale: 1.01,
        duration: 0.1,
        stagger: 0.08,
        ease: "power1.out"
      })
      .to(".slot-target", { borderColor: "transparent", duration: 0.1 }, "-=0.2")

      // 6. Cursor Leaves
      .to(
        cursorRef.value,
        {
          top: "20%",
          left: "80%",
          opacity: 0,
          duration: 0.5,
          ease: "power2.in"
        },
        "+=0.2"
      )

      // 7. Reset Sequence
      .to(moduleRef.value, { opacity: 0, duration: 0.3, delay: 0.5 })
      .to(
        [coreRef.value, renderRef.value],
        {
          borderColor: C.border,
          color: C.muted,
          backgroundColor: C.surface,
          scale: 1,
          duration: 0.3
        },
        "<"
      );
  }, container.value);
});

onUnmounted(() => {
  ctx?.revert();
});
</script>

<template>
  <section class="relative">
    <!-- Header -->
    <div class="flex border-b border-border h-16 md:h-20 bg-surface">
      <div class="w-20 md:w-24 border-r border-border flex items-center justify-center shrink-0">
        <span class="mono text-lg font-bold text-inverse">01</span>
      </div>
      <div class="flex-1 px-6 md:px-8 flex items-center justify-between">
        <h2 class="text-lg md:text-xl font-bold tracking-tighter text-inverse">The runtime</h2>
        <span
          class="mono text-[10px] text-subtle uppercase tracking-widest font-bold hidden sm:inline-block"
          >pipeline.ts</span
        >
      </div>
    </div>

    <div class="flex flex-col lg:flex-row border-b border-border">
      <!-- Sidebar Gutter -->
      <div class="hidden lg:block w-24 border-r border-border shrink-0 bg-surface-muted/30" />

      <!-- Content Container -->
      <div class="flex-1 flex flex-col lg:flex-row">
        <!-- Text Block -->
        <div class="flex-1 px-6 py-12 md:p-16 lg:p-24 bg-surface relative z-10">
          <div class="max-w-2xl">
            <h3
              class="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tighter text-inverse mb-6 md:mb-8 leading-[1.05]"
            >
              Plugins are first-class citizens.
            </h3>
            <p class="text-base sm:text-lg text-body font-medium leading-relaxed mb-8 text-pretty">
              Supermouse works as a tiny kernel that coordinates independent modules. From the
              <NuxtLink class="link" to="/docs/plugins/dot">Dot</NuxtLink> cursor to the
              <NuxtLink class="link" to="/docs/plugins/magnetic">Magnetic</NuxtLink> effect,
              everything is a plugin.
            </p>
            <div class="flex flex-col sm:flex-row gap-4">
              <UiButton to="/docs/architecture/authoring">Write a Plugin</UiButton>
              <UiButton to="/docs/plugins/" variant="secondary">See the plugins</UiButton>
            </div>
          </div>
        </div>

        <!-- Graphic Block - Modular Stack Simulation -->
        <div
          ref="container"
          class="w-full lg:w-120 shrink-0 border-t lg:border-t-0 lg:border-l border-border bg-surface-muted/50 relative min-h-[320px] md:min-h-[400px] flex overflow-hidden"
        >
          <div class="absolute inset-0 grid-bg opacity-30 pointer-events-none" />

          <!-- The Stack -->
          <div
            class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col gap-2 w-48"
          >
            <div
              ref="coreRef"
              class="stack-item h-12 w-full bg-surface border border-border flex items-center px-4 relative z-10 transition-colors"
            >
              <span class="mono text-[10px] font-bold text-inherit">INPUT</span>
            </div>
            <!-- The Empty Slot -->
            <div
              class="slot-target h-12 w-full border-2 border-dashed border-faint bg-surface-subtle/50 flex items-center justify-center box-border relative z-0"
            >
              <span class="mono text-[10px] font-bold text-faint opacity-50">PLUGIN</span>
            </div>
            <div
              ref="renderRef"
              class="stack-item h-12 w-full bg-surface border border-border flex items-center px-4 relative z-10 transition-colors"
            >
              <span class="mono text-[10px] font-bold text-inherit">STAGE</span>
            </div>
          </div>

          <!-- Draggable Module -->
          <div
            ref="moduleRef"
            class="absolute w-48 h-12 bg-inverse border border-strong shadow-xl flex items-center px-4 z-20 transform -translate-x-1/2 -translate-y-1/2 transition-colors"
          >
            <div class="pluginDot w-2 h-2 bg-ok border-strong border border-solid mr-3" />
            <span class="mono text-[10px] font-bold inherit uppercase tracking-widest flex-1">
              @supermouse/plugin
            </span>
          </div>

          <!-- Cursor -->
          <div
            ref="cursorRef"
            class="absolute z-30 w-6 h-6 pointer-events-none drop-shadow-xl transform -translate-x-1/2 -translate-y-1/2"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="none" class="w-full h-full text-inverse">
              <path d="M5.5 3.5L11.5 19.5L14 12.5L21 10L5.5 3.5Z" fill="currentColor" />
            </svg>
          </div>

          <div class="absolute bottom-6 left-0 right-0 text-center">
            <p class="mono text-[10px] text-subtle uppercase tracking-widest font-bold">
              Ordered by priority
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
