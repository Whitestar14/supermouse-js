<script setup lang="ts">
import DocsSection from "@/components/docs/DocsSection.vue";
import MetadataStrip from "@/components/shared/MetadataStrip.vue";
import Text from "@/components/shared/Text.vue";
import SectionHeader from "@/components/shared/SectionHeader.vue";
import { APP_VERSION, BUNDLE_SIZE } from "@config/constants";

const metaItems = [
  { label: "VERSION", content: APP_VERSION },
  { label: "CORE SIZE", content: `${BUNDLE_SIZE} (min+gzip)` },
  { label: "LICENSE", content: "MIT" }
];
</script>

<template>
  <DocsSection label="Guide" title="Introduction">
    <MetadataStrip :items="metaItems" />

    <div class="mb-12 space-y-4">
      <Text weight="medium" size="lg">
        Supermouse is a <b>high-performance</b> runtime that decouples <b>cursor intent</b> from
        <b>cursor rendering</b>.
      </Text>
      <Text size="lg">
        It provides a plugin system that allows for flexible plugin integration and complex visual
        effects. Unlike most cursor libraries that behave more or less like UI components, binding
        state to a specific framework's render cycle (React, Vue) or relying on heavy animation
        libraries (GSAP) to move a div, Supermouse runs its own deterministic game loop (60fps)
        using <code>requestAnimationFrame</code>
      </Text>
      <Text size="lg">
        It manages the hard parts (input normalization and physics interpolation) so it remains
        performant, and a priority-based plugin system with auto-recovery to render effects without
        layout thrashing.
      </Text>
    </div>

    <!-- The Problem / The Solution Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-px bg-zinc-200 border border-zinc-200 mb-16">
      <div class="bg-white p-8">
        <h3 class="font-mono text-xs font-bold uppercase tracking-widest text-zinc-400 mb-4">
          The Traditional Problems
        </h3>
        <ul class="space-y-4 text-sm text-zinc-700">
          <li class="flex gap-3">
            <span class="font-bold text-zinc-400 min-w-[3ch]">01.</span>
            <p>
              <strong>The Double Cursor Glitch.</strong> Hiding the native cursor via CSS is very
              fragile. <code>input</code>, <code>a</code>, and user-agent stylesheets often force it
              back, creating a flickering ghost cursor.
            </p>
          </li>
          <li class="flex gap-3">
            <span class="font-bold text-zinc-400 min-w-[3ch]">02.</span>
            <p>
              <strong>Input Lag.</strong> React/Vue state updates are asynchronous. Binding mouse
              coordinates to reactive state causes the cursor to trail 1-2 frames behind input,
              feeling mushy, laggy or unresponsive.
            </p>
          </li>
          <li class="flex gap-3">
            <span class="font-bold text-zinc-400 min-w-[3ch]">03.</span>
            <p>
              <strong>Logic/Visual Coupling.</strong> Most libraries bake the visual style (e.g a
              dot, a ring) into the logic, which makes attempts to swapping or layering effects
              non-trivial
            </p>
          </li>
        </ul>
      </div>
      <div class="bg-zinc-50 p-8">
        <h3 class="font-mono text-xs font-bold uppercase tracking-widest text-zinc-400 mb-4">
          The Supermouse Solution
        </h3>
        <ul class="space-y-4 text-sm text-zinc-700">
          <li class="flex gap-3">
            <span class="font-bold text-zinc-900 min-w-[3ch]">01.</span>
            <p>
              <strong>The Stage System.</strong> Supermouse injects a scoped, high-specificity
              stylesheet to aggressively suppress the native cursor on registered targets,
              guaranteeing it vanishes, with additional guardrails to ensure that and granularity to
              restore it if necessary.
            </p>
          </li>
          <li class="flex gap-3">
            <span class="font-bold text-zinc-900 min-w-[3ch]">02.</span>
            <p>
              <strong>Direct DOM Access.</strong> The core loop bypasses framework Virtual DOMs
              entirely, applying transforms directly to the GPU layer for 120hz+ fluidity.
            </p>
          </li>
          <li class="flex gap-3">
            <span class="font-bold text-zinc-900 min-w-[3ch]">03.</span>
            <p>
              <strong>Plugin Pipeline.</strong> Logic plugins (e.g Magnetc) runs first to modify the
              target. Physics runs second to smooth movement. Visuals (e.g Dot, Ring) run last to
              render. Completely decoupled.
            </p>
          </li>
        </ul>
      </div>
    </div>

    <!-- Core Philosophy -->
    <SectionHeader :level="2"> Core Philosophy </SectionHeader>
    <div class="border-t border-zinc-200">
      <div
        class="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-zinc-200 border-b border-zinc-200"
      >
        <div class="p-6">
          <strong class="block text-zinc-900 text-sm mb-2">1. Intent vs. Render</strong>
          <p class="text-xs text-zinc-500 leading-relaxed">
            We separate where the cursor <em>wants</em> to go from where it actually <em>is</em> and
            what it <em>looks like</em>. This allows plugins to hijack the target position without
            visually rendered cursors knowing.
          </p>
        </div>
        <div class="p-6">
          <strong class="block text-zinc-900 text-sm mb-2">2. Modular Defaults</strong>
          <p class="text-xs text-zinc-500 leading-relaxed">
            Supermouse ships with performance-optimized defaults that work out of the box. However,
            nothing is locked in. You can replace the renderer, logic, or input system entirely via
            plugins.
          </p>
        </div>
        <div class="p-6">
          <strong class="block text-zinc-900 text-sm mb-2">3. Accessibility First</strong>
          <p class="text-xs text-zinc-500 leading-relaxed">
            The library automatically detects touch devices (coarse pointer) and disables itself. It
            listens for
            <code>prefers-reduced-motion</code> and snaps physics instantly to prevent motion
            sickness.
          </p>
        </div>
      </div>
    </div>
  </DocsSection>
</template>
