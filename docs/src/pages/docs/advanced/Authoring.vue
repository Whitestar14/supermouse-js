<script setup lang="ts">
import DocsSection from "@/components/docs/DocsSection.vue";
import CodeBlock from "@/components/shared/CodeBlock.vue";
import Callout from "@/components/shared/Callout.vue";
import SectionHeader from "@/components/shared/SectionHeader.vue";
import Text from "@/components/shared/Text.vue";
import ApiLink from "@/components/shared/ApiLink.vue";
import SectionDivider from "@/components/shared/SectionDivider.vue";

const cliScaffoldCode = `pnpm run manage
# Follow the interactive prompts to create a new plugin
# OR run the direct command:
# pnpm run create:plugin <plugin-name>`;

const minimalPluginCode = `import type { SupermousePlugin } from '@supermousejs/core';

export const RedDot = (): SupermousePlugin => {
  let el: HTMLDivElement | null = null;

  return {
    name: 'red-dot',

    install(app) {
      el = document.createElement('div');
      el.style.width = '8px';
      el.style.height = '8px';
      el.style.borderRadius = '50%';
      el.style.background = 'red';
      el.style.position = 'fixed';
      el.style.pointerEvents = 'none';
      app.stage.appendChild(el);
    },

    update(app) {
      if (!el) return;
      const { x, y } = app.state.smooth;
      el.style.transform = \`translate(\${x}px, \${y}px)\`;
    },

    destroy() {
      el?.remove();
    }
  };
};`;

const pluginNameContractCode = `const app = new Supermouse();
app.use(RedDot());
app.use(Ring());
app.use(States({
  default: ['red-dot'],
  states: {
    hover: ['ring']
  }
}));

// Plugin names are part of the runtime contract.
// The strings in States() must match the plugin.name values exactly.`;

const definePluginCode = `import { definePlugin, dom } from '@supermousejs/utils';

export const RedDot = () =>
  definePlugin({
    name: 'red-dot',

    create: () => {
      const el = dom.createCircle(8, 'red');
      return el;
    },

    update: (app, el) => {
      const { x, y } = app.state.smooth;
      dom.setTransform(el, x, y);
    }
  });`;

const logicPluginCode = `export const Gravity = (intensity = 5) => ({
  name: 'gravity',
  priority: -10,    // must run before physics
  update(app) {
    app.state.target.y += intensity;
  }
});`;

const visualPluginCode = `export const Dot = () => ({
  name: 'dot',
  priority: 0,      // runs after physics
  update(app) {
    const { x, y } = app.state.smooth;
    // ... apply to DOM element
  }
});

// or
export const Dot = () =>
  definePlugin({
    name: 'dot',
    update: (app) => {
      const { x, y } = app.state.smooth;
    }
  });`;

const shapeCoordinationCode = `// Stick (logic, priority -10)
update(app) {
  if (isSticky) {
    app.state.shape = { width: 80, height: 40, borderRadius: 8 };
  } else {
    app.state.shape = null;
  }
}

// Ring (visual, priority 0)
update(app) {
  if (app.state.shape) {
    // morph to these dimensions
  } else {
    // stay circular
  }
}`;

const dtExampleCode = `// frame‑rate dependent (bad)
x += (target.x - x) * 0.1;

// frame‑rate independent (good)
import { damp } from '@supermousejs/utils';
x = damp(x, target.x, 12, dt);`;

const interactionCodeDemo = `// 1. App initialization sets global rules
const app = new Supermouse({
  rules: {
    '.btn-danger': { color: 'red' }
  }
});

// 2. HTML can override rules via data attributes
// <button class="btn-danger" data-supermouse-color="orange">Hover</button>

// 3. Plugin reads the flat interaction state without querying DOM
update(app) {
  const color = app.state.interaction.color;
  if (color) {
    el.style.backgroundColor = color;
  }
}`;
</script>

