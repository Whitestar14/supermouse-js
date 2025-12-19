
<script setup lang="ts">
import DocsSection from './DocsSection.vue';
</script>

<template>
  <DocsSection id="roadmap" label="08. Future" title="Roadmap">
     <div class="space-y-0 border border-zinc-200 divide-y divide-zinc-200">
        <div class="p-6 bg-white flex items-start gap-4 group hover:bg-zinc-50 transition-colors">
           <div class="w-6 h-6 border-2 border-zinc-300 rounded flex items-center justify-center shrink-0 mt-0.5 group-hover:border-black"></div>
           <div>
              <span class="font-bold text-zinc-900 block text-sm">Standardize Package Configs</span>
              <span class="text-xs text-zinc-500">Ensure all packages follow the same <code>vite.config.ts</code> template.</span>
           </div>
        </div>
        
        <div class="p-6 bg-white flex items-start gap-4 group hover:bg-zinc-50 transition-colors">
           <div class="w-6 h-6 border-2 border-zinc-300 rounded flex items-center justify-center shrink-0 mt-0.5 group-hover:border-black"></div>
           <div>
              <span class="font-bold text-zinc-900 block text-sm">Tests & CI</span>
              <span class="text-xs text-zinc-500">Add unit tests (Vitest) for core systems and GitHub Actions workflow.</span>
           </div>
        </div>

        <div class="p-6 bg-white flex items-start gap-4 group hover:bg-zinc-50 transition-colors">
           <div class="w-6 h-6 border-2 border-zinc-300 rounded flex items-center justify-center shrink-0 mt-0.5 group-hover:border-black"></div>
           <div>
              <span class="font-bold text-zinc-900 block text-sm">Framework Bindings</span>
              <span class="text-xs text-zinc-500">Implement proper React/Vue adapters in placeholder directories.</span>
           </div>
        </div>

        <div class="p-6 bg-white flex items-start gap-4 group hover:bg-zinc-50 transition-colors">
           <div class="w-6 h-6 border-2 border-zinc-300 rounded flex items-center justify-center shrink-0 mt-0.5 group-hover:border-black"></div>
           <div>
              <span class="font-bold text-zinc-900 block text-sm">Performance Audits</span>
              <span class="text-xs text-zinc-500">Add performance budgets and ARIA/accessibility checks.</span>
           </div>
        </div>
     </div>
  </DocsSection>
</template>
