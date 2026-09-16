import { queryCollectionSearchSections } from "@nuxt/content/server";

/**
 * Full-text search index for the docs collection.
 *
 * `queryCollectionSearchSections` splits every page into heading-level sections
 * (the "in-betweens"), which is what lets the palette match a sub-heading or a
 * paragraph instead of only a page title. The endpoint is prerendered to a
 * static `/search-index.json` (see `nitro.prerender.routes`), so it is fetched
 * on demand by the palette and never lands in a page's initial payload.
 */

/** Bound the payload: a snippet is plenty for ranking and display. */
const MAX_SECTION_CHARS = 1200;

export default defineEventHandler(async (event) => {
  const sections = await queryCollectionSearchSections(event, "docs");

  setHeader(event, "Content-Type", "application/json");

  return sections.map(({ id, title, titles, level, content }) => ({
    id,
    title,
    titles,
    level,
    content: typeof content === "string" ? content.slice(0, MAX_SECTION_CHARS) : ""
  }));
});
