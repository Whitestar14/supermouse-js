<script setup lang="ts">
import DocsSection from "@/components/docs/DocsSection.vue";
import MetadataStrip from "@/components/shared/MetadataStrip.vue";
import Text from "@/components/shared/Text.vue";
import SectionHeader from "@/components/shared/SectionHeader.vue";
import ApiLink from "@/components/shared/ApiLink.vue";
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
        Supermouse is a high-performance cursor engine for the modern web, designed to isolate <strong>cursor intent</strong> from <strong>cursor rendering</strong>.
      </Text>
      <Text size="lg">
        Conventional cursor libraries treat cursors as standard UI elements, tying their coordinates to framework reactive state (React, Vue) or relying on heavy animation wrappers (like GSAP) that operate on CPU layout properties. This coupling introduces input lag and rendering delays. Supermouse runs a standalone, deterministic animation loop (60–120Hz) managed directly via <code>requestAnimationFrame</code>.
      </Text>
      <Text size="lg">
        By separating physics interpolation from paint routines and enforcing a strict DOM Firewall, Supermouse enables fluid pointer dynamics without layout thrashing.
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
              <strong>The Double Cursor Glitch.</strong> Hiding the OS cursor via standard CSS is fragile; inputs, dynamic targets, and user-agent stylesheets regularly force it back, creating flickering.
            </p>
          </li>
          <li class="flex gap-3">
            <span class="font-bold text-zinc-400 min-w-[3ch]">02.</span>
            <p>
              <strong>Input Lag.</strong> Framework state updates are asynchronous. Driving coordinates through a virtual DOM deferment trails the native pointer by 1–2 frames.
            </p>
          </li>
          <li class="flex gap-3">
            <span class="font-bold text-zinc-400 min-w-[3ch]">03.</span>
            <p>
              <strong>Coupled Architectures.</strong> Mixing physical tracking bounds with visual render elements limits layout composability and stops developer modifications.
            </p>
          </li>
        </ul>
      </div>
      <div class="bg-zinc-50 p-8">
        <h3 class="font-mono text-xs font-bold uppercase tracking-widest text-zinc-900 mb-4">
          The Supermouse Solution
        </h3>
        <ul class="space-y-4 text-sm text-zinc-700">
          <li class="flex gap-3">
            <span class="font-bold text-zinc-900 min-w-[3ch]">01.</span>
            <p>
              <strong>The Stage Controller.</strong> Supermouse injects a scoped, high-specificity stylesheet to suppress native pointers over registered regions, utilizing granularity controls to show or hide the OS pointer.
            </p>
          </li>
          <li class="flex gap-3">
            <span class="font-bold text-zinc-900 min-w-[3ch]">02.</span>
            <p>
              <strong>Direct GPU Transforms.</strong> By bypassing the virtual DOM, updates apply hardware-accelerated CSS translation vectors directly onto target layers.
            </p>
          </li>
          <li class="flex gap-3">
            <span class="font-bold text-zinc-900 min-w-[3ch]">03.</span>
            <p>
              <strong>Decoupled Pipeline.</strong> Logic layers compute coordinates, physics smooths movement, and visuals render. Plugins hook into specific stages without side-effects.
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
            Physics models track coordinate intent on <ApiLink to="target"><code>state.target</code></ApiLink>, while visual plugins read from the interpolated <ApiLink to="smooth"><code>state.smooth</code></ApiLink> values. This decoupling lets plugins modify tracking bounds dynamically.
          </p>
        </div>
        <div class="p-6">
          <strong class="block text-zinc-900 text-sm mb-2">2. Modular Pipeline</strong>
          <p class="text-xs text-zinc-500 leading-relaxed">
            The core engine registers plugins on a chainable stack via <ApiLink to="use"><code>app.use()</code></ApiLink>, coordinating execution priority. You can swap, enable, or disable layers at runtime.
          </p>
        </div>
        <div class="p-6">
          <strong class="block text-zinc-900 text-sm mb-2">3. Accessibility First</strong>
          <p class="text-xs text-zinc-500 leading-relaxed">
            Coarse pointers (touch devices) trigger automatic hibernation via <ApiLink to="autodisableonmobile"><code>autoDisableOnMobile</code></ApiLink>. Operating system preferences for <ApiLink to="reducedmotion"><code>state.reducedMotion</code></ApiLink> instantly skip floaty physics to prevent motion sickness.
          </p>
        </div>
      </div>
    </div>
  </DocsSection>
</template>
