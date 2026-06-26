<script setup lang="ts">
import DocsSection from "@/components/docs/DocsSection.vue";
import CodeBlock from "@/components/shared/CodeBlock.vue";
import TimelineStep from "@/components/shared/TimelineStep.vue";
import Text from "@/components/shared/Text.vue";
import ResponsibilityBox from "@/components/shared/ResponsibilityBox.vue";
import ApiLink from "@/components/shared/ApiLink.vue";

const dampCode = `const damp = (current, target, lambda, dt) => {
  return lerp(current, target, 1 - Math.exp(-lambda * dt));
};`;

const loopCode = `// Simplified tick function — packages/core/src/Supermouse.ts
function tick(time) {
  const dt = time - lastTime;

  // Phase 1 — Logic plugins (priority < 0) modify target
  state.target = { ...state.pointer };
  runLogicPlugins(state);

  // Phase 2 — Physics: frame-rate independent damping
  state.smooth.x = damp(state.smooth.x, state.target.x, lambda, dt);
  state.smooth.y = damp(state.smooth.y, state.target.y, lambda, dt);

  // Phase 3 — Visual plugins (priority >= 0) render the result
  runVisualPlugins(state);
}`;
</script>

<template>
  <DocsSection label="Advanced" title="Core Architecture">
    <div class="mb-16">
      <p class="text-lg text-zinc-600 leading-relaxed mb-6">
        Supermouse models the cursor as a game entity running a deterministic
        <code>requestAnimationFrame</code> loop. The pipeline separates three distinct concerns
        every frame: <span class="text-black font-bold border-b-2 border-black/10">Input</span>,
        <span class="text-black font-bold border-b-2 border-black/10">Intent</span>, and
        <span class="text-black font-bold border-b-2 border-black/10">Rendering</span>.
      </p>
      <p class="text-lg text-zinc-600 leading-relaxed">
        This separation is what lets a magnetic button pull the cursor (modifying Intent via
        <ApiLink name="state.target" to="state.target" /> in Phase 01) without the input layer
        knowing — and without the visual dot jumping (Phase 02 physics handles the interpolation).
      </p>
    </div>

    <!-- The Pipeline -->
    <h3 class="text-2xl font-bold text-zinc-900 tracking-tight mb-8">The Frame Loop</h3>

    <div class="relative border-l-2 border-zinc-200 ml-4 md:ml-8 space-y-16">
      <!-- STEP 1: SENSE -->
      <TimelineStep phase="Phase 01: Input" title="Input Normalization">
        <Text>
          The <code>Input</code> system captures native DOM events (<code>mousemove</code>,
          <code>touchmove</code>). It normalizes pointer coordinates relative to the container,
          checks accessibility preferences (<code>prefers-reduced-motion</code>), and writes the
          result to <ApiLink name="state.pointer" to="state.pointer" />.
        </Text>
        <ResponsibilityBox title="Responsibility">
          Sanitize raw input. Check device capabilities. Write
          <span class="text-zinc-900 font-bold">state.pointer</span>.
        </ResponsibilityBox>
      </TimelineStep>

      <!-- STEP 2: LOGIC -->
      <TimelineStep phase="Phase 02: Intent" title="Logic Plugins">
        <Text>
          Plugins with <ApiLink name="priority" to="priority" /> <code>&lt; 0</code> run here. A
          magnetic plugin reads the hovered element's geometry from
          <ApiLink name="state.interaction" to="state.interaction" /> (pre-scraped on
          <code>mouseover</code>) and adjusts <ApiLink name="state.target" to="state.target" /> to
          pull the cursor toward the element's center.
        </Text>
        <ResponsibilityBox title="Responsibility">
          Read <span class="text-zinc-900 font-bold">state.pointer</span> /
          <span class="text-zinc-900 font-bold">state.interaction</span>. Write
          <span class="text-zinc-900 font-bold">state.target</span>.
        </ResponsibilityBox>
      </TimelineStep>

      <!-- STEP 3: PHYSICS -->
      <TimelineStep phase="Phase 03: Physics" title="Core Damping" :active="true">
        <Text>
          The core interpolates between where the cursor is (<ApiLink
            name="state.smooth"
            to="state.smooth"
          />) and where it needs to go (<ApiLink name="state.target" to="state.target" />) using
          frame-rate independent exponential damping.
          <ApiLink name="smoothness" to="smoothness" /> controls the <code>lambda</code> coefficient
          — higher values produce tighter tracking.
        </Text>
        <CodeBlock
          :code="dampCode"
          lang="javascript"
          :clean="true"
          class="border border-zinc-200"
        />
      </TimelineStep>

      <!-- STEP 4: RENDER -->
      <TimelineStep phase="Phase 04: Render" title="Visual Plugins" :last="true">
        <Text>
          Visual plugins — <code>Dot</code>, <code>Ring</code> — read the final
          <ApiLink name="state.smooth" to="state.smooth" /> coordinates and write
          <code>transform</code> to their DOM elements. This is the only phase allowed to touch the
          DOM.
        </Text>
        <ResponsibilityBox title="Responsibility">
          Read <span class="text-zinc-900 font-bold">state.smooth</span>. Write
          <code>transform</code> to the DOM.
        </ResponsibilityBox>
      </TimelineStep>
    </div>

    <!-- Design Philosophy -->
    <h3 class="text-2xl font-bold text-zinc-900 tracking-tight mt-20 mb-8">Design Philosophy</h3>

    <div class="mb-16">
      <Text>
        Supermouse follows a <strong>Brutalism-lite</strong> aesthetic contract: the UI is
        high-contrast, instant, and rigid; the cursor is fluid, physics-driven, and organic. The
        contrast is deliberate — it makes cursor interactions the only "living" element on the page.
      </Text>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-px bg-zinc-200 border border-zinc-200 mt-8">
        <div class="bg-white p-8">
          <h4 class="text-lg font-bold text-zinc-900 mb-4">No-Transition Rule</h4>
          <p class="text-sm text-zinc-600 leading-relaxed">
            Modal appearances, tab switches, and layout changes must be instantaneous
            (<code>duration-0</code>). Only hover micro-interactions (color, border) may have fast
            transitions.
          </p>
        </div>
        <div class="bg-white p-8">
          <h4 class="text-lg font-bold text-zinc-900 mb-4">Physics-First Rule</h4>
          <p class="text-sm text-zinc-600 leading-relaxed">
            <strong>Only</strong> the cursor and cursor-related effects are smooth. Everything else
            snaps. This contrast makes physics-based cursor motion stand out.
          </p>
        </div>
      </div>
    </div>

    <!-- Plugin Architecture -->
    <h3 class="text-2xl font-bold text-zinc-900 tracking-tight mt-20 mb-8">Plugin Architecture</h3>
    <div class="mb-16">
      <Text>
        Plugins are the primary extension mechanism. The core coordinates them — it does not replace
        them. If a feature can be a plugin, it should be a plugin. See
        <router-link to="/docs/advanced/authoring" class="underline font-bold hover:text-black"
          >Plugin Authoring</router-link
        >
        for the full contract.
      </Text>

      <div class="space-y-12 mt-8 border-l border-zinc-200 pl-8">
        <div>
          <h4 class="text-lg font-bold text-zinc-900 mb-2">Priority & The "Tearing" Bug</h4>
          <Text size="sm" color="subtle">
            Logic plugins (e.g. Magnetic) <strong>must</strong> declare a negative
            <ApiLink name="priority" to="priority" /> (e.g. <code>-10</code>). If a logic plugin
            runs at default priority (<code>0</code>), it executes interleaved with visual plugins —
            visuals registered before it render the old position while those registered after render
            the new one. This causes visible "tearing."
          </Text>
        </div>

        <div>
          <h4 class="text-lg font-bold text-zinc-900 mb-2">Logic vs. Visual Plugins</h4>
          <Text size="sm" color="subtle">
            <strong>Logic plugins</strong> write to
            <ApiLink name="state.target" to="state.target" /> and must not touch the DOM.
            <strong>Visual plugins</strong> read
            <ApiLink name="state.smooth" to="state.smooth" /> and write <code>transform</code> to
            the DOM. Mixing these responsibilities breaks the pipeline.
          </Text>
        </div>

        <div>
          <h4 class="text-lg font-bold text-zinc-900 mb-2">Inter-Plugin Communication</h4>
          <Text size="sm" color="subtle">
            Plugins coordinate via state channels. For example,
            <ApiLink name="state.shape" to="state.shape" /> bridges logic and visuals: a Stick
            plugin reads the hovered element's geometry and writes it to <code>state.shape</code>; a
            Ring plugin reads it to morph its border radius. Behavior and rendering remain fully
            decoupled.
          </Text>
        </div>
      </div>
    </div>

    <!-- Performance Systems -->
    <h3 class="text-2xl font-bold text-zinc-900 tracking-tight mt-20 mb-8">
      Performance Contracts
    </h3>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-px bg-zinc-200 border border-zinc-200">
      <div class="bg-white p-8">
        <h4 class="text-lg font-bold text-zinc-900 mb-4">DOM Firewall</h4>
        <p class="text-sm text-zinc-600 leading-relaxed mb-4">
          Reading layout properties (e.g. <code>getBoundingClientRect</code>) inside
          <code>update()</code> causes layout thrashing and breaks the 60fps budget.
        </p>
        <p class="text-sm text-zinc-600 leading-relaxed">
          The core scrapes element geometry <strong>once</strong> on the
          <code>mouseover</code> event and caches it in
          <ApiLink name="state.interaction" to="state.interaction" />. The render loop reads from
          this cache — all geometry lookups are O(1).
        </p>
      </div>
      <div class="bg-white p-8">
        <h4 class="text-lg font-bold text-zinc-900 mb-4">The Stage System</h4>
        <p class="text-sm text-zinc-600 leading-relaxed mb-4">
          The "double cursor" glitch occurs when an element's <code>cursor: pointer</code> overrides
          <code>body { cursor: none }</code>.
        </p>
        <p class="text-sm text-zinc-600 leading-relaxed">
          On init, Supermouse injects a <code>&lt;style&gt;</code> tag targeting every interactive
          selector registered by plugins and applies <code>cursor: none !important</code>. This is
          the Stage system.
        </p>
      </div>
    </div>

    <div class="mt-16">
      <h3 class="text-sm font-bold text-zinc-900 mb-4 uppercase tracking-widest">
        Reference Implementation
      </h3>
      <CodeBlock :code="loopCode" lang="typescript" title="core/Supermouse.ts (Simplified)" />
    </div>
  </DocsSection>
</template>
