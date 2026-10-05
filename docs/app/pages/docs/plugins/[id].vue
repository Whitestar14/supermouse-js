<script setup lang="ts">
definePageMeta({
  layout: "docs"
});

import { computed } from "vue";
import CodeBlock from "@components/content/CodeBlock.vue";
import MetadataStrip from "@/components/content/MetadataStrip.vue";
import Table from "@/components/content/Table.vue";
import CursorDemo from "@components/content/CursorDemo.vue";
import ProseH2 from "@components/content/ProseH2.vue";
import { usePageHead } from "@composables/usePageHead";
import { useToc, type TocSection } from "@composables/useToc";
import { PLUGINS } from "@data/plugin-data";
import { DEMOS, PLUGIN_DEMO_IDS } from "@playground/demos";

const route = useRoute();

/**
 * Authored markdown for this plugin, if one exists (`content/plugins/<id>.md`).
 * When present it carries the narrative — usage, patterns, caveats, live demos;
 * otherwise the generated sections below stand in. The options table is always
 * driven by `meta.json`, so structure can never drift from the package.
 */
const { data: pluginDoc } = await useAsyncData(`plugin-doc-${route.params.id}`, () =>
  queryCollection("plugins").path(`/plugins/${route.params.id}`).first()
);

interface TocLink {
  id: string;
  text: string;
  children?: TocLink[];
}

/** Flatten the rendered heading tree into the rail's flat list (h2→h4). */
function flattenToc(links: TocLink[], depth: 2 | 3 | 4): TocSection[] {
  return links.flatMap((link) => [
    { id: link.id, label: link.text, depth },
    ...(link.children ? flattenToc(link.children, Math.min(depth + 1, 4) as 2 | 3 | 4) : [])
  ]);
}

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

/**
 * This page is generated from package metadata rather than markdown, so it has
 * to publish its own TOC — otherwise the rail would keep whatever the last
 * markdown page wrote into the shared `docs-toc` state (the "stale sidebar"
 * bug on plugin pages). Anchors below match the ids on the headings.
 */
const tocSections = computed<TocSection[]>(() => {
  if (!plugin.value) return [];

  const sections: TocSection[] = pluginDoc.value
    ? flattenToc((pluginDoc.value.body?.toc?.links ?? []) as TocLink[], 2)
    : [
        { id: "installation", label: "Installation", depth: 2 },
        { id: "usage", label: "Usage", depth: 2 }
      ];

  if (showConfigTable.value) {
    sections.push({ id: "configuration", label: "Configuration", depth: 2 });
  }
  return sections;
});

useToc(tocSections);
</script>

<template>
  <div v-if="plugin">
    <!-- Same header component as markdown pages, package name as the label -->
    <PageHeader crumb="Plugins" :label="plugin.package" :title="plugin.name" />

    <!-- Meta Strip (Matching Introduction) -->
    <MetadataStrip :items="metaItems" />

    <!-- Authored docs: the narrative body, when the plugin ships markdown -->
    <div v-if="pluginDoc" class="docs-content prose max-w-none mb-20">
      <ContentRenderer :value="pluginDoc" />
    </div>

    <!-- Generated fallback for plugins without authored docs -->
    <template v-else>
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
          <CodeBlock :code="installCode" lang="text" :clean="true" class="flex-1" />
        </div>
        <div class="flex flex-col h-full">
          <h3
            id="usage"
            class="font-mono text-xs font-bold uppercase tracking-widest text-muted mb-4 flex items-center gap-2 scroll-mt-32"
          >
            <span class="w-1.5 h-1.5 bg-inverse" />
            Usage
          </h3>
          <CodeBlock :code="plugin.code" lang="typescript" :clean="true" class="flex-1" />
        </div>
      </div>
    </template>

    <!-- Configuration: same heading shell as authored markdown pages. -->
    <div class="border-t border-border">
      <ProseH2 id="configuration">Configuration</ProseH2>
      <div class="docs-content max-w-none mb-8">
        <p class="leading-relaxed">
          Every option <code>{{ plugin.name }}</code> accepts, with its type, default, and whether
          it is reactive. Options marked <strong>*</strong> accept a function of
          <a href="/docs/reference/api#mousestate">MouseState</a> and are re-read every frame. The
          engine's own settings — damping, cursor mode, scoping — are listed under
          <a href="/docs/reference/api#supermouseoptions">constructor options</a>.
        </p>
      </div>

      <!-- Options Table -->
      <Table
        v-if="showConfigTable"
        :columns="optionColumns"
        :rows="plugin.options ?? []"
        class="border-t border-border"
      >
        <template #cell-name="{ row }">
          <span class="font-mono text-xs font-bold text-inverse">{{ row.name }}</span>
          <span v-if="row.reactive" class="text-accent" title="Reactive property">*</span>
        </template>

        <template #cell-type="{ row }">
          <span class="font-mono text-xs text-accent">{{ row.type }}</span>
        </template>

        <template #cell-default="{ row }">
          <span class="font-mono text-xs text-muted">{{ row.default || "-" }}</span>
        </template>

        <template #cell-description="{ row }">
          <span class="text-body leading-relaxed">{{ row.description }}</span>
        </template>
      </Table>

      <div v-else class="p-12 border-t border-border bg-surface-muted text-center">
        <p class="font-mono text-xs text-subtle uppercase tracking-widest font-bold">
          No configuration options
        </p>
      </div>
    </div>
  </div>

  <!-- 404 State -->
  <div v-else class="min-h-[50vh] flex flex-col items-center justify-center text-center p-8">
    <div class="w-16 h-16 border border-border flex items-center justify-center mb-6 text-faint">
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
