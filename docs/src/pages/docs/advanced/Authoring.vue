
<script setup lang="ts">
import DocsSection from '../../../components/docs/DocsSection.vue';
import CodeBlock from '../../../components/CodeBlock.vue';
import Callout from '../../../components/ui/Callout.vue';

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

const interactionCode = `// ❌ BAD: Layout Thrashing
// Reading DOM properties forces the browser to recalculate layout mid-frame.
// const data = el.getAttribute('data-color');

// ✅ GOOD: State Cache
// The Input system pre-scrapes attributes on mouseover.
// Access is O(1).
const color = app.state.interaction.color; 

if (color) {
  dom.setStyle(el, 'backgroundColor', color);
}`;
</script>

<template>
  <DocsSection label="Advanced" title="Plugin Authoring">
     
     <p class="text-lg text-zinc-600 mb-12 leading-relaxed">
        Plugins are the primary extension mechanism. The core exists solely to coordinate them.
        You can write plugins in two ways: using the <span class="text-black font-bold border-b-2 border-black/10">Raw Interface</span> (full control) or the <span class="text-black font-bold border-b-2 border-black/10">definePlugin Helper</span> (recommended for visuals).
     </p>

     <!-- METHOD 1 -->
     <h3 class="text-2xl font-bold text-zinc-900 mb-6 flex items-center gap-3">
        <span class="w-6 h-6 bg-black text-white text-xs flex items-center justify-center font-mono">A</span>
        The Raw Interface (The Source of Truth)
     </h3>
     <p class="text-zinc-600 mb-6 max-w-2xl leading-relaxed">
        At its simplest, a plugin is just an object with a name and lifecycle methods. You don't <em>need</em> any helpers to write a plugin. Understanding this structure is key for advanced use cases (like plugins that manage multiple elements or canvas contexts).
     </p>
     
     <div class="mb-16">
        <CodeBlock :code="rawVisualCode" title="RawPlugin.ts" />
     </div>

     <!-- METHOD 2 -->
     <h3 class="text-2xl font-bold text-zinc-900 mb-6 flex items-center gap-3">
        <span class="w-6 h-6 bg-black text-white text-xs flex items-center justify-center font-mono">B</span>
        The Helper Strategy (definePlugin)
     </h3>
     <p class="text-zinc-600 mb-6 max-w-2xl leading-relaxed">
        For 90% of visual plugins, you just want to create a single DOM element, style it based on options, and move it. 
        <code>definePlugin</code> creates a standard wrapper that handles the boilerplate.
     </p>

     <div class="mb-8">
        <CodeBlock :code="helperCode" title="SmartSquare.ts" />
     </div>

     <Callout title="What is the 'styles' object?">
        <p class="mb-2">
            The <code>styles</code> property in <code>definePlugin</code> is a declarative map.
            It tells the runtime: <em>"Take the value of <code>options.key</code> and assign it to <code>element.style.property</code> every frame."</em>
        </p>
        <div class="font-mono text-xs bg-white p-4 border border-zinc-200 rounded-sm mt-4 mb-4">
            styles: { opacity: 'opacity' } <span class="text-zinc-400">// maps options.opacity -> style.opacity</span>
        </div>
        <p class="mt-2 text-xs text-zinc-500">
            It is optimized to only touch the DOM if the value actually changes (dirty checking).
        </p>
     </Callout>

     <!-- LOGIC PLUGINS -->
     <h3 class="text-2xl font-bold text-zinc-900 mb-6 flex items-center gap-3 mt-16">
        <span class="w-6 h-6 bg-black text-white text-xs flex items-center justify-center font-mono">C</span>
        Logic Plugins
     </h3>
     <p class="text-zinc-600 mb-6 max-w-2xl leading-relaxed">
        Logic plugins manipulate the cursor's <strong>intent</strong> rather than its appearance. They typically run before visual plugins (negative priority) to modify <code>state.target</code>. They should use the Raw Interface as they rarely need DOM elements.
     </p>

     <div class="mb-16">
        <CodeBlock :code="logicCode" title="Gravity.ts" />
     </div>

     <!-- INTERACTION SYSTEM -->
     <div class="border-t border-zinc-200 pt-12 mb-16">
        <h3 class="text-2xl font-bold text-zinc-900 mb-6 tracking-tight">Handling Interaction</h3>
        <p class="text-zinc-600 mb-6 leading-relaxed">
            Supermouse optimizes DOM access. Do <strong>not</strong> query the DOM or read attributes inside the <code>update</code> loop. It causes forced reflows and kills 120fps performance.
        </p>
        <p class="text-zinc-600 mb-6 leading-relaxed">
            Instead, read from <code>app.state.interaction</code>. The Input system automatically populates this object with any <code>data-supermouse-*</code> attributes found on the hovered element.
        </p>
        <CodeBlock :code="interactionCode" lang="javascript" />
     </div>

     <!-- LIFECYCLE -->
     <h3 class="text-2xl font-bold text-zinc-900 mb-8 tracking-tight">Lifecycle Hooks</h3>
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
