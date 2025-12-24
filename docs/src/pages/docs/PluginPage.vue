
<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import CodeBlock from '../../components/CodeBlock.vue';
import { PLUGINS } from '../../plugin-data';

const route = useRoute();

const plugin = computed(() => {
  return PLUGINS.find(p => p.id === route.params.id);
});

const installCode = computed(() => {
    // Dynamic: Uses the explicit package name from metadata
    return `pnpm add ${plugin.value?.package}`;
});
</script>

<template>
  <div v-if="plugin">
    
    <!-- Clean Header with Breadcrumbs -->
    <div class="mb-8">
        <div class="flex items-center gap-2 mb-6">
            <router-link to="/docs" class="mono text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-black transition-colors">
                Ecosystem
            </router-link>
            <span class="text-zinc-300">/</span>
            <span class="mono text-xs font-bold uppercase tracking-widest text-zinc-900">
                {{ plugin.package }}
            </span>
        </div>
        <h1 class="text-5xl font-bold tracking-tighter text-zinc-900 leading-[0.9]">
            {{ plugin.name }}
        </h1>
    </div>

    <!-- Meta Strip (Matching Introduction) -->
    <div class="flex items-center gap-6 mb-12 border-y border-zinc-200 py-4 font-mono text-xs">
        <div class="flex items-center gap-2">
            <span class="font-bold text-zinc-900">VERSION</span>
            <!-- Use the version injected by generate-docs-data.js -->
            <span class="text-zinc-500">{{ plugin.version || 'Latest' }}</span>
        </div>
        <div class="w-px h-4 bg-zinc-200"></div>
        <div class="flex items-center gap-2">
            <span class="font-bold text-zinc-900">LICENSE</span>
            <span class="text-zinc-500">MIT</span>
        </div>
        <div class="w-px h-4 bg-zinc-200"></div>
        <div class="flex items-center gap-2">
            <span class="font-bold text-zinc-900">CONFIG</span>
            <span class="text-zinc-500">{{ plugin.options?.length || 0 }} Options</span>
        </div>
    </div>

    <!-- Intro Text -->
    <div class="flex flex-col md:flex-row gap-12 mb-16">
        <div class="flex-1">
             <p class="text-xl text-zinc-600 leading-relaxed font-medium">
                {{ plugin.description }}
            </p>
        </div>
    </div>

    <!-- Integration -->
    <div class="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-20">
        <div class="flex flex-col h-full">
            <h3 class="font-mono text-xs font-bold uppercase tracking-widest text-zinc-500 mb-4 flex items-center gap-2">
                <span class="w-1.5 h-1.5 bg-black"></span>
                Installation
            </h3>
            <CodeBlock :code="installCode" lang="text" :clean="true" class="border border-zinc-200 shadow-sm flex-1" />
        </div>
        <div class="flex flex-col h-full">
            <h3 class="font-mono text-xs font-bold uppercase tracking-widest text-zinc-500 mb-4 flex items-center gap-2">
                <span class="w-1.5 h-1.5 bg-black"></span>
                Usage
            </h3>
            <CodeBlock 
                :code="plugin.code" 
                lang="typescript" 
                :recipeId="plugin.recipeId"
                :clean="true"
                class="border border-zinc-200 shadow-sm flex-1"
            />
        </div>
    </div>

    <!-- API / Config -->
    <div class="border-t border-zinc-200 pt-12">
        <div class="flex items-center justify-between mb-8">
            <h3 class="font-mono text-sm font-bold uppercase tracking-widest text-zinc-900">
                Configuration
            </h3>
            <span v-if="plugin.options?.some(o => o.reactive)" class="text-xs text-zinc-500">
                <span class="font-bold text-zinc-900">*</span> Reactive Property
            </span>
        </div>

        <!-- Brutalist Options Table -->
        <div v-if="plugin.options && plugin.options.length > 0" class="border border-zinc-200 bg-white overflow-hidden shadow-sm">
            <table class="w-full text-left text-sm border-collapse">
                <thead class="bg-zinc-50/50">
                    <tr>
                        <th class="border-b border-zinc-200 px-6 py-4 font-mono text-xs font-bold uppercase text-zinc-500 w-1/4">Option</th>
                        <th class="border-b border-zinc-200 px-6 py-4 font-mono text-xs font-bold uppercase text-zinc-500 w-1/6">Type</th>
                        <th class="border-b border-zinc-200 px-6 py-4 font-mono text-xs font-bold uppercase text-zinc-500 w-1/6">Default</th>
                        <th class="border-b border-zinc-200 px-6 py-4 font-mono text-xs font-bold uppercase text-zinc-500">Description</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-zinc-200">
                    <tr v-for="opt in plugin.options" :key="opt.name" class="group hover:bg-zinc-50 transition-colors">
                        <td class="px-6 py-5 align-top font-mono text-zinc-900 font-bold relative">
                            {{ opt.name }}
                            <span v-if="opt.reactive" class="absolute top-4 left-2 text-amber-500 text-xs select-none">*</span>
                        </td>
                        <td class="px-6 py-5 align-top font-mono text-amber-600 text-xs">
                            {{ opt.type }}
                        </td>
                        <td class="px-6 py-5 align-top font-mono text-zinc-400 text-xs">
                            {{ opt.default || '-' }}
                        </td>
                        <td class="px-6 py-5 align-top text-zinc-600 leading-relaxed">
                            {{ opt.description }}
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div v-if="!plugin.options || plugin.options.length === 0" class="p-12 border border-zinc-200 bg-zinc-50 text-center">
            <p class="font-mono text-xs text-zinc-400 uppercase tracking-widest font-bold">No configuration options available</p>
        </div>
    </div>

  </div>
  
  <!-- 404 State -->
  <div v-else class="min-h-[50vh] flex flex-col items-center justify-center text-center p-8">
    <div class="w-16 h-16 border border-zinc-200 flex items-center justify-center mb-6 text-zinc-300">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
    </div>
    <h1 class="text-xl font-bold text-zinc-900 tracking-tighter">Plugin Missing</h1>
    <p class="text-zinc-500 mt-2 font-mono text-xs">ID: {{ route.params.id }}</p>
    <router-link to="/docs" class="mt-8 px-6 py-3 bg-black text-white font-mono text-xs font-bold uppercase tracking-widest hover:bg-zinc-800 transition-colors">
        Return to Ecosystem
    </router-link>
  </div>
</template>