<template>
  <DocsSection label="Advanced" title="Plugin Authoring">
    <Text size="lg" class="mb-10">
      Plugins are the primary extension mechanism in Supermouse. The core runtime is intentionally
      minimal; it simply aggregates input and coordinates an array of plugins.
    </Text>

    <!-- What is a Plugin? -->
    <SectionDivider size="lg" id="what-is-a-plugin">
      <SectionHeader :level="2">What is a Plugin?</SectionHeader>
      <Text class="mb-4">
        At its core, a Supermouse plugin is simply a factory function that returns an object
        containing lifecycle hooks (<code>install</code>, <code>update</code>, <code>destroy</code>,
        etc.). This functional approach ensures that each plugin instance encapsulates its own
        state, avoiding cross-contamination between different cursors on the same page.
      </Text>
      <CodeBlock :code="minimalPluginCode" lang="typescript" :clean="true" class="mb-6" />
      <Text>
        You can write plugins entirely from scratch as plain objects (like above), or you can use
        our <ApiLink to="defineplugin"><code>definePlugin</code></ApiLink> helper which abstracts
        away mounting and unmounting DOM elements for standard visual plugins.
      </Text>
      <Callout title="Plugin names are required" class="mt-6">
        Every plugin should expose a stable <code>name</code> field. That value is how the core
        instance looks up, enables, and disables plugins at runtime. This is especially important
        for state-driven plugins such as <code>States()</code>, where the configured names must
        match the registered plugin names exactly.
      </Callout>
      <CodeBlock :code="pluginNameContractCode" lang="typescript" :clean="true" class="mt-4 mb-6" />
      <Text>
        If a plugin throws during <code>update()</code>, it is removed from the pipeline, its
        destroy and onDisable hooks are called, and an error is logged. A plugin that throws during
        <code>install()</code> is rejected entirely and never added.
      </Text>
    </SectionDivider>

    <!-- Scaffolding Plugins -->
    <SectionDivider size="lg" id="scaffolding">
      <SectionHeader :level="2">Scaffolding Plugins</SectionHeader>
      <Text class="mb-4">
        To streamline plugin development, this repository includes an interactive CLI manager. It
        automatically generates the correct directory structure, <code>package.json</code>, and a
        boilerplate <code>index.ts</code> with the appropriate TypeScript types.
      </Text>
      <CodeBlock :code="cliScaffoldCode" lang="bash" title="Terminal" class="mb-6" />
      <Text>
        The CLI handles symlinking your new plugin into the Playground so you can instantly start
        testing it. When you're ready to publish, the toolchain is fully compatible with our
        <code>changeset</code> automated versioning.
      </Text>
    </SectionDivider>

    <!-- Runtime Pipeline -->
    <SectionDivider size="lg" id="pipeline">
      <SectionHeader :level="2">Runtime Model</SectionHeader>
      <Text class="mb-4">
        Every frame Supermouse runs a fixed pipeline. Understanding this order prevents jitter and
        “tearing”.
      </Text>
      <ol class="list-decimal list-inside space-y-2 text-sm text-zinc-700 mb-6 pl-4">
        <li>
          <strong>Input System</strong> — captures events, writes
          <ApiLink to="state.pointer"><code>state.pointer</code></ApiLink
          >.
        </li>
        <li>
          <strong>Logic Plugins</strong> (<code>priority &lt; 0</code>) — read <code>pointer</code>,
          modify <ApiLink to="state.target"><code>state.target</code></ApiLink
          >.
        </li>
        <li>
          <strong>Core Physics</strong> — interpolates
          <ApiLink to="state.smooth"><code>state.smooth</code></ApiLink> toward <code>target</code>.
        </li>
        <li>
          <strong>Visual Plugins</strong> (<code>priority &ge; 0</code>) — read <code>smooth</code>,
          render to DOM.
        </li>
      </ol>
      <Callout title="Priority & the tearing bug">
        Logic plugins <strong>must</strong> have negative priority (e.g. <code>-10</code>). If a
        logic plugin runs at default <code>0</code>, it interleaves with visual plugins: some
        visuals see the old position, some see the new one. The cursor dot snaps correctly while the
        ring trails for a frame.
        <strong>Always set <code>priority: -10</code> for position‑affecting logic.</strong>
      </Callout>
    </SectionDivider>

    <!-- Logic vs Visual -->
    <SectionDivider size="lg" id="logic-vs-visual">
      <SectionHeader :level="2">Plugin Types</SectionHeader>
      <div class="grid grid-cols-1 gap-8 mt-6">
        <div>
          <h3 class="text-lg font-bold mb-2">Logic Plugin</h3>
          <p class="text-sm text-zinc-600 mb-3">
            Modifies cursor <b>intent</b> (its destination and bounds). They typically run before
            visual plugins using negative priority to modify
            <ApiLink to="state.target"><code>state.target</code></ApiLink
            >. Because they rarely create DOM nodes, they should be written using the raw interface
          </p>
          <CodeBlock :code="logicPluginCode" lang="typescript" :clean="true" />
        </div>
        <div>
          <h3 class="text-lg font-bold mb-2">Visual Plugin</h3>
          <p class="text-sm text-zinc-600 mb-3">
            For 90% of visual plugins, you want to create a single DOM element, dynamically style it
            based on options, and center it on the cursor. The
            <ApiLink to="defineplugin"><code>definePlugin</code></ApiLink> helper is the recommended
            approach. It handles mounting, unmounting, and normalizing static vs reactive options.
          </p>
          <CodeBlock :code="visualPluginCode" lang="typescript" :clean="true" />
        </div>
      </div>
    </SectionDivider>
    <SectionDivider size="lg" id="multi-instance">
      <SectionHeader :level="2"> Advanced Patterns </SectionHeader>

      <Text class="mb-6">
        Some cursor effects need to interact with several DOM elements (for example, a highlight
        that follows the cursor inside different cards) or behave gracefully when the pointer leaves
        the window. The approaches below are not the only way to solve these problems, but they are
        lightweight patterns that have proven effective in real plugins.
      </Text>

      <h3 class="text-lg font-bold mb-2">Working with multiple targets</h3>
      <Text class="mb-4">
        If your plugin must track the cursor across several containers, you need a way to associate
        state with each one. Three common strategies are:
      </Text>
      <ul class="list-disc list-inside space-y-2 text-sm text-zinc-700 mb-6 pl-4">
        <li>
          <strong>Per‑frame querying</strong> – call <code>querySelectorAll</code> every frame and
          use a <code>Map</code> to lazily create state for new containers. This is simple and works
          well for a handful of elements.
        </li>
        <li>
          <strong>Pre‑created pool</strong> – allocate a fixed number of elements in
          <code>install()</code> and decide during <code>update</code> which ones to show. This
          avoids DOM creation in the hot loop and is ideal for particle effects like the
          <strong>Sparkles</strong> plugin, where a single pool of particles serves the entire page.
        </li>
        <li>
          <strong>Static registration</strong> – collect all target elements once in
          <code>install()</code> and reuse the same reference. This is appropriate when the DOM
          structure is known to be stable.
        </li>
      </ul>
      <Text class="mb-6">
        The key insight is to separate <em>what</em> you’re tracking from <em>how</em> you render
        it. The Sparkles plugin, for example, doesn’t know about individual containers at all; it
        simply spawns particles along the pointer’s path. In contrast, a spotlight effect typically
        needs to know which container the cursor is over so it can clamp the highlight correctly.
        Choose the strategy that matches your data requirements.
      </Text>

      <h3 class="text-lg font-bold mb-2">Dealing with the pointer leaving the window</h3>
      <Text class="mb-4">
        When the pointer exits the browser window, Supermouse sets
        <ApiLink to="hasReceivedInput"><code>hasReceivedInput</code></ApiLink> to
        <code>false</code> and resets the smooth position to off‑screen coordinates (<code
          >-100, -100</code
        >). If your plugin blindly renders those coordinates, the effect will jump to the top‑left
        corner of the screen (or container). There are three common ways to avoid that jump:
      </Text>
      <ul class="list-disc list-inside space-y-2 text-sm text-zinc-700 mb-6 pl-4">
        <li>
          <strong>Last‑known position</strong> – keep a copy of the most recent valid local
          coordinates. When the cursor is over a container, update them; when it leaves, use that
          stored value for rendering. This keeps the effect anchored in place as it fades or
          shrinks.
        </li>
        <li>
          <strong>Interpolation along the path</strong> – if you are generating trailing particles
          (like Sparkles), you can stop spawning once <code>hasReceivedInput</code> is false. The
          existing particles continue their independent fade‑out without needing a fixed anchor.
        </li>
        <li>
          <strong>Instantly hide</strong> – for simple cursor‑replacement dots, it’s often
          acceptable to set <code>opacity: 0</code> when <code>hasReceivedInput</code> is false,
          provided you restore it on the first valid move after re‑entry.
        </li>
      </ul>
      <Text class="mb-6">
        The last‑known position approach is particularly useful for effects that expand or contract
        based on hover state, because it allows the shrink animation to play while the effect stays
        at the exact edge point where the cursor left. The Sparkles plugin handles the off‑screen
        case differently: it still runs its particle lifecycle (fade and movement) even when no new
        particles are spawned, so the trail naturally dissipates without jumping.
      </Text>
    </SectionDivider>

    <!-- Native Cursor State -->
    <SectionDivider size="lg" id="native-cursor">
      <SectionHeader :level="2">Native Cursor State</SectionHeader>
      <Text class="mb-4">
        Supermouse automatically detects native controls (inputs, textareas, contenteditable) and
        exposes
        <ApiLink to="state.isNative"><code>state.isNative</code></ApiLink
        >. Plugins should use this to hide custom visuals when the system cursor must take over. The
        fallback is configurable via <code>ignoreOnNative</code> and ensures accessibility is never
        sacrificed for style.
      </Text>
    </SectionDivider>

    <!-- Inter-Plugin Communication (Shared Buses) -->
    <SectionDivider size="lg" id="inter-plugin">
      <SectionHeader :level="2">Inter‑Plugin Communication</SectionHeader>
      <Text class="mb-6">
        Plugins are isolated: they never import each other and have no direct knowledge of one
        another. All coordination happens through shared state buses, specifically
        <ApiLink to="state.shape"><code>state.shape</code></ApiLink> and
        <ApiLink to="state.interaction"><code>state.interaction</code></ApiLink
        >. These act as decoupled channels that let logic plugins publish information that visual
        plugins consume, without any hard coupling.
      </Text>

      <h3 class="text-lg font-bold mb-2">The <code>state.shape</code> bus</h3>
      <Text class="mb-3">
        Logic plugins compute element geometry and write it to
        <ApiLink to="state.shape"><code>state.shape</code></ApiLink
        >; visual plugins react to it. For example, a Stick plugin measures a target and a Ring
        plugin morphs to match. This bus allows you to swap the visual plugin (e.g. use a Square
        cursor instead of Ring) without touching the sticky logic.
      </Text>
      <CodeBlock :code="shapeCoordinationCode" lang="typescript" :clean="true" class="mb-8" />

      <h3 class="text-lg font-bold mb-2" id="state-interaction">
        The <code>state.interaction</code> bus
      </h3>
      <Text class="mb-3">
        The <code>state.interaction</code> object is a reactive dictionary populated automatically
        by the core input system whenever a hover occurs. It acts as the primary "bus" that
        broadcasts context about the hovered element to all plugins without any expensive DOM calls.
      </Text>
      <Text class="mb-3"> There are two main ways the input system populates this object: </Text>
      <ol class="list-decimal list-inside space-y-2 text-sm text-zinc-700 mb-6 pl-4">
        <li>
          <strong>CSS Selector Rules:</strong> Configured in the Supermouse constructor via
          <code>options.rules</code>. These apply a static state object whenever the pointer is over
          an element matching the CSS selector.
        </li>
        <li>
          <strong>Data Attributes:</strong> Elements can override or supply state inline using
          <code>data-[prefix]-*</code> attributes (where prefix defaults to
          <code>supermouse</code>). Keys are camel-cased and values are coerced automatically.
        </li>
      </ol>
      <Callout title="Resolution Priority" class="mb-6">
        Data attributes on the hovered node will <b>override</b> the values defined in
        <code>options.rules</code>. This is incredibly powerful as it allows you to configure global
        fallback behaviors via CSS selectors and override them for specific DOM nodes via HTML
        attributes.
      </Callout>
      <Text class="mb-3">
        Inside a plugin's <code>update</code> loop, you simply read from the bus. Because
        <code>state.interaction</code> is completely flat, you get O(1) cached reads:
      </Text>
      <CodeBlock :code="interactionCodeDemo" lang="typescript" :clean="true" />
    </SectionDivider>

    <!-- Writing Plugins -->
    <SectionDivider size="lg" id="writing-plugins">
      <SectionHeader :level="2">Writing Plugins</SectionHeader>
      <Text class="mb-6">
        Plugins can be written as a plain object or with the
        <ApiLink to="defineplugin"><code>definePlugin</code></ApiLink> helper. Both produce the same
        runtime behaviour. <strong>Use factories (functions returning the plugin)</strong> to avoid
        cross‑instance state leakage.
      </Text>
      <Callout title="A few practical guardrails" class="mb-6">
        If you are authoring a reusable plugin, prefer
        <ApiLink to="defineplugin"><code>definePlugin</code></ApiLink> for a single visual root, but
        switch to a plain object when you need multiple roots, custom fragments, logic-only
        behavior, or specialized lifecycle control. Keep the plugin-name contract stable, use
        <ApiLink to="state.interaction"><code>state.interaction</code></ApiLink> for hover context,
        and let <ApiLink to="normalize"><code>normalize</code></ApiLink> resolve user options once
        instead of branching inside the hot loop.
      </Callout>

      <h3 class="text-lg font-bold mb-2">Plain Object Format</h3>
      <Text class="mb-3"
        >Great for logic plugins, experiments, learning, or multi-element visual effects.</Text
      >
      <Text class="mb-8"
        ><em
          >See
          <router-link to="#what-is-a-plugin" class="underline font-bold hover:text-black"
            >What is a Plugin?</router-link
          >
          for an example of the plain object format.</em
        ></Text
      >

      <h3 class="text-lg font-bold mb-2">Packaged Plugin (<code>definePlugin</code>)</h3>
      <Text class="mb-3">
        Recommended for reusable or published plugins.
        <strong><code>definePlugin</code> assumes a single visual root.</strong> If you need
        multiple elements or custom mounting, use a plain object.
        <ApiLink to="normalize"><code>normalize</code></ApiLink> (detailed in the API Reference)
        unifies static values and reactive getters so you always receive a plain resolved value.
      </Text>
      <CodeBlock title="RedDot.ts" :code="definePluginCode" lang="typescript" class="mb-8" />

      <h3 class="text-lg font-bold mb-2">When to use which?</h3>
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm border-collapse">
          <thead>
            <tr class="border-b border-zinc-200">
              <th class="py-3 px-4 font-mono text-black uppercase text-xs">Use case</th>
              <th class="py-3 px-4 text-xs text-zinc-500">Approach</th>
            </tr>
          </thead>
          <tbody class="text-zinc-700">
            <tr class="border-b border-zinc-100">
              <td class="py-3 px-4">Quick experiment</td>
              <td class="py-3 px-4">Plain object</td>
            </tr>
            <tr class="border-b border-zinc-100">
              <td class="py-3 px-4">Learning the lifecycle</td>
              <td class="py-3 px-4">Plain object</td>
            </tr>
            <tr class="border-b border-zinc-100">
              <td class="py-3 px-4">npm package</td>
              <td class="py-3 px-4"><code>definePlugin</code></td>
            </tr>
            <tr class="border-b border-zinc-100">
              <td class="py-3 px-4">Configurable visual plugin</td>
              <td class="py-3 px-4"><code>definePlugin</code></td>
            </tr>
            <tr class="border-b border-zinc-100">
              <td class="py-3 px-4">Multi‑root / custom mounting</td>
              <td class="py-3 px-4">Plain object</td>
            </tr>
            <tr>
              <td class="py-3 px-4">Logic‑only plugin</td>
              <td class="py-3 px-4">Plain object</td>
            </tr>
          </tbody>
        </table>
      </div>
      <Callout title="Options are static" class="mt-6">
        Plugin options are read at construction time. Changing them later won't automatically update
        behaviour unless you design for it. <strong>Document this clearly for your users.</strong>
      </Callout>
      <Callout title="Edge cases to watch for" class="mt-6">
        Some of the most common failures are: using zero or positive priority on a logic plugin,
        reading DOM geometry in <code>update()</code>, re-creating DOM nodes on enable/disable, and
        letting <code>States()</code> refer to plugin names that do not match the runtime
        <code>plugin.name</code> values exactly. If a plugin misbehaves only in production, run
        <ApiLink to="doctor"><code>doctor()</code></ApiLink> from the browser console to surface the
        usual configuration mistakes quickly.
      </Callout>
    </SectionDivider>

    <!-- Performance Best Practices -->
    <SectionDivider size="lg" id="performance">
      <SectionHeader :level="2">Performance Best Practices</SectionHeader>
      <Text class="mb-6">
        Plugins run at 60–240 fps on the main thread. Keep these three rules in mind to maintain a
        smooth framerate.
      </Text>

      <h3 class="text-lg font-bold mb-2">1. The DOM Firewall</h3>
      <Text class="mb-3">
        Never read DOM attributes, layouts (<code>getBoundingClientRect</code>), or computed styles
        inside <code>update()</code>. The input system scrapes and caches metadata in
        <ApiLink to="state.interaction"><code>state.interaction</code></ApiLink
        >. Use it instead.
      </Text>

      <h3 class="text-lg font-bold mb-2">2. Frame‑Rate Independence</h3>
      <Text class="mb-3">
        Different displays have different refresh rates. Use the <code>dt</code> (delta time)
        argument or the provided math helpers (<code>damp</code>, <code>lerp</code>). Never
        hard‑code per‑frame increments.
      </Text>
      <CodeBlock :code="dtExampleCode" lang="typescript" :clean="true" class="mb-8" />

      <h3 class="text-lg font-bold mb-2">3. Memory Management</h3>
      <Text class="mb-3">
        Avoid creating objects or arrays every frame. Reuse vectors, do not create DOM elements in
        <code>update</code>, and prefer CSS transforms over <code>top</code>/<code>left</code>
        layout changes to keep the rendering on the GPU.
      </Text>
    </SectionDivider>

    <!-- Ownership & Publishing -->
    <SectionDivider size="lg" id="ownership">
      <SectionHeader :level="2">Plugin Publishing</SectionHeader>
      <Text class="mb-4">
        You are free to publish your plugins to npm under your own namespace, such as
        <code>supermouse-plugin-xyz</code> or <code>@your-scope/supermouse-xyz</code>. The
        <code>@supermousejs/*</code> scope is strictly reserved for official plugins and the core
        engine.
      </Text>
    </SectionDivider>
  </DocsSection>
</template>
