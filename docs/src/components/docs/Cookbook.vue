
<script setup lang="ts">
import CodeBlock from '../CodeBlock.vue';
import DocsSection from './DocsSection.vue';

const spotlightCode = `export const Spotlight = (options: { size?: number } = {}): SupermousePlugin => {
  let el: HTMLDivElement;
  let currentSize = 0;
  const maxSize = options.size || 400;

  return {
    name: 'spotlight',
    
    install(app) {
      el = dom.createDiv();
      // Difference mode: White on White = Black. Black on White = White.
      el.style.mixBlendMode = 'difference';
      el.style.backgroundColor = 'white';
      el.style.borderRadius = '50%';
      el.style.pointerEvents = 'none';
      el.style.position = 'fixed';
      el.style.zIndex = Layers.CURSOR;
      app.container.appendChild(el);
    },
    
    update(app) {
      const target = app.state.isHover ? maxSize : 0;
      currentSize = lerp(currentSize, target, 0.1);

      const { x, y } = app.state.smooth;
      el.style.width = \`\${currentSize}px\`;
      el.style.height = \`\${currentSize}px\`;
      dom.setTransform(el, x - currentSize/2, y - currentSize/2);
    },
    
    destroy() { el.remove(); }
  };
};`;
</script>

<template>
  <DocsSection id="cookbook" label="06. Examples" title="Cookbook: Spotlight">
     <div class="flex flex-col gap-12">
        <div class="w-full">
            <p class="text-zinc-600 mb-8 leading-relaxed max-w-2xl">
                The "Flashlight" effect used on the CTA of this website can be packaged as a single file plugin. 
                It uses <code>mix-blend-mode: difference</code> to invert the colors beneath it.
            </p>
            <div class="bg-zinc-50 border border-zinc-200 p-6 max-w-2xl">
                <h4 class="font-bold text-zinc-900 mb-4 text-sm uppercase tracking-widest">Key Concepts</h4>
                <ul class="list-square list-inside text-sm text-zinc-600 space-y-2 marker:text-zinc-400">
                    <li>Using <code>mix-blend-mode</code> for contrast.</li>
                    <li>Expanding size on hover state.</li>
                    <li>Direct DOM manipulation for performance.</li>
                </ul>
            </div>
        </div>
        
        <div class="w-full">
            <CodeBlock :code="spotlightCode" title="packages/spotlight/src/index.ts" />
        </div>
     </div>
  </DocsSection>
</template>
