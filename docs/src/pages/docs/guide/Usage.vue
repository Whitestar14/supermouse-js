
<script setup lang="ts">
import DocsSection from '../../../components/docs/DocsSection.vue';
import CodeBlock from '../../../components/CodeBlock.vue';
import Callout from '../../../components/ui/Callout.vue';

const initCode = `import { Supermouse } from '@supermousejs/core';
import { Dot } from '@supermousejs/dot';
import { Ring } from '@supermousejs/ring';

const app = new Supermouse({
  // Register plugins declaratively
  plugins: [
    Dot({ size: 8 }),
    Ring({ size: 24 })
  ],

  // Physics (0.01 - 1.0)
  smoothness: 0.15,

  // Native Cursor Hiding
  hideCursor: true,

  // Native Fallback Strategy ('auto' | 'tag' | 'css')
  // 'tag' checks HTML tags (fastest). 'auto' checks CSS too (safer).
  ignoreOnNative: 'tag'
});`;

const globalUsageCode = `// When using a CDN, all standard exports are on the global Supermouse object
const app = new Supermouse({ smoothness: 0.1 });
app.use(Supermouse.Dot());
app.use(Supermouse.Ring());`;

const chainingCode = `// You can also add plugins imperatively at runtime
// This is useful for conditional loading or lazy-loaded effects.

if (prefersComplexEffects) {
  app.use(Sparkles({ color: 'gold' }));
}`;

const interactionCode = `// 1. Configure Rules
const app = new Supermouse({
  rules: {
    // Selector : State Object
    'button': { magnetic: true },
    'a': { color: '#00ff00' }
  }
});

// 2. Plugins consume the State
// The "Magnetic" plugin looks for app.state.interaction.magnetic
app.use(Magnetic());

// The "Dot" plugin looks for app.state.interaction.color
app.use(Dot());`;

const htmlCode = `<!-- You can also define state directly in HTML -->
<button data-supermouse-magnetic="true" data-supermouse-color="red">
  Complex Interaction
</button>`;

const containerCode = `// 1. Target a specific element
const modal = document.getElementById('my-modal');

const app = new Supermouse({
  container: modal,
  hideCursor: true
});

// The custom cursor will now exist INSIDE #my-modal
// Coordinates are automatically relative to the container.
// CSS injection is scoped to this container.`;

const visibilityCode = `// Force SHOW native cursor (e.g. dragging, specialized UI)
app.setCursor('auto');

// Force HIDE native cursor (override auto-detection)
app.setCursor('none');

// Reset to automatic behavior (based on ignoreOnNative / isHover)
app.setCursor(null);`;

const cleanupCode = `// React / Vue / Svelte
// You MUST destroy the instance to stop the RequestAnimationFrame loop
// and remove event listeners.

onUnmounted(() => {
  app.destroy();
});`;
</script>

