
<script setup lang="ts">
import DocsSection from './DocsSection.vue';
</script>

<template>
  <DocsSection id="contributing" label="10. Community" title="Contributing" class="pb-32">
     <p class="text-zinc-600 text-lg leading-relaxed mb-8">
        Contributions are welcome. Please open issues/PRs and follow the standard steps:
     </p>
     
     <div class="flex flex-col gap-4 mb-16">
        <div class="flex items-center gap-4">
            <div class="w-6 h-6 border border-zinc-300 flex items-center justify-center text-xs font-bold font-mono">01</div>
            <span class="text-sm font-bold text-zinc-900">Fork the repository</span>
        </div>
        <div class="flex items-center gap-4">
            <div class="w-6 h-6 border border-zinc-300 flex items-center justify-center text-xs font-bold font-mono">02</div>
            <span class="text-sm font-bold text-zinc-900">Branch, code, and add tests</span>
        </div>
        <div class="flex items-center gap-4">
            <div class="w-6 h-6 border border-zinc-300 flex items-center justify-center text-xs font-bold font-mono">03</div>
            <span class="text-sm font-bold text-zinc-900">Ensure the <code>playground</code> demonstrates your changes</span>
        </div>
        <div class="flex items-center gap-4">
            <div class="w-6 h-6 border border-zinc-300 flex items-center justify-center text-xs font-bold font-mono">04</div>
            <span class="text-sm font-bold text-zinc-900">Open a PR with a clear description</span>
        </div>
     </div>

     <div class="mt-16 pt-16 border-t border-zinc-200 flex justify-between items-center">
        <div>
            <h2 class="text-xl font-bold tracking-tighter text-zinc-900">License</h2>
            <p class="text-zinc-500">MIT</p>
        </div>
        <div class="text-right">
            <p class="text-xs text-zinc-400 uppercase tracking-widest font-bold">Maintained by</p>
            <p class="font-bold text-zinc-900">Stud.io Inc.</p>
        </div>
     </div>
  </DocsSection>
</template>
