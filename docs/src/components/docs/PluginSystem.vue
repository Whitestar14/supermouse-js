
<script setup lang="ts">
import CodeBlock from '../CodeBlock.vue';
import DocsSection from './DocsSection.vue';

const pluginTemplate = `import type { SupermousePlugin } from '@supermousejs/core';
import { dom, Layers, resolve } from '@supermousejs/core';

export const MyPlugin = (opts = {}): SupermousePlugin => {
  let el: HTMLDivElement;
  return {
    name: 'my-plugin',
    
    install(app) {
      // 1. Create DOM
      el = dom.createDiv();
      el.style.zIndex = Layers.CURSOR;
      app.container.appendChild(el);
      
      // 2. Register special selectors (optional)
      app.registerHoverTarget('[data-my-trigger]');
    },
    
    update(app, deltaTime) {
      // 3. Read state
      const { x, y } = app.state.smooth;
      dom.setTransform(el, x, y);
    },
    
    destroy() { el.remove(); }
  };
};`;
</script>

<template>
  <DocsSection id="plugin-system" label="05. API Reference" title="Plugin System">
     <p class="text-zinc-600 mb-12 max-w-2xl text-lg">
        Plugins are simple objects that hook into the lifecycle. They are the only way to render visuals. 
        Because the Core handles physics, plugins can be extremely lightweight.
     </p>
     
     <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
        <div>
            <h3 class="text-sm font-bold text-zinc-900 uppercase tracking-widest mb-6">Anatomy</h3>
            <CodeBlock :code="pluginTemplate" title="packages/my-plugin/src/index.ts" />
        </div>
        
        <div>
            <h3 class="text-sm font-bold text-zinc-900 uppercase tracking-widest mb-6">State Object</h3>
            <div class="border border-zinc-200 divide-y divide-zinc-200 bg-white">
                <div class="p-4 flex flex-col gap-1">
                    <code class="text-xs font-bold text-purple-600">state.pointer</code>
                    <p class="text-sm text-zinc-600">Raw {x,y} from input events.</p>
                </div>
                <div class="p-4 flex flex-col gap-1">
                    <code class="text-xs font-bold text-purple-600">state.smooth</code>
                    <p class="text-sm text-zinc-600">Interpolated {x,y} (lagged position).</p>
                </div>
                <div class="p-4 flex flex-col gap-1">
                    <code class="text-xs font-bold text-purple-600">state.velocity</code>
                    <p class="text-sm text-zinc-600">Current speed vector.</p>
                </div>
            </div>
        </div>
     </div>

     <div>
        <h3 class="text-sm font-bold text-zinc-900 uppercase tracking-widest mb-6">Data Attributes</h3>
        <p class="text-zinc-600 mb-6 text-sm">Built-in plugins respond to specific HTML attributes.</p>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
           <div class="border border-zinc-200 p-4">
              <code class="text-xs bg-zinc-100 px-2 py-1 mb-2 inline-block font-bold">data-supermouse-color</code>
              <p class="text-xs text-zinc-500">Override color for Dot/Ring.</p>
           </div>
           <div class="border border-zinc-200 p-4">
              <code class="text-xs bg-zinc-100 px-2 py-1 mb-2 inline-block font-bold">data-supermouse-img</code>
              <p class="text-xs text-zinc-500">Image Plugin Source URL.</p>
           </div>
           <div class="border border-zinc-200 p-4">
              <code class="text-xs bg-zinc-100 px-2 py-1 mb-2 inline-block font-bold">data-supermouse-text</code>
              <p class="text-xs text-zinc-500">Text Plugin Content.</p>
           </div>
           <!-- Standardized VETO card -->
           <div class="border border-zinc-200 bg-zinc-50 p-4">
              <code class="text-xs bg-white px-2 py-1 mb-2 inline-block font-bold text-zinc-900">data-supermouse-ignore</code>
              <p class="text-xs text-zinc-600">VETO: Force native cursor.</p>
           </div>
        </div>
     </div>
  </DocsSection>
</template>
