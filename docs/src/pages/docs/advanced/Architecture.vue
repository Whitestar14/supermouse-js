<script setup lang="ts">
import DocsSection from "@/components/docs/DocsSection.vue";
import CodeBlock from "@/components/shared/CodeBlock.vue";
import TimelineStep from "@/components/shared/TimelineStep.vue";
import Text from "@/components/shared/Text.vue";
import ResponsibilityBox from "@/components/shared/ResponsibilityBox.vue";
import ApiLink from "@/components/shared/ApiLink.vue";
import Callout from "@/components/shared/Callout.vue";
import SectionHeader from "@/components/shared/SectionHeader.vue";
import SectionDivider from "@/components/shared/SectionDivider.vue";

const loopCode = `// Simplified internal tick function
function tick(time) {
  const dt = time - lastTime;

  // 1. Reset target to follow raw pointer
  state.target = { ...state.pointer };

  // 2. Logic Plugins (priority < 0) modify target
  runLogicPlugins(state);

  // 3. Physics Damping
  state.smooth.x = damp(state.smooth.x, state.target.x, lambda, dt);
  state.smooth.y = damp(state.smooth.y, state.target.y, lambda, dt);

  // 4. Update internal velocity & angle
  state.velocity.x = state.target.x - state.smooth.x;
  state.velocity.y = state.target.y - state.smooth.y;
  state.angle = Math.atan2(state.velocity.y, state.velocity.x) * (180 / Math.PI);

  // 5. Visual Plugins (priority >= 0) render results
  runVisualPlugins(state);
}`;

const hoverRegisterCode = `export default {
  name: 'my-plugin',
  install(app) {
    // Tells the core to scrape data-my-plugin attributes on hover
    // and hides the native cursor for these elements.
    app.registerHoverTarget('[data-my-plugin]');
  },
  update(app) {
    if (app.state.interaction['my-plugin']) {
      // React to the scraped state
    }
  }
}`;

const customResolverCode = `new Supermouse({
  resolveInteraction(el) {
    return {
      color: el.style.color,
      magnetic: el.hasAttribute("data-magnetic")
    };
  }
});`;

const closestExampleCode = `<!-- Register: '[data-hover] a' -->
<div data-hover>
  <a href="#">Hover me</a>  <!-- ✅ matched: <a> inside [data-hover] -->
</div>

<!-- Register: 'a [data-hover]' (WRONG mental model) -->
<a href="#">
  <span data-hover>text</span> <!-- ❗ closest('a [data-hover]') matches the <a>, not the <span> -->
</a>`;

const trueVelocityCode = `// Inside your plugin
let lastPointer = { x: 0, y: 0 };

update(app) {
  // Calculate actual pixel movement per frame
  const dx = app.state.pointer.x - lastPointer.x;
  const dy = app.state.pointer.y - lastPointer.y;

  lastPointer = { ...app.state.pointer };
}`;

const valueOrGetterCode = `import { normalize } from "@supermousejs/utils";

// In your plugin's install/update method:
const size = normalize(options.size, 16); // If options.size is undefined, defaults to 16
// 'size' is now guaranteed to be a resolved number,
// even if options.size was passed as (state) => number`;

const scopingBadGood = `// ❌ BAD: selector starts with a combinator
'> .child'   → becomes '.supermouse-scope-0 > .child'
// ✅ GOOD: simple selectors only
'.child', '[data-my-plugin]'`;
</script>

