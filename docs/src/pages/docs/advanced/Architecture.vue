<script setup lang="ts">
import DocsSection from "@/components/docs/DocsSection.vue";
import CodeBlock from "@/components/shared/CodeBlock.vue";
import TimelineStep from "@/components/shared/TimelineStep.vue";
import Text from "@/components/shared/Text.vue";
import ResponsibilityBox from "@/components/shared/ResponsibilityBox.vue";

const dampCode = `const damp = (current, target, lambda, dt) => {
  return lerp(current, target, 1 - Math.exp(-lambda * dt));
};`;

const loopCode = `// Pseudocode of the actual tick function
function tick(time) {
  const dt = time - lastTime;

  // 1. Logic (Priority < 0)
  // Plugins modify where we WANT to go
  state.target = { ...state.pointer };
  runLogicPlugins(state);

  // 2. Physics
  // Core smooths the movement
  state.smooth.x = damp(state.smooth.x, state.target.x, lambda, dt);

  // 3. Visuals (Priority >= 0)
  // Plugins render the result
  runVisualPlugins(state);
}`;
</script>

<template>
  <DocsSection label="Advanced" title="Core Architecture">
    <div class="mb-16">
      <p class="text-lg text-zinc-600 leading-relaxed mb-6">
        Supermouse treats the cursor as a game character. It runs a continuous loop that separates
        <span class="text-black font-bold border-b-2 border-black/10">User Input</span>
        from
        <span class="text-black font-bold border-b-2 border-black/10">Cursor Intent</span>
        and
        <span class="text-black font-bold border-b-2 border-black/10">Visual Rendering</span>.
      </p>
      <p class="text-lg text-zinc-600 leading-relaxed">
        This separation is what allows a magnetic button to "pull" the cursor (modifying Intent)
        without the input system needing to know, and without the visual dot jumping instantly
        (Physics handles the smoothing).
      </p>
    </div>

    <!-- The Pipeline -->
    <h3 class="text-2xl font-bold text-zinc-900 tracking-tight mb-8">The Frame Loop (16ms)</h3>

    <div class="relative border-l-2 border-zinc-200 ml-4 md:ml-8 space-y-16">
      <!-- STEP 1: SENSE -->
      <TimelineStep phase="Phase 01: Sense" title="Input Normalization">
        <Text>
          The <code>Input</code> system captures native DOM events (mousemove, touchmove). It
          normalizes coordinates relative to the container and checks for accessibility preferences
          (reduced-motion).
        </Text>
        <ResponsibilityBox title="Responsibility">
          Sanitize input. Check device capabilities. Update
          <span class="text-zinc-900 font-bold">state.pointer</span>.
        </ResponsibilityBox>
      </TimelineStep>

      <!-- STEP 2: LOGIC -->
      <TimelineStep phase="Phase 02: Intent" title="Logic Plugins">
        <Text>
          Plugins with <code>priority &lt; 0</code> execute. This is where "magic" happens. A
          magnetic plugin might look at the hovered element and say "Hey, I know the mouse is at
          500, but I want the cursor to snap to the center of this button at 550."
        </Text>
        <ResponsibilityBox title="Responsibility">
          Hijack the user's intent. Modify
          <span class="text-zinc-900 font-bold">state.target</span>.
        </ResponsibilityBox>
      </TimelineStep>

      <!-- STEP 3: PHYSICS -->
      <TimelineStep phase="Phase 03: Physics" title="Core Damping" :active="true">
        <Text>
          The Core calculates the difference between where we are (<span
            class="mono text-xs text-black bg-zinc-100 px-1"
            >smooth</span
          >) and where we want to go (<span class="mono text-xs text-black bg-zinc-100 px-1"
            >target</span
          >). It applies frame-rate independent damping to calculate the new position for this
          specific frame.
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
          Visual plugins (Dot, Ring) read the final
          <code>state.smooth</code> coordinates and apply CSS transforms to their DOM elements.
        </Text>
        <ResponsibilityBox title="Responsibility">
          Read <span class="text-zinc-900 font-bold">state.smooth</span>. Write to DOM (transform).
        </ResponsibilityBox>
      </TimelineStep>
    </div>

    <!-- Design Philosophy -->
    <h3 class="text-2xl font-bold text-zinc-900 tracking-tight mt-20 mb-8">Design Philosophy</h3>

    <div class="mb-16">
      <Text>
        Supermouse adopts a <strong>Brutalist-lite</strong> aesthetic. The interface is
        high-contrast, instant, and rigid, while the cursor is fluid, physics-driven, and organic.
        This contrast emphasizes the library's capability.
      </Text>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-px bg-zinc-200 border border-zinc-200 mt-8">
        <div class="bg-white p-8">
          <h4 class="text-lg font-bold text-zinc-900 mb-4">No-Transition Rule</h4>
          <p class="text-sm text-zinc-600 leading-relaxed">
            The user interface should feel like a high-precision tool. Modal appearances, tab
            switches, and layout changes must be instantaneous. Only micro-interactions on hover
            (colors, borders) are allowed fast transitions.
          </p>
        </div>
        <div class="bg-white p-8">
          <h4 class="text-lg font-bold text-zinc-900 mb-4">Physics-First Rule</h4>
          <p class="text-sm text-zinc-600 leading-relaxed">
            <strong>Only</strong> the cursor and cursor-related effects are allowed to be smooth or
            floaty. This stark contrast makes the cursor interactions stand out.
          </p>
        </div>
      </div>
    </div>

    <!-- Plugin Architecture -->
    <h3 class="text-2xl font-bold text-zinc-900 tracking-tight mt-20 mb-8">Plugin Architecture</h3>
    <div class="mb-16">
      <Text>
        Plugins are the primary extension mechanism in Supermouse. The core exists to coordinate
        them, not to replace them. If a feature can be a plugin, it probably should be.
      </Text>

      <div class="space-y-12 mt-8 border-l border-zinc-200 pl-8">
        <div>
          <h4 class="text-lg font-bold text-zinc-900 mb-2">Priority & The "Tearing" Bug</h4>
          <Text size="sm" color="subtle">
            Logic plugins (like Magnetic) <strong>must</strong> have negative priority (e.g.
            <code>-10</code>). If a logic plugin has default priority (<code>0</code>), it runs
            mixed in with visual plugins causing "tearing" (visuals registered before it render the
            old position, visuals registered after render the new position).
          </Text>
        </div>

        <div>
          <h4 class="text-lg font-bold text-zinc-900 mb-2">Logic vs Visual Plugins</h4>
          <Text size="sm" color="subtle">
            <strong>Logic plugins</strong> modify where the cursor goes by writing to
            <code>state.target</code> and generally shouldn't touch the DOM.
            <strong>Visual plugins</strong> read <code>state.smooth</code> and render to the DOM,
            usually running with non-negative priority.
          </Text>
        </div>

        <div>
          <h4 class="text-lg font-bold text-zinc-900 mb-2">Inter-Plugin Communication</h4>
          <Text size="sm" color="subtle">
            Plugins coordinate via state channels. For example, <code>state.shape</code> bridges
            logic and visuals. A Stick logic plugin measures the hovered element and writes
            dimensions to <code>state.shape</code>, and a Ring visual plugin reads it to morph its
            shape, decoupling behavior from rendering.
          </Text>
        </div>
      </div>
    </div>

    <!-- Performance Systems -->
    <h3 class="text-2xl font-bold text-zinc-900 tracking-tight mt-20 mb-8">Performance Strategy</h3>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-px bg-zinc-200 border border-zinc-200">
      <div class="bg-white p-8">
        <h4 class="text-lg font-bold text-zinc-900 mb-4">Interaction Scraping</h4>
        <p class="text-sm text-zinc-600 leading-relaxed mb-4">
          Reading DOM attributes or styles during the render loop causes layout thrashing.
        </p>
        <p class="text-sm text-zinc-600 leading-relaxed">
          Supermouse solves this by parsing interaction data <strong>only once</strong> when the
          <code>mouseover</code> event fires. It stores the result in a cache. The loop reads from
          this cache, making interaction checks O(1).
        </p>
      </div>
      <div class="bg-white p-8">
        <h4 class="text-lg font-bold text-zinc-900 mb-4">The Stage System</h4>
        <p class="text-sm text-zinc-600 leading-relaxed mb-4">
          The "Double Cursor" glitch happens when an element's CSS (`cursor: pointer`) overrides the
          body's `cursor: none`.
        </p>
        <p class="text-sm text-zinc-600 leading-relaxed">
          Supermouse injects a dynamic <code>&lt;style&gt;</code> tag targeting every interactive
          selector registered by plugins and applies <code>cursor: none !important</code>.
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
