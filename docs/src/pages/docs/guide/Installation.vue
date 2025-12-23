
<script setup lang="ts">
import DocsSection from '../../../components/docs/DocsSection.vue';
import CodeBlock from '../../../components/CodeBlock.vue';

const shellCode = `pnpm add @supermousejs/core @supermousejs/dot @supermousejs/ring`;

const mainCode = `import { Supermouse } from '@supermousejs/core';
import { Dot } from '@supermousejs/dot';
import { Ring } from '@supermousejs/ring';

const app = new Supermouse({ 
  smoothness: 0.12,
  hideCursor: true
});

app.use(Dot({ size: 8, color: '#f0f' }));
app.use(Ring({ size: 20 }));`;

const htmlCode = `<div data-supermouse-color="#00ff00">Color override</div>
<a data-supermouse-img="/path/to/img.jpg">Show image on hover</a>`;
</script>

<template>
  <DocsSection label="Guide" title="Installation">
    <div class="flex flex-col gap-12">
        
        <!-- Step 1 -->
        <div class="flex flex-col gap-4">
            <h3 class="text-xl font-bold text-zinc-900 flex items-center gap-3">
                <span class="w-6 h-6 bg-black text-white flex items-center justify-center text-xs font-mono rounded-sm">01</span>
                Add Dependencies
            </h3>
            <p class="text-zinc-600 text-sm">Install the core runtime and any effect plugins you wish to use.</p>
            <CodeBlock :code="shellCode" title="Terminal" lang="text" />
        </div>

        <!-- Step 2 -->
        <div class="flex flex-col gap-4">
            <h3 class="text-xl font-bold text-zinc-900 flex items-center gap-3">
                <span class="w-6 h-6 bg-black text-white flex items-center justify-center text-xs font-mono rounded-sm">02</span>
                Initialize
            </h3>
            <p class="text-zinc-600 text-sm">Create the instance in your app's entry point (e.g., <code>main.ts</code> or a top-level `useEffect`).</p>
            <CodeBlock :code="mainCode" title="src/main.ts" lang="typescript" />
        </div>

        <!-- Step 3 -->
        <div class="flex flex-col gap-4">
            <h3 class="text-xl font-bold text-zinc-900 flex items-center gap-3">
                <span class="w-6 h-6 bg-black text-white flex items-center justify-center text-xs font-mono rounded-sm">03</span>
                Markup Control
            </h3>
            <p class="text-zinc-600 text-sm">Plugins automatically listen for data attributes on your HTML elements.</p>
            <CodeBlock :code="htmlCode" title="index.html" lang="html" />
            
            <div class="p-4 border-l-4 border-zinc-900 bg-zinc-50 text-zinc-900 text-sm">
                <strong>Tip:</strong> Do not manually apply <code>cursor: none</code> in your CSS. Supermouse handles this dynamically to prevent disappearing cursors on touch devices or when the plugin is disabled.
            </div>
        </div>

    </div>
  </DocsSection>
</template>