<template>
  <DocsSection label="Advanced" title="Architecture">
    <div class="mb-16">
      <Text size="lg">
        Supermouse is built on a rigid, highly-optimized frame loop inspired by game engines. To
        write effective plugins, you need to understand how the core pipeline separates
        <strong>intent</strong> from <strong>rendering</strong>, and how it protects performance
        using a strict DOM firewall.
      </Text>
    </div>

    <!-- The Pipeline -->
    <SectionHeader :level="2" class="mb-8">The Render Pipeline & Execution Order</SectionHeader>

    <div class="relative border-l-2 border-zinc-200 ml-4 md:ml-8 space-y-16">
      <TimelineStep phase="Phase 01: Input" title="Event Aggregation">
        <Text>
          The input system captures native DOM pointer events outside of the animation loop. It
          normalizes coordinates and writes them to <ApiLink to="state.pointer" />. The core loop
          never waits on the DOM; it strictly consumes the latest available pointer coordinates.
        </Text>
      </TimelineStep>

      <TimelineStep phase="Phase 02: Intent" title="Logic Plugins">
        <Text>
          Plugins with a negative <ApiLink to="priority" /> (e.g., <code>-10</code>) run first.
          These are "Logic Plugins". They read the physical <ApiLink to="state.pointer" /> and
          modify the <ApiLink to="state.target" /> destination. For example, a magnetic plugin will
          override <code>state.target</code> to pull the cursor toward a button.
        </Text>
        <ResponsibilityBox title="Rule">
          Logic plugins must never touch the DOM. They only mutate state.
        </ResponsibilityBox>
      </TimelineStep>

      <TimelineStep phase="Phase 03: Physics" title="Interpolation" :active="true">
        <Text>
          The core steps in and calculates the physics. It interpolates between the current physical
          position (<ApiLink to="state.smooth" />) and the intended position (<ApiLink
            to="state.target"
          />) using a frame-rate independent exponential decay algorithm.
        </Text>
      </TimelineStep>

      <TimelineStep phase="Phase 04: Render" title="Visual Plugins" :last="true">
        <Text>
          Plugins with a priority of <code>0</code> or higher run last. These are "Visual Plugins"
          (like Dot, Ring, or Trail). They read the final, interpolated
          <ApiLink to="state.smooth" /> coordinates and apply them to DOM elements via CSS
          <code>transform</code>.
        </Text>
      </TimelineStep>
    </div>

    <div class="mt-12">
      <CodeBlock
        :code="loopCode"
        lang="javascript"
        :clean="true"
        class="border border-zinc-200 mb-6"
      />
      <Callout title="Execution Order Note" class="mb-6">
        Plugins are installed in insertion order (the order <code>.use()</code> is called), but
        their <code>update()</code> hooks run sorted by their <code>priority</code> number on every
        frame. A logic plugin modifying <code>state.target</code> should always have a lower
        (negative) priority than visual plugins reading <code>state.smooth</code>.
      </Callout>
    </div>

    <!-- DOM Firewall -->
    <SectionDivider size="lg" id="dom-firewall">
      <SectionHeader :level="2"> The DOM Firewall </SectionHeader>
      <Text class="mb-2">
        <strong>“DOM Firewall”</strong> is the principle that all DOM‑scraping must happen at
        hover‑start, never inside the animation loop. Querying the DOM (like calling
        <code>getBoundingClientRect</code>) during a <code>requestAnimationFrame</code> loop causes
        severe layout thrashing. Supermouse enforces this by caching metadata the moment a hover
        begins.
      </Text>

      <SectionHeader :level="3" class="mt-8 mb-4">Registering Hover Targets</SectionHeader>
      <Text class="mb-4">
        For the core to know when to scrape data, your plugin must declare what CSS selectors it
        cares about. You do this in your plugin's <code>install</code> method using
        <ApiLink to="registerHoverTarget" />.
      </Text>
      <CodeBlock :code="hoverRegisterCode" lang="typescript" class="mb-6" />
      <Text class="mb-4">
        Calling <code>registerHoverTarget</code> does two critical things under the hood:
      </Text>
      <ul class="list-disc list-inside space-y-2 text-sm text-zinc-700 mb-8 pl-4">
        <li>
          It adds the selector to the internal list used for
          <code>element.closest(selectors)</code> detection to trigger hover states.
        </li>
        <li>
          It injects a global stylesheet (e.g.,
          <code>.supermouse-scope-0 [data-my-plugin] { cursor: none !important; }</code>) to hide
          the native cursor.
        </li>
      </ul>

      <SectionHeader :level="3" class="mt-8 mb-4"
        >Hover Detection & <code>closest()</code></SectionHeader
      >
      <Text class="mb-4">
        Internally, all registered hover selectors are joined into a single string (e.g.
        <code>"a, button, [data-supermouse-stick]"</code>). This string is passed to
        <code>element.closest(selectors)</code>, which finds the
        <strong>nearest ancestor</strong> (including self) that matches <em>any</em> of the
        selectors.
      </Text>
      <Callout title="Compound Selectors Warning" class="mb-6">
        If you register a compound selector like <code>[data-hover] a</code>,
        <code>closest()</code> will match an ancestor that satisfies the full rule. It does
        <strong>not</strong> match the innermost <code>a</code> alone unless it also satisfies the
        selector. Prefer simple selectors or register multiple individual selectors.
      </Callout>
      <CodeBlock :code="closestExampleCode" lang="html" :clean="true" class="mb-8" />
    </SectionDivider>

    <!-- Interaction State Resolution -->
    <SectionDivider size="lg" id="interaction-resolution">
      <SectionHeader :level="2"> Interaction State Resolution </SectionHeader>
      <Text class="mb-4">
        When the user hovers over a registered element, the engine evaluates properties in the
        following priority order (highest to lowest), merging them into a single flat object stored
        at <code>state.interaction</code>:
      </Text>
      <ol class="list-decimal list-inside space-y-2 text-sm text-zinc-700 mb-6 pl-4">
        <li>
          <strong>Custom <code>resolveInteraction()</code> function:</strong> User-provided custom
          logic.
        </li>
        <li>
          <strong>Per-element <code>data-supermouse-*</code> attributes:</strong> HTML overrides on
          specific nodes.
        </li>
        <li>
          <strong>CSS selector rules:</strong> Global mappings defined in
          <code>options.rules</code>.
        </li>
      </ol>
      <Text class="mb-4">
        <strong>Parsing behavior:</strong> The prefix (<code>data-supermouse-</code> by default) is
        stripped, and keys are camelCased (<code>data-supermouse-my-key</code> becomes
        <code>interaction.myKey</code>). Empty attributes like
        <code>data-supermouse-stick</code> resolve to boolean <code>true</code>.
      </Text>
      <CodeBlock :code="customResolverCode" lang="typescript" :clean="true" class="mt-6" />
    </SectionDivider>

    <!-- State & Plugin Coordination -->
    <SectionDivider size="lg" id="shared-state">
      <SectionHeader :level="2"> State & Plugin Coordination </SectionHeader>
      <Text class="mb-6">
        Plugins are isolated by design. They do not import or call methods on each other. Instead,
        they coordinate entirely by reading and writing to the central
        <ApiLink to="MouseState" /> object.
      </Text>

      <SectionHeader :level="3" class="mt-8 mb-4">The Shape State Contract</SectionHeader>
      <Text class="mb-4">
        <code>state.shape</code> is a read-mostly cache for the current cursor geometry (width,
        height, borderRadius). It is intended to be:
      </Text>
      <ul class="list-disc list-inside space-y-2 text-sm text-zinc-700 mb-6 pl-4">
        <li>
          <strong>Written by one logic plugin</strong> per context (e.g., a "stick" plugin that
          computes the element's rect) early in the pipeline.
        </li>
        <li>
          <strong>Read by visual plugins</strong> (ring, morph) to avoid redundant
          <code>getBoundingClientRect</code> calls.
        </li>
        <li><strong>Set back to null</strong> when the condition that produced the shape ends.</li>
      </ul>
      <Callout title="Coordination Warning" class="mb-6">
        Because plugins run in isolation, if multiple logic plugins attempt to write to
        <code>state.shape</code> simultaneously, the one with the higher priority will overwrite the
        other, leading to visual flickering or "tearing". To avoid conflicts, check
        <code>if (!app.state.shape)</code> before writing from a lower-priority plugin.
      </Callout>

      <SectionHeader :level="3" class="mt-10 mb-4">Velocity & Angle Semantics</SectionHeader>
      <Text class="mb-4">
        It is a common misconception that <code>state.velocity</code> represents the true physical
        speed of the user's mouse. It does not. As seen in the loop pipeline above,
        <code>velocity</code> is derived directly from the mathematical difference between the
        <strong>target</strong> and the <strong>smooth</strong> position.
        <code>state.angle</code> is the direction (in degrees) of that same tracking error vector,
        computed via <code>atan2(velocity.y, velocity.x)</code>.
      </Text>
      <CodeBlock
        code="velocity.x = target.x - smooth.x
velocity.y = target.y - smooth.y
angle = atan2(velocity.y, velocity.x) * (180 / PI)"
        lang="javascript"
        :clean="true"
        class="border border-zinc-200 mb-6"
      />
      <Text class="mb-4">
        This makes <code>velocity</code> a vector representing the
        <strong>spring tracking error</strong> (or distance to destination). This is highly useful
        for squishy, organic animations where you want the cursor to stretch based on how far behind
        it is.
      </Text>
      <Text class="mb-4">
        If your plugin specifically requires the raw pixel delta per frame (true mouse speed), you
        must track it manually against the un-smoothed <ApiLink to="state.pointer" />:
      </Text>
      <CodeBlock :code="trueVelocityCode" lang="typescript" />
    </SectionDivider>

    <!-- Utilities & Helpers -->
    <SectionDivider size="lg" id="utilities">
      <SectionHeader :level="2"> Utilities & Helpers </SectionHeader>
      <SectionHeader :level="3" class="mt-8 mb-4"
        ><code>ValueOrGetter&lt;T&gt;</code></SectionHeader
      >
      <Text class="mb-4">
        Many plugin options accept either a static value or a reactive function
        <code>(state: MouseState) =&gt; T</code>. The core library provides a
        <code>normalize</code> helper to easily evaluate these inside your
        <code>update</code> hooks:
      </Text>
      <CodeBlock :code="valueOrGetterCode" lang="typescript" class="mb-6" />
    </SectionDivider>

    <!-- Lifecycle & Error Handling -->
    <SectionDivider size="lg" id="lifecycle">
      <SectionHeader :level="2"> Lifecycle & Error Handling </SectionHeader>

      <SectionHeader :level="3" class="mt-8 mb-4">Native Cursor Visibility Control</SectionHeader>
      <Text class="mb-4"> Three layers control whether the real cursor is shown or hidden: </Text>
      <ol class="list-decimal list-inside space-y-2 text-sm text-zinc-700 mb-6 pl-4">
        <li>
          <strong>Global <code>options.hideCursor</code>:</strong> If false, the native cursor is
          never hidden.
        </li>
        <li>
          <strong>Automatic detection:</strong> Based on <code>state.isNative</code> (e.g. hovering
          over native text inputs).
        </li>
        <li>
          <strong>Forced override:</strong> Using
          <code>app.setNativeCursor("hide" | "show" | "auto")</code> to bypass automatic logic.
        </li>
      </ol>
      <Callout title="CSS Scoping Mechanism" class="mb-6">
        When hiding the cursor automatically, Supermouse injects
        <code>cursor: none !important</code> scoped with a generated class (e.g.
        <code>.supermouse-scope-0</code>). Be careful: do <strong>not</strong> pass selectors that
        start with combinators (<code>&gt;</code>, <code>+</code>, <code>~</code>), as prepending a
        class to them results in invalid or unintended CSS scoping.
        <div class="mt-4">
          <CodeBlock :code="scopingBadGood" lang="text" :clean="true" />
        </div>
      </Callout>

      <SectionHeader :level="3" class="mt-8 mb-4"
        >Execution Flags (<code>enableTouch</code> & <code>autoStart</code>)</SectionHeader
      >
      <ul class="list-disc list-inside space-y-2 text-sm text-zinc-700 mb-6 pl-4">
        <li>
          <strong><code>enableTouch</code> (default: <code>false</code>):</strong> When true, touch
          events are processed instead of ignored. Experimental.
        </li>
        <li>
          <strong><code>autoStart</code> (default: <code>true</code>):</strong> If false, the
          animation loop will not start until you explicitly call <code>app.start()</code>. Useful
          when waiting for additional setup.
        </li>
      </ul>

      <SectionHeader :level="3" class="mt-8 mb-4">Plugin Error Handling</SectionHeader>
      <Text class="mb-4">
        To prevent a single plugin from crashing the entire pipeline, Supermouse guards plugin
        execution. If a plugin throws an error in its <code>install()</code> or
        <code>update()</code> hooks, the core catches it, disables that specific plugin (<code
          >isEnabled = false</code
        >), logs an error to the console, and attempts to safely run its
        <code>onDisable</code> hook.
      </Text>
      <Callout title="Note" class="mb-6">
        The <code>destroy()</code> lifecycle hook is <strong>not</strong> wrapped in a try‑catch.
        Plugin authors must ensure their cleanup logic is defensive to avoid unhandled exceptions.
      </Callout>
    </SectionDivider>
  </DocsSection>
</template>
