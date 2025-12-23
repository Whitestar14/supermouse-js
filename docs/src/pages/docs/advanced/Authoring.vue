
<script setup lang="ts">
import DocsSection from '../../../components/docs/DocsSection.vue';
import CodeBlock from '../../../components/CodeBlock.vue';

const helperCode = `import { definePlugin, normalize, dom } from '@supermousejs/utils';

export const MySquare = (options = {}) => {
  // 1. Normalize options (Value or Getter)
  // This allows users to pass static values OR functions
  const getSize = normalize(options.size, 20);
  const getColor = normalize(options.color, 'blue');

  // 2. Use the helper
  return definePlugin({
    name: 'my-square',
    
    // Auto-registers [data-supermouse-square] to hide native cursor
    selector: '[data-supermouse-square]', 

    // Create the DOM element once. 
    // The helper handles appending to app.container and cleanup.
    create: (app) => {
      const el = dom.createActor('div'); // Standard absolute/pointer-events:none div
      return el; 
    },

    // Optional: Auto-map user options to CSS properties
    styles: {
      color: 'backgroundColor' 
    },

    // Run every frame (~60fps)
    update: (app, el, dt) => {
      const size = getSize(app.state);
      const { x, y } = app.state.smooth;
      
      // Use fast DOM setters provided by utils
      dom.setStyle(el, 'width', \`\${size}px\`);
      dom.setStyle(el, 'height', \`\${size}px\`);
      
      // Universal transform setter (handles centering automatically)
      dom.setTransform(el, x, y);
    }
  }, options);
};`;

const rawCode = `// Logic plugins don't need the DOM helper.
// They usually modify state.target to influence movement.

export const Gravity = (intensity = 5) => ({
  name: 'gravity',
  
  // Critical: Negative priority runs BEFORE visual plugins
  priority: -10, 
  
  update(app, dt) {
    // Pull the target down every frame
    app.state.target.y += intensity;
  }
});`;

const interactionCode = `// ❌ BAD: Causes layout thrashing (Read + Write in loop)
// const data = document.querySelector('.hovered')?.getAttribute('data-color');

// ✅ GOOD: Read from pre-parsed cache
// The Input system scrapes data attributes once on mouseover.
const color = app.state.interaction.color; 

if (color) {
  dom.setStyle(el, 'backgroundColor', color);
}`;
</script>

