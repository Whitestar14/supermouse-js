
<script setup lang="ts">
import DocsSection from '../../../components/docs/DocsSection.vue';
import CodeBlock from '../../../components/CodeBlock.vue';
import Callout from '../../../components/ui/Callout.vue';

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

const debugCode = `import { doctor } from '@supermousejs/utils';

// Run once to check for conflicts
doctor();`;
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
            
            <Callout title="Warning: CSS Conflicts" variant="warning">
                <p class="mb-2"><strong>Do not use <code>cursor: pointer</code> or <code>cursor: none</code> in your own CSS.</strong></p>
                <p>
                    Supermouse manages cursor visibility dynamically. Manually setting cursor styles often results in the "double cursor" glitch where the OS cursor reappears on top of the custom one. If you need a pointer state, use the <code>rules</code> config in Supermouse to handle it programmatically.
                </p>
            </Callout>
        </div>

        <!-- Troubleshooting -->
        <div class="flex flex-col gap-4 border-t border-zinc-200 pt-8">
            <h3 class="text-xl font-bold text-zinc-900">Troubleshooting</h3>
            <p class="text-zinc-600 text-sm">
                If you see the native cursor flickering, use the <code>doctor</code> utility to find conflicting CSS.
            </p>
            <CodeBlock :code="debugCode" title="Debug" lang="typescript" />
        </div>

    </div>
  </DocsSection>
</template>
