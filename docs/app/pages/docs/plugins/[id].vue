<script setup lang="ts">
definePageMeta({
  layout: "docs"
});

import { computed } from "vue";
import CodeBlock from "@components/content/CodeBlock.vue";
import MetadataStrip from "@/components/content/MetadataStrip.vue";
import Table from "@/components/content/Table.vue";
import { usePageHead } from "@composables/usePageHead";
import { PLUGINS } from "@data/plugin-data";

const route = useRoute();

const plugin = computed(() => {
  return PLUGINS.find((p) => p.id === route.params.id);
});

const installCode = computed(
  () => plugin.value?.installCommand ?? `pnpm add ${plugin.value?.package}`
);

const metaItems = computed(() => [
  { label: "VERSION", content: plugin.value?.version || "Latest" },
  { label: "LICENSE", content: plugin.value?.license || "MIT" },
  { label: "PACKAGE", content: plugin.value?.package || plugin.value?.id || "" }
]);

const optionColumns = [
  { key: "name", label: "Option", class: "w-1/4" },
  { key: "type", label: "Type", class: "w-1/6" },
  { key: "default", label: "Default", class: "w-1/6" },
  { key: "description", label: "Description" }
];

usePageHead({
  title: computed(() => plugin.value?.name ?? "Plugin"),
  description: computed(() => plugin.value?.description ?? "Supermouse plugin documentation.")
});

const showConfigTable = computed(() => (plugin.value?.options?.length ?? 0) > 0);

const docsStatus = computed(() => {
  if (!plugin.value) return null;
  return plugin.value.hasDetailedDocs
    ? { label: "Full Docs", class: "text-emerald-600" }
    : { label: "Overview Only", class: "text-zinc-500" };
});
</script>

<template>
  <div v-if="plugin">
    <!-- Clean Header with Breadcrumbs -->
    <div class="mb-8">
      <div class="flex items-center gap-2 mb-6">
        <NuxtLink
          to="/docs"
          class="mono text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-black transition-colors"
        >
          Plugins
        </NuxtLink>
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
    <MetadataStrip :items="metaItems" />

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
        <h3
          class="font-mono text-xs font-bold uppercase tracking-widest text-zinc-500 mb-4 flex items-center gap-2"
        >
          <span class="w-1.5 h-1.5 bg-black" />
          Installation
        </h3>
        <CodeBlock
          :code="installCode"
          lang="text"
          :clean="true"
          class="border border-zinc-200 shadow-sm flex-1"
        />
      </div>
      <div class="flex flex-col h-full">
        <h3
          class="font-mono text-xs font-bold uppercase tracking-widest text-zinc-500 mb-4 flex items-center gap-2"
        >
          <span class="w-1.5 h-1.5 bg-black" />
          Usage
        </h3>
        <CodeBlock
          :code="plugin.code"
          lang="typescript"
          :recipe-id="plugin.recipeId"
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
        <div class="flex items-center gap-3">
          <span v-if="docsStatus" class="text-xs font-mono uppercase tracking-widest">
            <span :class="docsStatus.class">{{ docsStatus.label }}</span>
          </span>
          <span v-if="plugin.options?.some((o) => o.reactive)" class="text-xs text-zinc-500">
            <span class="font-bold text-zinc-900">*</span> Reactive Property
          </span>
        </div>
      </div>

      <!-- Options Table -->
      <Table
        :columns="optionColumns"
        :rows="plugin.options ?? []"
        v-if="showConfigTable"
        wrapper-class="border border-zinc-200 bg-white overflow-hidden shadow-sm"
      >
        <template #cell-name="{ row }">
          <span class="font-mono text-zinc-900 font-bold relative">
            {{ row.name }}
            <span
              v-if="row.reactive"
              class="absolute top-4 left-2 text-amber-500 text-xs select-none"
              >*</span
            >
          </span>
        </template>

        <template #cell-type="{ row }">
          <span class="font-mono text-amber-600 text-xs">{{ row.type }}</span>
        </template>

        <template #cell-default="{ row }">
          <span class="font-mono text-zinc-400 text-xs">{{ row.default || "-" }}</span>
        </template>

        <template #cell-description="{ row }">
          <span class="text-zinc-600 leading-relaxed">{{ row.description }}</span>
        </template>
      </Table>

      <div
        v-else
        class="p-12 border border-zinc-200 bg-zinc-50 text-center"
      >
        <p class="font-mono text-xs text-zinc-400 uppercase tracking-widest font-bold">
          {{ plugin?.hasDetailedDocs ? 'No configuration options' : 'Configuration docs coming soon' }}
        </p>
      </div>
    </div>
  </div>

  <!-- 404 State -->
  <div v-else class="min-h-[50vh] flex flex-col items-center justify-center text-center p-8">
    <div
      class="w-16 h-16 border border-zinc-200 flex items-center justify-center mb-6 text-zinc-300"
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1"
      >
        <path
          d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
        />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    </div>
    <h1 class="text-xl font-bold text-zinc-900 tracking-tighter">Plugin Missing</h1>
    <p class="text-zinc-500 mt-2 font-mono text-xs">ID: {{ route.params.id }}</p>
    <NuxtLink
      to="/docs"
      class="mt-8 px-6 py-3 bg-black text-white font-mono text-xs font-bold uppercase tracking-widest hover:bg-zinc-800 transition-colors"
    >
      Return to Plugins
    </NuxtLink>
  </div>
</template>
