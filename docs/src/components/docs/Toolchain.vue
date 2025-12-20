
<script setup lang="ts">
import CodeBlock from '../CodeBlock.vue';
import DocsSection from './DocsSection.vue';

const createPluginCode = `pnpm run create:plugin <name>`;
const removePluginCode = `pnpm run remove:plugin <name>`;
const devCode = `pnpm dev`;
const buildCode = `pnpm -r build`;
</script>

<template>
  <DocsSection id="toolchain" label="07. Tooling" title="Toolchain & Monorepo">
     <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        <div class="p-6 border border-zinc-200">
            <h4 class="font-bold text-zinc-900 mb-2">Workspace</h4>
            <p class="text-sm text-zinc-600 leading-relaxed">
                Managed with <code>pnpm</code>. Internal packages are linked via <code>workspace:*</code> protocol.
            </p>
        </div>
        <div class="p-6 border border-zinc-200">
            <h4 class="font-bold text-zinc-900 mb-2">Bundler</h4>
            <p class="text-sm text-zinc-600 leading-relaxed">
                <code>vite</code> in library mode. Emits dual ESM/UMD builds for maximum compatibility.
            </p>
        </div>
        <div class="p-6 border border-zinc-200">
            <h4 class="font-bold text-zinc-900 mb-2">Versioning</h4>
            <p class="text-sm text-zinc-600 leading-relaxed">
                <code>@changesets/cli</code> manages semver bumping and changelog generation.
            </p>
        </div>
     </div>

     <h3 class="text-xl font-bold text-zinc-900 mb-6 tracking-tight">CLI Helpers</h3>
     <div class="space-y-8">
        <div class="flex flex-col md:flex-row gap-8 items-start">
           <div class="w-full md:w-1/3 shrink-0">
               <div class="text-sm font-bold text-zinc-900 mb-1">Scaffold Plugin</div>
               <p class="text-xs text-zinc-500 mb-4">Creates package folder, tsconfig, and vite config.</p>
           </div>
           <div class="w-full md:w-2/3">
               <CodeBlock :code="createPluginCode" title="Terminal" lang="text" />
           </div>
        </div>

        <div class="flex flex-col md:flex-row gap-8 items-start">
           <div class="w-full md:w-1/3 shrink-0">
               <div class="text-sm font-bold text-zinc-900 mb-1">Remove Plugin</div>
               <p class="text-xs text-zinc-500 mb-4">Safely unlinks from workspace and deletes files.</p>
           </div>
           <div class="w-full md:w-2/3">
               <CodeBlock :code="removePluginCode" title="Terminal" lang="text" />
           </div>
        </div>
     </div>

     <div class="mt-16 p-6 bg-zinc-50 border border-zinc-200 flex gap-4 items-start">
        <div class="w-1 h-1 bg-black rounded-full mt-2 shrink-0"></div>
        <div>
            <h4 class="text-sm font-bold text-zinc-900 mb-1">Dependency Isolation</h4>
            <p class="text-sm text-zinc-600 leading-relaxed">
            Plugins depend on <code>@supermousejs/core</code> via <code>workspace:*</code>. 
            Vite configs mark core as <strong>external</strong> so it is not bundled into plugin distributions. 
            This ensures a small footprint.
            </p>
        </div>
     </div>
  </DocsSection>
</template>
