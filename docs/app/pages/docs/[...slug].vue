<script setup lang="ts">
import { useTocScroll, useTocSections, type TocSection } from "@composables/useToc";
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

/**
 * The table of contents comes straight from the rendered markdown headings, so
 * it can never drift from the page body. Publishing it to shared state here
 * (during setup, before the layout renders its rail) keeps it in the
 * server-rendered HTML.
 */
const tocSections = computed<TocSection[]>(() =>
  (page.value?.body?.toc?.links ?? []).flatMap<TocSection>((link) => [
    { id: link.id, label: link.text, depth: 2 },
    ...(link.children ?? []).map((child) => ({
      id: child.id,
      label: child.text,
      depth: 3 as const
    }))
  ])
);

const tocState = useTocSections();
tocState.value = tocSections.value;

useTocScroll(tocSections);

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
