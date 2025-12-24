
<script setup lang="ts">
import DocsSection from '../../../components/docs/DocsSection.vue';
import { APP_VERSION, BUNDLE_SIZE } from '../../../constants';
</script>

<template>
  <DocsSection label="Guide" title="Introduction">
    
    <!-- Meta Data Strip -->
    <div class="flex items-center gap-6 mb-12 border-y border-zinc-200 py-4 font-mono text-xs">
        <div class="flex items-center gap-2">
            <span class="font-bold text-zinc-900">VERSION</span>
            <span class="text-zinc-500">{{ APP_VERSION }}</span>
        </div>
        <div class="w-px h-4 bg-zinc-200"></div>
        <div class="flex items-center gap-2">
            <span class="font-bold text-zinc-900">CORE SIZE</span>
            <span class="text-zinc-500">{{ BUNDLE_SIZE }} (min+gzip)</span>
        </div>
        <div class="w-px h-4 bg-zinc-200"></div>
        <div class="flex items-center gap-2">
            <span class="font-bold text-zinc-900">LICENSE</span>
            <span class="text-zinc-500">MIT</span>
        </div>
    </div>

    <div class="prose prose-zinc max-w-none mb-16">
        <p class="text-xl md:text-2xl text-zinc-900 font-bold leading-tight tracking-tight text-pretty mb-8">
          Supermouse is a high-performance runtime that decouples cursor intent from cursor rendering.
        </p>
        <p class="text-lg text-zinc-600 leading-relaxed mb-4">
          Most cursor libraries are UI components. They bind state to a specific framework's render cycle (React, Vue) or rely on heavy animation libraries (GSAP) to move a div. 
        </p>
        <p class="text-lg text-zinc-600 leading-relaxed">
          <strong>Supermouse is different.</strong> It runs its own deterministic game loop (~60fps) using <code>requestAnimationFrame</code>. It manages input normalization, physics interpolation, and a priority-based plugin system to render effects without layout thrashing.
        </p>
    </div>

    <!-- The Problem / The Solution Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-px bg-zinc-200 border border-zinc-200 mb-16">
        <div class="bg-white p-8">
            <h3 class="font-mono text-xs font-bold uppercase tracking-widest text-zinc-400 mb-4">The Problem</h3>
            <ul class="space-y-4 text-sm text-zinc-700">
                <li class="flex gap-3">
                    <span class="font-bold text-zinc-400 min-w-[3ch]">01.</span>
                    <p><strong>The "Double Cursor" Glitch.</strong> Hiding the native cursor via CSS is fragile. <code>input</code>, <code>a</code>, and user-agent stylesheets often force it back, creating a flickering ghost cursor.</p>
                </li>
                <li class="flex gap-3">
                    <span class="font-bold text-zinc-400 min-w-[3ch]">02.</span>
                    <p><strong>Input Lag.</strong> React/Vue state updates are asynchronous. Binding mouse coordinates to reactive state causes the cursor to trail 1-2 frames behind input, feeling "mushy".</p>
                </li>
                <li class="flex gap-3">
                    <span class="font-bold text-zinc-400 min-w-[3ch]">03.</span>
                    <p><strong>Logic/Visual Coupling.</strong> Most libraries bake the visual style (a dot, a ring) into the logic. You can't easily swap visuals or layer multiple effects.</p>
                </li>
            </ul>
        </div>
        <div class="bg-zinc-50 p-8">
            <h3 class="font-mono text-xs font-bold uppercase tracking-widest text-zinc-400 mb-4">The Supermouse Solution</h3>
            <ul class="space-y-4 text-sm text-zinc-700">
                <li class="flex gap-3">
                    <span class="font-bold text-zinc-900 min-w-[3ch]">01.</span>
                    <p><strong>The Stage System.</strong> Supermouse injects a scoped, high-specificity stylesheet to aggressively suppress the native cursor on registered targets, guaranteeing it vanishes.</p>
                </li>
                <li class="flex gap-3">
                    <span class="font-bold text-zinc-900 min-w-[3ch]">02.</span>
                    <p><strong>Direct DOM Access.</strong> The core loop bypasses framework Virtual DOMs entirely, applying transforms directly to the GPU layer for 120hz+ fluidity.</p>
                </li>
                <li class="flex gap-3">
                    <span class="font-bold text-zinc-900 min-w-[3ch]">03.</span>
                    <p><strong>Plugin Pipeline.</strong> Logic (Magnetic) runs first to modify the target. Physics runs second to smooth movement. Visuals (Dot, Ring) run last to render. Totally decoupled.</p>
                </li>
            </ul>
        </div>
    </div>

    <!-- Core Philosophy -->
    <h3 class="text-2xl font-bold text-zinc-900 tracking-tight mb-6">Core Philosophy</h3>
    <div class="border-t border-zinc-200">
        <div class="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-zinc-200 border-b border-zinc-200">
            <div class="p-6">
                <strong class="block text-zinc-900 text-sm mb-2">1. Intent vs. Render</strong>
                <p class="text-xs text-zinc-500 leading-relaxed">
                    We separate where the cursor <em>wants</em> to go (Logic) from where it actually <em>is</em> (Physics) and what it <em>looks like</em> (Visuals). This allows plugins like <code>Magnetic</code> to hijack the target position without the visual dot knowing.
                </p>
            </div>
            <div class="p-6">
                <strong class="block text-zinc-900 text-sm mb-2">2. Modular Defaults</strong>
                <p class="text-xs text-zinc-500 leading-relaxed">
                    Supermouse ships with performance-optimized defaults that work out of the box. However, nothing is locked in. You can replace the renderer, logic, or input system entirely via plugins.
                </p>
            </div>
            <div class="p-6">
                <strong class="block text-zinc-900 text-sm mb-2">3. Accessibility First</strong>
                <p class="text-xs text-zinc-500 leading-relaxed">
                    The library automatically detects touch devices (coarse pointer) and disables itself. It listens for <code>prefers-reduced-motion</code> and snaps physics instantly to prevent motion sickness.
                </p>
            </div>
        </div>
    </div>

  </DocsSection>
</template>
