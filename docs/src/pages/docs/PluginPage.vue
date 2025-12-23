
<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import DocsSection from '../../components/docs/DocsSection.vue';
import CodeBlock from '../../components/CodeBlock.vue';
import { PLUGINS } from '../../plugin-data';

const route = useRoute();

const plugin = computed(() => {
  return PLUGINS.find(p => p.id === route.params.id);
});

const installCode = computed(() => {
    return `pnpm add @supermousejs/${plugin.value?.id}`;
});
</script>

<template>
  <div v-if="plugin">
    <DocsSection label="Plugin" :title="plugin.name">
        <div class="flex flex-col md:flex-row gap-8 mb-16 border-b border-zinc-200 pb-12">
            <div class="w-24 h-24 border border-zinc-900 flex items-center justify-center p-6 text-zinc-900 shrink-0 bg-white" v-html="plugin.icon"></div>
            <div class="flex-1">
                <p class="text-xl text-zinc-900 font-bold leading-tight mb-6 max-w-2xl">{{ plugin.description }}</p>
                <div class="flex gap-4 font-mono text-xs uppercase tracking-widest text-zinc-500">
                    <span class="border border-zinc-200 px-2 py-1">v2.0.0</span>
                    <span class="border border-zinc-200 px-2 py-1">MIT</span>
                    <span class="border border-zinc-200 px-2 py-1">{{ (plugin.options?.length || 0) }} Options</span>
                </div>
            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
            <div>
                <h3 class="font-mono text-xs font-bold uppercase tracking-widest text-zinc-400 mb-4">Installation</h3>
                <CodeBlock :code="installCode" lang="text" :clean="true" class="border border-zinc-200" />
            </div>
            <div>
                <h3 class="font-mono text-xs font-bold uppercase tracking-widest text-zinc-400 mb-4">Usage</h3>
                <CodeBlock 
                    :code="plugin.code" 
                    lang="typescript" 
                    :recipeId="plugin.recipeId"
                    :clean="true"
                    class="border border-zinc-200"
                />
            </div>
        </div>

        <h3 class="font-mono text-xs font-bold uppercase tracking-widest text-zinc-900 mb-4 border-t border-zinc-200 pt-12">
            Configuration
        </h3>

        <!-- Brutalist Options Table -->
        <div v-if="plugin.options && plugin.options.length > 0" class="border-t border-l border-zinc-200 bg-white mb-4">
            <table class="w-full text-left text-sm border-collapse">
                <thead class="bg-zinc-50">
                    <tr>
                        <th class="border-r border-b border-zinc-200 px-4 py-3 font-mono text-xs font-bold uppercase text-zinc-500 w-1/4">Prop</th>
                        <th class="border-r border-b border-zinc-200 px-4 py-3 font-mono text-xs font-bold uppercase text-zinc-500 w-1/6">Type</th>
                        <th class="border-r border-b border-zinc-200 px-4 py-3 font-mono text-xs font-bold uppercase text-zinc-500 w-1/6">Default</th>
                        <th class="border-r border-b border-zinc-200 px-4 py-3 font-mono text-xs font-bold uppercase text-zinc-500">Description</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="opt in plugin.options" :key="opt.name" class="group hover:bg-zinc-50 transition-colors">
                        <td class="border-r border-b border-zinc-200 px-4 py-3 align-top font-mono text-zinc-900 font-bold">
                            {{ opt.name }}<span v-if="opt.reactive" class="text-zinc-400 select-none">*</span>
                        </td>
                        <td class="border-r border-b border-zinc-200 px-4 py-3 align-top font-mono text-zinc-500 text-xs">
                            {{ opt.type }}
                        </td>
                        <td class="border-r border-b border-zinc-200 px-4 py-3 align-top font-mono text-zinc-400 text-xs">
                            {{ opt.default || '-' }}
                        </td>
                        <td class="border-r border-b border-zinc-200 px-4 py-3 align-top text-zinc-600 leading-snug">
                            {{ opt.description }}
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
        
        <div v-if="plugin.options?.some(o => o.reactive)" class="font-mono text-[10px] uppercase tracking-widest text-zinc-400 mb-16">
            * Accepts function: (state) => value
        </div>

        <div v-if="!plugin.options || plugin.options.length === 0" class="p-8 border border-zinc-200 bg-zinc-50 text-center mb-16">
            <p class="font-mono text-xs text-zinc-400 uppercase">No options available</p>
        </div>

    </DocsSection>
  </div>
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
