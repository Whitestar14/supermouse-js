/**
 * useSearch — MiniSearch-powered docs search.
 *
 * Index documents are derived entirely from `useDocsNavigation()`, which in
 * turn comes from markdown frontmatter (written pages) and generated package
 * metadata (plugin pages). Adding a page or plugin makes it searchable with no
 * extra bookkeeping here.
 */
import { ref, computed } from "vue";
import MiniSearch from "minisearch";
import { useDocsNavigation } from "@config/navigation";

export interface SearchResult {
  id: string;
  label: string;
  heading?: string;
  description?: string;
  path: string;
  type: "Guide" | "Plugin" | "Architecture" | "API";
  section?: string;
}

/** Section group -> result badge. */
const GROUP_TYPE: Record<string, SearchResult["type"]> = {
  Guide: "Guide",
  Architecture: "Architecture",
  Integrations: "Guide",
  Reference: "API",
  "Standard Plugins": "Plugin",
  Experimental: "Plugin"
};

interface IndexDoc {
  id: string;
  label: string;
  heading: string;
  path: string;
  type: SearchResult["type"];
  section: string;
}

function buildDocuments(): IndexDoc[] {
  return useDocsNavigation().flatMap((group) => {
    const type = GROUP_TYPE[group.title] ?? "Guide";
    return group.items.map((item) => ({
      id: item.path,
      label: item.label,
      heading: group.title,
      path: item.path,
      type,
      section: group.title
    }));
  });
}

const miniSearch = new MiniSearch<IndexDoc>({
  fields: ["label", "heading"],
  storeFields: ["label", "heading", "path", "type", "section"],
  searchOptions: {
    boost: { label: 5, heading: 2 },
    prefix: true,
    fuzzy: 0.2
  }
});

export function useSearch() {
  const query = ref("");

  // Rebuilt once per app boot; navigation is static build-time data.
  if (miniSearch.documentCount === 0) {
    miniSearch.addAll(buildDocuments());
  }

  const results = computed<SearchResult[]>(() => {
    const trimmed = query.value.trim();
    if (!trimmed) return [];

    return miniSearch
      .search(trimmed, { combineWith: "OR" })
      .slice(0, 10)
      .map((hit) => ({
        id: hit.id,
        label: hit.label,
        heading: hit.heading,
        path: hit.path,
        type: hit.type as SearchResult["type"],
        section: hit.section,
        description: hit.heading === hit.label ? undefined : hit.heading
      }));
  });

  return { query, results };
}