<template>
  <DocsSection label="Guide" title="Usage">
    
    <p class="text-lg text-zinc-600 mb-12 leading-relaxed">
      Supermouse is a singleton runtime. It manages the animation loop, input listeners, and the plugin pipeline. You initialize it once when your application mounts.
    </p>

    <!-- Configuration -->
    <h3 class="text-2xl font-bold text-zinc-900 tracking-tight mb-6">1. Configuration</h3>
    <p class="text-zinc-600 mb-6">
      The constructor accepts a <code>SupermouseOptions</code> object. You can pass plugins directly in the configuration array.
    </p>
    <div class="mb-8">
        <CodeBlock :code="initCode" title="main.ts (ES Modules)" lang="typescript" class="border border-zinc-200" />
    </div>

    <Callout title="Global Usage">
        If you are using the <strong>CDN bundle</strong>, the core and standard plugins are available on the global <code>window.Supermouse</code> object.
        <div class="mt-4">
            <CodeBlock :code="globalUsageCode" lang="javascript" :clean="true" />
        </div>
    </Callout>

    <!-- Plugins -->
    <h3 class="text-2xl font-bold text-zinc-900 tracking-tight mb-6 mt-16">2. Runtime Registration</h3>
    <p class="text-zinc-600 mb-6">
      If you need to add plugins later (e.g. lazy loading), you can use the chainable <code>use()</code> method.
    </p>
    <div class="mb-12">
        <CodeBlock :code="chainingCode" title="main.ts" lang="typescript" class="border border-zinc-200" />
    </div>

    <!-- Interaction -->
    <h3 class="text-2xl font-bold text-zinc-900 tracking-tight mb-6">3. Defining Interactions</h3>
    
    <p class="text-zinc-600 mb-6 leading-relaxed">
        Interaction in Supermouse is completely data-driven. The Core does not know what "magnetic" means. It simply parses metadata (State) from the DOM and exposes it to plugins.
    </p>

    <div class="bg-zinc-50 border-l-4 border-zinc-900 p-6 mb-8">
        <strong class="block text-zinc-900 text-sm font-bold mb-2">The Concept</strong>
        <p class="text-zinc-600 text-sm leading-relaxed">
            The Input system scrapes <code>rules</code> or <code>data-attributes</code> to populate <code>app.state.interaction</code>. 
            <br> Plugins like <strong>Magnetic</strong> or <strong>Dot</strong> read this state to decide what to do.
        </p>
    </div>

    <div class="grid grid-cols-1 gap-8 mb-12">
        <div>
            <h4 class="font-bold text-zinc-900 mb-4 text-sm uppercase tracking-widest">Global Rules (Recommended)</h4>
            <p class="text-zinc-600 text-sm mb-4">
                Map CSS selectors to state objects. This keeps your HTML clean.
            </p>
            <CodeBlock :code="interactionCode" title="main.ts" lang="typescript" class="border border-zinc-200" />
        </div>
        
        <div>
            <h4 class="font-bold text-zinc-900 mb-4 text-sm uppercase tracking-widest">HTML Overrides</h4>
            <p class="text-zinc-600 text-sm mb-4">
                Use <code>data-supermouse-*</code> attributes for one-off overrides. These take precedence over rules.
            </p>
            <CodeBlock :code="htmlCode" title="index.html" lang="html" class="border border-zinc-200" />
        </div>
    </div>

    <!-- Scoped Containers -->
    <h3 class="text-2xl font-bold text-zinc-900 tracking-tight mb-6">4. Scoped Containers</h3>
    <p class="text-zinc-600 mb-6 max-w-2xl leading-relaxed">
      By default, Supermouse appends to <code>document.body</code> and tracks the window. 
      You can restrict the cursor to a specific div (e.g., a modal, a canvas wrapper, or a specific section of your site) using the <code>container</code> option.
    </p>
    <div class="mb-12">
        <CodeBlock :code="containerCode" title="Scoped Usage" lang="typescript" class="border border-zinc-200" />
    </div>

    <!-- Manual Visibility -->
    <h3 class="text-2xl font-bold text-zinc-900 tracking-tight mb-6">5. Manual Visibility</h3>
    <p class="text-zinc-600 mb-6 leading-relaxed">
      Sometimes you need strict control over the cursor visibility (e.g., drag and drop operations, custom modals, or games). Use <code>setCursor</code> to override the internal auto-detection.
    </p>
    <div class="mb-12">
        <CodeBlock :code="visibilityCode" lang="typescript" class="border border-zinc-200" />
    </div>

    <!-- Cleanup -->
    <h3 class="text-2xl font-bold text-zinc-900 tracking-tight mb-6">6. Cleanup</h3>
    <div class="p-6 bg-zinc-50 border border-zinc-200 border-l-4 border-l-black mb-6">
        <strong class="block text-zinc-900 font-bold mb-2">Important for SPA Navigation</strong>
        <p class="text-sm text-zinc-600">
            If your app navigates between pages that mount/unmount the cursor (or if you use Hot Module Replacement), you must call destroy to prevent memory leaks and duplicate cursors.
        </p>
    </div>
    <div class="mb-12">
        <CodeBlock :code="cleanupCode" lang="typescript" class="border border-zinc-200" />
    </div>

  </DocsSection>
</template>
