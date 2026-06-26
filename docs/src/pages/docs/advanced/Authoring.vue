<script setup lang="ts">
import DocsSection from "@/components/docs/DocsSection.vue";
import CodeBlock from "@/components/shared/CodeBlock.vue";
import Callout from "@/components/shared/Callout.vue";
import SectionHeader from "@/components/shared/SectionHeader.vue";
import Text from "@/components/shared/Text.vue";
import ApiLink from "@/components/shared/ApiLink.vue";

const rawVisualCode = `// A "Raw" Visual Plugin
// No helpers. Just the lifecycle methods.

export const RawSquare = () => {
  let el: HTMLElement;

  return {
    name: 'raw-square',

    install(app) {
      // 1. Create DOM
      el = document.createElement('div');
      Object.assign(el.style, {
        width: '20px',
        height: '20px',
        backgroundColor: 'red',
        position: 'absolute',
        pointerEvents: 'none' // Critical so it doesn't block clicks
      });

      // 2. Mount
      app.container.appendChild(el);
    },

    update(app) {
      // 3. Render Loop
      const { x, y } = app.state.smooth;
      // Use translate3d for GPU acceleration
      el.style.transform = \`translate3d(\${x}px, \${y}px, 0)\`;
    },

    destroy(app) {
      // 4. Cleanup
      el.remove();
    }
  };
};`;

const helperCode = `import { definePlugin, normalize, dom } from '@supermousejs/utils';

export const SmartSquare = (options = {}) => {
  // Normalize allows users to pass static values ('blue')
  // OR reactive getters (state => state.isHover ? 'red' : 'blue')
  const getSize = normalize(options.size, 20);

  return definePlugin({
    name: 'smart-square',

    // 1. Setup: Create and return the primary element.
    // The helper handles appending to app.container and cleanup.
    create: (app) => {
      // dom.createActor creates a div with absolute position & pointer-events: none
      return dom.createActor('div');
    },

    // 2. Auto-Binding: Map options keys to CSS properties.
    // The helper watches 'options.color' and updates 'el.style.backgroundColor'.
    // If 'options.color' is a function, it re-evaluates it every frame.
    styles: {
      color: 'backgroundColor',
      opacity: 'opacity'
    },

    // 3. Loop: 'el' is passed in automatically.
    update: (app, el, dt) => {
      // Manual updates for things that aren't simple CSS mappings
      const size = getSize(app.state);
      dom.setStyle(el, 'width', \`\${size}px\`);
      dom.setStyle(el, 'height', \`\${size}px\`);

      const { x, y } = app.state.smooth;
      // dom.setTransform handles centering (-50%, -50%) automatically
      dom.setTransform(el, x, y);
    }
  }, options);
};`;

const logicCode = `export const Gravity = (intensity = 5) => ({
  name: 'gravity',

  // Critical: Run BEFORE visual plugins (which are usually priority 0)
  // Logic modifies the 'target'. Visuals read the 'target' (indirectly via smooth).
  priority: -10,

  update(app, dt) {
    // Pull the target down every frame
    app.state.target.y += intensity;
  }
});`;

const interactionCode = `// ❌ BAD: Layout Thrashing (DOM Firewall Violation)
// Reading DOM properties forces the browser to recalculate layout mid-frame.
// const data = el.getAttribute('data-color');

// ✅ GOOD: State Cache (DOM Firewall Adhered)
// The Input system pre-scrapes attributes on mouseover.
// Access is O(1).
const color = app.state.interaction.color;

if (color) {
  dom.setStyle(el, 'backgroundColor', color);
}`;
</script>

