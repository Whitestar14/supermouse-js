
<script setup lang="ts">
import DocsSection from '../../../components/docs/DocsSection.vue';
import CodeBlock from '../../../components/CodeBlock.vue';

const initCode = `const app = new Supermouse({
  // Motion Physics (0.01 - 1.0)
  // Lower = more lag/floaty. Higher = snappy.
  smoothness: 0.15,

  // Native Cursor Hiding
  // Injects scoped CSS to hide the OS cursor on body + interactive elements
  hideCursor: true,

  // Ignore Semantic Elements
  // If true, reverts to native cursor on text inputs and textareas
  ignoreOnNative: true
});`;

const chainingCode = `import { Dot } from '@supermousejs/dot';
import { Ring } from '@supermousejs/ring';

// Chainable API
app
  .use(Dot({ size: 8 }))
  .use(Ring({ size: 30 }));`;

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
  <DocsSection label="Guide" title="Basic Usage">
    
    <p class="text-lg text-zinc-600 mb-12 leading-relaxed">
      Supermouse is a singleton runtime. It manages the animation loop, input listeners, and the plugin pipeline. You initialize it once when your application mounts.
    </p>

    <!-- Configuration -->
    <h3 class="text-2xl font-bold text-zinc-900 tracking-tight mb-6">1. Configuration</h3>
    <p class="text-zinc-600 mb-6">
      The constructor accepts a <code>SupermouseOptions</code> object. These settings control the physics engine and how the library interacts with the DOM.
    </p>
    <div class="mb-12">
        <CodeBlock :code="initCode" title="main.ts" lang="typescript" class="border border-zinc-200" />
    </div>

    <!-- Plugins -->
    <h3 class="text-2xl font-bold text-zinc-900 tracking-tight mb-6">2. Registering Plugins</h3>
    <p class="text-zinc-600 mb-6">
      The core library renders nothing. You must register plugins to see a cursor. The <code>use()</code> method is chainable.
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
