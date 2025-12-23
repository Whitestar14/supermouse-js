
<script setup lang="ts">
import DocsSection from '../../../components/docs/DocsSection.vue';
import CodeBlock from '../../../components/CodeBlock.vue';

const setupCode = `pnpm install
pnpm dev`;
</script>

<template>
  <DocsSection label="Advanced" title="Contributing">
    
    <p class="text-xl text-zinc-900 font-bold mb-8 max-w-3xl leading-tight">
      Supermouse is a modular cursor engine with a plugin-first architecture. 
      Contributions are welcome, but not required to participate in the ecosystem.
    </p>
    
    <p class="text-zinc-600 mb-12 text-lg">
      This document explains <strong>how to contribute</strong>, <strong>what belongs in this repo</strong>, and <strong>what does not</strong>.
    </p>

    <!-- Scope Grid -->
    <h3 class="text-2xl font-bold text-zinc-900 mb-6">What belongs in this repo</h3>
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

    <div class="p-6 bg-zinc-900 text-zinc-400 text-sm mb-16 font-mono">
      <span class="text-white font-bold">Tip:</span> If you’re unsure, open a discussion first. No pressure.
    </div>

    <!-- Contributing Code -->
    <h3 class="text-2xl font-bold text-zinc-900 mb-6">Contributing Code</h3>
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

    <!-- Philosophy -->
    <div class="border-t border-zinc-200 pt-12">
      <h3 class="text-2xl font-bold text-zinc-900 mb-6">Philosophy</h3>
      <p class="text-zinc-600 mb-8">Supermouse optimizes for:</p>
      
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="p-6 border border-zinc-200 bg-white">
          <span class="block font-bold text-zinc-900 text-sm">Predictable Behavior</span>
        </div>
        <div class="p-6 border border-zinc-200 bg-white">
          <span class="block font-bold text-zinc-900 text-sm">Explicit Data Flow</span>
        </div>
        <div class="p-6 border border-zinc-200 bg-white">
          <span class="block font-bold text-zinc-900 text-sm">Minimal Magic</span>
        </div>
        <div class="p-6 border border-zinc-200 bg-white">
          <span class="block font-bold text-zinc-900 text-sm">Userland Extensibility</span>
        </div>
      </div>

      <p class="mt-12 text-2xl font-bold text-zinc-900 max-w-2xl leading-tight">
        If a feature can be a plugin, it probably should be.
      </p>
    </div>

  </DocsSection>
</template>
