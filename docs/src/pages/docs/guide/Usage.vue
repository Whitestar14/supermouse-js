
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
  ignoreOnNative: true,
  
  // Custom Hover Rules
  rules: {
    'a, button': { magnetic: true },
    '.card': { color: 'red' }
  }
});`;

const chainingCode = `import { Dot } from '@supermousejs/dot';
import { Ring } from '@supermousejs/ring';

// Chainable API
app
  .use(Dot({ size: 8 }))
  .use(Ring({ size: 30 }));`;

const rulesCode = `// Option A: HTML Attributes (Ad-hoc)
<button data-supermouse-magnetic="0.5">Snap Me</button>

// Option B: Centralized Config (Recommended)
const app = new Supermouse({
  rules: {
    // Selector : State Object
    '[data-variant="primary"]': { 
       color: '#0000ff',
       magnetic: true 
    },
    'input': { 
       icon: 'text' // Used by SmartIcon plugin
    }
  }
});`;

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
    <p class="text-zinc-600 mb-6">
      Plugins read from <code>app.state.interaction</code> to change behavior (e.g. changing color, sticking to an element). You can populate this state in two ways:
    </p>
    
    <div class="grid grid-cols-1 gap-px bg-zinc-200 border border-zinc-200 mb-12">
        <div class="bg-white p-8">
            <h4 class="font-bold text-zinc-900 mb-4 font-mono text-sm uppercase tracking-widest">A. Data Attributes</h4>
            <p class="text-sm text-zinc-600 mb-4">
                Good for quick overrides or CMS-driven content.
            </p>
            <div class="font-mono text-xs bg-zinc-50 p-3 border border-zinc-100 text-purple-700">
                data-supermouse-color="#ff0000"
            </div>
        </div>
        <div class="bg-white p-8">
            <h4 class="font-bold text-zinc-900 mb-4 font-mono text-sm uppercase tracking-widest">B. Global Rules</h4>
            <p class="text-sm text-zinc-600 mb-4">
                Good for keeping your HTML clean and managing design systems.
            </p>
            <div class="font-mono text-xs bg-zinc-50 p-3 border border-zinc-100 text-purple-700">
                rules: { 'button': { magnetic: true } }
            </div>
        </div>
    </div>
    <div class="mb-12">
        <CodeBlock :code="rulesCode" title="Comparison" lang="typescript" class="border border-zinc-200" />
    </div>

    <!-- Cleanup -->
    <h3 class="text-2xl font-bold text-zinc-900 tracking-tight mb-6">4. Cleanup</h3>
    <div class="p-6 bg-zinc-50 border border-zinc-200 border-l-4 border-l-black mb-6">
        <strong class="block text-zinc-900 font-bold mb-2">Important for SPA Navigation</strong>
        <p class="text-sm text-zinc-600">
            If your app navigates between pages that mount/unmount the cursor (or if you use Hot Module Replacement), you must call destroy to prevent memory leaks and duplicate cursors.
        </p>
    </div>
    <div class="mb-12">
        <CodeBlock :code="cleanupCode" lang="typescript" class="border border-zinc-200" />
    </div>

    <div class="p-6 bg-zinc-50 border border-zinc-200 text-sm text-zinc-600">
      <strong class="text-zinc-900 block mb-1">Curious about the internal loop?</strong>
      Check out <router-link to="/docs/advanced/architecture" class="underline decoration-zinc-400 hover:decoration-black text-black font-bold">Core Concepts</router-link> to understand the priority pipeline and physics engine.
    </div>

  </DocsSection>
</template>
