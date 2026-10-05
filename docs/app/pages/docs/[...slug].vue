<script setup lang="ts">
import { useToc, type TocSection } from "@composables/useToc";
import { APP_VERSION } from "@config/constants";

definePageMeta({
  layout: "docs"
});

const route = useRoute();

const { data: page } = await useAsyncData(`content-${route.path}`, () => {
  return queryCollection("docs").path(route.path).first();
});

if (!page.value) {
  throw createError({
    statusCode: 404,
    statusMessage: `Page ${route.path} not found`,
    fatal: false
  });
}

interface MdcTocLink {
  id: string;
  text: string;
  children?: MdcTocLink[];
}

/** Flattens the heading tree into the rail's list, walking nested levels. */
function flattenToc(links: MdcTocLink[], depth: 2 | 3 | 4): TocSection[] {
  return links.flatMap((link) => [
    { id: link.id, label: link.text, depth },
    ...(link.children ? flattenToc(link.children, Math.min(depth + 1, 4) as 2 | 3 | 4) : [])
  ]);
}

const tocSections = computed<TocSection[]>(() =>
  flattenToc((page.value?.body?.toc?.links ?? []) as MdcTocLink[], 2)
);

useToc(tocSections);

/** Frontmatter keys surfaced as the metadata strip, in display order. */
const META_FIELDS = [
  ["version", "VERSION"],
  ["coreSize", "CORE SIZE"],
  ["license", "LICENSE"]
] as const;

/**
 * A page that declares any of them gets the whole strip; `version` falls back to
 * the release the site is presenting, so it can never drift from the build.
 */
const metaItems = META_FIELDS.flatMap(([key, label]) => {
  if (!page.value || !META_FIELDS.some(([field]) => page.value?.[field])) return [];
  const value = page.value[key] ?? (key === "version" ? APP_VERSION : undefined);
  return value ? [{ label, content: String(value) }] : [];
});

useSeoMeta({
  title: () => (page.value?.title ? `${page.value.title} | Supermouse` : "Supermouse"),
  description: () => page.value?.description || ""
});
</script>

<template>
  <DocsSection v-if="page" :label="page.section || 'Guide'" :title="page.title">
    <MetadataStrip v-if="metaItems.length" :items="metaItems" />
    <ContentRenderer :value="page" />
  </DocsSection>
</template>