<template>
  <DocsSection label="Advanced" title="Plugin Authoring">
     
     <p class="text-xl text-zinc-900 font-bold mb-8 max-w-3xl leading-tight">
        Plugins are the primary extension mechanism. The core exists solely to coordinate them.
     </p>
     <p class="text-zinc-600 mb-12 max-w-2xl leading-relaxed">
        You can write plugins in two ways: using the <code>definePlugin</code> helper (recommended for visual effects) or as a plain object (recommended for logic modifiers).
     </p>

     <!-- METHOD 1 -->
     <h3 class="text-2xl font-bold text-zinc-900 mb-6 flex items-center gap-3">
        <span class="w-6 h-6 bg-black text-white text-xs flex items-center justify-center font-mono">A</span>
        The Helper Strategy (Visuals)
     </h3>
     <p class="text-zinc-600 mb-6 max-w-2xl">
        Most plugins just need to create a DOM element and move it. The <code>definePlugin</code> utility handles the boilerplate: creating the element, appending it to the container, scoping styles, and cleaning up on destroy.
     </p>
     
     <div class="mb-16">
        <CodeBlock :code="helperCode" title="MySquare.ts" />
     </div>

     <!-- METHOD 2 -->
     <h3 class="text-2xl font-bold text-zinc-900 mb-6 flex items-center gap-3">
        <span class="w-6 h-6 bg-black text-white text-xs flex items-center justify-center font-mono">B</span>
        The Raw API (Logic)
     </h3>
     <p class="text-zinc-600 mb-6 max-w-2xl">
        Logic plugins manipulate the cursor's <strong>intent</strong> rather than its appearance. They typically run before visual plugins (negative priority) to modify <code>state.target</code>.
     </p>

     <div class="mb-16">
        <CodeBlock :code="rawCode" title="Gravity.ts" />
     </div>

     <!-- INTERACTION SYSTEM -->
     <div class="border-t border-zinc-200 pt-12 mb-16">
        <h3 class="text-xl font-bold text-zinc-900 mb-6">Handling Interaction</h3>
        <p class="text-zinc-600 mb-6 leading-relaxed">
            Supermouse optimizes DOM access. Do <strong>not</strong> query the DOM or read attributes inside the <code>update</code> loop. It causes forced reflows and kills 120fps performance.
        </p>
        <p class="text-zinc-600 mb-6 leading-relaxed">
            Instead, read from <code>app.state.interaction</code>. The Input system automatically populates this object with any <code>data-supermouse-*</code> attributes found on the hovered element.
        </p>
        <CodeBlock :code="interactionCode" lang="javascript" />
     </div>

     <!-- LIFECYCLE -->
     <h3 class="text-xl font-bold text-zinc-900 mb-8">Lifecycle Hooks</h3>
     <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-zinc-200 border border-zinc-200 mb-16">
        <div class="bg-white p-6">
            <strong class="font-mono text-xs text-black uppercase tracking-widest block mb-2">install(app)</strong>
            <p class="text-sm text-zinc-600">Runs once when <code>app.use()</code> is called. Setup your DOM and listeners here.</p>
        </div>
        <div class="bg-white p-6">
            <strong class="font-mono text-xs text-black uppercase tracking-widest block mb-2">update(app, dt)</strong>
            <p class="text-sm text-zinc-600">Runs every frame via requestAnimationFrame. Keep this function extremely hot-path optimized.</p>
        </div>
        <div class="bg-white p-6">
            <strong class="font-mono text-xs text-zinc-400 uppercase tracking-widest block mb-2">destroy(app)</strong>
            <p class="text-sm text-zinc-600">Runs when the app is destroyed. Remove elements and unbind listeners.</p>
        </div>
        <div class="bg-white p-6">
            <strong class="font-mono text-xs text-zinc-400 uppercase tracking-widest block mb-2">onEnable(app)</strong>
            <p class="text-sm text-zinc-600">Runs when <code>enablePlugin</code> is called. Restore visibility (opacity: 1).</p>
        </div>
        <div class="bg-white p-6">
            <strong class="font-mono text-xs text-zinc-400 uppercase tracking-widest block mb-2">onDisable(app)</strong>
            <p class="text-sm text-zinc-600">Runs when <code>disablePlugin</code> is called. Hide visuals (opacity: 0). Do not destroy DOM.</p>
        </div>
     </div>

     <!-- PERFORMANCE CONTRACT -->
     <div class="bg-zinc-900 text-zinc-400 p-8 border border-zinc-900">
        <h3 class="text-white font-bold text-lg mb-6">The Performance Contract</h3>
        <ul class="space-y-4 font-mono text-xs">
            <li class="flex gap-4">
                <span class="text-zinc-500 font-bold">01.</span>
                <span>Do not create/destroy DOM elements in `update`. Use object pooling or CSS opacity.</span>
            </li>
            <li class="flex gap-4">
                <span class="text-zinc-500 font-bold">02.</span>
                <span>Do not use `getBoundingClientRect` or `getComputedStyle` in `update`.</span>
            </li>
            <li class="flex gap-4">
                <span class="text-zinc-500 font-bold">03.</span>
                <span>Use `transform: translate3d()` for positioning. Never `top/left`.</span>
            </li>
            <li class="flex gap-4">
                <span class="text-white font-bold">04.</span>
                <span>Respect `app.state.reducedMotion`. If true, disable animations or huge movements.</span>
            </li>
        </ul>
     </div>

  </DocsSection>
</template>