<template>
  <DocsSection label="Advanced" title="Plugin Authoring">
    <Text size="lg" class="mb-12">
      Plugins are the primary extension mechanism in Supermouse. The core runner exists solely to
      coordinate them. You can write plugins in two ways: using the
      <span class="text-black font-bold border-b-2 border-black/10">Raw Interface</span> (for full
      control and logic-only utilities) or the
      <span class="text-black font-bold border-b-2 border-black/10">definePlugin Helper</span>
      (recommended for single-element visual layers).
    </Text>

    <!-- METHOD 1 -->
    <SectionHeader :level="2" class="flex items-center gap-3">
      <span class="w-6 h-6 bg-black text-white text-xs flex items-center justify-center font-mono"
        >A</span
      >
      The Raw Interface (The Source of Truth)
    </SectionHeader>
    <Text size="base" class="mb-6 max-w-2xl">
      At its simplest, a plugin is just an object with a unique <code>name</code> and standard
      lifecycle hooks. You don't <em>need</em> any helper functions to author a plugin.
      Understanding this raw structure is crucial for advanced use cases, such as plugins that
      manage multiple DOM elements, coordinate dynamic canvas contexts, or handle logic-only
      operations.
    </Text>

    <div class="mb-16">
      <CodeBlock :code="rawVisualCode" title="RawPlugin.ts" />
    </div>

    <!-- METHOD 2 -->
    <SectionHeader :level="2" class="flex items-center gap-3">
      <span class="w-6 h-6 bg-black text-white text-xs flex items-center justify-center font-mono"
        >B</span
      >
      The Helper Strategy (definePlugin)
    </SectionHeader>
    <Text size="base" class="mb-6 max-w-2xl">
      For 90% of visual plugins, you want to create a single DOM element, dynamically style it based
      on options, and center it on the cursor. The
      <ApiLink to="defineplugin"><code>definePlugin</code></ApiLink> utility provides a standard
      wrapper that handles the lifecycle, DOM mounting, and configuration watch boilerplate for you.
    </Text>

    <div class="mb-8">
      <CodeBlock :code="helperCode" title="SmartSquare.ts" />
    </div>

    <Callout title="What is the 'styles' mapping object?">
      <p class="mb-2">
        The <code>styles</code> property in <code>definePlugin</code> is a declarative map. It tells
        the runtime:
        <em
          >"Take the value of <code>options.key</code> and assign it to
          <code>element.style.property</code> every frame."</em
        >
      </p>
      <div class="font-mono text-xs bg-white p-4 border border-zinc-200 rounded-sm mt-4 mb-4">
        styles: { opacity: 'opacity' }
        <span class="text-zinc-400">// maps options.opacity -> style.opacity</span>
      </div>
      <p class="mt-2 text-xs text-zinc-500">
        It is optimized internally to perform dirty-checking, ensuring style changes only touch the
        DOM if their evaluated value changes.
      </p>
    </Callout>

    <!-- LOGIC PLUGINS -->
    <SectionHeader :level="2" class="flex items-center gap-3 mt-16">
      <span class="w-6 h-6 bg-black text-white text-xs flex items-center justify-center font-mono"
        >C</span
      >
      Logic Plugins
    </SectionHeader>
    <Text size="base" class="mb-6 max-w-2xl">
      Logic plugins manipulate the cursor's <strong>intent</strong> (its destination or bounds)
      rather than its rendering. They typically run before visual plugins (using negative priority)
      to modify <ApiLink to="target"><code>state.target</code></ApiLink
      >. Because they rarely create DOM nodes, they should be written using the Raw Interface.
    </Text>

    <div class="mb-16">
      <CodeBlock :code="logicCode" title="Gravity.ts" />
    </div>

    <!-- INTERACTION SYSTEM -->
    <div class="border-t border-zinc-200 pt-12 mb-16">
      <SectionHeader :level="2"> Handling Interaction </SectionHeader>
      <Text size="base" class="mb-6">
        Supermouse enforces a strict **DOM Firewall** for rendering performance. You should
        **never** query the DOM or read layout properties (such as
        <code>getBoundingClientRect()</code> or <code>getComputedStyle()</code>) inside your
        plugin's <ApiLink to="update"><code>update()</code></ApiLink> loop. Doing so causes
        synchronous layout calculations, known as **Layout Thrashing**, which destroys 120fps+
        smoothness.
      </Text>
      <Text size="base" class="mb-6">
        Instead, read scraped attributes from
        <ApiLink to="state.interaction"><code>state.interaction</code></ApiLink
        >. The core input layer listens for hover changes and pre-scrapes any
        <ApiLink to="data-attributes"><code>data-supermouse-*</code></ApiLink> attributes on the
        hovered target, making them instantly available to your plugin update cycles in an O(1)
        dictionary.
      </Text>
      <CodeBlock :code="interactionCode" lang="javascript" />
    </div>

    <!-- LIFECYCLE -->
    <SectionHeader :level="2" class="mb-8"> Lifecycle Hooks </SectionHeader>
    <div
      class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-zinc-200 border border-zinc-200 mb-16"
    >
      <div class="bg-white p-6">
        <strong class="font-mono text-xs text-black uppercase tracking-widest block mb-2"
          ><ApiLink to="install">install(app)</ApiLink></strong
        >
        <p class="text-sm text-zinc-600">
          Runs once when a plugin is registered via
          <ApiLink to="use"><code>app.use()</code></ApiLink
          >. Create your DOM structures and bind global event listeners here.
        </p>
      </div>
      <div class="bg-white p-6">
        <strong class="font-mono text-xs text-black uppercase tracking-widest block mb-2"
          ><ApiLink to="update">update(app, dt)</ApiLink></strong
        >
        <p class="text-sm text-zinc-600">
          Runs every frame inside the animation loop. Keep this function lean and optimized for
          hot-path rendering.
        </p>
      </div>
      <div class="bg-white p-6">
        <strong class="font-mono text-xs text-black uppercase tracking-widest block mb-2"
          ><ApiLink to="plugin-destroy">destroy(app)</ApiLink></strong
        >
        <p class="text-sm text-zinc-600">
          Runs during runtime teardown or route shifts. Always clean up your created elements and
          unbind any event listeners to prevent memory leaks.
        </p>
      </div>
      <div class="bg-white p-6">
        <strong class="font-mono text-xs text-black uppercase tracking-widest block mb-2"
          ><ApiLink to="onenable">onEnable(app)</ApiLink></strong
        >
        <p class="text-sm text-zinc-600">
          Called when a disabled plugin is re-enabled. Use this hook to restore element opacity or
          visibility.
        </p>
      </div>
      <div class="bg-white p-6">
        <strong class="font-mono text-xs text-black uppercase tracking-widest block mb-2"
          ><ApiLink to="ondisable">onDisable(app)</ApiLink></strong
        >
        <p class="text-sm text-zinc-600">
          Called when a plugin is disabled. Hide your visual elements but keep them in the DOM to
          avoid costly re-creation.
        </p>
      </div>
    </div>

    <!-- PERFORMANCE CONTRACT -->
    <div class="bg-zinc-900 text-zinc-400 p-8 border border-zinc-900">
      <h3 class="text-white font-bold text-lg mb-6">The Performance Contract</h3>
      <ul class="space-y-4 font-mono text-xs">
        <li class="flex gap-4">
          <span class="text-zinc-500 font-bold">01.</span>
          <span
            >Do not create/destroy DOM elements in
            <ApiLink to="update"><code>update()</code></ApiLink
            >. Pre-allocate or reuse elements.</span
          >
        </li>
        <li class="flex gap-4">
          <span class="text-zinc-500 font-bold">02.</span>
          <span
            >Do not read layouts (e.g. `getBoundingClientRect`) in update cycles. Cache values on
            target changes.</span
          >
        </li>
        <li class="flex gap-4">
          <span class="text-zinc-500 font-bold">03.</span>
          <span
            >Use <code>dom.setTransform()</code> for hardware-accelerated 3D transforms. Avoid
            CPU-heavy `top/left` styles.</span
          >
        </li>
        <li class="flex gap-4">
          <span class="text-white font-bold">04.</span>
          <span
            >Respect <ApiLink to="reducedmotion"><code>app.state.reducedMotion</code></ApiLink
            >. When true, disable animation springiness and trails to support screen
            readability.</span
          >
        </li>
      </ul>
    </div>
  </DocsSection>
</template>
