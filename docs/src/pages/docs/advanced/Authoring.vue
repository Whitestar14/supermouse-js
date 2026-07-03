<script setup lang="ts">
import DocsSection from "@/components/docs/DocsSection.vue";
import CodeBlock from "@/components/shared/CodeBlock.vue";
import Callout from "@/components/shared/Callout.vue";
import SectionHeader from "@/components/shared/SectionHeader.vue";
import Text from "@/components/shared/Text.vue";
import ApiLink from "@/components/shared/ApiLink.vue";
import SectionDivider from "@/components/shared/SectionDivider.vue";

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
      app.container.appendChild(el);
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

const interactionStateCode = `// inside update()
const color = app.state.interaction.color;  // O(1) cached read

if (color) {
  el.style.backgroundColor = color;
}`;

const dtExampleCode = `// frame‑rate dependent (bad)
x += (target.x - x) * 0.1;

// frame‑rate independent (good)
import { damp } from '@supermousejs/utils';
x = damp(x, target.x, 12, dt);`;
</script>

<template>
  <DocsSection label="Advanced" title="Plugin Authoring">
    <Text size="lg" class="mb-10">
      Plugins are the primary extension mechanism in Supermouse. The core exists to coordinate them.
      You can write plugins in two ways, using the
      <span class="text-black font-bold border-b-2 border-black/10">definePlugin helper </span>
      (recommended for single-element visual layers) or as a
      <span class="text-black font-bold border-b-2 border-black/10">plain object</span> (for full
      control). Both produce the same runtime behavior
    </Text>

    <!-- Ownership & Publishing -->
    <SectionDivider size="lg" id="ownership">
      <SectionHeader :level="2">Plugin Ownership & Publishing</SectionHeader>
      <Text class="mb-4">
        Plugins are published <strong>independently</strong>: no pull requests, no namespace
        restriction. Use a descriptive name like <code>supermouse-plugin-xyz</code> or
        <code>@your-scope/supermouse-xyz</code>. The <code>@supermousejs/*</code> org is reserved
        for core runtime, utilities, and reference implementations. Community promotion is optional
        and rare.
      </Text>
    </SectionDivider>

    <!-- Runtime Pipeline -->
    <SectionDivider size="lg" id="pipeline">
      <SectionHeader :level="2">Runtime Model (The Pipeline)</SectionHeader>
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
      <SectionHeader :level="2">Logic vs Visual Plugins</SectionHeader>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
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

      <h3 class="text-lg font-bold mb-2">The <code>state.interaction</code> bus</h3>
      <Text class="mb-3">
        The input system scrapes data attributes once per hover and caches them in
        <ApiLink to="state.interaction"><code>state.interaction</code></ApiLink
        >. This bus broadcasts metadata to all plugins without any DOM calls. Plugins read it for
        contextual styling, behavior flags, or custom logic.
      </Text>
      <CodeBlock :code="interactionStateCode" lang="typescript" :clean="true" />
    </SectionDivider>

    <!-- Lifecycle -->
    <SectionDivider size="lg" id="lifecycle">
      <SectionHeader :level="2">Lifecycle Hooks</SectionHeader>
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm border-collapse mb-6">
          <thead>
            <tr class="border-b border-zinc-200">
              <th class="py-3 px-4 font-mono text-black uppercase text-xs">Hook</th>
              <th class="py-3 px-4 text-xs text-zinc-500">When it runs</th>
            </tr>
          </thead>
          <tbody class="text-zinc-700">
            <tr class="border-b border-zinc-100">
              <td class="py-3 px-4 font-mono"><ApiLink to="install">install(app)</ApiLink></td>
              <td class="py-3 px-4">
                Once, when <ApiLink to="use"><code>app.use()</code></ApiLink> is called
              </td>
            </tr>
            <tr class="border-b border-zinc-100">
              <td class="py-3 px-4 font-mono"><ApiLink to="update">update(app, dt)</ApiLink></td>
              <td class="py-3 px-4">Every animation frame (~60–240 fps)</td>
            </tr>
            <tr class="border-b border-zinc-100">
              <td class="py-3 px-4 font-mono"><ApiLink to="onenable">onEnable(app)</ApiLink></td>
              <td class="py-3 px-4">When enabled via <code>app.enablePlugin()</code></td>
            </tr>
            <tr class="border-b border-zinc-100">
              <td class="py-3 px-4 font-mono"><ApiLink to="ondisable">onDisable(app)</ApiLink></td>
              <td class="py-3 px-4">When disabled via <code>app.disablePlugin()</code></td>
            </tr>
            <tr>
              <td class="py-3 px-4 font-mono">
                <ApiLink to="plugin-destroy">destroy(app)</ApiLink>
              </td>
              <td class="py-3 px-4">On app teardown</td>
            </tr>
          </tbody>
        </table>
      </div>
      <Callout title="Visual plugins: fade out, don't remove">
        When disabled, visual plugins should hide elements (opacity/visibility) rather than removing
        them from the DOM. This avoids expensive re‑creation on re‑enable. Also remember that plugin
        instances are singletons—closures persist across enable/disable cycles, so reset visual
        state explicitly in <code>onEnable</code>/<code>onDisable</code>.
      </Callout>
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

      <h3 class="text-lg font-bold mb-2">Minimal Plugin (Plain Object)</h3>
      <Text class="mb-3">Great for experiments, learning, or custom local effects.</Text>
      <CodeBlock
        title="MinimalPlugin.ts"
        :code="minimalPluginCode"
        lang="typescript"
        class="mb-8"
      />

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
    </SectionDivider>

    <!-- Performance Contract -->
    <SectionDivider size="lg" id="performance-contract">
      <SectionHeader :level="2">Performance Contract (Non‑Negotiable)</SectionHeader>
      <Text class="mb-6">
        Plugins run at 60–240 fps on the main thread. Three rules keep the cursor smooth.
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

      <h3 class="text-lg font-bold mb-2">3. Allocation Discipline</h3>
      <Text class="mb-3">
        Avoid creating objects or arrays every frame. Reuse vectors, do not create DOM elements in
        <code>update</code>, and use CSS transforms (GPU) instead of <code>top</code>/<code
          >left</code
        >
        (CPU).
      </Text>
    </SectionDivider>
  </DocsSection>
</template>
