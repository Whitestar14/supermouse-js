
<script setup lang="ts">
import CodeBlock from '../CodeBlock.vue';
import DocsSection from './DocsSection.vue';

const shellCode = `pnpm install @supermousejs/core @supermousejs/dot @supermousejs/ring`;

const mainCode = `import { Supermouse } from '@supermousejs/core';
import { Dot } from '@supermousejs/dot';
import { Ring } from '@supermousejs/ring';

const app = new Supermouse({ 
  smoothness: 0.12
});

app.use(Dot({ size: 8, color: '#f0f' }));
app.use(Ring({ size: 20 }));`;

const htmlCode = `<div data-supermouse-color="#00ff00">Color override</div>
<a data-supermouse-img="/path/to/img.jpg">Show image on hover</a>`;
</script>

<template>
  <DocsSection id="quick-start" label="01. Quick Start" title="Getting Up & Running">
    <div class="flex flex-col gap-12">
        
        <!-- Step 1 -->
        <div class="flex flex-col md:flex-row gap-8">
            <div class="shrink-0 flex flex-col gap-2 md:w-48">
                <div class="w-8 h-8 bg-white border border-zinc-200 text-zinc-900 flex items-center justify-center font-mono font-bold text-sm shadow-sm">01</div>
                <h3 class="font-bold text-zinc-900">Installation</h3>
                <p class="text-xs text-zinc-500 leading-relaxed">Install core and any desired effect plugins.</p>
            </div>
            <div class="flex-1 min-w-0">
                <CodeBlock :code="shellCode" title="Terminal" />
            </div>
        </div>

        <!-- Step 2 -->
        <div class="flex flex-col md:flex-row gap-8">
            <div class="shrink-0 flex flex-col gap-2 md:w-48">
                <div class="w-8 h-8 bg-white border border-zinc-200 text-zinc-900 flex items-center justify-center font-mono font-bold text-sm shadow-sm">02</div>
                <h3 class="font-bold text-zinc-900">Initialization</h3>
                <p class="text-xs text-zinc-500 leading-relaxed">Initialize the class and register plugins.</p>
            </div>
            <div class="flex-1 min-w-0">
                <CodeBlock :code="mainCode" title="src/main.ts" />
            </div>
        </div>

        <!-- Step 3 -->
        <div class="flex flex-col md:flex-row gap-8">
            <div class="shrink-0 flex flex-col gap-2 md:w-48">
                <div class="w-8 h-8 bg-white border border-zinc-200 text-zinc-900 flex items-center justify-center font-mono font-bold text-sm shadow-sm">03</div>
                <h3 class="font-bold text-zinc-900">Markup</h3>
                <p class="text-xs text-zinc-500 leading-relaxed">Use data attributes to control behavior.</p>
            </div>
            <div class="flex-1 min-w-0">
                <CodeBlock :code="htmlCode" title="index.html" />
                <!-- Callout separated from code block container -->
                <div class="mt-6 p-4 border border-zinc-200 bg-zinc-50/50">
                    <p class="text-xs font-bold text-zinc-900 uppercase tracking-wide mb-1">Important</p>
                    <p class="text-sm text-zinc-600">Do NOT manually apply <code class="bg-white px-1 border border-zinc-200">cursor: none</code> in CSS. Supermouse handles this dynamically.</p>
                </div>
            </div>
        </div>

    </div>
  </DocsSection>
</template>
