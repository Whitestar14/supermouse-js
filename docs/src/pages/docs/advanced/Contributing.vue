
<script setup lang="ts">
import DocsSection from '../../../components/docs/DocsSection.vue';
import CodeBlock from '../../../components/CodeBlock.vue';
import Callout from '../../../components/ui/Callout.vue';

const setupCode = `pnpm install
pnpm dev`;
</script>

<template>
  <DocsSection label="Advanced" title="Contributing">
    
    <p class="text-lg text-zinc-600 mb-12 leading-relaxed">
      Supermouse is a modular cursor engine with a plugin-first architecture. 
      Contributions are welcome, but not required to participate in the ecosystem.
      This document explains <span class="text-black font-bold border-b-2 border-black/10">how to contribute</span>, <span class="text-black font-bold border-b-2 border-black/10">what belongs in this repo</span>, and <span class="text-black font-bold border-b-2 border-black/10">what does not</span>.
    </p>

    <!-- Scope Grid -->
    <h3 class="text-2xl font-bold text-zinc-900 mb-6 tracking-tight">What belongs in this repo</h3>
    <p class="text-zinc-600 mb-8">
      This monorepo is intentionally conservative. We maintain the core runtime and reference implementations.
    </p>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-px bg-zinc-200 border border-zinc-200 mb-12">
      <!-- Accepted -->
      <div class="bg-white p-8">
        <strong class="block text-zinc-900 font-bold uppercase tracking-widest text-xs mb-6 border-b border-zinc-100 pb-2">We Accept PRs For</strong>
        <ul class="space-y-3 text-sm text-zinc-700">
          <li class="flex gap-3">
            <span class="text-zinc-900 font-bold">✓</span> 
            <span>Core runtime fixes</span>
          </li>
          <li class="flex gap-3">
            <span class="text-zinc-900 font-bold">✓</span> 
            <span>Performance improvements</span>
          </li>
          <li class="flex gap-3">
            <span class="text-zinc-900 font-bold">✓</span> 
            <span>Bug fixes</span>
          </li>
          <li class="flex gap-3">
            <span class="text-zinc-900 font-bold">✓</span> 
            <span>Documentation</span>
          </li>
          <li class="flex gap-3">
            <span class="text-zinc-900 font-bold">✓</span> 
            <span><strong>Reference-quality</strong> plugins that demonstrate an essential pattern</span>
          </li>
        </ul>
      </div>

      <!-- Rejected -->
      <div class="bg-zinc-50 p-8">
        <strong class="block text-zinc-400 font-bold uppercase tracking-widest text-xs mb-6 border-b border-zinc-200 pb-2">We Do NOT Accept</strong>
        <ul class="space-y-3 text-sm text-zinc-700">
          <li class="flex gap-3">
            <span class="text-zinc-400 font-bold">×</span> 
            <span>Niche visual effects</span>
          </li>
          <li class="flex gap-3">
            <span class="text-zinc-400 font-bold">×</span> 
            <span>Framework-specific wrappers</span>
          </li>
          <li class="flex gap-3">
            <span class="text-zinc-400 font-bold">×</span> 
            <span>Stylistic variants of existing plugins</span>
          </li>
          <li class="flex gap-3">
            <span class="text-zinc-400 font-bold">×</span> 
            <span>Experimental or opinionated behavior</span>
          </li>
        </ul>
        <div class="mt-8 pt-6 border-t border-zinc-200 text-xs text-zinc-500">
          These should live as <router-link to="/docs/advanced/authoring" class="underline hover:text-black font-bold">External Plugins</router-link>.
        </div>
      </div>
    </div>

    <Callout title="Tip">
        If you’re unsure, open a discussion first. No pressure.
    </Callout>

    <!-- Contributing Code -->
    <h3 class="text-2xl font-bold text-zinc-900 mb-6 tracking-tight">Contributing Code</h3>
    <ul class="space-y-4 text-zinc-600 mb-8 list-none pl-0 text-sm">
      <li class="flex gap-3">
        <span class="w-1.5 h-1.5 bg-black rounded-full mt-2 shrink-0"></span>
        <span>Use <strong>pnpm</strong>.</span>
      </li>
      <li class="flex gap-3">
        <span class="w-1.5 h-1.5 bg-black rounded-full mt-2 shrink-0"></span>
        <span>Keep changes scoped.</span>
      </li>
      <li class="flex gap-3">
        <span class="w-1.5 h-1.5 bg-black rounded-full mt-2 shrink-0"></span>
        <span>Avoid introducing new abstractions without a clear perf or ergonomics win.</span>
      </li>
      <li class="flex gap-3">
        <span class="w-1.5 h-1.5 bg-black rounded-full mt-2 shrink-0"></span>
        <span>Cursor logic is <strong>hot-path code</strong>. Allocations and layout reads are scrutinized.</span>
      </li>
    </ul>

    <div class="mb-16">
      <CodeBlock :code="setupCode" lang="bash" title="Setup" />
    </div>

    <!-- Philosophy Grid -->
    <div class="border-t border-zinc-200 pt-12">
      <h3 class="text-2xl font-bold text-zinc-900 mb-8 tracking-tight">Philosophy</h3>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-px bg-zinc-200 border border-zinc-200 mb-12">
        <div class="bg-white p-8">
            <span class="mono text-xs font-bold text-zinc-400 mb-2 block">01</span>
            <strong class="block text-zinc-900 font-bold text-sm mb-2">Predictable Behavior</strong>
            <p class="text-sm text-zinc-600 leading-relaxed">No hidden state. No side effects outside the plugin container. Input -> Output.</p>
        </div>
        <div class="bg-white p-8">
            <span class="mono text-xs font-bold text-zinc-400 mb-2 block">02</span>
            <strong class="block text-zinc-900 font-bold text-sm mb-2">Explicit Data Flow</strong>
            <p class="text-sm text-zinc-600 leading-relaxed">Input -> Logic -> Physics -> Render. One way, every frame. No loops.</p>
        </div>
        <div class="bg-white p-8">
            <span class="mono text-xs font-bold text-zinc-400 mb-2 block">03</span>
            <strong class="block text-zinc-900 font-bold text-sm mb-2">Minimal Magic</strong>
            <p class="text-sm text-zinc-600 leading-relaxed">We prefer verbose, clear configuration over "auto-magic" guessing.</p>
        </div>
        <div class="bg-white p-8">
            <span class="mono text-xs font-bold text-zinc-400 mb-2 block">04</span>
            <strong class="block text-zinc-900 font-bold text-sm mb-2">Userland Extensibility</strong>
            <p class="text-sm text-zinc-600 leading-relaxed">The core is small. The ecosystem is infinite.</p>
        </div>
      </div>
    </div>

  </DocsSection>
</template>
