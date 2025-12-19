
<script setup lang="ts">
import DocsSection from './DocsSection.vue';
</script>

<template>
  <DocsSection id="goals" label="03. Philosophy" title="Goals & Principles">
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-zinc-200 border border-zinc-200">
       <div class="bg-white p-8 group hover:bg-zinc-50 transition-colors">
          <span class="mono text-xs font-bold text-zinc-300 mb-4 block group-hover:text-black transition-colors">01</span>
          <h3 class="font-bold text-black mb-3 text-lg tracking-tight">Minimal Core</h3>
          <p class="text-sm text-zinc-600 leading-relaxed">
             The `core` package is intentionally small. It focuses solely on input normalization, cursor hiding/visibility, a single DOM stage, and the plugin lifecycle.
          </p>
       </div>
       
       <div class="bg-white p-8 group hover:bg-zinc-50 transition-colors">
          <span class="mono text-xs font-bold text-zinc-300 mb-4 block group-hover:text-black transition-colors">02</span>
          <h3 class="font-bold text-black mb-3 text-lg tracking-tight">Plugin-First</h3>
          <p class="text-sm text-zinc-600 leading-relaxed">
             Visual/interaction features live in separate packages and should be able to be built and published independently.
          </p>
       </div>
       
       <div class="bg-white p-8 group hover:bg-zinc-50 transition-colors">
          <span class="mono text-xs font-bold text-zinc-300 mb-4 block group-hover:text-black transition-colors">03</span>
          <h3 class="font-bold text-black mb-3 text-lg tracking-tight">Data-Driven</h3>
          <p class="text-sm text-zinc-600 leading-relaxed">
             Plugins integrate with DOM elements via semantic <code>data-supermouse-*</code> attributes to provide flexible, declarative behavior.
          </p>
       </div>
       
       <div class="bg-white p-8 group hover:bg-zinc-50 transition-colors">
          <span class="mono text-xs font-bold text-zinc-300 mb-4 block group-hover:text-black transition-colors">04</span>
          <h3 class="font-bold text-black mb-3 text-lg tracking-tight">Framework Agnostic</h3>
          <p class="text-sm text-zinc-600 leading-relaxed">
             Core uses vanilla DOM operations. Framework bindings (React/Vue) can be provided as thin adapters.
          </p>
       </div>

       <div class="bg-white p-8 group hover:bg-zinc-50 transition-colors">
          <span class="mono text-xs font-bold text-zinc-300 mb-4 block group-hover:text-black transition-colors">05</span>
          <h3 class="font-bold text-black mb-3 text-lg tracking-tight">Accessibility First</h3>
          <p class="text-sm text-zinc-600 leading-relaxed">
             Respects <code>prefers-reduced-motion</code> and auto-disables on touch/narrow-pointer environments by default.
          </p>
       </div>
       
       <!-- Empty cell for grid balance if needed, or let it be empty -->
       <div class="bg-zinc-50/50 hidden lg:block"></div>
    </div>
  </DocsSection>
</template>
