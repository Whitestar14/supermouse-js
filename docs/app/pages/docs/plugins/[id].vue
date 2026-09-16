<script setup lang="ts">
definePageMeta({
  layout: "docs"
});

import { computed, watch } from "vue";
import CodeBlock from "@components/content/CodeBlock.vue";
import MetadataStrip from "@/components/content/MetadataStrip.vue";
import Table from "@/components/content/Table.vue";
import CursorDemo from "@components/content/CursorDemo.vue";
import { usePageHead } from "@composables/usePageHead";
import { useTocScroll, useTocSections, type TocSection } from "@composables/useToc";
import { PLUGINS } from "@data/plugin-data";
import { DEMOS, PLUGIN_DEMO_IDS } from "@playground/demos";

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

/** Docs completeness, expressed with tokens — never a raw colour utility. */
const docsStatus = computed(() => {
  if (!plugin.value) return null;
  return plugin.value.hasDetailedDocs
    ? { label: "Full Docs", class: "border border-border bg-surface-muted text-inverse" }
    : { label: "Overview Only", class: "border border-dashed border-border text-subtle" };
});

/**
 * This page is generated from package metadata rather than markdown, so it has
 * to publish its own TOC — otherwise the rail would keep whatever the last
 * markdown page wrote into the shared `docs-toc` state (the "stale sidebar"
 * bug on plugin pages). Anchors below match the ids on the headings.
 */
const tocSections = computed<TocSection[]>(() => {
  if (!plugin.value) return [];
  const sections: TocSection[] = [
    { id: "installation", label: "Installation", depth: 2 },
    { id: "usage", label: "Usage", depth: 2 }
  ];
  if (showConfigTable.value) {
    sections.push({ id: "configuration", label: "Configuration", depth: 2 });
  }
  return sections;
});

const tocState = useTocSections();
watch(tocSections, (sections) => (tocState.value = sections), { immediate: true });
useTocScroll(tocSections);
</script>

<template>
  <div v-if="plugin">
    <!-- Same header component as markdown pages, package name as the label -->
    <PageHeader crumb="Plugins" :label="plugin.package" :title="plugin.name" />

    <!-- Meta Strip (Matching Introduction) -->
    <MetadataStrip :items="metaItems" />

    <!-- Intro Text -->
    <div class="flex flex-col md:flex-row gap-12 mb-16">
      <div class="flex-1">
        <p class="text-xl text-body leading-relaxed font-medium">
          {{ plugin.description }}
        </p>
      </div>
    </div>

    <!-- Live preview: shown for plugins with a registered demo, else omitted -->
    <CursorDemo
      v-if="plugin && PLUGIN_DEMO_IDS[plugin.id] && DEMOS[PLUGIN_DEMO_IDS[plugin.id]]"
      :demo="PLUGIN_DEMO_IDS[plugin.id]"
      class="mb-16"
    />

    <!-- Integration -->
    <div class="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-20">
      <div class="flex flex-col h-full">
        <h3
          id="installation"
          class="font-mono text-xs font-bold uppercase tracking-widest text-muted mb-4 flex items-center gap-2 scroll-mt-32"
        >
          <span class="w-1.5 h-1.5 bg-inverse" />
          Installation
        </h3>
        <CodeBlock
          :code="installCode"
          lang="text"
          :clean="true"
          class="border border-code-border flex-1"
        />
      </div>
      <div class="flex flex-col h-full">
        <h3
          id="usage"
          class="font-mono text-xs font-bold uppercase tracking-widest text-muted mb-4 flex items-center gap-2 scroll-mt-32"
        >
          <span class="w-1.5 h-1.5 bg-inverse" />
          Usage
        </h3>
        <CodeBlock
          :code="plugin.code"
          lang="typescript"
          :recipe-id="plugin.recipeId"
          :clean="true"
          class="border border-code-border flex-1"
        />
      </div>
    </div>

    <!-- API / Config -->
    <div class="border-t border-border pt-12">
      <div class="flex items-center justify-between mb-8">
        <h3
          id="configuration"
          class="font-mono text-sm font-bold uppercase tracking-widest text-inverse scroll-mt-32"
        >
          Configuration
        </h3>
        <div class="flex items-center gap-3">
          <span
            v-if="docsStatus"
            class="mono text-[10px] font-bold uppercase tracking-widest px-2 py-0.5"
            :class="docsStatus.class"
          >
            {{ docsStatus.label }}
          </span>
          <span v-if="plugin.options?.some((o) => o.reactive)" class="text-xs text-muted">
            <span class="font-bold text-inverse">*</span> Reactive Property
          </span>
        </div>
      </div>

      <!-- Options Table -->
      <Table
        :columns="optionColumns"
        :rows="plugin.options ?? []"
        v-if="showConfigTable"
        wrapper-class="border border-border overflow-hidden"
      >
        <template #cell-name="{ row }">
          <span class="font-mono text-inverse font-bold relative">
            {{ row.name }}
            <span
              v-if="row.reactive"
              class="absolute top-4 left-2 text-accent text-xs select-none"
              >*</span
            >
          </span>
        </template>

        <template #cell-type="{ row }">
          <span class="font-mono text-accent text-xs">{{ row.type }}</span>
        </template>

        <template #cell-default="{ row }">
          <span class="font-mono text-subtle text-xs">{{ row.default || "-" }}</span>
        </template>

        <template #cell-description="{ row }">
          <span class="text-body leading-relaxed">{{ row.description }}</span>
        </template>
      </Table>

      <div
        v-else
        class="p-12 border border-border bg-surface-muted text-center"
      >
        <p class="font-mono text-xs text-subtle uppercase tracking-widest font-bold">
          {{ plugin?.hasDetailedDocs ? 'No configuration options' : 'Configuration docs coming soon' }}
        </p>
      </div>
    </div>
  </div>

  <!-- 404 State -->
  <div v-else class="min-h-[50vh] flex flex-col items-center justify-center text-center p-8">
    <div
      class="w-16 h-16 border border-border flex items-center justify-center mb-6 text-faint"
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
    <h1 class="text-xl font-bold text-inverse tracking-tighter">Plugin Missing</h1>
    <p class="text-muted mt-2 font-mono text-xs">ID: {{ route.params.id }}</p>
    <NuxtLink
      to="/docs"
      class="mt-8 px-6 py-3 bg-inverse text-surface font-mono text-xs font-bold uppercase tracking-widest hover:bg-elevated transition-colors"
    >
      Return to Plugins
    </NuxtLink>
  </div>
</template>
