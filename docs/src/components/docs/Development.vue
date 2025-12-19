
<script setup lang="ts">
import CodeBlock from '../CodeBlock.vue';
import DocsSection from './DocsSection.vue';

const appendix = [
  { file: 'packages/core/src/Supermouse.ts', desc: 'Core runtime and update loop' },
  { file: 'packages/core/src/systems/Input.ts', desc: 'Input normalization and accessibility checks' },
  { file: 'packages/core/src/systems/Stage.ts', desc: 'DOM stage and native-cursor hiding' },
  { file: 'packages/*/src/index.ts', desc: 'Plugin entry points' },
  { file: 'scripts/create-plugin.js', desc: 'Scaffolding helper' },
];
</script>

<template>
  <DocsSection id="development" label="09. Workflow" title="Development">
     <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        <div class="p-6 bg-zinc-50 border border-zinc-200">
            <h4 class="font-bold text-zinc-900 mb-2">Build & Test</h4>
            <ul class="space-y-2 text-sm text-zinc-600 font-mono">
                <li>pnpm dev</li>
                <li>pnpm -r build</li>
            </ul>
        </div>
        <div class="p-6 bg-zinc-50 border border-zinc-200">
            <h4 class="font-bold text-zinc-900 mb-2">Publishing</h4>
            <p class="text-sm text-zinc-600 mb-2">Prefer <code>changesets</code> to prepare releases.</p>
            <code class="text-xs font-bold">pnpm -r publish</code>
        </div>
     </div>

     <h3 class="text-lg font-bold text-zinc-900 uppercase tracking-widest mb-6">Files of Interest</h3>
     <div class="border border-zinc-200 bg-white">
        <table class="w-full text-left text-sm">
           <tbody class="divide-y divide-zinc-200">
              <tr v-for="item in appendix" :key="item.file" class="group hover:bg-zinc-50 transition-colors">
                 <td class="p-4 font-mono text-xs text-zinc-500 group-hover:text-black">{{ item.file }}</td>
                 <td class="p-4 text-zinc-900">{{ item.desc }}</td>
              </tr>
           </tbody>
        </table>
     </div>
  </DocsSection>
</template>
